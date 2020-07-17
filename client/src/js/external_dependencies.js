import "angular-route";
import "angular-animate";
import "angular-sanitize";
import "angular-bootstrap";
import "ui-select/dist/select.js";
import "angular-loading-bar";
import "angular-translate";
import "angular-translate-loader-static-files";
import "angulartics";
import "angulartics-google-analytics";
import "ng-grid/ng-grid-2.0.1.min.js";

// Importing js deps
import "jquery";
import "jquery-ui/external/requirejs/require.js";
import "bootstrap/dist/js/bootstrap.min.js";
import "crossfilter/crossfilter.min.js";
import "sigma/build/plugins/sigma.parsers.json.min.js";
import "sigma/build/plugins/sigma.layout.forceAtlas2.min.js";
//import sigma/JLouvain.js",
import "sigma/build/plugins/sigma.plugins.neighborhoods.min.js";
import "sigma/build/plugins/sigma.renderers.snapshot.min.js";
import "sigma/build/plugins/sigma.plugins.filter.min.js";
//import "./node_modules/sigma/build/plugins/sigma.canvas.hoveredNode.js";

jQuery(document).ready(function () {
  $("<div class='affix-placeholder'></div>").insertAfter(".submenu:last");
});

(function (i, s, o, g, r, a, m) {
  i["GoogleAnalyticsObject"] = r;
  (i[r] =
    i[r] ||
    function () {
      (i[r].q = i[r].q || []).push(arguments);
    }),
    (i[r].l = 1 * new Date());
  (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m);
})(window, document, "script", "//www.google-analytics.com/analytics.js", "ga");
ga("create", "UA-37695848-8", "auto");
ga("send", "pageview");
