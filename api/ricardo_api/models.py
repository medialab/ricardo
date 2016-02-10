# coding=utf8

from ricardo_api import app
from ricardo_api import get_db

import sqlite3
import json
import codecs


def ric_entities_data(ids=[]):
    cursor = get_db().cursor()

    where_clause="""WHERE id in ("%s")"""%("\",\"".join(ids)) if len(ids)>0 else ""

    cursor.execute("""SELECT id,RICname,type,central_state,continent
                      FROM  RICentities
                      %s"""%where_clause)

    rics=[]
    for (id,r,t,central,continent) in cursor:
        rics.append({
            "RICid":id,
            "RICname":r,
            "type":t,
            "central_state":central,
            "continent":continent
            })
    return rics


def flows_data(reporting_ids,partner_ids,original_currency,from_year,to_year,with_sources,group_reporting_by="", search_by_reporting=False):
    cursor = get_db().cursor()
    partners_clause =""" AND partner_id IN ("%s")"""%'","'.join(partner_ids) if len(partner_ids)>0 else ""
    from_year_clause = """ AND Yr>%s"""%from_year if from_year!="" else ""
    to_year_clause = """ AND Yr<%s"""%to_year if to_year!="" else ""


    flow_field = "Flow*Unit/rate" if not original_currency else "Flow*Unit"
    source_field = """,group_concat(Source,"|")""" if with_sources else ""

    if group_reporting_by=="":
        cursor.execute("""SELECT reporting_id,partner_id,Yr,group_concat(expimp,"|"),group_concat(%s,"|"),currency%s
                      FROM flow_joined
                      where reporting_id IN ("%s")
                      %s
                      and  %s is not null
                      GROUP BY reporting,partner,Yr
                      ORDER BY  Yr ASC
                      """%(flow_field,source_field,'","'.join(reporting_ids),partners_clause+from_year_clause+to_year_clause,flow_field)
                )
    elif group_reporting_by=="continent": # in these 2 usecases, reporting_ids are continents
        if search_by_reporting:  # In this usecase, partner_ids are actually reporting_ids
            cursor.execute("""SELECT reporting_id, p.continent, Yr, group_concat(expimp,"|"), group_concat(%s,"|"), currency%s
                      FROM flow_joined
                      LEFT OUTER JOIN RICentities r on reporting_id = r.id
                      LEFT OUTER JOIN RICentities p on partner_id = p.id
                      WHERE r.id IN ("%s") AND p.continent IN ("%s")
                      %s
                      AND ( %s IS NOT null)
                      GROUP BY p.continent, reporting_id, Yr
                      ORDER BY Yr ASC
                      """%(flow_field,source_field,'","'.join(partner_ids),'","'.join(reporting_ids),from_year_clause+to_year_clause,flow_field)
                )
        else:
            cursor.execute("""SELECT r.continent,partner_id,Yr,group_concat(expimp,"|"),group_concat(%s,"|"),currency%s
                      FROM flow_joined
                      LEFT OUTER JOIN RICentities r on reporting_id = r.id
                      LEFT OUTER JOIN RICentities p on partner_id = p.id
                      where r.continent IN ("%s") AND p.continent NOT IN ("%s")
                      %s
                      AND ( %s IS NOT null)
                      GROUP BY r.continent, partner, Yr
                      ORDER BY Yr ASC
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
            #when grouping we sum exp imp
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
    partners_clause =""" AND partner_id IN ("%s")"""%'","'.join(partner_ids) if len(partner_ids)>0 else ""
    from_year_clause = """ AND Yr>%s"""%from_year if from_year!="" else ""
    to_year_clause = """ AND Yr<%s"""%to_year if to_year!="" else ""

    cursor.execute("""SELECT distinct(Source)
                      FROM flow_joined
                      where reporting_id IN ("%s")
                      %s
                      and rate is not null
                      and Flow is not null
                      """%('","'.join(reporting_ids),partners_clause+from_year_clause+to_year_clause)
                )

    return json.dumps({"sources":[_[0] for _ in cursor]},encoding="UTF8")

def get_world_flows(from_year,to_year):
    cursor = get_db().cursor()
    from_year_clause = """ AND Yr>%s"""%from_year if from_year!="" else ""
    to_year_clause = """ AND Yr<%s"""%to_year if to_year!="" else ""
    print from_year_clause, to_year_clause
    cursor.execute("""SELECT SUM(flow*Unit/rate), Yr, COUNT(*), expimp, Source
                      FROM flow_joined
                      WHERE partner_id = "Worldbestguess"
                      %s
                      GROUP BY Yr, expimp
                      ORDER BY Yr ASC
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

def get_nations_network_by_year(year):
  cursor = get_db().cursor()
  cursor.execute("""SELECT reporting, reporting_id, partner, partner_id, Flow, expimp, RIC_reporting.continent as reporting_continent, RIC_partner.continent as partner_continent, RIC_reporting.type as reporting_type, RIC_partner.type as partner_type
                    FROM flow_joined
                    INNER JOIN RICentities as RIC_reporting 
                      on flow_joined.reporting_id = RIC_reporting.id 
                    INNER JOIN RICentities as RIC_partner 
                      on flow_joined.partner_id = RIC_partner.id
                    WHERE reporting NOT LIKE "Worl%%"
                    AND partner NOT LIKE "Worl%%"
                    AND Flow != "null"
                    AND Yr = %s
                    """%(year)
              )


  json_sql_response=[]
  for (reporting, reporting_id, partner, partner_id, Flow, expimp, reporting_continent, partner_continent, reporting_type, partner_type) in cursor:
    json_sql_response.append({
      "reporting": reporting,
      "reporting_id": reporting_id,
      "partner": partner,
      "partner_id": partner_id,
      "flow": Flow,
      "expimp": expimp,
      "reporting_continent": reporting_continent,
      "partner_continent": partner_continent,
      "reporting_type": reporting_type,
      "partner_type": partner_type
      })

  return json.dumps(json_sql_response,encoding="UTF8")

def get_continent_nb_partners(from_year, to_year):
  cursor = get_db().cursor()
  from_year_clause = """ AND Yr>%s"""%from_year if from_year!="" else ""
  to_year_clause = """ AND Yr<%s"""%to_year if to_year!="" else ""
  print from_year_clause, to_year_clause
  cursor.execute("""SELECT RIC_reporting.continent as reporting_continent, RIC_partner.continent as partner_continent,
                    Yr, COUNT(distinct(RIC_partner.id)) as nb_partners
                    FROM flow_joined
                    %s
                    INNER JOIN RICentities as RIC_reporting 
                      on flow_joined.reporting_id = RIC_reporting.id 
                    INNER JOIN RICentities as RIC_partner 
                      on flow_joined.partner_id = RIC_partner.id
                    GROUP BY Yr, reporting_continent, partner_continent
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
    cursor.execute("""SELECT f.reporting_id,f.reporting,rci.type,rci.central_state,rci.continent,group_concat(f.Yr),rpp.years_from_reporting
                          FROM flow_joined f
                          LEFT OUTER JOIN RICentities rci ON rci.id=f.reporting_id
                          LEFT OUTER JOIN (
                                SELECT partner_id,group_concat(Yr) as years_from_reporting 
                                from flow_joined where reporting_id='%s' 
                                group by partner_id)
                                rpp
                                on rpp.partner_id=f.reporting_id
                          WHERE f.partner_id='%s' and rpp.partner_id not null
                          group by f.reporting_id
                          """%(reporting_id,reporting_id))
    json_response=[]
    for (id,r,t,central,continent,years_from_partner,years_from_reporting) in cursor:
      # let's check if the mirror flows partner->reporting match the time span of the reporting->partner flows
      if len(set(years_from_partner.split(",")) & set(years_from_reporting.split(",")))>0:
        json_response.append({
            "RICid":id,
            "RICname":r,
            "type":t,
            "central_state":central,
            "continent":continent
            })
    return json.dumps(json_response,encoding="UTF8")

def get_reporting_entities(types=[],to_partner_ids=[]):

    cursor = get_db().cursor()
    if "continent" in types:
        types.remove("continent")
        cursor.execute("""SELECT continent
                          FROM flow_joined
                          LEFT OUTER JOIN RICentities ON RICname=reporting
                          group by continent ORDER BY count(*) DESC""")
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

    type_clause='type IN ("%s")'%'","'.join(types) if len(types)>0 else ""
    partner_clause=" partner_id IN ('%s') "%"','".join(to_partner_ids) if len(to_partner_ids)>0 else ""
    if type_clause!="" or partner_clause!="":
        where_clause = " AND ".join(_ for _ in [type_clause,partner_clause] if _ != "")
        where_clause = "WHERE "+where_clause if where_clause!="" else ""
    else:
        where_clause =""
    sql="""SELECT RICentities.id,reporting,type,central_state,continent
                          FROM flow_joined
                          LEFT OUTER JOIN RICentities ON RICname=reporting
                          %s
                          group by reporting"""%(where_clause)
    cursor.execute(sql)

    for (id,r,t,central,continent) in cursor:
        json_response.append({
            "RICid":id,
            "RICname":r,
            "type":t,
            "central_state":central,
            "continent":continent
            })
    return json.dumps(json_response,encoding="UTF8")


def get_RICentities():
    return json.dumps(ric_entities_data(),encoding="UTF8")

