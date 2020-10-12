angular
  .module("ricardo.services.reporting", [])
  .config([
    "$httpProvider",
    function ($httpProvider) {
      delete $httpProvider.defaults.headers.common["X-Requested-With"];
    },
  ])
  .factory("reportingService", function () {
    return {
      rollupYears: function (leaves) {
        var nb_exps_not_null = leaves.filter(function (l) {
          return l.exp != null;
        }).length;
        var nb_imps_not_null = leaves.filter(function (l) {
          return l.imp != null;
        }).length;
        var res = {
          exp: d3.sum(leaves, function (d) {
            if (!/^World/.test(d.partner_id)) return d.exp;
            else return 0;
          }),
          imp: d3.sum(leaves, function (d) {
            if (!/^World/.test(d.partner_id)) return d.imp;
            else return 0;
          }),
        };
        if (nb_exps_not_null == 0) res.exp = null;
        if (nb_imps_not_null == 0) res.imp = null;

        res.tot = res.exp || res.imp ? res.exp + res.imp : null;
        res.type = leaves[0].type;
        res.currency = leaves[0].currency;
        return res;
      },
      valuesToPartners: function (partners, indexYears) {
        let type = undefined;
        return partners.map(p => {
          const data = p.values.reduce((years,d) => {
            type = d.values.type
            if (d.values.exp || d.values.imp)
              return Object.assign({[d.key]:{
                total: d.values.exp || d.values.imp ? ((d.values.exp + d.values.imp) / indexYears[d.key].tot) * 100 : null,
                exp: d.values.exp ? (d.values.exp / indexYears[d.key].exp) * 100 : null,
                imp: d.values.imp ? (d.values.imp / indexYears[d.key].imp) * 100 : null,
                abs_total: d.values.tot,
                abs_exp: d.values.exp,
                abs_imp: d.values.imp,
                currency: d.values.currency
              }}, years);
            else
              return years;
          },{})
          
          return {
            key: p.key,
            label: p.key,
            type,
            data,
            average:{
              total: d3.mean(
                Object.values(data).filter((d) => d.total != null),
                d => d.total
              ),
              imp: d3.mean(
                Object.values(data).filter((d) => d.imp != null),
                d => d.imp
              ),
              exp: d3.mean(
                Object.values(data).filter((d) => d.exp != null),
                d => d.exp
              ),

            }
          }
        })
      }
    };
  })
  .factory("countryLines", function () {
    return {
      initLineChart2: function (linechart_flows, yearSelected, linechartData, ric, yValue, color) {
        var countryTab = {};
        countryTab.values = yearSelected;
        countryTab.color = color;
        countryTab.key = ric;
        countryTab.flowType = yValue;
        linechart_flows.push(countryTab);
        linechart_flows.forEach(function (d) {
          linechartData.push(d);
        });
      },
    };
  });
