/*
 * Partner view Controller :
 */
angular.module("ricardo.controllers.partner", []).controller("partner", [
  "$scope",
  "$route",
  "$routeParams",
  "apiService",
  "partnerEntities",
  function ($scope, $route, $routeParams, apiService, partnerEntities) {
    $scope.view = "partner";
    $scope.loaded = false;

    /**
     * INITIAL STATE:
     * **************
     */
    // The selected partner ID:
    $scope.partner = $routeParams.partner;
    // The list of all available partners full data objects:
    $scope.partnersList = partnerEntities.map((ricEntry) => ({
      id: ricEntry.RICid,
      label: ricEntry.RICname,
      type: ricEntry.type,
    }));
    // A dictionary of partner labels, indexed by IDs:
    $scope.partnersDict = $scope.partnersList.reduce((iter, partner) => ({ ...iter, [partner.id]: partner.label }), {});

    // The extrema years range (only depends on the data):
    $scope.minDate = null;
    $scope.maxDate = null;
    // The currently selected years range (bound to params later in the code):
    $scope.selectedMinDate = $route.current.params.selectedMinDate;
    $scope.selectedMaxDate = $route.current.params.selectedMaxDate;
    // The years values lists:
    $scope.minDateRange = [];
    $scope.maxDateRange = [];

    // Flows data for charts:
    $scope.flows = null;

    // Political statuses data:
    $scope.statusesData = {};
    $scope.sovereigntyData = {};
    $scope.dependenciesData = [];
    $scope.boundaries = { minYear: null, maxYear: null };

    /**
     * ACTIONS:
     * ********
     */
    $scope.selectPartner = (partner) => {
      $scope.partner = partner;
      $scope.updateQueryParams();

      apiService
        .getFlows({
          partner_ids: $scope.partner,
          with_sources: 1,
        })
        .then((data) => {
          $scope.flows = data.flows;

          const dates = $scope.flows.map((d) => d.year);
          $scope.minDate = d3.min(dates);
          $scope.maxDate = d3.max(dates);

          $scope.selectDates();
        });
    };

    $scope.selectDates = (state = {}) => {
      if ("selectedMinDate" in state) $scope.selectedMinDate = state.selectedMinDate;
      if ("selectedMaxDate" in state) $scope.selectedMaxDate = state.selectedMaxDate;

      // Set initial values if missing:
      if (!$scope.selectedMinDate) $scope.selectedMinDate = -Infinity;
      if (!$scope.selectedMaxDate) $scope.selectedMaxDate = Infinity;

      // Check absolute extrema:
      $scope.selectedMinDate = Math.min(Math.max($scope.selectedMinDate, $scope.minDate), $scope.maxDate - 1);
      $scope.selectedMaxDate = Math.min(Math.max($scope.selectedMaxDate, $scope.minDate + 1), $scope.maxDate);

      // Check dates compared to each other:
      $scope.selectedMaxDate = Math.max($scope.selectedMaxDate, $scope.selectedMinDate + 1);

      // Reset available date ranges:
      $scope.minDateRange = d3.range($scope.minDate, $scope.selectedMaxDate);
      $scope.maxDateRange = d3.range($scope.selectedMinDate + 1, $scope.maxDate);

      $scope.updateQueryParams();
      $scope.updatePoliticalStatuses();
    };
    $scope.selectMinDate = (selectedMinDate) => $scope.selectDates({ selectedMinDate });
    $scope.selectMaxDate = (selectedMaxDate) => $scope.selectDates({ selectedMaxDate });

    $scope.updateQueryParams = () => {
      $route.updateParams({
        partner: $scope.partner,
        selectedMinDate: $scope.selectedMinDate,
        selectedMaxDate: $scope.selectedMaxDate,
      });
    };

    $scope.updatePoliticalStatuses = () => {
      const { entities, statusInTime } = $scope.statusesData || {};
      const partner = $scope.partner;
      const minYear = $scope.selectedMinDate;
      const maxYear = $scope.selectedMaxDate;

      if (!entities || !statusInTime) return;

      // Search for entity in GeoPolHist corpus:
      const gphPartnerEntity = entities.find((entity) => partner === entity.GPH_name);

      // If no entity has been found, reset related data:
      if (!gphPartnerEntity) {
        $scope.sovereigntyData = {};
        $scope.dependenciesData = [];
        $scope.boundaries = { minYear, maxYear };
        return;
      }

      const entitiesIndex = entities.reduce(
        (iter, entity) => ({
          ...iter,
          [entity.GPH_code]: entity,
        }),
        {},
      );
      const sovereigntyStatuses = {
        Sovereign: true,
        "Sovereign (limited)": true,
        "Sovereign (unrecognized)": true,
      };
      const dependenciesStatuses = {
        "Became colony of": true,
        "Became part of": true,
        "Became dependency of": true,
        "Became protectorate of": true,
        "Became vassal of": true,
        "Became possession of": true,
      };
      $scope.sovereigntyData = [];
      $scope.dependenciesData = [];
      statusInTime.forEach(({ GPH_code, sovereign_GPH_code, GPH_status, start_year, end_year }) => {
        // Check years boundaries:
        if (+start_year > +maxYear || end_year < minYear) return;

        const startYear = Math.max(start_year, minYear);
        const endYear = Math.min(end_year, maxYear);

        if (sovereigntyStatuses[GPH_status] && GPH_code === gphPartnerEntity.GPH_code) {
          $scope.sovereigntyData.push({
            relation: GPH_status,
            startYear: startYear,
            endYear: endYear,
          });
        }
        if (dependenciesStatuses[GPH_status] && sovereign_GPH_code === gphPartnerEntity.GPH_code) {
          $scope.dependenciesData.push({
            id: GPH_code,
            label: entitiesIndex[GPH_code].GPH_name,
            relation: GPH_status,
            startYear: startYear,
            endYear: endYear,
          });
        }
      });
      $scope.boundaries = { minYear, maxYear };
    };

    /**
     * INITIALISATION:
     * ***************
     */
    apiService.getGeoPolHistData().then((data) => {
      $scope.statusesData = data;
      $scope.updatePoliticalStatuses();
      $scope.selectPartner($scope.partner);
    });
  },
]);
