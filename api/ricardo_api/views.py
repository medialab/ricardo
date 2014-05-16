from ricardo_api import app

from flask import request
from flask import Response
from flask import abort

import ricardo_api.models as models

@app.route('/')
def index():
    return 'Hello World!'

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
    if reporting_ids=="":
        abort(400)
   
    try:
        json_data=models.get_flows_in_pounds(reporting_ids.split(","),partner_ids.split(",")if partner_ids!='' else [])
    except Exception as e:
        app.logger.exception("exception occurs in flows")
        abort(500)
    return Response(json_data, status=200, mimetype='application/json')
    
@app.route('/reporting_entities')
def reporting_entities():
    type_filter = request.args.get('type_filter',None) #["countries","city","colonial_area","geographic_area"])
    to_world_only=True if request.args.get('to_world_only','0')=='1' else False

    
    try:
        json_data=models.get_reporting_entities(type_filter.split(",") if type_filter else [],to_world_only)
    except:
        abort(500)
    return Response(json_data, status=200, mimetype='application/json')
