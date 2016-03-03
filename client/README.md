##App Installation
If you want to run your instance of RICardo locally on your machine, be sure you have the following requirements installed.

###Requirements

- [Git](http://git-scm.com/book/en/Getting-Started-Installing-Git)
- [Bower](http://bower.io/#installing-bower)

Clone RICardo from the command line:

``` 
$ git clone https://github.com/medialab/ricardo.git
```

browse to RICardo root folder:

``` 
$ cd ricardo
```

browse to RICardo client root folder:

``` 
$ cd ricardo/client
```

install client-side dependencies:

``` 
$ bower install
```

edit configuration file

```
$ cd js
$ cp config.sample.js config.js
$ vi config.js
# edit config.js and add the correct root to API
'use strict';

angular.module('ricardo')
  .constant('BASE_API_URL', 'http://localhost:5000')
```

You can now run RICardo from your local web server. For example, you can run Python's built-in server:

``` 
$ python -m SimpleHTTPServer 4000
```

or for Python 3+

``` 
$ python -m http.server 4000
```

Once this is running, go to [http://localhost:4000/](http://localhost:4000/)

# API structure (flask framework)
```
+api/
|__+ricardo_api
	|__ __init.py__ 					-> connection to database
	|__config.py 						-> information element of database
	|__models.py 						-> methods to get and transform datas from DB to JSON api responses
	|__views.py 						-> routes to serve datas
	|__RICardo_visualisation.sqlite
```

# API responses
```
# RICentities
List all entities from the database

# reporting_entities
List entities which has reported Imp/Exp flows.

# flows
The main raw data API. flows will provide the exp/imp flows between countries.

# continent_flows
Flows aggregated by continent

# flows_sources
Provide a list of all sources used in a flow API call.
Used to get them all at once without repeating them in flow.
```

# Angular app structure (version after rush 07/2015)

- one controller per view in js/controllers.js
- one directive by viz component in js/directives.js
- templates are in partials
- api calls are in services.js 
- some files are in lib/ricardo/*.js ?

# App architecture
```
/client
|_+css
|_+js
	|__app.js 						-> all routes and databinding form DB
	|__config.js
	|__config.sample.js 			-> config and config.sample are files for load constants to display default value
	|__+controllers 				
		|__navbar
		|__TranslateController 
		|__bilateral
		|__country
		|__world
	|__directives.js
		|__navbar
		|__bilateralTitle
		|__countryTitle
		|__worldTitle
		|__inlineSelectCountry
		|__inlineSelectYear
		|__dualTimeline
		|__comparisonTimeline
		|__brushingTimeline
		|__partnersHistogram
		|__barChart
		|__linechartWorld 					
	|__services.js 					
	|__filters.js 					
|_+lib
	|_+angular
	|_+bower_components
|_+partials
	|_modal.html
	|_navbar.html
	|_bilateral
	|_country
	|_world
```


