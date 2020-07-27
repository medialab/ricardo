# RICardo

**RICardo Project, Historical Trade Database**

This project contains 2 applications:

- [`ricardo_api`](API.md)': a [Flask](http://flask.pocoo.org/) application exposing a REST API serving data from the sqlite database in JSON format.
- `client`: an HTML5 angular.js application displaying data vizualisations from the ricardo API.

## Ricardo - Web Application (client)

### Installation

If you want to run your instance of RICardo locally on your machine, be sure you have the following requirements installed.

#### Requirements

- [Git](http://git-scm.com/book/en/Getting-Started-Installing-Git)
- [Node / npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

#### Installation steps

Clone RICardo from the command line:

```
$ git clone https://github.com/medialab/ricardo.git
```

Browse to RICardo root folder:

```
$ cd ricardo
```

Browse to RICardo client root folder:

```
$ cd ricardo/client
```

Install client-side dependencies:

```
$ npm install
```

Edit configuration file

```
$ cd src/js
$ cp config.sample.js config.js
$ vi config.js
# edit config.js and add the correct root to API
'use strict';

angular.module('ricardo')
  .constant('BASE_API_URL', 'http://localhost:5000')
```

You can now run RICardo with the following command :

```
$ npm start
```

Once this is running, go to [http://localhost:8080/](http://localhost:8080/)

You can build the RICardo application with the following command :

```
$ npm run build
```

The build will be available in the `dist` folder.

### Angular app structure

Controllers are located under the `src/js/controllers` folder with one file per controller, and you should reference them in the file `src/js/controllers/index.js`.

Directives are located under the `src/js/directives` folder with one file per directive, and you should reference them in the file `src/js/directives/index.js`. Every chart component should have a directive.

Angular partials are located under the folder `src/public/partials`.

Api calls are done in the service `src/js/services.js`.

All files under the `src/public` folder are static.

CSS files must be referenced in the file `src/js/style.js`. The build process generates one CSS file from this JS file, and include it (with a style tag) in the `index.html`.

The same philosophy is applied to js dependencies, with the file `src/js/external_dependencies`.

## Ricardo - API

### Installation

If you want to run the RICardo API locally on your machine, be sure you have the following requirements installed.

#### Requirements

- [python 2.7](https://www.python.org/downloads/)
- [pip](https://pypi.org/project/pip/)

#### Database

The dataset needed to run this application is available in the [ricardo data repository](http://github.com/medialab/ricardo_data).
You can follow the readme of the project to know how to build the database.
It should produce a file called `RICardo_viz.sqlite`
You must copy `RICardo_viz.sqlite` in the folder`api/ricardo_api`.

You can change the path of the database by editing the `api/ricardo_api/config.py` if needed.

#### Installation steps

Go into the Api folder of the project

```
cd api
```

Install the server dependencies

```
pip install -r requirements.txt
```

Launch the server

```
python runserver.py
```

### API structure (flask framework)

```
+api/
|__+ricardo_api
	|__ __init.py__ 					-> connection to database
	|__config.py 						-> information element of database
	|__models.py 						-> methods to get and transform datas from DB to JSON api responses
	|__views.py 						-> routes to serve datas
	|__RICardo_visualisation.sqlite
```

### API responses

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

## Docker

### Run the stack with docker-compose

At the root of this project, there is a folder `docker` that contains a [https://docs.docker.com/compose/](docker-compose) stack
for the development.

You can run it by following those steps :

```
cd docker
docker-compose up
```

It will start for you the project stack with :

- An nginx that serves the client on port **80**
- the API

In `DEV` mode (check the file `.env`), the auto-reload of the code is enabled.

### Build the project images

The docker images of the project (ie. API & client) are build automatically by a gitlab process (see `.gitlab-ci.yml`).
Those images are build with the Dockerfiles `client/Dockerfile` & `api/Dockerfile`.
