import "./bilateral.controller.js";
import "./reporting.controller.js";
import "./home.controller.js";
import "./metadata.controller.js";
import "./navbar.controller.js";
import "./network.controller.js";
import "./translate.controller.js";
import "./world.controller.js";
import "./rates.controller.js";

angular.module("ricardo.controllers", [
  "ricardo.controllers.navbar",
  "ricardo.controllers.TranslateController",
  "ricardo.controllers.bilateral",
  "ricardo.controllers.reporting",
  "ricardo.controllers.world",
  "ricardo.controllers.rates",
  "ricardo.controllers.network",
  "ricardo.controllers.metadata",
  "ricardo.controllers.home",
]);
