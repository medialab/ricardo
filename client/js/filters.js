'use strict';

/* Filters */

angular.module('ricardo.filters', [])
	.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }])

