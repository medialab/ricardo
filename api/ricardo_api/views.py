from ricardo_api import app

from flask import request
from flask import Response
from flask import abort
from flask import jsonify

import ricardo_api.models as models

@app.route('/')
def index():
    return 'Hello World!'

@app.route('/flows')
def flows():
    reporting_ids = request.args.get('reporting_ids', '')
    partner_ids = request.args.get('partner_ids', '')
    original_currency = request.args.get('original_currency','0')=='1'
    with_sources = request.args.get('with_sources','0')=='1'
    from_year = request.args.get('from', '')
    to_year = request.args.get('to', '')

    if reporting_ids=="":
        abort(400)

    try:
        json_data=models.get_flows(reporting_ids.split(","),partner_ids.split(",")if partner_ids!='' else [],original_currency,from_year,to_year,with_sources)
    except Exception as e:
        app.logger.exception("exception occurs in flows")
        abort(500)
    return Response(json_data, status=200, mimetype='application/json')

def split_listarg(req, key):
    arg = request.args.get(key, '')
    return arg.split(",") if arg else []

@app.route('/continent_flows')
def continent_flows():
    continents = split_listarg(request, 'continents')
    reporting_ids = split_listarg(request, 'reporting_ids')
    partner_ids = split_listarg(request, 'partner_ids')
    with_sources = request.args.get('with_sources', '0') == '1'
    from_year = request.args.get('from', '')
    to_year = request.args.get('to', '')

    if not continents or (reporting_ids and partner_ids):
        abort(400)

    try:
        if partner_ids or not reporting_ids:
            json_data = models.get_continent_flows(continents, partner_ids, from_year, to_year, with_sources)
        else:
            json_data = models.get_continent_flows_for_reporting(continents, reporting_ids, from_year, to_year, with_sources)
    except Exception as e:
        app.logger.exception("exception occurs in flows")
        abort(500)
    return Response(json_data, status=200, mimetype='application/json')

@app.route('/reporting_entities')
def reporting_entities():
    type_filter = request.args.get('type_filter',None) #["countries","city","colonial_area","geographic_area"])
    to_partner_ids = request.args.get('to_partner_ids',None)
    types=type_filter.split(",") if type_filter else []

    try:
        json_data=models.get_reporting_entities(types,to_partner_ids.split(",") if to_partner_ids else [])
    except Exception:
        raise
        abort(500)

    return Response(json_data, status=200, mimetype='application/json')

@app.route('/mirror_entities')
def mirror_entities():
    reporting_id = request.args.get('reporting_id',None)  #only one !
    try:
        json_data=models.get_mirror_entities(reporting_id)
    except Exception:
         abort(500)

    return Response(json_data, status=200, mimetype='application/json')

@app.route('/RICentities')
def RICentities():
    #type_filter = request.args.get('type_filter',None) #["countries","city","colonial_area","geographic_area"])
    try:
        json_data=models.get_RICentities() #type_filter.split(",") if type_filter else [])
    except:
        abort(500)
    return Response(json_data, status=200, mimetype='application/json')

@app.route('/flows_sources')
def flows_sources():
    reporting_ids = request.args.get('reporting_ids', '')
    partner_ids = request.args.get('partner_ids', '')
    from_year = request.args.get('from', '')
    to_year = request.args.get('to', '')
    try:
        json_data=models.get_flows_sources(reporting_ids.split(","),partner_ids.split(",")if partner_ids!='' else [],from_year,to_year)
    except:
        app.logger.exception("exception in flow source")
        abort(500)
    return Response(json_data, status=200, mimetype='application/json')
