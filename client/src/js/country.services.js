angular
  .module("ricardo.services.country", [])
  .config([
    "$httpProvider",
    function ($httpProvider) {
      delete $httpProvider.defaults.headers.common["X-Requested-With"];
    },
  ])
  .factory("countryService", function () {
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
        res.type = leaves;
        return res;
      },
      addTypePartner: function (partners, data) {
        var entityChecked = [];
        partners.forEach(function (d) {
          for (var i = 0, len = data.length; i < len; i++) {
            if (d.key === data[i].partner_name) {
              d.type = data[i].type;
            }
          }
        });
        return partners;
      },
      valuesToPartners: function (partners, indexYears) {
        partners.forEach(function (p) {
          p.years = [];
          p.values.forEach(function (d) {
            if (d.values.exp || d.values.imp)
              p.years.push({
                key: d.key,
                exp: d.values.exp,
                imp: d.values.imp,
                balance: (d.values.exp - d.values.imp) / (d.values.exp + d.values.imp) || 0,
                pct_exp: d.values.exp ? (d.values.exp / indexYears[d.key].exp) * 100 : null,
                pct_imp: d.values.imp ? (d.values.imp / indexYears[d.key].imp) * 100 : null,
                pct_tot:
                  d.values.exp || d.values.imp ? ((d.values.exp + d.values.imp) / indexYears[d.key].tot) * 100 : null,
              });
          });

          delete p.values;
          p.avg_tot = d3.mean(
            p.years.filter(function (d) {
              return d.pct_tot != null;
            }),
            function (d) {
              return d.pct_tot;
            },
          );
          p.avg_imp = d3.mean(
            p.years.filter(function (d) {
              return d.pct_imp != null;
            }),
            function (d) {
              return d.pct_imp;
            },
          );
          p.avg_exp = d3.mean(
            p.years.filter(function (d) {
              return d.pct_exp != null;
            }),
            function (d) {
              return d.pct_exp;
            },
          );
          if (!p.avg_tot && p.avg_imp) p.avg_tot = p.avg_imp;
          if (!p.avg_tot && p.avg_exp) p.avg_tot = p.avg_exp;
        });
        return partners;
      },
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
