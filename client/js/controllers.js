'use strict';

/* Controllers */

angular.module('ricardo.controllers', [])
  .controller('navbar', function($scope, $location) {

  	$scope.isActive = function (viewLocation) { 
        return viewLocation === $location.path();
    };
    
    $scope.views = [
      {slug:"bilateral", label:"Bilateral view"},
      {slug:"country", label:"Country view"},
      {slug:"world", label:"World view"},
      {slug:"timeline", label:"Timeline view"},
      {slug:"federation", label:"Federation view"},
    ]

  })
  .controller('bilateral', function($scope, $location, fileService, cf) {

    $scope.country2;
    $scope.country = [
      "Afghanistan",
      "Albania",
      "Algeria",
      "Andorra",
      "Angola",
      "Antigua and Barbuda",
      "Argentina",
      "Armenia",
      "Aruba",
      "Australia",
      "Austria",
      "Bahamas",
      "Bahrain",
      "Bangladesh",
      "Barbados",
      "Belarus",
      "Belgium",
      "Belize",
      "Benin",
      "Bhutan",
      "Bolivia",
      "Bosnia and Herzegovina",
      "Botswana",
      "Brazil",
      "Brunei",
      "Bulgaria",
      "Burkina Faso",
      "Burma",
      "Burundi"
    ]

    $scope.testData = []
    $scope.gridOptions = { data: 'testData' }

    // $scope.data;

    // fileService
    //   .getFile('data/ricardo_basic_14janv.csv')
    //   .then(
    //     function(data){
    //     $scope.data = d3.csv.parse(
    //                     data, 
    //                     function(d) {
    //                       return {
    //                         entity: d.entity,
    //                         partner: d.partner,
    //                         currency: d.currency,
    //                         exp_imp: d["exp/imp"],
    //                         year: new Date(+d.year, 0, 1),
    //                         flow: +d.flow,
    //                         total_pounds: +d.total_pounds,
    //                       }
    //                     })

    //     var france = $scope.data.filter(function(d){return d.entity == "France"})
    //     console.log(france.length)
    //     cf.add(france)
    //     cf.partner().filter("Brazil")
    //     var timeev = d3.nest().key(function(d){return d.exp_imp}).entries(cf.year().top(Infinity))
    //     console.log(timeev)
    //     },
    //     function(error) {
    //       console.log(error)
    //     }
    //   )

  })
  .controller('country', function($scope, $location) {

  })
  .controller('world', function($scope, $location) {

  })
  .controller('timeline', function($scope, $location) {

  })
  .controller('federation', function($scope, $location) {

  })