'use strict';

/* Directives */

// Note: these directives wre added during a sprint the 06 / 07 / 2015
// They do not use the same coding pattern

angular.module('ricardo.directives-addendum', [])

.directive('brushableTimeline', [ 'cfSource', 'cfTarget','fileService', 'apiService', '$timeout', '$modal','DEFAULT_REPORTING','DEFAULT_PARTNER',
  function(                        cfSource,   cfTarget,  fileService,   apiService,   $timeout,   $modal,  DEFAULT_REPORTING,  DEFAULT_PARTNER ){

    return {
      restrict: 'A',
      replace: false,
      link: function( scope, element, attrs ) {

        var modalInstance;

          scope.open = function (size) {

               modalInstance = $modal.open({
                templateUrl: 'partials/modal.html',
                controller: 'ModalInstance',
                size: size
              });
          };

        var timelineData;

        var stacked = ricardo.stackedBar()
          .width(element.width())
          .height(200)
          .stackColors(["#7CA49E", "#D35530"])
          .on("brushing", function(d){
            scope.startDate = d[0].getFullYear()
            scope.endDate = d[1].getFullYear()
            if(!scope.$$phase) {
              scope.$apply()
            }
          })
          .on("brushed", function(d){
            cfSource.year().filterRange(d)
            cfTarget.year().filterRange(d)

            scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity))
            scope.streamData = [
              {key:"first", values:[
                {y: cfSource.imp(), x:0, key:"first"},
                {y: cfTarget.exp(), x:1, key:"second"}
                ]
              },
              {key:"second", values:[
                {y: cfSource.exp(), x:0, key:"second"},
                {y: cfTarget.imp(), x:1, key:"first"}
                ]
              }
            ]
            if(!scope.$$phase) {
              scope.$apply()
            }
          })

        var chart = d3.select(element[0]);
        
        var init = function(sourceID, targetID){
          
          apiService
            .getFlows({reporting_ids: sourceID, partner_ids: targetID})
            .then(
              function(data){
                var flows = data.flows,
                    mirror_flows = data.mirror_flows || [];
                    
                    scope.alerts = [];
                
                //manage empty country couple
                if(!flows.length){

                  scope.startDate = 1857
                  scope.endDate = 1938

                  scope.minDate = 1857
                  scope.maxDate = 1938
                  
                  scope.tableData = []
                  
                  scope.reportings = [scope.entities.sourceEntity.selected.RICname]
                  scope.partners = [scope.entities.targetEntity.selected.RICname]
                  scope.streamData = [
                    {key:"first", values:[
                      {y: 0, x:0, key:"first"},
                      {y: 0, x:1, key:"second"}
                      ]
                    },
                    {key:"second", values:[
                      {y: 0, x:0, key:"second"},
                      {y: 0, x:1, key:"first"}
                      ]
                    }
                  ]

                  timelineData = [{key:"imp", values:[]},{key:"exp", values:[]}];
                  var yearDiff = d3.range(scope.maxDate-scope.minDate)
                  yearDiff.forEach(function(d,i){
                    timelineData[0].values.push({total: null, year: new Date((1857+i), 0, 1)})
                    timelineData[1].values.push({total: null, year: new Date((1857+i), 0, 1)})
                  })

                  
                  scope.alerts.push({type:'danger', msg:'There are no data available in the database for this couple of countries'});
                  console.log(scope.alerts)

                  scope.missingData = timelineData;
                  update()
                  return
                }

                //end empty couple country
                

                if(cfSource.size()>0){
                  cfSource.year().filterAll()
                  cfSource.type().filterAll()
                  cfSource.clear();
                }

                if(cfTarget.size()>0){
                  cfTarget.year().filterAll()
                  cfTarget.clear();
                }

                cfSource.add(flows);
                cfTarget.add(mirror_flows);


                scope.startDate = cfSource.year().bottom(1)[0].year
                scope.endDate = cfSource.year().top(1)[0].year

                scope.minDate = cfSource.year().bottom(1)[0].year
                scope.maxDate = cfSource.year().top(1)[0].year
                
                scope.tableData = cfSource.year().top(Infinity).concat(cfTarget.year().top(Infinity))
                
                scope.reportings = [scope.entities.sourceEntity.selected.RICname]
                scope.partners = [scope.entities.targetEntity.selected.RICname]

                scope.streamData = [
                  {key:"first", values:[
                    {y: cfSource.imp(), x:0, key:"first"},
                    {y: cfTarget.exp(), x:1, key:"second"}
                    ]
                  },
                  {key:"second", values:[
                    {y: cfSource.exp(), x:0, key:"second"},
                    {y: cfTarget.imp(), x:1, key:"first"}
                    ]
                  }
                ]

                
                timelineData = [{key:"imp", values:[]},{key:"exp", values:[]}];
                flows.sort(function(a, b){ return d3.ascending(a.year, b.year); })
                flows.forEach(function(d){
                  timelineData[0].values.push({total: d.imp, year: new Date(d.year, 0, 1)})
                  timelineData[1].values.push({total: d.exp, year: new Date(d.year, 0, 1)})
                })

                scope.missingData = timelineData;
                
                update()
              },
              function(error) {
                console.log(error)
              }
            )
  
        }

        var update = function(){
          chart.datum(timelineData).call(stacked)
        }

        scope.$watchCollection('[entities.sourceEntity.selected, entities.targetEntity.selected]', function(newValue, oldValue){
          if(newValue != oldValue && newValue[0] && newValue[1]){
              scope.oldValues = oldValue
              init(newValue[0].RICid, newValue[1].RICid)
          }
        }, true)

        /* start initialize */
        scope.entities.sourceEntity.selected=scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_REPORTING})[0]
        scope.entities.targetEntity.selected=scope.reportingEntities.filter(function(e){return e.RICid==DEFAULT_PARTNER})[0]

        init(DEFAULT_REPORTING,DEFAULT_PARTNER)

        /* end initialize */

      }
    }
  }])