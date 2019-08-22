# RICardo

**RICardo Project, Historical Trade Database**

This project contains 2 applications:

* [`ricardo_api`](API.md)': a [Flask](http://flask.pocoo.org/) application exposing a REST API serving data from the sqlite database in JSON format.
* `client`: an HTML5 angular.js application displaying data vizualisations from the ricardo API.

The dataset needed to run this application is available in the [ricardo data repository](http://github.com/medialab/ricardo_data).

## Docker Installation


### Build local images

+ Build your own images from the source code:

  ```bash
  docker-compose -f docker-compose.dev.yml build
  ```

### Run the stack


Start containers with the following command, which will run Ricardo and display all of its logs in the console until stopped by pressing `Ctrl+C`.

```bash
docker-compose -f docker-compose.dev.yml up
```

Or run the containers as a background daemon:

```bash
docker-compose -f docker-compose.dev.yml up -d
```


### Stop the stack


Stop containers with the following command:

```bash
docker-compose -f docker-compose.dev.yml stop
```

You also can stop containers and delete them: 
```bash
docker-compose -f docker-compose.dev.yml down
```

### Logs

You can inspect the logs of the various Docker containers using:

```bash
docker-compose -f docker-compose.dev.yml logs
```
or with option `-f` to track real time logging:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

### Custom `docker-compose.yml`

If you want to change reference configuration  in `docker-compose.dev.yml`, you can copy/paste it `docker-compose.yml`:
```bash
cp docker-compose.dev.yml docker-compose.yml
```
It's useful to change variables like the data's reference commit (`DATA_VERSION_REF`), enable debug, test others configurations related to your host.

If you do that you don't need to specify `-f docker-compose.dev.yml` argument anymore.

## Manual Installation

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

# Install to el Capitan
change python version, brew install python 

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
