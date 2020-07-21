export function getListItemId(item) {
  return item.type.value;
}

/**
 *  Check if param is in the url and make a watch on it
 *
 *     name: string,
 *     list: array,
 *     getItemId: (item: any): any
 */
export function initParams($route, $scope, params) {
  let urlParams = Object.assign({}, $route.current.params);
  params.forEach((param) => {
    if (urlParams[param.name] !== undefined) {
      if (param.list) {
        $scope[param.name] = param.list.filter((item) => param.getItemId(item) == urlParams[param.name]).shift();
      } else {
        $scope[param.name] = urlParams[param.name];
      }
      console.log("param", param.name, $scope[param.name]);
    }

    // Just a watcher to update the url
    const watchlist = params.map((e) => e.name);
    $scope.$watchCollection(`[${watchlist.join(", ")}]`, function (newVal, oldVal) {
      if (newVal !== oldVal) {
        newVal.forEach((item, index) => {
          if (oldVal[index] != newVal[index]) {
            const param = params.find((e) => e.name == watchlist[index]);
            urlParams[param.name] = param.getItemId ? param.getItemId(item) : item;
          }
        });
        return $route.updateParams(urlParams);
      }
    });
  });
}
