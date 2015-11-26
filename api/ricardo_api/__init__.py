# coding=utf8

#python utils
import sqlite3
import json
import os
import logging
from logging.handlers import RotatingFileHandler
#flask
from flask import Flask
from flask import g
from flask.ext.cors import CORS
# ricardo
import config

from flask.ext.compress import Compress

app = Flask(__name__)
# app.run(threaded=True)
cors = CORS(app)
app.config.from_object(config)
Compress(app)

# logging
handler = RotatingFileHandler(os.path.join(os.path.dirname(os.path.realpath(__file__)),'ricardoapi.log'), maxBytes=10000, backupCount=1)
handler.setLevel(logging.INFO if app.debug else logging.ERROR)
app.logger.addHandler(handler)


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(os.path.join(app.root_path,app.config['DATABASE']))
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

import ricardo_api.views
