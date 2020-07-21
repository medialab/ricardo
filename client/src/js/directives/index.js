"use strict";

import "./barChart.directive.js";
import "./brushingTimeline.directive.js";
import "./collapseLegend.directive.js";
import "./comparisonTimeline.directive.js";
import "./countryTitle.directive.js";
import "./dualtimeline.directive.js";
import "./index.js";
import "./inlineSelectCountry.directive.js";
import "./inlineSelectCtrl.directive.js";
import "./inlineSelectCurrency.directive.js";
import "./inlineSelectYear.directive.js";
import "./linechartTitle.directive.js";
import "./linechartWorld.directive.js";
import "./navbar.directive.js";
import "./numberFlows.directive.js";
import "./partnersHistogram.directive.js";
import "./reportingEntities.directive.js";
import "./reportingSynth.directive.js";
import "./reportingWorld.directive.js";
import "./worldTitle.directive.js";
import "./exchangeRateCurves.directive.js";

angular.module("ricardo.directives", [
  "ricardo.directives.navbar",
  "ricardo.directives.worldTitle",
  "ricardo.directives.countryTitle",
  "ricardo.directives.inlineSelectCountry",
  "ricardo.directives.dualTimeline",
  "ricardo.directives.inlineSelectCurrency",
  "ricardo.directives.inlineSelectCtrl",
  "ricardo.directives.inlineSelectYear",
  "ricardo.directives.linechartTitle",
  "ricardo.directives.comparisonTimeline",
  "ricardo.directives.brushingTimeline",
  "ricardo.directives.partnersHistogram",
  "ricardo.directives.barChart",
  "ricardo.directives.linechartWorld",
  "ricardo.directives.collapseLegend",
  "ricardo.directives.reportingEntities",
  "ricardo.directives.reportingWorld",
  "ricardo.directives.reportingSynth",
  "ricardo.directives.numberFlows",
  "ricardo.directives.exchangeRateCurves",
]);
