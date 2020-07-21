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
  "$routeParams",
  "$location",
  "apiService",
  "DEFAULT_CURRENCY",
  function ($scope, $routeParams, $location, apiService, DEFAULT_CURRENCY) {
    $scope.view = "rates";
    $scope.loaded = false;

    /**
     * INITIAL STATE:
     * **************
     */
    // Initial dataset:
    $scope.currencyRatesToPound = null;
    // Dataset of rates between all currencies and the selected currency:
    $scope.currentyRates = null;
    // The selected currency, to compare to all the others:
    $scope.currency = $routeParams.currency;
    // The list given to autocomplete the Currency select:
    $scope.currenciesList = [];
    // The list of currencies that must appear in the curves list:
    $scope.filteredCurrenciesList = [];
    // The dictionary of currencies labels:
    $scope.currenciesDict = {};
    // The choices and selected choice to sort currencies as they appear in the
    // curves list:
    const SORT_ALPHA = "alpha";
    const SORT_ALPHA_REVERSED = "alpha_reversed";
    const HIGHEST_RATE = "highest_rate";
    const AVERAGE_RATE = "average_rate";
    $scope.sortChoices = [
      { id: SORT_ALPHA, label: "RATES_SORT_ALPHA" },
      { id: SORT_ALPHA_REVERSED, label: "RATES_SORT_ALPHA_REVERSED" },
      { id: HIGHEST_RATE, label: "RATES_SORT_HIGHEST_RATE" },
      { id: AVERAGE_RATE, label: "RATES_SORT_AVERAGE_RATE" },
    ];
    $scope.sortChoice = SORT_ALPHA;
    // A string to filter currencies that must appear in the curves list:
    $scope.currencyFilter = "";
    // The year boundaries for all records:
    $scope.boundaries = {
      minYear: Infinity,
      maxYear: -Infinity,
    };

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

      // Slugify all currency IDs, and store a prettified dictionary:
      const currenciesList = [];
      const slugifiedRatesToPound = {};
      for (let currency in currenciesRatesToPounds) {
        let slug = slugify(currency);
        let label = prettify(currency);
        currenciesList.push({ id: slug, label });
        slugifiedRatesToPound[slug] = currenciesRatesToPounds[currency];
      }

      $scope.boundaries.minYear = minYear;
      $scope.boundaries.maxYear = maxYear;
      $scope.currencyRatesToPound = {
        ref: DEFAULT_CURRENCY,
        rates: slugifiedRatesToPound,
      };
      $scope.currenciesList = currenciesList;
      $scope.currenciesDict = currenciesList.reduce((iter, { id, label }) => ({ ...iter, [id]: label }), {});
      $scope.loaded = true;

      $scope.selectCurrency(slugifiedRatesToPound[$scope.currency] ? $scope.currency : DEFAULT_CURRENCY);
    });

    /**
     * ACTIONS:
     * ********
     */
    $scope.selectCurrency = (currency) => {
      $scope.currency = currency;
      $scope.currencyRates = convertRates($scope.currencyRatesToPound, currency, $scope.boundaries);
      $scope.currencyFilter = "";
      $scope.refreshCurrenciesList();

      // Update URL:
      $location.url(`/rates/${currency}`);
    };

    $scope.refreshCurrenciesList = () => {
      $scope.filteredCurrenciesList = getFilteredCurrenciesList(
        $scope.currencyRates,
        $scope.sortChoice,
        $scope.currencyFilter,
        $scope.currenciesDict,
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
    function getFilteredCurrenciesList(currencyRates, sortChoice, query, dict) {
      const lcQuery = (query || "").toLowerCase();
      const filteredList = Object.keys(currencyRates.rates).filter((str) => dict[str].toLowerCase().includes(lcQuery));

      switch (sortChoice) {
        case SORT_ALPHA:
          return filteredList.sort();
        case SORT_ALPHA_REVERSED:
          return filteredList.sort().reverse();
        case HIGHEST_RATE:
          const highestRates = filteredList.reduce(
            (iter, curr) => ({ ...iter, [curr]: d3.max(Object.values(currencyRates.rates[curr])) }),
            {},
          );
          return filteredList.sort((a, b) => highestRates[a] - highestRates[b]);
        case AVERAGE_RATE:
          const meanRates = filteredList.reduce(
            (iter, curr) => ({ ...iter, [curr]: d3.mean(Object.values(currencyRates.rates[curr])) }),
            {},
          );
          return filteredList.sort((a, b) => meanRates[a] - meanRates[b]);
        default:
          return filteredList;
      }
    }

    /**
     * Helper to slugify / prettify currency values:
     */
    function slugify(currency) {
      return currency.replace(/[ +-_]+/g, "-");
    }
    function prettify(currency) {
      return currency[0].toUpperCase() + currency.substr(1);
    }
  },
]);
