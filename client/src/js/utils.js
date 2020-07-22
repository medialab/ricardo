/**
 * Default getId function for item list based on the inline-select.
 */
export function getListItemId(item) {
  return item.type.value;
}

/**
 *  Check if param is in the url and make a watch on it for url sync.
 *  The params attribute is an array of :
 *     name: string  // the name of the parameter (in scope and url, it's the same)
 *     isArray?: boolean // if the parameter is an array
 *     list: array // the list of possible value for the param
 *     getItemId?: (item: any): any // function that return the id of the element. Ie the url we only put the id.
 */
export function initParams($route, $scope, params) {
  let urlParams = Object.assign({}, $route.current.params);

  // populate the scope with the variable from the url
  params.forEach((param) => {
    if (urlParams[param.name] !== undefined) {
      if (param.list) {
        if (param.isArray) {
          $scope[param.name] = param.list.filter(
            (item) => urlParams[param.name].split("|").indexOf(param.getItemId ? param.getItemId(item) : item) > -1,
          );
        } else {
          $scope[param.name] = param.list
            .filter((item) => (param.getItemId ? param.getItemId(item) : item) + "" === urlParams[param.name] + "")
            .shift();
        }
      } else {
        $scope[param.name] = urlParams[param.name];
      }
    }

    // Watch the params to sync the url query parameters
    const watchlist = params.filter((e) => !e.isArray).map((e) => e.name);
    $scope.$watchCollection(`[${watchlist.join(", ")}]`, function (newVal, oldVal) {
      newVal.forEach((item, index) => {
        if (oldVal[index] !== newVal[index]) {
          const param = params.find((e) => e.name == watchlist[index]);
          urlParams[param.name] = param.getItemId ? param.getItemId(item) : item;
        }
      });
      return $route.updateParams(urlParams);
    });

    // Deep Watch the array params to sync the url query parameters
    const watchArrayList = params.filter((e) => e.isArray);
    watchArrayList.forEach((param) => {
      $scope.$watch(
        param.name,
        function (newVal, oldVal) {
          if (newVal !== oldVal) {
            urlParams[param.name] = newVal.map((e) => (param.getItemId ? param.getItemId(e) : e)).join("|");
            return $route.updateParams(urlParams);
          }
        },
        true, // for deep watch (only available on `$watch`, not on `$watchCollection`)
      );
    });
  });
}
