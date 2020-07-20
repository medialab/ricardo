/**
 * Rates exchange format :
 * {
 *   ref: ID of the referential currency,
 *   rates: {
 *     [currencyId]: {
 *       [year]: Rate of the currency compared to the referential one
 *       ...
 *     }
 *     ...
 *   }
 *   ...
 * }
 */
angular.module("ricardo.controllers.rates", []).controller("rates", [
  "$scope",
  "apiService",
  function ($scope, apiService) {
    const DEFAULT_CURRENCY = "sterling pound";

    $scope.view = "rates";
    $scope.loading = true;

    /**
     * INITIALISATION:
     * ***************
     */
    apiService.getExchangeRates().then((result) => {
      // Prepare data:
      let minYear = Infinity;
      let maxYear = -Infinity;
      const parsedYears = {};

      // Index input by currency:
      const currenciesRatesToPounds = result.reduce((iter, { currency, year, rate_to_pounds }) => {
        if (!parsedYears[year]) {
          minYear = Math.min(minYear, +year);
          maxYear = Math.max(maxYear, +year);
          parsedYears[year] = true;
        }
        if (!iter[currency]) iter[currency] = {};
        iter[currency][year] = rate_to_pounds;
        return iter;
      }, {});

      $scope.minYear = minYear;
      $scope.maxYear = maxYear;
      $scope.currentyRatesToPound = {
        ref: DEFAULT_CURRENCY,
        rates: currenciesRatesToPounds,
      };
      $scope.currenciesList = Object.keys(currenciesRatesToPounds);
      $scope.loading = false;

      $scope.selectCurrency(DEFAULT_CURRENCY);
    });

    /**
     * INITIAL STATE:
     * **************
     */
    // Initial dataset:
    $scope.currentyRatesToPound = null;
    // Dataset of rates between all currencies and the selected currency:
    $scope.currentyRates = null;
    // The selected currency, to compare to all the others:
    $scope.currency = DEFAULT_CURRENCY;
    // The list given to autocomplete the Currency select:
    $scope.currenciesList = [];
    // The list of currencies that must appear in the curves list:
    $scope.filteredCurrenciesList = [];
    // The choices and selected choice to sort currencies as they appear in the
    // curves list:
    const SORT_ALPHA = "alpha";
    const SORT_ALPHA_REVERSED = "alpha_reversed";
    $scope.sortChoices = [
      { id: SORT_ALPHA, label: "name (A to Z)" },
      { id: SORT_ALPHA_REVERSED, label: "name (Z to A)" },
    ];
    $scope.sortChoice = SORT_ALPHA;
    // A string to filter currencies that must appear in the curves list:
    $scope.currencyFilter = "";
    // The min year value for all records:
    $scope.minYear = Infinity;
    // The max year value for all records:
    $scope.maxYear = -Infinity;

    /**
     * ACTIONS:
     * ********
     */
    $scope.selectCurrency = (currency) => {
      $scope.currency = currency;
      $scope.currencyRates = convertRates($scope.currentyRatesToPound, currency, {
        minYear: $scope.minYear,
        maxYear: $scope.maxYear,
      });
      $scope.currencyFilter = "";
      $scope.refreshCurrenciesList();
    };

    $scope.refreshCurrenciesList = () => {
      $scope.filteredCurrenciesList = getFilteredCurrenciesList(
        $scope.currencyRates,
        $scope.sortChoice,
        $scope.currencyFilter,
      );
    };

    $scope.selectSortChoice = (sortChoice) => {
      $scope.sortChoice = sortChoice;
      $scope.refreshCurrenciesList();
    };

    $scope.setCurrencyFilter = (query) => {
      $scope.currencyFilter = query;
      $scope.refreshCurrenciesList();
    };

    /**
     * HELPERS:
     * ********
     */

    /**
     * This function takes the conversion rates between all currencies and a
     * given referential one (british pound, most probably) and a currency, and
     * returns an object with the same structure, but with conversions rates
     * with the given currency.
     *
     * The `currencyRates` and output format is described at the beginning of
     * this controller.
     */
    function convertRates(currencyRates, newRef, boundaries) {
      if (newRef === currencyRates.ref) return currencyRates;

      const rates = currencyRates.rates;
      const minYear = boundaries.minYear;
      const maxYear = boundaries.maxYear;
      const selectedCurrencyRatesToPound = rates[newRef];

      const currenciesRatesToSelected = {};

      for (let currency in rates) {
        const currencyRatesToPound = rates[currency];
        const currencyRatesToSelected = {};

        for (let year = minYear; year < maxYear; year++) {
          if (year in currencyRatesToPound && year in selectedCurrencyRatesToPound) {
            currencyRatesToSelected[year] = +currencyRatesToPound[year] / +selectedCurrencyRatesToPound[year];
          }
        }

        currenciesRatesToSelected[currency] = currencyRatesToSelected;
      }

      return {
        ref: newRef,
        rates: currenciesRatesToSelected,
      };
    }

    /**
     * This function takes the current rates dataset, a sortBy option and a query
     * filter, and returns an array of currencies IDs that:
     *
     * - Contain the query string (case insensitive)
     * - Are sorted following the sortBy option
     *
     * The `currencyRates` format is described at the beginning of this
     * controller.
     */
    function getFilteredCurrenciesList(currencyRates, sortChoice, query) {
      const lcQuery = (query || "").toLowerCase();
      const filteredList = Object.keys(currencyRates.rates).filter((str) => str.toLowerCase().includes(lcQuery));

      switch (sortChoice) {
        case SORT_ALPHA:
          return filteredList.sort();
        case SORT_ALPHA_REVERSED:
          return filteredList.sort().reverse();
        default:
          return filteredList;
      }
    }
  },
]);
