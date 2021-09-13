import "angular-route";
import "angular-animate";
import "angular-sanitize";
import "angular-bootstrap";
import "ui-select/dist/select.js";
import "angular-loading-bar";
import "angular-translate";
import "angular-translate-loader-static-files";
import "angulartics";
import "angulartics-piwik";
import "angular-ui-grid";

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

// MATOMO START
var _paq = window._paq = window._paq || [];
/* tracker methods like "setCustomDimension" should be called before "trackPageView" */
_paq.push(['setDoNotTrack', true]);
_paq.push(['disableCookies']);
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
  var u='https://ws.sciences-po.fr/';
  _paq.push(['setTrackerUrl', u+'matomo.php']);
  _paq.push(['setSiteId', '15']);
  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
  g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
})();
// MATOMO END
