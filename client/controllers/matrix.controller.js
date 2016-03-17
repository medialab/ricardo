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
    			"color": "#DADB63"},
    			{"name" :"Asia",
    			"color": "#E3B1D2" },
    			{"name" :"Africa",
    			"color": "#77E0B6"},
    			{"name" :"America",
    			"color": "#96D2DF"},
    			{"name" :"World",
    			"color": "#E3B171"},
    			{"name" :"Oceania",
    			"color": "#AEDF8A"}
    			]

  	  $scope.continentsColors = continentColors2;

        function init() {
          apiService
            .getReportingsAvailableByYear()
            .then(function (data){
              //data manipulation

              var data_nest=d3.nest()
                              .key(function(d){return d.reporting_id})
                              .entries(data)
              data_nest.forEach(function(d){
                d["reporting"]=d.values[0]["reporting"];
                d["continent"]=d.values[0]["continent"];
              })
              console.log(data_nest);
              // transform array of string in array of int
            //   data.forEach(function (r) {
            //     r.years = r.years.split(',')
            //                        .map(function (e) {
            //                       return e = parseInt(e)
            //                     })
            //   })

            //   $scope.matrix = data
            })
        }

        init()

        $scope.sortReportings = function(newVal) {
          $scope.changed = newVal.type.value;
        }
 }])