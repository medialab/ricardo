import os
from ricardo_api import app

isDebug = False
if os.environ['FLASK_ENV'] == "development":
    isDebug = True

app.run(host= '0.0.0.0', debug=isDebug)
