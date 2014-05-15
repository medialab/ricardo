#python utils
import sqlite3
import json
#flask
from flask import Flask
from flask import g
from flask import request
from flask import Response
from flask import abort
# model
from model import get_flows_in_pounds,get_reporting_entities 

app = Flask(__name__)

try :
    conf=json.load(open("config.json","r"))
except :
    print "500 ERROR"
    exit(1)


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(conf["sqlite_filename"])
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/flows')
def flows():
    # reportings = request.args.get('reportings', '')
    # partners = request.args.get('partners', '')
    reporting_ids = request.args.get('reporting_ids', '')
    partner_ids = request.args.get('partner_ids', '')
    flow_type = request.args.get('type','')
    with_sources = request.args.get('with_sources','')
    # from=YYYY)
    # to=YYYY)
    cursor = get_db().cursor()
    try:
        json_data=get_flows_in_pounds(cursor,reporting_ids.split(","),partner_ids.split(",")if partner_ids!='' else [])
    except:
        raise
        abort(500)
    return Response(json_data, status=200, mimetype='application/json')
    
@app.route('/reporting_entities')
def reporting_entities():
    type_filter = request.args.get('type_filter',None) #["countries","city","colonial_area","geographic_area"])
    to_world_only=True if request.args.get('to_world_only','0')=='1' else False

    cursor = get_db().cursor()
    try:
        json_data=get_reporting_entities(cursor,type_filter.split(",") if type_filter else [],to_world_only)
    except:
        abort(500)
    return Response(json_data, status=200, mimetype='application/json')



if __name__ == '__main__':
    app.run(debug=True)