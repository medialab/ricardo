'use strict';

/* Controllers */

angular.module('ricardo.controllers.matrix', [])

  .controller('matrix', [ "$scope", "$location", "apiService", "utils",
    function ($scope, $location, apiService, utils) {

      var yearsDelta = d3.range(1787, 1940)

      $scope.sorted = {};
      $scope.sort = [
      {type: {value: "name",writable: true},
       name: {value: "name",writable: true}
       },
      {type: {value: "coverage",writable: true},
       name: {value: "coverage",writable: true}
      }]

    	var continentColors2 = [
    			{"name" :"Europe",
    			"color": "#F4463C"},
    			{"name" :"Asia",
    			"color": "#44CC51" },
    			{"name" :"Africa",
    			"color": "#9980FC"},
    			{"name" :"America",
    			"color": "#30361C"},
    			{"name" :"World",
    			"color": "#976909"},
    			{"name" :"Oceania",
    			"color": "#C3BF4E"}
    			]

  	  $scope.continentsColors = continentColors2;

        function init() {
          apiService
            .getReportingsAvailableByYear()
            .then(function (reportings){
              // transform array of string in array of int
              reportings.forEach(function (r) {
                r.years = r.years.split(',')
                                   .map(function (e) {
                                  return e = parseInt(e)
                                })
              })

              $scope.matrix = reportings
            })
        }

        init()

        $scope.sortReportings = function(newVal) {
          $scope.changed = newVal.type.value;
        }


    }])