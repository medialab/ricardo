'use strict';

/* Services */

angular.module('ricardo.services.country', [])
  .config(function ( $httpProvider) {
      delete $httpProvider.defaults.headers.common['X-Requested-With'];
  })
  .factory('countryService', function () {
    return {
        rollupYears:  function (leaves){
            var res = {
            exp: d3.sum(leaves, function(d){ 
              if (!/^World/.test(d.partner_id) )
                return d.exp
              else
                return 0
            }),
            imp: d3.sum(leaves, function(d){
              if (!/^World/.test(d.partner_id) )
                return d.imp
              else
                return 0
            }),
            };
            res.tot = res.exp + res.imp;
            res.type = leaves
            return res;
            },
        addTypePartner: function(partners, data) {
            var entityChecked = []; 
            partners.forEach(function (d) {
            if (entityChecked.indexOf(d.key) === -1 ) {
              for (var i = 0, len = data.length; i < len; i++) {
                if (d.key === data[i].partner_id) {
                  d.type = data[i].type
                  entityChecked.push(d.key);
                }
              }  
            }
            })
            return partners;
            },
        valuesToPartners: function(partners, indexYears) {
          partners.forEach(function(p){
            p.years = []
            p.values.forEach(function(d){
              p.years.push({
                key: d.key,
                exp: d.values.exp,
                imp: d.values.imp,
                balance: (d.values.exp - d.values.imp) / (d.values.exp + d.values.imp) || 0,
                pct_exp: d.values.exp / indexYears[d.key].exp * 100,
                pct_imp: d.values.imp / indexYears[d.key].imp * 100,
                pct_tot: (d.values.exp + d.values.imp) / indexYears[d.key].tot * 100
              });
            });

            delete p.values;
            p.avg_tot = d3.mean(p.years, function(d){ return d.pct_tot });
            p.avg_imp = d3.mean(p.years, function(d){ return d.pct_imp });
            p.avg_exp = d3.mean(p.years, function(d){ return d.pct_exp });
          })
          return partners  
        }
    }
  })
  .factory('countryLines', function () {
    return {
        initLineChart2: function(linechart_flows, yearSelected, linechartData, ric, yValue, color) {
            var countryTab = {};
            countryTab.values = yearSelected;
            countryTab.color = color;
            countryTab.key = ric;
            countryTab.flowType = yValue;
            linechart_flows.push(countryTab);
            linechart_flows.forEach( function (d) {
            linechartData.push(d);        
          })
        }
    }
  })