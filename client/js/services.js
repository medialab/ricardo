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
  .factory('cf', function() {

    //"year","entity","partner","flow","unit","currency","rate_pounds","total_pounds","exp/imp","spe/gen/tot"
    var cf = crossfilter([]),
    all = cf.groupAll(),
    year = cf.dimension(function(d) { return d.year; }),
    years = year.group(),
    entity = cf.dimension(function(d) { return d.entity; }),
    entities = entity.group(),
    partner = cf.dimension(function(d) { return d.partner; }),
    partners = partner.group(),
    flow = cf.dimension(function(d) { return d.flow; }),
    flows = flow.group(),
    currency = cf.dimension(function(d) { return d.currency; }),
    currencies = currency.group(),
    total_pound = cf.dimension(function(d) { return d.total_pounds; }),
    total_pounds = total_pound.group(),
    exp_imp = cf.dimension(function(d) { return d.exp_imp; }),
    exp_imps = exp_imp.group();

    //decide which dimension/group to expose
    var exports = {};

    exports.add = function(data){ cf.add(data); }; // add new items, as array
    exports.clear = function(){ cf.remove(); };// reset crossfilter
    exports.size = function() { return cf.size(); }; // crossfilter size total
    exports.entity = function() { return entity};
    exports.entities = function() { return entities};
    exports.partner  = function() { return partner};
    exports.partners  = function() { return partners};

    return exports;
  })