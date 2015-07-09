'use strict';

angular.module('ricardo')
  .constant('BASE_API_URL', 'http://localhost:5000')
  .constant('DEFAULT_REPORTING', 'France')
  .constant('DEFAULT_PARTNER', 'Italy')
  .constant('DEFAULT_CONTINENT', 'Europe')
  .constant('TABLE_HEADERS', [
    {'field': 'reporting_id', 'displayName': 'reporting'},
    {'field': 'partner_id', 'displayName': 'partner'},
    {'field': 'type', 'displayName': 'partner type'},
    {'field': 'year', 'displayName': 'year'},
    {'field': 'imp', 'displayName': 'import'},
    {'field': 'exp', 'displayName': 'export'},
    {'field': 'total', 'displayName': 'total'},
    {'field': 'currency', 'displayName': 'currency'},
    {'field': 'sources', 'displayName': 'source'},
  ])
