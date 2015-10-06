##Installation
If you want to run your instance of RICardo locally on your machine, be sure you have the following requirements installed.

###Requirements

- [Git](http://git-scm.com/book/en/Getting-Started-Installing-Git)
- [Bower](http://bower.io/#installing-bower)


Clone RICardo from the command line:

``` sh
$ git clone https://github.com/medialab/ricardo.git
```

browse to RICardo root folder:

``` sh
$ cd ricardo
```

browse to RICardo client root folder:

``` sh
$ cd ricardo/client
```

install client-side dependencies:

``` sh
$ bower install
```

edit configuration file

```sh
$ cd js
$ cp config.sample.js config.js
$ vi config.js
# edit config.js and add the correct root to API
'use strict';

angular.module('ricardo')
  .constant('BASE_API_URL', 'http://localhost:5000')
```

You can now run RICardo from your local web server. For example, you can run Python's built-in server:

``` sh
$ python -m SimpleHTTPServer 4000
```

or for Python 3+

``` sh
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

# New app's architecture proposition
```
/client
|_+css
|_+js
	|__app.js 						-> all routes and databinding form DB
	|__config.js
	|__config.sample.js 			-> config and config.sample are files for load constants to display default value
	|__+controllers 				-> one controller file by controller for maintenance, scalability and lazyloading 
		|__bilateral.controller.js	-> new version [done]
		|__country.controller.js	-> new version [done]
		|__world.controller.js		-> new version
	|__directives.js 				-> maybe a directory with many files like controllers ?
	|__services.js 					-> maybe a directory with many files like controllers ?
	|__filters.js 					-> use ?
|_+lib
	|_+angular
	|_+bower_components
	|_+ricardo
		|_linecharts.js 			-> useless ?
		|_missing.js 				
		|_partnersHistogram.js		-> new version [done]
		|_stackedbar.js				-> new version [done]
		|_stream.js 				-> useless ?
|_+partials
	|_+commons 						-> views include in every views
		|_modal.html
		|_navbar.html
	|_+bilateral
	|_+country
	|_+world
```

# Propositions
_ use grunt or gulp to minify js and css
_ there are two README and two API.md 
