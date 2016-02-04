'use strict';

/* Controllers */

angular.module('ricardo.controllers.network', [])

  .controller('network', [ "$scope", "$location", "apiService", "utils", 
    function ($scope, $location, apiService, utils) {

    $scope.allYears = d3.range( 1789, 1940 );
    $scope.selectedDate;


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
      $scope.sigma.graph.nodes().forEach(function(n) {
        n.originalColor = n.color;
      });
      $scope.sigma.graph.edges().forEach(function(e) {
        e.originalColor = e.color;
      });
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
                // list of all nations with reportings & partners
            	var listNations = [];
            	trades.forEach(function (t) {
            		if (listNations.indexOf(t.reporting_id) === -1)
            			listNations.push(t.reporting_id)
            		if (listNations.indexOf(t.partner_id) === -1)
            			listNations.push(t.partner_id)
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
                var community = jLouvain().nodes(node_data).edges(edge_data); 

                // nodes & edges for sigma
                var nodes = [];
                var i = 0;
                listNations.forEach(function (n) {
                    nodes.push({
                        id: n,
                        label: n,
                        x: Math.random(),
                        y: Math.random(),
                        attributes: {
                            "Modularity Class": null
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

                // Community Detection
                var community_assignment_result = community();
                var node_ids = Object.keys(community_assignment_result);
                var node_community = [];

                node_data.forEach( function (n) {
                    listNationsByKey[n].attributes["Modularity Class"] = community_assignment_result[n]
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

                // Create Graph
            	var data = {};
            	data.nodes = nodes;
            	data.edges = edges;

                // params to sigma
            	var params = {
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
            	$scope.sigma  = new sigma(params);

                saveOriginalColor($scope.sigma);

                $scope.sigma.bind('clickNode', function(e) {
                    console.log("e", e);
                    var nodeId = e.data.node.id,
                        toKeep = $scope.sigma.graph.neighbors(nodeId);
                    toKeep[nodeId] = e.data.node;

                    $scope.sigma.graph.nodes().forEach(function(n) {
                      if (toKeep[n.id])
                        n.color = n.originalColor;
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
                    console.log("start")
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
            }
        })
      }

      $scope.$watch('selectedDate', function (newVal, oldVal) {
        if (newVal !== oldVal ) {
            init(newVal); 
        }
    }, true);

    }])
