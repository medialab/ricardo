# coding=utf8

#python utils
import sqlite3
import json
import os
#flask
from flask import Flask
from flask import g
# ricardo
import config

app = Flask(__name__)
app.config.from_object(config)

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
