'use strict';

/* Services */


angular.module('ricardo.services', [])
  .factory('fileService', function($http, $q) {

   return {

     getFile : function(url){
       var deferred = $q.defer();
       $http.get(url).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching file");
       });

       return deferred.promise;
     }
   }
  })
  .factory('apiService', function($http, $q) {

   return {

     getReportingEntities : function(url){
       var deferred = $q.defer();
       $http.get(url).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching file");
       });

       return deferred.promise;
     },
     getFlows : function(url){
       var deferred = $q.defer();
       $http.get(url).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching file");
       });

       return deferred.promise;
     },
     getFlowsResources : function(url){
       var deferred = $q.defer();
       $http.get(url).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching file");
       });

       return deferred.promise;
     }
   }
  })
  .factory('cfSource', function() {

    var cf = crossfilter([]),
    all = cf.groupAll(),
    year = cf.dimension(function(d) { return new Date(d.year, 0, 1); }),
    years = year.group(d3.time.year).reduce(reduceAdd, reduceRemove, reduceInitial),
    partner = cf.dimension(function(d) { return d.partner}),
    partners = partner.group().reduce(reduceAdd, reduceRemove, reduceInitial).order(order);

    function reduceAdd(p, v) {
      ++p.count;
      p.imp += Math.round(v.imp);
      p.exp += Math.round(v.exp);
      p.tot = p.imp + p.exp
      return p;
    }

    function reduceRemove(p, v) {
      --p.count;
      p.imp -= Math.round(v.imp);
      p.exp -= Math.round(v.exp);
      p.tot = p.imp + p.exp
      return p;
    }

    function reduceInitial() {
      return {count:0, imp: 0, exp: 0, tot: 0};
    }

    function order(p) {
      return p.tot;
    }

    //decide which dimension/group to expose
    var exports = {};

    exports.add = function(data){ cf.add(data); }; // add new items, as array
    exports.clear = function(){ cf.remove(); };// reset crossfilter
    exports.size = function() { return cf.size(); }; // crossfilter size total
    exports.all = function() { return all};
    exports.year = function() { return year};
    exports.years = function() { return years};
    exports.partner = function() { return partner};
    exports.partners = function() { return partners};
    exports.imp = function() { return all.reduceSum(function(d) { return d.imp; }).value()};
    exports.exp  = function() { return all.reduceSum(function(d) { return d.exp; }).value()};
    exports.total  = function() { return all.reduceSum(function(d) { return d.total; }).value()};

    return exports;
  })
  .factory('cfTarget', function() {

    var cf = crossfilter([]),
    all = cf.groupAll(),
    year = cf.dimension(function(d) { return new Date(d.year, 0, 1); }),
    years = year.group(d3.time.year);

    //decide which dimension/group to expose
    var exports = {};

    exports.add = function(data){ cf.add(data); }; // add new items, as array
    exports.clear = function(){ cf.remove(); };// reset crossfilter
    exports.size = function() { return cf.size(); }; // crossfilter size total
    exports.all = function() { return all};
    exports.year = function() { return year};
    exports.imp = function() { return all.reduceSum(function(d) { return d.imp; }).value()};
    exports.exp  = function() { return all.reduceSum(function(d) { return d.exp; }).value()};
    exports.total  = function() { return all.reduceSum(function(d) { return d.total; }).value()};

    return exports;
  })