'use strict';

/* Services */

angular.module('ricardo.services', [])
  .config(function ( $httpProvider) {
      delete $httpProvider.defaults.headers.common['X-Requested-With'];
  })
  .factory('fileService', [ "$http", "$q", function($http, $q) {

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
  }])
  .factory('dataTableService', function() {

   return {
     sortData : function(data, field, direction) {
        if (data) {
          data.sort(function (a, b) {
                if (direction === "asc") {
              return a[field]> b[field]? 1 : -1;
            } else {
              return a[field]> b[field]? -1 : 1;
            }
          })
        }
      }

      }
  })
  .factory('lineChartService', function(){
    return {

      adjustArrayTime : function (linechart_flows, min, max) {
          var years = d3.nest()
            .key(function (d) {return d.year})
            .entries(linechart_flows)

          var minDate = d3.min(years, function (years) {return years.key})
          var maxDate = d3.max(years, function (years) {return years.key})

          if (minDate > min) {
            for (var i = min; i < minDate; i++)
            {
              linechart_flows.push({
                reporting_id: linechart_flows[0].reporting_id,
                type: linechart_flows[0].reporting_id,
                partner_id: linechart_flows[0].partner_id,
                year: i,
                imp:null,
                exp:null,
                tot: null ,
                currency: null,
                sources: null
              })
            }
          }

          if ( maxDate < max ) {
            for (var i = maxDate; i < max; i++)
            {
              linechart_flows.push({
                reporting_id: linechart_flows[0].reporting_id,
                type: linechart_flows[0].reporting_id,
                partner_id: linechart_flows[0].partner_id,
                year: i,
                imp:null,
                exp:null,
                tot: null ,
                currency: null,
                sources: null
              })
            }
          }
          return linechart_flows;
      },
      initTabLineChart: function (result, yearSelected, type, ric, dateMin, dateMax )  {
        for (var i = dateMin; i <= dateMax; i++) {
        yearSelected.push({
          reporting_id: ric,
          type: type,
          partner_id:"Worldbestguess",
          year: i,
          imp: null,
          exp: null,
          total: null,
          currency:null,
          sources:null
          });
      }

        yearSelected.forEach( function (d) {
          result.flows.forEach( function (e) {
            if (d.year === e.year && d.year >= dateMin && d.year <= dateMax) {
              d.exp = e.exp;
              d.imp = e.imp;
              d.currency = e.currency,
              d.sources = e.sources
              d.total = e.exp + e.imp;
              if (d.total === 0)
                d.total = null;
            }
          })
        })
        return yearSelected;
      }
    }
  })
  .factory('apiService', ['$http', '$q', '$rootScope', 'BASE_API_URL', function($http, $q, $rootScope, BASE_API_URL) {
   return {
     getReportingEntities: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/reporting_entities'
       $http({
          method: 'GET',
          url : BASE_API_URL + serviceUrl,
          params : params,
          cache: true
        }).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("Error 500 : An error occured while fetching data");
       });
       return deferred.promise;
     },
     getBilateralEntities: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/bilateral_entities'
       $http({
          method: 'GET',
          url : BASE_API_URL + serviceUrl,
          params : params,
          cache: true
        }).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("Error 500 : An error occured while fetching data");
       });
       return deferred.promise;
     },
     getReportingYears: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/reporting_years'
       $http({
          method: 'GET',
          url : BASE_API_URL + serviceUrl,
          params : params,
          cache: true
        }).success(function(data){
          deferred.resolve(data);
       }).error(function(){
         deferred.reject("Error 500 : An error occured while fetching data");
       });

       return deferred.promise;
     },
     getFlows: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/flows'
       $http({
          method: 'GET',
          url : BASE_API_URL + serviceUrl,
          params : params,
          cache:true
          // cache: false
        }).success(function(data){
         deferred.resolve(data);
       }).error(function (err){
         deferred.reject(arguments);
       });

       return deferred.promise;
     },
     getContinentFlows: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/continent_flows'
       $http({
          method: 'GET',
          url : BASE_API_URL + serviceUrl,
          params : params,
          cache: true
        }).success(function(data){
          deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching data");
       });
       return deferred.promise;
     },
     getWorldFlows: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/world_flows'
       $http({
          method: 'GET',
          url : BASE_API_URL + serviceUrl,
          params : params,
          // cache: false
          cache:true
        }).success(function(data){
          deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching data");
       });
       return deferred.promise;
     },
     getFlowsResources: function(url){
       var deferred = $q.defer();
       $http.get(url).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching file");
       });

       return deferred.promise;
     },
    getMirrorEntities: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/mirror_entities'
       $http({
          method: 'GET',
          url : BASE_API_URL + serviceUrl,
          params : params,
          cache: true
        }).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching data");
       });

       return deferred.promise;
     },
     getRICEntities: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/RICentities'
       $http({
          method: 'GET',
          url : BASE_API_URL + serviceUrl,
          params : params,
          cache: true
        }).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching data");
       });

       return deferred.promise;
     },
     getReportingsNetwork: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/nations_network'
       $http({
          method: 'GET',
          url: BASE_API_URL + serviceUrl,
          params: params,
          cache: true
        }).success(function(data){
          deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching data");
       });

       return deferred.promise;
     },
     getNumberFlows: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/nb_flows_by_year'
       $http({
          method: 'GET',
          url: BASE_API_URL + serviceUrl,
          params: params,
          cache: true,
        }).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching data");
       });
       return deferred.promise;
     },
     getReportingsAvailableByYear: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/reportings_available_by_years'
       $http({
          method: 'GET',
          url: BASE_API_URL + serviceUrl,
          params: params,
          cache: true,
          timeout: 100000
        }).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching data");
       });

       return deferred.promise;
     },
     getWorldAvailable: function(params){
       var deferred = $q.defer();
       var serviceUrl = '/world_available'
       $http({
          method: 'GET',
          url: BASE_API_URL + serviceUrl,
          params: params,
          cache: true,
          timeout: 100000
        }).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching data");
       });

       return deferred.promise;
     },
     getBlogRSS: function(params){
       var deferred = $q.defer();
       $http({
          method: 'GET',
          url : BASE_API_URL + '/blog_RSS.xml',
          cache: true
        }).success(function(data){
         deferred.resolve(data);
       }).error(function(){
         deferred.reject("An error occured while fetching Blog RSS");
       });
       return deferred.promise;
     },
   }
  }])
  .factory('cfSource', function() {

    var cf = crossfilter([]),
    all = cf.groupAll(),
    year = cf.dimension(function(d) { return new Date(d.year, 0, 1); }),
    years = year.group(d3.time.year).reduce(reduceAdd, reduceRemove, reduceInitial),
    partner = cf.dimension(function(d) { return d.partner_id}),
    partners = partner.group().reduce(reduceAdd, reduceRemove, reduceInitial).order(order),
    continent = cf.dimension(function(d){return d.continent }),
    continents = continent.group().reduce(reduceAddContinent, reduceRemoveContinent, reduceInitialContinent).order(order),
    type = cf.dimension(function(d){return d.type}),
    types = type.group();

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

     function reduceAddContinent(p, v) {
      ++p.count;
      p.imp += Math.round(v.imp);
      p.exp += Math.round(v.exp);
      p.tot = p.imp + p.exp;
      p.partner_id=p.continent;
      p.year=p.year;
      return p;
    }

    function reduceRemoveContinent(p, v) {
      --p.count;
      p.imp -= Math.round(v.imp);
      p.exp -= Math.round(v.exp);
      p.tot = p.imp + p.exp
      p.partner_id=p.continent;
      p.year=p.year;
      return p;
    }

    function reduceInitialContinent() {
      return {count:0, imp: 0, exp: 0, tot: 0, partner_id:"", year:""};
    }


    function order(p) {
      return p.tot;
    }

    // Decide which dimension/group to expose
    var exports = {};

    exports.add = function(data){ cf.add(data); }; // add new items, as array
    exports.clear = function(){ cf.remove(); };// reset crossfilter
    exports.size = function() { return cf.size(); }; // crossfilter size total
    exports.all = function() { return all};
    exports.year = function() { return year};
    exports.years = function() { return years};
    exports.partner = function() { return partner};
    exports.partners = function() { return partners};
    exports.continent = function() { return continent};
    exports.continents = function() { return continents};
    exports.type = function() { return type};
    exports.types = function() { return types};
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

    // Decide which dimension/group to expose
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
  .factory('cfSourceLine', function() {

    var cf = crossfilter([]),
    all = cf.groupAll(),
    year = cf.dimension(function(d) { return new Date(d.year, 0, 1); }),
    years = year.group(d3.time.year).reduce(reduceAdd, reduceRemove, reduceInitial),
    partner = cf.dimension(function(d) { return d.partner_id}),
    partners = partner.group().reduce(reduceAdd, reduceRemove, reduceInitial).order(order),
    type = cf.dimension(function(d){return d.type}),
    types = type.group();

    var reduceAdd = function (p, v) {
      ++p.count;
      p.imp += Math.round(v.imp);
      p.exp += Math.round(v.exp);
      p.tot = p.imp + p.exp
      return p;
    }

    var reduceRemove =  function(p, v) {
      --p.count;
      p.imp -= Math.round(v.imp);
      p.exp -= Math.round(v.exp);
      p.tot = p.imp + p.exp
      return p;
    }

    var reduceInitial = function() {
      return {count:0, imp: 0, exp: 0, tot: 0};
    }

    var order = function(p) {
      return p.tot;
    }

    // Decide which dimension/group to expose
    var exports = {};

    exports.add = function(data){ cf.add(data); }; // add new items, as array
    exports.clear = function(){ cf.remove(); };// reset crossfilter
    exports.size = function() { return cf.size(); }; // crossfilter size total
    exports.all = function() { return all};
    exports.year = function() { return year};
    exports.years = function() { return years};
    exports.partner = function() { return partner};
    exports.partners = function() { return partners};
    exports.type = function() { return type};
    exports.types = function() { return types};
    exports.imp = function() { return all.reduceSum(function(d) { return d.imp; }).value()};
    exports.exp  = function() { return all.reduceSum(function(d) { return d.exp; }).value()};
    exports.total  = function() { return all.reduceSum(function(d) { return d.total; }).value()};

    return exports;
  })
  .factory('utils', function() {

    // Is the given value a plain JavaScript object
    function isPlainObject(value) {
      return value &&
             typeof value === 'object' &&
             !Array.isArray(value) &&
             !(value instanceof Date) &&
             !(value instanceof RegExp);
    }

    // Convert an object into an array of its properties
    function objectToArray(o, order) {
      order = order || Object.keys(o);

      return order.map(function(k) {
        return o[k];
      });
    }

    // Retrieve an index of keys present in an array of objects
    function keysIndex(a) {
      var keys = [],
          l,
          k,
          i;

      for (i = 0, l = a.length; i < l; i++)
        for (k in a[i])
          if (!~keys.indexOf(k))
            keys.push(k);

      return keys;
    }

    // Escape a string for a RegEx
    function rescape(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // Converting an array of arrays into a CSV string
    function toCSVString(data, params) {
      params = params || {};

      var header = params.headers || [],
          plainObject = isPlainObject(data[0]),
          keys = plainObject && (params.order || keysIndex(data)),
          oData,
          i;

      // Defaults
      var escape = params.escape || '"',
          delimiter = params.delimiter || ',';

      // Dealing with headers polymorphism
      if (!header.length)
        if (plainObject && params.headers !== false)
          header = keys;

      // Should we append headers
      oData = (header.length ? [header] : []).concat(
        plainObject ?
          data.map(function(e) { return objectToArray(e, keys); }) :
          data
      );

      // Converting to string
      return oData.map(function(row) {
        return row.map(function(item) {

          // Wrapping escaping characters
          var i = ('' + (typeof item === 'undefined' || item === null ? '' : item)).replace(
            new RegExp(rescape(escape), 'g'),
            escape + escape
          );

          // Escaping if needed
          return ~i.indexOf(delimiter) || ~i.indexOf(escape) || ~i.indexOf('\n') ?
            escape + i + escape :
            i;
        }).join(delimiter);
      }).join('\n');
    }

    function downloadCSV(data, headers, order, fileName) {
      var csv = toCSVString(data, {headers: headers, order: order}),
          blob = new Blob([csv], {type: "attachment/csv;charset=utf-8"}),
          dataUrl = URL.createObjectURL(blob);

      var a = document.createElement("a");
      a.style.display = 'none';
      a.setAttribute("href", dataUrl);
      document.body.appendChild(a);
      a.setAttribute("download", fileName + ".csv");
      a.click();
      document.body.removeChild(a);

      // a = null;
      // URL.revokeObjectURL(dataUrl);
    }

    return {
      downloadCSV: downloadCSV,
      toCSVString: toCSVString
    };
  });
