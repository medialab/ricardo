# RICardo

**RICardo Project, Historical Trade Database**

This project contains 3 applications:

* `database_creation`: a set of python scripts transforming the source Access database into a sqlite one and doing a set of data manipulation and validation on the go.
* [`ricardo_api`](API.md)': a [Flask](http://flask.pocoo.org/) application exposing a REST API serving data from the sqlite database in JSON format.
* `client`: an HTML5 angular.js application displaying data vizualisations from the ricardo API.

## Installation

### Requirements

Python 2.7, pip, node, npm, and [bower](http://bower.io/).

To install bower:

```bash
(sudo) npm install -g bower
```

To install pip
```bash
sudo easy_install pip
```
### Database

Move the `RICardo_visualisation.sqlite` database file to `api/ricardo_api` (you can change the path of the database by editing the `api/ricardo_api/config.py` if needed.

### Server dependencies

To install the server dependencies (you should probably use a `virtualenv`):

```
cd api
pip install -r requirements.txt
```

### Client dependencies

```
bower install
```

Then copy and edit the config:

```
cd client
cp js/config.sample.js js/config.js
vim js/config.js
```

## Usage

### Running the API server

```
cd api
python runserver.py
```

### Running the client

Just serve the `client` folder.

```
# With python, for instance
cd client
python -m SimpleHTTPServer
```
