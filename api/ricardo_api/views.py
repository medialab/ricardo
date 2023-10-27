from ricardo_api import app

from flask import request
from flask import Response
from flask import abort
from flask import jsonify
import feedparser
from . import config
import json
import calendar


import ricardo_api.models as models


@app.route("/")
def index():
    return 'Welcome to RICardo API. </br>You could find more informations in the Github repository of <a href="https://github.com/medialab/ricardo">RICardo Medialab project</a>'


@app.route("/flows")
def flows():
    reporting_ids = request.args.get("reporting_ids", "")
    partner_ids = request.args.get("partner_ids", "")
    original_currency = request.args.get("original_currency", "0") == "1"
    with_sources = request.args.get("with_sources", "0") == "1"
    from_year = request.args.get("from", "")
    to_year = request.args.get("to", "")

    # if there is no reporting and partner ids, then we return a 400
    if not reporting_ids and not partner_ids:
        abort(400)

    try:
        json_data = models.get_flows(
            reporting_ids.split(",") if reporting_ids != "" else [],
            partner_ids.split(",") if partner_ids != "" else [],
            original_currency,
            from_year,
            to_year,
            with_sources,
        )
    except Exception as e:
        app.logger.exception("exception occurs in flows")
        abort(500)

    return Response(json_data, status=200, mimetype="application/json")


def split_listarg(req, key):
    arg = request.args.get(key, "")
    return arg.split(",") if arg else []


@app.route("/continent_flows")
def continent_flows():
    continents = split_listarg(request, "continents")
    reporting_ids = split_listarg(request, "reporting_ids")
    partner_ids = split_listarg(request, "partner_ids")
    with_sources = request.args.get("with_sources", "0") == "1"
    from_year = request.args.get("from", "")
    to_year = request.args.get("to", "")

    if not continents or (reporting_ids and partner_ids):
        abort(400)

    try:
        if partner_ids or not reporting_ids:
            json_data = models.get_continent_flows(
                continents, partner_ids, from_year, to_year, with_sources
            )
        else:
            json_data = models.get_continent_flows_for_reporting(
                continents, reporting_ids, from_year, to_year, with_sources
            )
    except Exception as e:
        app.logger.exception("exception occurs in flows")
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/world_flows")
def world_flows():
    flow_field = request.args.get("flow_field", "")
    with_sources = request.args.get("with_sources", "0") == "1"
    from_year = request.args.get("from", "")
    to_year = request.args.get("to", "")
    try:
        json_data = models.get_world_flows(from_year, to_year)
    except Exception as e:
        app.logger.exception("exception occurs in flows")
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/continent_with_partners")
def continent_with_partners():
    flow_field = request.args.get("flow_field", "")
    with_sources = request.args.get("with_sources", "0") == "1"
    from_year = request.args.get("from", "")
    to_year = request.args.get("to", "")
    try:
        json_data = models.get_continent_nb_partners(from_year, to_year)
    except Exception as e:
        app.logger.exception("exception occurs in flows")
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/reporting_years")
def reporting_years():
    try:
        json_data = models.get_reporting_years()
    except Exception:
        raise
        abort(500)

    return Response(json_data, status=200, mimetype="application/json")


@app.route("/reporting_entities")
def reporting_entities():
    type_filter = request.args.get(
        "type_filter", None
    )  # ["countries","city","colonial_area","geographic_area"])
    to_partner_ids = request.args.get("partners_ids", None)
    types = type_filter.split(",") if type_filter else []
    try:
        json_data = models.get_reporting_or_partner_entities(
            types, to_partner_ids.split(",") if to_partner_ids else [], "reporting"
        )
    except Exception:
        raise
        abort(500)

    return Response(json_data, status=200, mimetype="application/json")


@app.route("/partner_entities")
def partner_entities():
    type_filter = request.args.get(
        "type_filter", None
    )  # ["countries","city","colonial_area","geographic_area"])
    from_reporting_ids = request.args.get("reporting_ids", None)
    types = type_filter.split(",") if type_filter else []
    try:
        json_data = models.get_reporting_or_partner_entities(
            types,
            from_reporting_ids.split(",") if from_reporting_ids else [],
            "partner",
        )
    except Exception:
        raise
        abort(500)

    return Response(json_data, status=200, mimetype="application/json")


@app.route("/bilateral_entities")
def bilateral_entities():
    try:
        json_data = models.get_bilateral_entities()
    except Exception:
        raise
        abort(500)

    return Response(json_data, status=200, mimetype="application/json")


@app.route("/mirror_entities")
def mirror_entities():
    reporting_id = request.args.get("reporting_id", None)  # only one !
    try:
        json_data = models.get_mirror_entities(reporting_id)
    except Exception:
        abort(500)

    return Response(json_data, status=200, mimetype="application/json")


@app.route("/RICentities")
def RICentities():
    # type_filter = request.args.get('type_filter',None) #["countries","city","colonial_area","geographic_area"])
    try:
        json_data = (
            models.get_RICentities()
        )  # type_filter.split(",") if type_filter else [])
    except:
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/flows_sources")
def flows_sources():
    reporting_ids = request.args.get("reporting_ids", "")
    partner_ids = request.args.get("partner_ids", "")
    from_year = request.args.get("from", "")
    to_year = request.args.get("to", "")
    try:
        json_data = models.get_flows_sources(
            reporting_ids.split(","),
            partner_ids.split(",") if partner_ids != "" else [],
            from_year,
            to_year,
        )
    except:
        app.logger.exception("exception in flow source")
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/nations_network")
def nations_network():
    year = request.args.get("year", "")
    try:
        json_data = models.get_nations_network_by_year(year)
    except:
        app.logger.exception("exception in flow source")
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/nb_flows_by_year")
def nb_flows_by_year():
    partner = request.args.get("partner", "")
    try:
        json_data = models.get_nb_flows(partner)
    except:
        app.logger.exception("exception in flows available")
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/reportings_available_by_years")
def reportings_available_by_years():
    partner = request.args.get("partner", "")
    try:
        # json_data=models.get_reportings_overview(partner_ids)
        json_data = models.get_reportings_available_by_year(partner)
        # json_data=models.get_world_available()
    except:
        app.logger.exception("exception in nations available")
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/world_available")
def world_available():
    try:
        json_data = models.get_world_available()
    except:
        app.logger.exception("exception in nations available")
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/exchange_rates")
def exchange_rates():
    try:
        json_data = models.get_echange_rates()
    except:
        abort(500)
    return Response(json_data, status=200, mimetype="application/json")


@app.route("/blog_RSS.xml")
def blog_RSS():
    try:
        rss_data = feedparser.parse(config.BLOG_RSS)
        posts = []
        for e in rss_data["entries"]:
            posts.append(
                {
                    "title": e["title"],
                    "day": e.published_parsed[2],
                    "month": calendar.month_abbr[e.published_parsed[1]],
                    "year": e.published_parsed[0],
                    "description": e.description.split(" <")[0],
                    "url": e.link,
                }
            )
    except:
        app.logger.exception("exception in retrieving BLOG RSS")
        abort(500)
    return Response(json.dumps(posts), status=200, mimetype="application/rss+xml")
