# coding=utf8

from ricardo_api import app
from ricardo_api import get_db

import sqlite3
import json
import codecs


def ric_entities_data(ids=[]):
    cursor = get_db().cursor()
    
    where_clause="""WHERE id in (%s)"""%(",".join(ids)) if len(ids)>0 else ""

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


def flows_data(reporting_ids,partner_ids,original_currency,from_year,to_year,with_sources):
    cursor = get_db().cursor()
    partners_clause =""" AND partner_id IN ("%s")"""%'","'.join(partner_ids) if len(partner_ids)>0 else ""
    from_year_clause = """ AND Yr>%s"""%from_year if from_year!="" else ""
    to_year_clause = """ AND Yr<%s"""%to_year if to_year!="" else ""


    flow_field = "Flow*Unit/rate" if not original_currency else "Flow*Unit"
    source_field = """,group_concat(Source,"|")""" if with_sources else ""
    

    cursor.execute("""SELECT reporting_id,partner_id,Yr,group_concat(expimp,"|"),group_concat(%s,"|"),currency%s
                      FROM flow_joined
                      where reporting_id IN ("%s")
                      %s
                      and rate is not null
                      and Flow is not null
                      GROUP BY reporting,partner,Yr
                      """%(flow_field,source_field,'","'.join(reporting_ids),partners_clause+from_year_clause+to_year_clause)
                )
    #
    flows=[]
    partners_meta={}
    for fields in cursor:
        
        if with_sources:
            (r_id,p_id,y,expimp_g,flow_g,currency,source_g)=fields
        else:
            (r_id,p_id,y,expimp_g,flow_g,currency)=fields

        imports=[]
        exports=[]
        for i,ei in enumerate(expimp_g.split("|")):
            if ei == "Imp":
                imports.append(float(flow_g.split("|")[i]))
            elif ei == "Exp":
                exports.append(float(flow_g.split("|")[i]))
        dups=[]
        if len(imports)>1 :
            dups.append((r_id,"Imp from",p_id,y,imports))
        if len(exports)>1:
            dups.append((r_id,"Exp to",p_id,y,exports))
        for dup in dups:
            app.logger.warning("Warning duplicated flows for %s %s %s in %s with dup flows in pounds : %s"%dup)
        # resolve dupicates and null cases
        imp=max(imports) if len(imports)>0 else None 
        exp=max(exports) if len(exports)>0 else None
        total = (imp if imp else 0) + (exp if exp else 0)
        flows.append({
            "reporting_id":r_id,
            "partner_id":p_id,
            "year":y,
            "imp": imp,
            "exp": exp,
            "total": total,
            "currency":currency if original_currency else "sterling pound",
            })
        if with_sources:
            sources=set(source_g.split("|"))
            flows[-1]["sources"]=list(sources)[0]

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
   
    r=[_[0] for _ in cursor]
    app.logger.info(r)
    return json.dumps({"sources":r},encoding="UTF8",indent=4)


def get_flows(reporting_ids,partner_ids,original_currency,from_year,to_year,with_sources):
    
    json_response={}
    json_response["flows"]=flows_data(reporting_ids,partner_ids,original_currency,from_year,to_year,with_sources)
    if len(partner_ids)==0:
        partner_ids=list(set(str(_["partner_id"]) for _ in json_response["flows"]))
    json_response["RICentities"]={"reportings":ric_entities_data(reporting_ids),"partners":ric_entities_data(partner_ids)}

    if len(reporting_ids)==1 and len(partner_ids)==1:
        #bilateral : add mirror
        json_response["mirror_flows"]=flows_data(partner_ids,reporting_ids,original_currency,from_year,to_year,with_sources)


    return json.dumps(json_response,encoding="UTF8",indent=4)

def get_reporting_entities(types=[],to_world_only=False):
    cursor = get_db().cursor()
    type_clause='type IN ("%s")'%'","'.join(types) if len(types)>0 else "" 
    partner_clause="partner='World'" if to_world_only else ""
    if type_clause!="" or partner_clause!="":
        where_clause = " AND ".join(_ for _ in [type_clause,partner_clause] if _ != "")
        where_clause = "WHERE "+where_clause if where_clause!="" else ""
    else:
        where_clause =""
    cursor.execute("""SELECT RICentities.id,reporting,type,central_state,continent
                      FROM flow_joined
                      LEFT OUTER JOIN RICentities ON RICname=reporting
                      %s
                      group by reporting"""%(where_clause))
    
    json_response=[]
    for (id,r,t,central,continent) in cursor:
        json_response.append({
            "RICid":id,
            "RICname":r,
            "type":t,
            "central_state":central,
            "continent":continent
            })
    return json.dumps(json_response,encoding="UTF8",indent=4)

def get_RICentities():
    return json.dumps(ric_entities_data(),encoding="UTF8",indent=4)

