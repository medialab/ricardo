angular.module("ricardo.controllers.network", []).controller("network", [
  "$scope",
  "apiService",
  "utils",
  "reportingYears",
  function ($scope, apiService, utils, reportingYears) {
    $scope.showlegend = false;

    $scope.allYears = reportingYears.sort(function (a, b) {
      return a - b;
    });
    $scope.selectedDate;

    $scope.colors = [
      {
        type: { value: "community", writable: true },
        name: { value: "community", writable: true },
      },
      {
        type: { value: "continent", writable: true },
        name: { value: "continent", writable: true },
      },
      {
        type: { value: "type", writable: true },
        name: { value: "type", writable: true },
      },
    ];

    $scope.colored;

    $scope.networkFlowChoices = [
      {
        type: { value: "total", writable: true },
        name: { value: "Total", writable: true },
      },
      {
        type: { value: "Exp", writable: true },
        name: { value: "Exports", writable: true },
      },
      {
        type: { value: "Imp", writable: true },
        name: { value: "Imports", writable: true },
      },
    ];
    $scope.networkFlow = $scope.networkFlowChoices[0];

    var communityColors;
    var continents = [
      "Europe",
      "Asia",
      "Africa",
      "America",
      "World",
      "Oceania",
      "Pacific",
      "Mediterranean",
      "Baltic",
      "Antarctic",
      "Atlantic Ocean",
    ];
    var types = ["GPH_entity", "locality", "group", "geographical_area", "colonial_area"];
    var continentColors = d3.scale.category20().domain(continents);
    var typeColors = d3.scale.category10().domain(types);

    var impexpColor = { Imp: "#9ecae1", Exp: "#fdae6b" };
    $scope.changeFlow = function (flow) {
      $scope.networkFlow = flow;
    };
    $scope.changeColor = function (color) {
      $scope.colored = color;
      if (color.name.value === "community") {
        $scope.colored["color_domain"] = communityColors;
        $scope.sigma.graph.nodes().forEach(function (n) {
          n.color = communityColors(n.attributes.community);
        });
      } else if (color.name.value === "continent") {
        $scope.colored["color_domain"] = continentColors;
        $scope.sigma.graph.nodes().forEach(function (n) {
          n.color = continentColors(n.attributes.continent);
        });
      } else {
        $scope.colored["color_domain"] = typeColors;
        $scope.sigma.graph.nodes().forEach(function (n) {
          n.color = typeColors(n.attributes.type);
        });
      }
      $scope.sigma.refresh();
    };

    sigma.classes.graph.addMethod("neighbors", function (nodeId) {
      var k,
        neighbors = {},
        index = this.allNeighborsIndex[nodeId] || {};

      for (k in index) neighbors[k] = this.nodesIndex[k];

      return neighbors;
    });

    function stopLayout() {
      $scope.sigma.stopForceAtlas2();
    }

    function communityDetection(nodes, node_data, edge_data, listNationsByKey) {
      var community = jLouvain().nodes(node_data).edges(edge_data);
      // Community Detection
      var community_assignment_result = community();
      var node_ids = Object.keys(community_assignment_result);
      var node_community = [];

      node_data.forEach(function (n) {
        listNationsByKey[n].attributes["community"] = community_assignment_result[n];
      });

      var max_community_number = 0;
      node_ids.forEach(function (d) {
        listNationsByKey[d].community = community_assignment_result[d];

        max_community_number =
          max_community_number < community_assignment_result[d] ? community_assignment_result[d] : max_community_number;
      });
      communityColors = d3.scale.category20().domain(d3.range([0, max_community_number]));
      return nodes;
    }

    function initGraph(trades, networkFlow) {
      trades = trades.filter(function (d) {
        return networkFlow === "total" ? d : d.expimp === networkFlow;
      });
      var listNations = [];
      var listOfNations = [];
      var pairs = [];
      trades.forEach(function (t) {
        if (listNations.indexOf(t.reporting_id) === -1) {
          listNations.push(t.reporting_id);
          listOfNations.push({
            id: t.reporting_id,
            continent: t.reporting_continent,
            type: t.reporting_type,
            role: "reporting",
          });
        }
        if (listNations.indexOf(t.partner_id) === -1) {
          listNations.push(t.partner_id);
          listOfNations.push({
            id: t.partner_id,
            continent: t.partner_continent,
            type: t.partner_type,
            role: "partner",
          });
        }
      });

      var flows = trades.map(function (d) {
        return d.flow;
      });

      var size = d3.scale.pow().domain(d3.extent(flows)).range([0.5, 5]);

      // create edges between nodes
      var edges = [];
      var j = 0;
      trades.forEach(function (t) {
        edges.push({
          id: "e" + j,
          size: size(t.flow),
          flow: t.flow,
          source: t.reporting_id,
          target: t.partner_id,
          expimp: t.expimp,
          hover_color: "#000",
          type: "arrow",
        });
        j++;
      });

      // Louvain community detection
      var edge_data = [];
      trades.forEach(function (t) {
        edge_data.push({
          source: t.reporting_id,
          target: t.partner_id,
          weigth: 1,
        });
      });

      var node_data = listNations;

      // nodes & edges for sigma
      var nodes = [];
      var i = 0;

      listOfNations.forEach(function (n) {
        nodes.push({
          id: n.id,
          label: n.id,
          x: Math.random(),
          y: Math.random(),
          attributes: {
            community: null,
            continent: n.continent,
            type: n.type,
            expimp: n.expimp,
          },
          size: 3,
        });
        i++;
      });

      var listNationsByKey = {};
      for (var i = 0, len = nodes.length; i < len; i++) {
        var obj = {};
        obj[nodes[i].id] = nodes[i];
        listNationsByKey[nodes[i].id] = obj[nodes[i].id];
      }

      nodes = communityDetection(nodes, node_data, edge_data, listNationsByKey);
      // Create Graph
      var data = {};
      data.nodes = nodes;
      data.edges = edges;

      var PARAMS = {
        graph: data,
        container: "network",
        renderer: {
          container: document.getElementById("network"),
          type: "canvas",
        },
        settings: {
          minNodeSize: 4,
          maxNodeSize: 8,
          maxEdgeSize: 5,
          defaultNodeColor: "#ec5148",
          edgeColor: "default",
          defaultEdgeColor: "#d1d1d1",
          labelSize: "fixed",
          labelSizeRatio: 1,
          labelThreshold: 5,
          enableCamera: true,
          enableHovering: true,
          enableEdgeHovering: true,
          edgeHoverColor: "edge",
          defaultEdgeHoverColor: "#000",
          edgeHoverSizeRatio: 1,
          edgeHoverExtremities: true,
        },
      };

      // delete graph if exist
      if ($scope.sigma) $scope.sigma.kill();

      // instantiate graph
      $scope.sigma = new sigma(PARAMS);

      // Initialize the Filter API
      $scope.filter = new sigma.plugins.filter($scope.sigma);
      updatePane($scope.sigma.graph, $scope.filter);
      $scope.changeColor($scope.colored);

      $scope.sigma.bind("clickNode", function (e) {
        var nodeId = e.data.node.id,
          toKeep = $scope.sigma.graph.neighbors(nodeId);
        toKeep[nodeId] = e.data.node;

        $scope.filter.undo("neighbors", "legend").neighborsOf(nodeId, "neighbors").apply();

        $scope.nodeSelected = true;
        $scope.$apply();
      });

      $scope.reset = function () {
        $scope.filter.undo("neighbors", "legend").apply();
        $scope.nodeSelected = false;
      };

      // change size with degree
      var nodes = $scope.sigma.graph.nodes();
      // second create size for every node
      for (var i = 0; i < nodes.length; i++) {
        var degree = $scope.sigma.graph.degree(nodes[i].id);
        nodes[i].size = degree;
      }

      // Start the ForceAtlas2 algorithm:
      $scope.sigma.startForceAtlas2(LAYOUT_SETTINGS);

      // Relaunch function with (issue)
      $scope.relaunch = function () {
        var listNationsIndexed = indexNodes($scope.listNations);
        var listOfEdges = filterOnEdges(listNationsIndexed, data.edges);

        data = {};
        $scope.listNations.forEach(function (d) {
          d.x = Math.random();
          d.y = Math.random();
        });
        data.nodes = $scope.listNations;
        data.edges = listOfEdges;

        $scope.sigma.killForceAtlas2();
        // delete graph if exist
        $scope.sigma.graph.clear(); //(issue)
        drawGraph($scope.sigma, data);
      };

      _.$("min-degree").addEventListener("input", applyMinDegreeFilter); // for Chrome and FF
      _.$("min-flow").addEventListener("input", applyMinFlowFilter); // for Chrome and FF
      _.$("min-degree").addEventListener("change", applyMinDegreeFilter); // for IE10+, that sucks
      return data;
    }

    var LAYOUT_SETTINGS = {
      worker: true,
      barnesHutOptimize: false,
      strongGravityMode: true,
      gravity: 0.05,
      scalingRatio: 10,
      slowDown: 2,
    };

    /**
     * DOM utility functions
     */
    var _ = {
      $: function (id) {
        return document.getElementById(id);
      },

      all: function (selectors) {
        return document.querySelectorAll(selectors);
      },

      removeClass: function (selectors, cssClass) {
        var nodes = document.querySelectorAll(selectors);
        var l = nodes.length;
        for (var i = 0; i < l; i++) {
          var el = nodes[i];
          // Bootstrap compatibility
          el.className = el.className.replace(cssClass, "");
        }
      },

      addClass: function (selectors, cssClass) {
        var nodes = document.querySelectorAll(selectors);
        var l = nodes.length;
        for (var i = 0; i < l; i++) {
          var el = nodes[i];
          // Bootstrap compatibility
          if (-1 == el.className.indexOf(cssClass)) {
            el.className += " " + cssClass;
          }
        }
      },

      show: function (selectors) {
        this.removeClass(selectors, "hidden");
      },

      hide: function (selectors) {
        this.addClass(selectors, "hidden");
      },

      toggle: function (selectors, cssClass) {
        var cssClass = cssClass || "hidden";
        var nodes = document.querySelectorAll(selectors);
        var l = nodes.length;
        for (var i = 0; i < l; i++) {
          var el = nodes[i];
          //el.style.display = (el.style.display != 'none' ? 'none' : '' );
          // Bootstrap compatibility
          if (-1 !== el.className.indexOf(cssClass)) {
            el.className = el.className.replace(cssClass, "");
          } else {
            el.className += " " + cssClass;
          }
        }
      },
    };

    function updatePane(graph, filter) {
      // get max degree
      var maxDegree = 0,
        maxFlow = 0,
        categories = {};

      var maxFlow = d3.max(
        graph.edges().map(function (n) {
          return n.flow;
        }),
      );

      // read nodes
      graph.nodes().forEach(function (n) {
        maxDegree = Math.max(maxDegree, graph.degree(n.id));
        categories[n.attributes] = true;
      });

      // min degree
      if (_.$("min-degree") != null) _.$("min-degree").max = maxDegree;
      if (_.$("max-degree-value") != null) _.$("max-degree-value").textContent = maxDegree;

      // min flow
      if (_.$("min-flow") != null) _.$("min-flow").max = maxFlow;
      if (_.$("max-flow-value") != null) _.$("max-flow-value").textContent = maxFlow;

      // node category
      var nodecategoryElt = _.$("node-category");
      Object.keys(categories).forEach(function (c) {
        var optionElt = document.createElement("option");
        optionElt.text = c;
        if (nodecategoryElt != null) nodecategoryElt.add(optionElt);
      });

      // reset button
      if (_.$("reset-btn") != null) {
        _.$("reset-btn").addEventListener("click", function (e) {
          _.$("min-degree").value = 0;
          _.$("min-degree-val").textContent = "0";
          _.$("min-flow").value = 0;
          _.$("min-flow-val").textContent = "0";
          // _.$('node-category').selectedIndex = 0;
          filter.undo().apply();
          _.$("dump").textContent = "";
          _.hide("#dump");
        });
      }
    }

    function applyMinDegreeFilter(e) {
      var v = e.target.value;
      _.$("min-degree-val").textContent = v;

      $scope.filter
        .undo("min-degree")
        .nodesBy(function (n) {
          return this.degree(n.id) >= v;
        }, "min-degree")
        .apply();
    }

    function applyMinFlowFilter(e) {
      var v = e.target.value;
      _.$("min-flow-val").textContent = v;

      $scope.filter
        .undo("min-flow")
        .edgesBy(function (e) {
          return e.flow >= v;
        }, "min-flow")
        .apply();
    }

    function applyCategoryFilter(e) {
      var c = e.target[e.target.selectedIndex].value;

      $scope.filter
        .undo("node-category")
        .nodesBy(function (n) {
          return !c.length || n.attributes === c;
        }, "node-category")
        .apply();
    }

    function indexNodes(nodes) {
      var indexNodes = {};

      nodes.forEach(function (d) {
        indexNodes[d.id] = true;
      });

      return indexNodes;
    }

    function filterOnEdges(nodes, edges) {
      var newNodesList = [];

      edges.forEach(function (e) {
        if (nodes[e.source] && nodes[e.target]) newNodesList.push(e);
      });

      return newNodesList;
    }

    $scope.sigma;

    /*
     * Calling the API to init country selection
     */
    function init(year) {
      apiService
        .getReportingsNetwork({
          year: year,
        })
        .then(function (trades) {
          trades = trades.network;
          if (trades.length === 0) alert("There is no value for this year");
          else {
            $scope.trades = trades;
            var data = initGraph(trades, $scope.networkFlow.type.value);
          }
        });
    }

    $scope.stopLayout = function () {
      $scope.sigma.stopForceAtlas2();
    };

    $scope.startLayout = function () {
      $scope.sigma.startForceAtlas2(LAYOUT_SETTINGS);
    };

    var filename = "RICardo - Networt Trade Nations in " + $scope.selectedDate;
    $scope.snapshot = function () {
      $scope.sigma.renderers[0].snapshot({
        format: "png",
        background: "white",
        labels: true,
        download: true,
        filename: filename,
      });
    };

    $scope.zoom = function () {
      var camera = $scope.sigma.cameras[0];

      sigma.misc.animation.camera(camera, { ratio: camera.ratio / 1.5 }, { duration: 150 });
    };

    $scope.unzoom = function () {
      var camera = $scope.sigma.cameras[0];

      sigma.misc.animation.camera(camera, { ratio: camera.ratio * 1.5 }, { duration: 150 });
    };

    $scope.rescale = function () {
      var camera = $scope.sigma.cameras[0];

      sigma.misc.animation.camera(camera, { x: 0, y: 0, angle: 0, ratio: 1 }, { duration: 150 });
    };

    $scope.export = function () {
      var dataExported = [];
      $scope.trades.forEach(function (e) {
        dataExported.push({
          reporting: e.reporting,
          partner: e.partner,
          flow: e.flow,
          expimp: e.expimp,
        });
      });

      var headers = ["reporting", "partner", "flow", "expimp"],
        order = "",
        filename = "RICardo - Network " + $scope.selectedDate;
      utils.downloadCSV(dataExported, headers, order, filename);
    };

    $scope.$watch(
      "networkFlow",
      function (newVal, oldVal) {
        if (newVal !== oldVal) {
          initGraph($scope.trades, newVal.type.value);
        }
      },
      true,
    );
    $scope.$watch(
      "selectedDate",
      function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if (!$scope.showlegend) $scope.showlegend = true;
          if ($scope.colored === undefined) $scope.colored = $scope.colors[1];
          init(newVal);
        }
      },
      true,
    );
  },
]);
