'use strict';

/* Controllers */

angular.module('ricardo.controllers.network', [])

  .controller('network', [ "$scope", "$location", "apiService", "utils", 
    function ($scope, $location, apiService, utils) {

    $scope.allYears = d3.range( 1789, 1940 );
    $scope.selectedDate;

    $scope.colored = {};
    $scope.colors = [
    {type: {value: "community",writable: true},
     name: {value: "community",writable: true}
     },
    {type: {value: "continent",writable: true},
     name: {value: "continent",writable: true}
    },
     {type: {value: "type",writable: true},
      name: {value: "type",writable: true}
     }]

    $scope.changeColor = function(color) {
      if (color.name.value === "community") {
        // var max_community = d3.max($scope.sigma.graph.nodes()
        //   .map(function (n) { 
        //     return n.community
        //   })
        // )

        $scope.sigma.graph.nodes().forEach(function (n) {
          // var color = d3.scale.category20().domain(d3.range([0, max_community]));
          n.color = n.originalColor;
        })
      }
      else if (color.name.value === "continent") {
        $scope.sigma.graph.nodes().forEach(function (n) {
          n.color = colorByContinent(n);
        })
      }
      else {
        $scope.sigma.graph.nodes().forEach(function (n) {
          n.color = colorByType(n)
        })
      }
      $scope.sigma.refresh();
    }

    sigma.classes.graph.addMethod('neighbors', function(nodeId) {
        var k,
            neighbors = {},
            index = this.allNeighborsIndex[nodeId] || {};

        for (k in index)
          neighbors[k] = this.nodesIndex[k];

        return neighbors;
    });

    function saveOriginalColor(s) {
      // We first need to save the original colors of our
      // nodes and edges, like this:
      s.graph.nodes().forEach(function(n) {
        n.originalColor = n.color;
      });
      s.graph.edges().forEach(function(e) {
        e.originalColor = e.color;
      });
    }

    function stopLayout () {
      $scope.sigma.stopForceAtlas2();
    }

    function communityDetection(nodes, node_data, edge_data, listNationsByKey) {
          var community = jLouvain().nodes(node_data).edges(edge_data);
          // Community Detection
          var community_assignment_result = community();
          var node_ids = Object.keys(community_assignment_result);
          var node_community = [];

          node_data.forEach( function (n) {
              listNationsByKey[n].attributes["ModularityClass"] = community_assignment_result[n]
          })

          var max_community_number = 0;
          node_ids.forEach(function(d){
            listNationsByKey[d].community = community_assignment_result[d];

            max_community_number = max_community_number < community_assignment_result[d] ? community_assignment_result[d]: max_community_number;
          });

          var color = d3.scale.category20().domain(d3.range([0, max_community_number]));

          nodes.forEach( function (d) {
              d.color = color(d.community);
          })
          return nodes;
    }

    function colorByContinent(nodes) {
      var continentColors = { "Europe":"#7ED27C",
                               "Asia":"#FC9FEB" ,
                               "Africa":"#F6B42C",
                               "America":"#BFFA27",
                               "World":"#B1BCF5",
                               "Oceania":"#36E120"
                              }

      return continentColors[nodes.attributes.continent]     
    }

    function colorByType(nodes) {
      var typeColors = { "country":"#A561C7",
                     "city/part_of":"#669746" ,
                     "group":"#B86634",
                     "geographical_area":"#6481A2",
                     "colonial_area":"#B74F74"
                    }
          
      return typeColors[nodes.attributes.type];
    }

    function initGraph (trades) {
        var listNations = [];
        var listOfNations = [];
        trades.forEach(function (t) {
            if (listNations.indexOf(t.reporting_id) === -1) {
                listNations.push(t.reporting_id)
                listOfNations.push({
                  id: t.reporting_id, 
                  continent: t.reporting_continent,
                  type: t.reporting_type})
            }
            if (listNations.indexOf(t.partner_id) === -1) {
                listNations.push(t.partner_id)
                listOfNations.push({
                  id: t.partner_id, 
                  continent: t.partner_continent,
                  type: t.partner_type})
            }
        })

        var flows = trades.map(function (d) { return d.flow });

        var size = d3.scale.pow()
            .domain(d3.extent(flows))
            .range([0.5, 5]);

        // create edges between nodes
        var edges = [];
        var j = 0;
        trades.forEach(function (t) {
            edges.push({
                id: "e" + j,
                size: size(t.flow),
                flow: t.flow,
                source: t.reporting_id,
                target: t.partner_id
            })
            j++;
        })

        // Louvain community detection
        var edge_data = [];
        trades.forEach(function (t) {
            edge_data.push({
                source: t.reporting_id,
                target: t.partner_id,
                weigth: 1,
                color: '#D1D1D1'
            })
        })
        
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
                    "Modularity Class": null,
                    "continent": n.continent,
                    "type": n.type,
                    "expimp": n.expimp
                },
                color: "rgb(0,199,255)",
                size: 3
            })
            i++;
        })

        var listNationsByKey = {};
        for (var i = 0, len = nodes.length; i < len; i++) {
            var obj = {};
            obj[nodes[i].id] = nodes[i];
            listNationsByKey[nodes[i].id] = obj[nodes[i].id]
        }

        nodes = communityDetection(nodes, node_data, edge_data, listNationsByKey);

        //nodes = colorByType(nodes);

        // Create Graph
        var data = {};
        data.nodes = nodes;
        data.edges = edges;

        return data;
    }

    function drawGraph (s, data) {
        var PARAMS = {
            graph: data,
            container: 'network',
            settings: {
                minNodeSize: 4,
                maxNodeSize: 8,
                maxEdgeSize: 5,
                defaultNodeColor: '#ec5148',
                edgeColor: 'default',
                defaultEdgeColor: '#d1d1d1',
                labelSize: 'fixed',
                labelSizeRatio: 1,
                labelThreshold: 5,
                enableCamera: true,
                enableHovering: true,
                minArrowSize: 3
            },
            type: 'webgl'
        }
        // instantiate graph
        s  = new sigma(PARAMS);

        saveOriginalColor(s);

        s.bind('clickNode', function(e) {
            console.log("e", e);
            var nodeId = e.data.node.id,
                toKeep = s.graph.neighbors(nodeId);
            toKeep[nodeId] = e.data.node;

            s.graph.nodes().forEach(function(n) {
              if (toKeep[n.id])
                n.color = n.originalColor;
              else
                n.color = '#eee';
            });

            s.graph.edges().forEach(function(e) {
              if (toKeep[e.source] && toKeep[e.target])
                e.color = e.originalColor;
              else
                e.color = '#eee';
            });

            // Since the data has been modified, we need to
            // call the refresh method to make the colors
            // update effective.
            s.refresh();
        });

          // When the stage is clicked, we just color each
          // node and edge with its original color.
        s.bind('clickStage', function(e) {
            s.graph.nodes().forEach(function(n) {
              n.color = n.originalColor;
            });

            s.graph.edges().forEach(function(e) {
              e.color = e.originalColor;
            });

            s.refresh();
          });

        // change size with degree
        var nodes = s.graph.nodes();
        // second create size for every node
        for(var i = 0; i < nodes.length; i++) {
          var degree = s.graph.degree(nodes[i].id);
          nodes[i].size = degree;
        }

        var LAYOUT_SETTINGS = {
            worker: true, 
            barnesHutOptimize: false,
            strongGravityMode: true,
            gravity: 0.05,
            scalingRatio: 10,
            slowDown: 2
        }

        // Start the ForceAtlas2 algorithm:
        s.startForceAtlas2(LAYOUT_SETTINGS);
    }

    /**
     * This is an example on how to use sigma filters plugin on a real-world graph.
     */
    var filter;

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

      removeClass: function(selectors, cssClass) {
        var nodes = document.querySelectorAll(selectors);
        var l = nodes.length;
        for ( i = 0 ; i < l; i++ ) {
          var el = nodes[i];
          // Bootstrap compatibility
          el.className = el.className.replace(cssClass, '');
        }
      },

      addClass: function (selectors, cssClass) {
        var nodes = document.querySelectorAll(selectors);
        var l = nodes.length;
        for ( i = 0 ; i < l; i++ ) {
          var el = nodes[i];
          // Bootstrap compatibility
          if (-1 == el.className.indexOf(cssClass)) {
            el.className += ' ' + cssClass;
          }
        }
      },

      show: function (selectors) {
        this.removeClass(selectors, 'hidden');
      },

      hide: function (selectors) {
        this.addClass(selectors, 'hidden');
      },

      toggle: function (selectors, cssClass) {
        var cssClass = cssClass || "hidden";
        var nodes = document.querySelectorAll(selectors);
        var l = nodes.length;
        for ( i = 0 ; i < l; i++ ) {
          var el = nodes[i];
          //el.style.display = (el.style.display != 'none' ? 'none' : '' );
          // Bootstrap compatibility
          if (-1 !== el.className.indexOf(cssClass)) {
            el.className = el.className.replace(cssClass, '');
          } else {
            el.className += ' ' + cssClass;
          }
        }
      }
    };


    function updatePane (graph, filter) {
      // get max degree
      var maxDegree = 0,
          maxFlow = 0,
          categories = {};

      var maxFlow = d3.max($scope.sigma.graph.edges()
          .map(function (n) { 
            return n.flow
          })
        )

      // read nodes
      graph.nodes().forEach(function(n) {
        maxDegree = Math.max(maxDegree, graph.degree(n.id));
        categories[n.attributes] = true;
      })

      // min degree
      if (_.$('min-degree') != null)
        _.$('min-degree').max = maxDegree;
      if (_.$('max-degree-value') != null)
        _.$('max-degree-value').textContent = maxDegree;
      
      // min flow
      if (_.$('min-flow') != null)
        _.$('min-flow').max = maxFlow;
      if (_.$('max-flow-value') != null)
        _.$('max-flow-value').textContent = maxFlow;
      
      // node category
      var nodecategoryElt = _.$('node-category');
      Object.keys(categories).forEach(function(c) {
        var optionElt = document.createElement("option");
        optionElt.text = c;
        if (nodecategoryElt != null)
            nodecategoryElt.add(optionElt);
      });

      // reset button
      if (_.$('reset-btn') != null) {
          _.$('reset-btn').addEventListener("click", function(e) {
            _.$('min-degree').value = 0;
            _.$('min-degree-val').textContent = '0';
            _.$('node-category').selectedIndex = 0;
            filter.undo().apply();
            _.$('dump').textContent = '';
            _.hide('#dump');
          });    
      }

      // export button
      if (_.$('export-btn') != null) {
          _.$('export-btn').addEventListener("click", function(e) {
            var chain = filter.export();
            console.log(chain);
            _.$('dump').textContent = JSON.stringify(chain);
            _.show('#dump');
          }); 
      }
    }

    function applyMinDegreeFilter(e) {
      var v = e.target.value;
      _.$('min-degree-val').textContent = v;

      filter
        .undo('min-degree')
        .nodesBy(function(n) {
          return this.degree(n.id) >= v;
        }, 'min-degree')
        .apply();
    }

    function applyMinFlowFilter(e) {
      var v = e.target.value;
      _.$('min-flow-val').textContent = v;

      filter
        .undo('min-flow')
        .edgesBy(function(e) {
          return e.flow >= v;
        }, 'min-flow')
        .apply();
    }

    function applyCategoryFilter(e) {
      var c = e.target[e.target.selectedIndex].value;

      console.log("c", c);

      filter
        .undo('node-category')
        .nodesBy(function(n) {
          console.log("n", n);
          return !c.length || n.attributes === c;
        }, 'node-category')
        .apply();
    }

    $scope.sigma;
    /* 
     * Calling the API to init country selection
     */
    function init(year) {
      apiService
        .getNationsNetwork({
          year: year
        })
        .then(function (trades) {
            if (trades.length === 0)
                alert("There is no value for this year")
            else {
                var data = initGraph(trades);
                // params to sigma
            	var PARAMS = {
            		graph: data,
    			      container: 'network',
                settings: {
                    minNodeSize: 4,
                    maxNodeSize: 8,
                    maxEdgeSize: 5,
                    defaultNodeColor: '#ec5148',
                    edgeColor: 'default',
                    defaultEdgeColor: '#d1d1d1',
                    labelSize: 'fixed',
                    labelSizeRatio: 1,
                    labelThreshold: 5,
                    enableCamera: true,
                    enableHovering: true
                },
                type: 'webgl'
    			    }

                // delete graph if exist
                if ($scope.sigma) 
                    $scope.sigma.kill()

                // instantiate graph
            	$scope.sigma  = new sigma(PARAMS);

                // Initialize the Filter API
                filter = new sigma.plugins.filter($scope.sigma);
                updatePane($scope.sigma.graph, filter);

                //
                saveOriginalColor($scope.sigma);

                $scope.sigma.bind('clickNode', function(e) {
                    
                    var nodeId = e.data.node.id,
                        toKeep = $scope.sigma.graph.neighbors(nodeId);
                    toKeep[nodeId] = e.data.node;

                    $scope.listNations = []
                    $scope.sigma.graph.nodes().forEach(function(n) {
                      console.log("n", n);
                      if (toKeep[n.id]) { 
                        $scope.listNations.push({
                          id: n.id, 
                          color: n.color, 
                          community: n.community,
                          expimp: n.attributes.expimp
                        })
                        n.color = n.originalColor;
                      }
                      else
                        n.color = '#eee';
                    });


                    $scope.sigma.graph.edges().forEach(function(e) {

                      if (toKeep[e.source] && toKeep[e.target])
                        e.color = e.originalColor;
                      else
                        e.color = '#eee';
                    });

                    // Since the data has been modified, we need to
                    // call the refresh method to make the colors
                    // update effective.
                    $scope.sigma.refresh();
                    $scope.$apply();
                });

                  // When the stage is clicked, we just color each
                  // node and edge with its original color.
                $scope.sigma.bind('clickStage', function(e) {
                    $scope.sigma.graph.nodes().forEach(function(n) {
                      n.color = n.originalColor;
                    });

                    $scope.sigma.graph.edges().forEach(function(e) {
                      e.color = e.originalColor;
                    });

                    $scope.sigma.refresh();
                  });

                // change size with degree
                var nodes = $scope.sigma.graph.nodes();
                // second create size for every node
                for(var i = 0; i < nodes.length; i++) {
                  var degree = $scope.sigma.graph.degree(nodes[i].id);
                  nodes[i].size = degree;
                }

                var LAYOUT_SETTINGS = {
                    worker: true, 
                    barnesHutOptimize: false,
                    strongGravityMode: true,
                    gravity: 0.05,
                    scalingRatio: 10,
                    slowDown: 2
                }

                // Start the ForceAtlas2 algorithm:
                $scope.sigma.startForceAtlas2(LAYOUT_SETTINGS);

                $scope.stopLayout = function () {
                    $scope.sigma.stopForceAtlas2();
                }

                $scope.startLayout = function () {
                    $scope.sigma.startForceAtlas2(LAYOUT_SETTINGS)
                }

                var filename = "RICardo - Networt Trade Nations in " + $scope.selectedDate;
                $scope.snapshot = function () {
                    $scope.sigma.renderers[0].snapshot({
                      format: 'png',
                      background: 'white',
                      labels: true,
                      download: true,
                      filename: filename
                    });
                }

                $scope.zoom = function () {
                   var camera = $scope.sigma.cameras[0];

                    sigma.misc.animation.camera(
                      camera,
                      {ratio: camera.ratio / 1.5},
                      {duration: 150}
                    );
                }

                $scope.unzoom = function () {
                   var camera = $scope.sigma.cameras[0];

                    sigma.misc.animation.camera(
                      camera,
                      {ratio: camera.ratio * 1.5},
                      {duration: 150}
                    );
                }

                $scope.rescale = function () {
                   var camera = $scope.sigma.cameras[0];

                    sigma.misc.animation.camera(
                      camera,
                      {x: 0, y: 0, angle: 0, ratio: 1},
                      {duration: 150}
                    );
                }

                $scope.showNodeOnGraph = function(node) {
                    console.log("test show")
                }

                $scope.hoverOnNodeList = function () {
                  console.log("test");
                }

                // $scope.exp = function () {
                //     var expTrades = trades.filter(function (t) {return t.expimp === 'Exp'})
                //     $scope.sigma.stopForceAtlas2();
                //     $scope.sigma.kill();
                //     var data = initGraph(expTrades);
                //     drawGraph($scope.sigma, data);
                // }

                // $scope.imp = function () {
                //     var expTrades = trades.filter(function (t) {return t.expimp === 'Imp'})
                //     $scope.sigma.stopForceAtlas2();
                //     $scope.sigma.kill();
                //     var data = initGraph(expTrades);
                //     drawGraph($scope.sigma, data);
                // }

                 _.$('min-degree').addEventListener("input", applyMinDegreeFilter);  // for Chrome and FF
                 _.$('min-flow').addEventListener("input", applyMinFlowFilter);  // for Chrome and FF
                 _.$('min-degree').addEventListener("change", applyMinDegreeFilter); // for IE10+, that sucks
                 //_.$('node-category').addEventListener("change", applyCategoryFilter);
            }
        })
      }

      

      $scope.$watch('selectedDate', function (newVal, oldVal) {
        if (newVal !== oldVal ) {
            init(newVal); 
        }
    }, true);

    }])