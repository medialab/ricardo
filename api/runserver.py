import os
from ricardo_api import app

isDebug = False
if 'FLASK_ENV' in os.environ and os.environ['FLASK_ENV'] == "development":
    isDebug = True

app.run(host= '0.0.0.0', debug=isDebug)
