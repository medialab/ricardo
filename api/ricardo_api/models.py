# coding=utf8

from ricardo_api import app
from ricardo_api import get_db

import sqlite3
import json
import codecs
import networkx as nx
import operator
from difflib import SequenceMatcher

def ric_entities_data(ids=[]):
    cursor = get_db().cursor()

    where_clause="""WHERE slug in ("%s")"""%("\",\"".join(ids)) if len(ids)>0 else ""

    cursor.execute("""SELECT slug,RICname,type,continent
                      FROM  RICentities
                      %s"""%where_clause)

    rics=[]
    for (id,r,t,continent) in cursor:
        rics.append({
            "RICid":id,
            "RICname":r,
            "type":t,
            "continent":continent
            })
    return rics


def flows_data(reporting_ids,partner_ids,original_currency,from_year,to_year,with_sources,group_reporting_by="", search_by_reporting=False):
    cursor = get_db().cursor()
    partners_clause =""" AND partner_slug IN ("%s")"""%'","'.join(partner_ids) if len(partner_ids)>0 else ""
    # world_partner_clause = "AND partner_slug NOT LIKE 'Worl%%'" if "Worldbestguess" not in partner_ids else ""
    from_year_clause = """ AND year>%s"""%from_year if from_year!="" else ""
    to_year_clause = """ AND year<%s"""%to_year if to_year!="" else ""

    print original_currency
    flow_field = "Flow*Unit/rate" if not original_currency else "Flow*Unit"
    source_field = """,group_concat(Source,"|")""" if with_sources else ""

    if group_reporting_by=="":
        cursor.execute("""SELECT reporting_slug,partner_slug,year,group_concat(expimp,"|"),group_concat(%s,"|"),currency%s
                      FROM flow_joined
                      where reporting_slug IN ("%s")
                      %s
                      and  %s is not null
                      and partner_slug is not "NA"
                      GROUP BY reporting,partner,year
                      ORDER BY  year ASC
                      """%(flow_field, source_field,'","'.join(reporting_ids),partners_clause+from_year_clause+to_year_clause,flow_field)
                )
    elif group_reporting_by=="continent": # in these 2 usecases, reporting_ids are continents
        if search_by_reporting:  # In this usecase, partner_ids are actually reporting_ids
            cursor.execute("""SELECT reporting_slug, partner_continent, year, group_concat(expimp,"|"), group_concat(%s,"|"), currency%s
                      FROM flow_joined
                      WHERE reporting_slug IN ("%s") AND partner_continent IN ("%s")
                      %s
                      AND ( %s IS NOT null)
                      and partner_slug is not "NA"
                      GROUP BY partner_continent, reporting_slug, year
                      ORDER BY year ASC
                      """%(flow_field,source_field,'","'.join(partner_ids),'","'.join(reporting_ids),from_year_clause+to_year_clause,flow_field)
                )
        else:
            cursor.execute("""SELECT reporting_continent,partner_slug,year,group_concat(expimp,"|"),group_concat(%s,"|"),currency%s
                      FROM flow_joined
                      where reporting_continent IN ("%s") AND partner_continent NOT IN ("%s")
                      %s
                      AND ( %s IS NOT null)
                      and partner_slug is not "NA"
                      GROUP BY reporting_continentt, partner, year
                      ORDER BY year ASC
                      """%(flow_field,source_field,'","'.join(reporting_ids),'","'.join(reporting_ids),partners_clause+from_year_clause+to_year_clause,flow_field)
                )

    flows=[]
    partners_meta={}
    last_y={}
    for fields in cursor:
        if with_sources:
            (r_id,p_id,y,expimp_g,flow_g,currency,source_g)=fields
        else:
            (r_id,p_id,y,expimp_g,flow_g,currency)=fields

        imports=[]
        exports=[]
        if p_id not in last_y.keys():
            last_y[p_id]=y
        if flow_g:
            if len(expimp_g.split("|")) != len(flow_g.split("|")) :
                app.logger.debug("%s %s"%(expimp_g,flow_g))
            for i,ei in enumerate(expimp_g.split("|")):
                if ei == "Imp":
                    imports.append(float(flow_g.split("|")[i]))
                elif ei == "Exp":
                    exports.append(float(flow_g.split("|")[i]))
        if group_reporting_by=="":
            # duplicates are only possible when not grouping
            dups=[]
            if len(imports)>1 :
                dups.append((r_id,"Imp from",p_id,y,imports))
            if len(exports)>1:
                dups.append((r_id,"Exp to",p_id,y,exports))
            for dup in dups:
                app.logger.warning("Warning duplicated flows for %s %s %s in %s with dup flows in pounds : %s"%dup)
        if group_reporting_by=="":
            # resolve duplicates and null cases
            imp=max(imports) if len(imports)>0 else None
            exp=max(exports) if len(exports)>0 else None
        else:
            # when grouping we sum exp imp
            imp=sum(imports)
            exp=sum(exports)
        total = (imp if imp else 0) + (exp if exp else 0)
        # deal with missing years in flows list
        for missing_year in (last_y[p_id]+i+1 for i in range(y-(last_y[p_id]+1))):
            flows.append({
                "reporting_id":r_id,
                "partner_id":p_id,
                "year":missing_year,
                "imp": None,
                "exp": None,
                "total": None,
                "currency":currency if original_currency else "sterling pound",
                })
        flows.append({
            "reporting_id":r_id,
            "partner_id":p_id,
            "year":y,
            "imp": imp,
            "exp": exp,
            "total": total,
            "currency":currency if original_currency else "sterling pound",
            })
        last_y[p_id]=y
        if with_sources:
            sources=set(source_g.split("|") if source_g else [])
            flows[-1]["sources"]=list(sources)[0] if sources else ""

    return flows

def get_flows_sources(reporting_ids,partner_ids,from_year,to_year):
    cursor = get_db().cursor()
    partners_clause =""" AND partner_slug IN ("%s")"""%'","'.join(partner_ids) if len(partner_ids)>0 else ""
    from_year_clause = """ AND year>%s"""%from_year if from_year!="" else ""
    to_year_clause = """ AND year<%s"""%to_year if to_year!="" else ""

    cursor.execute("""SELECT distinct(Source)
                      FROM flow_joined
                      where reporting_slug IN ("%s")
                      %s
                      and rate is not null
                      and Flow is not null
                      """%('","'.join(reporting_ids),partners_clause+from_year_clause+to_year_clause)
                )

    return json.dumps({"sources":[_[0] for _ in cursor]},encoding="UTF8")

def get_world_flows(from_year,to_year):
    cursor = get_db().cursor()
    from_year_clause = """ AND year>%s"""%from_year if from_year!="" else ""
    to_year_clause = """ AND year<%s"""%to_year if to_year!="" else ""
    # print from_year_clause, to_year_clause
    cursor.execute("""SELECT SUM(flow*Unit/rate), year, COUNT(*), expimp, Source
                      FROM flow_joined
                      WHERE partner_slug = "Worldbestguess"
                      %s
                      GROUP BY year, expimp
                      ORDER BY year ASC
                      """%(from_year_clause+to_year_clause)
                )

    json_response=[]
    for (flow, year, nb_reporting, type, sources) in cursor:
      json_response.append({
      "year":year,
      "flows":flow,
      "nb_reporting": nb_reporting,
      "type":type,
      "sources": sources
      })

    return json.dumps(json_response,encoding="UTF8")

def get_reportings_available_by_year():
  cursor = get_db().cursor()
  cursor.execute("""SELECT reporting_slug, continent, group_concat(DISTINCT year) as years
                    FROM flow_joined
                    group by reporting_slug"""
                )

  json_response=[]
  for (reporting_id, continent, years) in cursor:
    json_response.append({
    "reporting_id": reporting_id,
    "continent": continent,
    "years":years
    })

  return json.dumps(json_response,encoding="UTF8")

def get_reportings_overview(partner_ids):
  partners_clause = "NOT LIKE 'World%'"if partner_ids=="" else "LIKE '%s'"%partner_ids

  cursor = get_db().cursor()
  cursor.execute("""SELECT t1.reporting_slug as reporting_id,t1.reporting as reporting,t1.reporting_continent  as continent, t1.reporting_type as type, t1.year as year,
                    ifnull(SUM(t1.exports),0) as exports,ifnull(SUM(t2.imports),0) as imports,
                    group_concat(t1.partner_slug,"|") as exp_partners, group_concat(t1.partner_continent,"|") as exp_continents,group_concat(t1.partner_type,"|") as exp_types,
                    group_concat(t2.partner_slug,"|") as imp_partners, group_concat(t2.partner_continent,"|") as imp_continents,group_concat(t2.partner_type,"|") as imp_types,
                    group_concat(t1.source,"|") as sources,
                    group_concat (DISTINCT t1.type) as sourcetype
                    FROM
                    (SELECT reporting, reporting_slug , partner_slug, partner_continent,partner_type,(flow*Unit/rate) as exports, expimp, year, Source, type, reporting_continent,reporting_type
                    FROM flow_joined
                    WHERE expimp = "Exp"
                    AND partner_slug %s
                    AND Flow is not NULL
                    AND reporting_continent is not "World") t1
                    LEFT OUTER JOIN
                      (SELECT reporting_slug,partner_slug, partner_continent,partner_type,(flow*Unit/rate) as imports, expimp, year, source,type
                    FROM flow_joined
                    WHERE expimp = "Imp"
                    AND partner_slug %s
                    AND Flow is not NULL) t2
                    ON  t1.year = t2.year AND  t1.reporting_slug = t2.reporting_slug AND t1.partner_slug = t2.partner_slug
                    GROUP BY  t1.reporting_slug, t1.year
                     """%(partners_clause,partners_clause)
                )
  json_response=[]
  table = [list(r) for r in cursor]
  for row in table:

    exp_partners=row[7].split("|") if row[7] is not None else []
    imp_partners=row[10].split("|") if row[10] is not None else []
    sourcetype=row[14].split(",")[0] if row[14] is not None else []
    # exp_sources=list(set(row[8].split("|"))) if row[4] is not None else []
    # imp_sources=list(set(row[9].split("|"))) if row[4] is not None else []

    # exp_sources_cls=[]
    # imp_sources_cls=[]

    # if len(exp_sources)>0:
    #   exp_sources_cls.append(exp_sources[0])
    #   for i in exp_sources:
    #     s=SequenceMatcher(None,exp_sources[0],i)
    #     if s.ratio()<0.5:
    #       exp_sources_cls.append(i)
    # if len(imp_sources)>0:
    #   imp_sources_cls.append(imp_sources[0])
    #   for i in imp_sources:
    #     s=SequenceMatcher(None,imp_sources[0],i)
    #     if s.ratio()<0.5:
    #       imp_sources_cls.append(i)

    json_response.append({
    "reporting_id": row[0],
    "reporting": row[1],
    "continent": row[2],
    "type": row[3],
    "year": row[4],
    "exp_flow": round(row[5],2),
    "imp_flow": round(row[6],2),
    "total_flow":round(row[5]+row[6],2),
    "exp_partner": row[7],
    "exp_continent": row[8],
    "exp_type": row[9],
    "imp_partner": row[10],
    "imp_continent": row[11],
    "imp_type": row[12],
    "total_partner": ("|").join(list(set(exp_partners)|set(imp_partners))),
    "source": row[13].split("|")[0],
    "sourcetype": sourcetype
    })

  return json.dumps(json_response,encoding="UTF8")

def get_nations_network_by_year(year):
  cursor = get_db().cursor()
  cursor.execute("""SELECT reporting, reporting_slug, partner, partner_slug, Flow, expimp,
                    reporting_continent, partner_continent,reporting_type,partner_type
                    FROM flow_joined
                    WHERE reporting NOT LIKE "Worl%%"
                    AND partner NOT LIKE "Worl%%"
                    AND Flow != "null"
                    AND year = %s
                    """%(year)
              )

  table = [list(r) for r in cursor]

  json_sql_response=[]

  for row in table:
    json_sql_response.append({
      "reporting": row[0],
      "reporting_id": row[1],
      "partner": row[2],
      "partner_id": row[3],
      "flow": row[4],
      "expimp": row[5],
      "reporting_continent": row[6],
      "partner_continent": row[7],
      "reporting_type": row[8],
      "partner_type": row[9]
      })


  # Create a graph instance
  G=nx.Graph()

  nodes = []
  for row in table:
    nodes.append(row[1])
    nodes.append(row[3])
    # add edge to the graph
    G.add_edge(row[1], row[3])

  nodes = set(nodes)

  # add nodes to graph
  G.add_nodes_from(nodes)
  if len(G.nodes())>0:
    stats = {
      "average_clustering": nx.average_clustering(G),
      "center": nx.center(G),
      "diameter": nx.diameter(G),
      "eccentricity": nx.eccentricity(G)
    }
  else:
    stats=[]
  json_response = {}
  json_response["stats"] = stats
  json_response["network"] = json_sql_response

  return json.dumps(json_response,encoding="UTF8")

def get_continent_nb_partners(from_year, to_year):
  cursor = get_db().cursor()
  from_year_clause = """ AND year>%s"""%from_year if from_year!="" else ""
  to_year_clause = """ AND year<%s"""%to_year if to_year!="" else ""
  print from_year_clause, to_year_clause
  cursor.execute("""SELECT reporting_continent, partner_continent,
                    year, COUNT(distinct(partner_slug)) as nb_partners
                    FROM flow_joined
                    %s
                    GROUP BY year, reporting_continent, partner_continent
                    """%(from_year_clause+to_year_clause)
                )

  json_response=[]
  for (reporting_continent, partner_continent, year, nb_partners) in cursor:
    json_response.append({
      "year":year,
      "reporting_continent": reporting_continent,
      "partner_continent": partner_continent,
      "nb_partners": nb_partners
      })

    return json.dumps(json_response,encoding="UTF8")

def get_flows(reporting_ids,partner_ids,original_currency,from_year,to_year,with_sources):
    json_response={}
    json_response["flows"]=flows_data(reporting_ids,partner_ids,original_currency,from_year,to_year,with_sources)
    if len(partner_ids)==0:
        partner_ids=list(set(_["partner_id"] for _ in json_response["flows"]))
    partners = ric_entities_data(partner_ids) if len(partner_ids)>0 else []
    json_response["RICentities"]={"reportings":ric_entities_data(reporting_ids),"partners":partners}

    if len(reporting_ids)==1 and len(partner_ids)==1:
        #bilateral : add mirror
        #restrict the mirror flows to the time span of the reporting flows to the partner
        from_year_in_flow=min(_["year"] for _ in json_response["flows"])
        to_year_in_flow=max(_["year"] for _ in json_response["flows"])
        json_response["mirror_flows"]=flows_data(partner_ids,reporting_ids,original_currency,from_year_in_flow,to_year_in_flow,with_sources)

    return json.dumps(json_response,encoding="UTF8")

def get_continent_flows(continents,partner_ids,from_year,to_year,with_sources):

    json_response={}
    json_response["flows"]=flows_data(continents,partner_ids,False,from_year,to_year,with_sources, group_reporting_by="continent")
    if len(partner_ids)==0:
        partner_ids=list(set(_["partner_id"] for _ in json_response["flows"]))
    partners = ric_entities_data(partner_ids) if len(partner_ids)>0 else []
    json_response["RICentities"]={"reportings":continents,"partners":partners}

    return json.dumps(json_response,encoding="UTF8")

def get_continent_flows_for_reporting(continents, reporting_ids, from_year, to_year, with_sources):

    json_response = {
        "flows": flows_data(continents, reporting_ids, False, from_year, to_year, with_sources, group_reporting_by="continent", search_by_reporting=True)
    }
    partner_ids = list(set(_["partner_id"] for _ in json_response["flows"]))
    partners = ric_entities_data(partner_ids) if partner_ids else []
    reporting_ids = list(set(_["reporting_id"] for _ in json_response["flows"]))
    reportings = ric_entities_data(reporting_ids) if reporting_ids else []
    json_response["RICentities"] = {"reportings": reportings, "partners": partners}

    return json.dumps(json_response, encoding="UTF8", indent=4)

def get_mirror_entities(reporting_id):
    cursor = get_db().cursor()
    cursor.execute("""SELECT f.reporting_slug,f.reporting,f.reporting_type,f.continent,group_concat(f.year),rpp.years_from_reporting
                          FROM flow_joined f
                          LEFT OUTER JOIN (
                                SELECT partner_slug,group_concat(year) as years_from_reporting
                                from flow_joined where reporting_slug='%s'
                                group by partner_slug)
                                rpp
                                on rpp.partner_slug=f.reporting_slug
                          WHERE f.partner_slug='%s' and rpp.partner_slug not null
                          group by f.reporting_slug
                          """%(reporting_id,reporting_id))
    json_response=[]
    for (id,r,t,continent,years_from_partner,years_from_reporting) in cursor:
      # let's check if the mirror flows partner->reporting match the time span of the reporting->partner flows
      if len(set(years_from_partner.split(",")) & set(years_from_reporting.split(",")))>0:
        json_response.append({
            "RICid":id,
            "RICname":r,
            "type":t,
            "continent":continent
            })
    return json.dumps(json_response,encoding="UTF8")

def get_reporting_years():
  cursor = get_db().cursor()
  cursor.execute("""SELECT distinct year
                      FROM flow_joined
                      Where partner_slug NOT LIKE 'Worl%%'""")
  json_response=[]
  for year in cursor:
    json_response.append(year[0])

  return json.dumps(json_response,encoding="UTF8")


def get_reporting_entities(types=[],to_partner_ids=[]):

    cursor = get_db().cursor()
    if "continent" in types:
        types.remove("continent")
        cursor.execute("""SELECT reporting_continent
                          FROM flow_joined
                          group by reporting_continent ORDER BY count(*) DESC""")
        json_response=[]
        for (continent) in cursor:
            json_response.append({
            "RICname":continent[0],
            "type":"continent",
            })

        if len(types)==0:
            # nothing to add so return
            return json.dumps(json_response,encoding="UTF8")
    else:
        json_response=[]

    type_clause='reporting_type IN ("%s")'%'","'.join(types) if len(types)>0 else ""
    partner_clause=" partner_slug IN ('%s') "%"','".join(to_partner_ids) if len(to_partner_ids)>0 else ""
    if type_clause!="" or partner_clause!="":
        where_clause = " AND ".join(_ for _ in [type_clause,partner_clause] if _ != "")
        where_clause = "WHERE "+where_clause if where_clause!="" else ""
    else:
        where_clause =""
    sql="""SELECT distinct reporting_slug,reporting,reporting_type,reporting_continent
                          FROM flow_joined
                          %s"""%(where_clause)
    cursor.execute(sql)

    for (id,r,t,continent) in cursor:
        json_response.append({
            "RICid":id,
            "RICname":r,
            "type":t,
            "continent":continent
            })
    return json.dumps(json_response,encoding="UTF8")


def get_RICentities():
    return json.dumps(ric_entities_data(),encoding="UTF8")

