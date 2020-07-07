"use strict";

angular
  .module("ricardo")
  .constant("BASE_API_URL", process.env.API_URL || "http://localhost:5000");
