# coding=utf8
import sqlite3
import json
import codecs

def flows_data(cursor,reporting_ids,partner_ids):
   
    partners_clause =""" AND partner_id IN ("%s")"""%'","'.join(partner_ids) if len(partner_ids)>0 else ""

    cursor.execute("""SELECT reporting_id,reporting,partner_id,partner,type,central_state,continent,Yr,group_concat(expimp,"|"),group_concat(Flow*Unit/rate,"|")
                      FROM flow_joined
                      LEFT OUTER JOIN RICentities ON RICname=partner
                      where reporting_id IN ("%s")
                      %s
                      and rate is not null
                      and Flow is not null
                      GROUP BY reporting,partner,Yr
                      """%('","'.join(reporting_ids),partners_clause)
                )
    flows=[]
    partners_meta={}
    for (r_id,r,p_id,p,p_type,p_central,p_continent,y,expimp_g,flow_g) in cursor:
        partners_meta[p]={"partner":p,"type":p_type,"central_state":p_central,"continent":p_continent}
        imports=[]
        exports=[]
        for i,ei in enumerate(expimp_g.split("|")):
            if ei == "Imp":
                imports.append(float(flow_g.split("|")[i]))
            elif ei == "Exp":
                exports.append(float(flow_g.split("|")[i]))
        dups=[]
        if len(imports)>1 :
            dups.append((r,"Imp from",p,y,imports))
        if len(exports)>1:
            dups.append((r,"Exp to",p,y,exports))
        for dup in dups:
            print "Warning duplicated flows for %s %s %s in %s with dup flows in pounds : %s"%dup
        imp=max(imports) if len(imports)>0 else None # in case of duplicates
        exp=max(exports) if len(exports)>0 else None # in case of duplicates
        total = (imp if imp else 0) + (exp if exp else 0)
        flows.append({
            "reporting_id":r_id,
            "partner_id":p_id,
            "year":y,
            "imp": imp,
            "exp": exp,
            "total": total,
            "currency":"£",
            })
    return {"flows":flows,"partners_meta":partners_meta}


def get_flows_in_pounds(cursor,reporting_ids=[],partner_ids=[]):
    
    json_response={"meta":{"reporting_ids":reporting_ids,"partner_ids":partner_ids}}
    data=flows_data(cursor,reporting_ids,partner_ids)
    json_response["flows_in_pounds"]=data["flows"]
    json_response["partners"]=data["partners_meta"].values()

    if len(reporting_ids)==1 and len(partner_ids)==1:
        #bilateral : add mirror
        data=flows_data(cursor,partner_ids,reporting_ids)
        json_response["mirror_flows"]=data["flows"]


    return json.dumps(json_response,encoding="UTF8",indent=4)

def get_reporting_entities(cursor,types=[],to_world_only=False):

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

