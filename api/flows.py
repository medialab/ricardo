# coding=utf8
import sqlite3
import json
import codecs

def flows_data(reportings,partners):
	try :
		conf=json.load(open("config.json","r"))
	except :
		print "500 ERROR"
		exit(1)

	conn=sqlite3.connect(conf["sqlite_filename"])
	cursor=conn.cursor()

	partners_clause =""" AND partner IN ("%s")"""%'","'.join(partners) if len(partners)>0 else ""

	cursor.execute("""SELECT reporting,partner,type,central_state,continent,Yr,group_concat(expimp,"|"),group_concat(Flow*Unit/rate,"|")
					  FROM flow_joined
					  LEFT OUTER JOIN RICentities ON RICname=partner
					  where reporting IN ("%s")
					  %s
					  and rate is not null
					  and Flow is not null
					  GROUP BY reporting,partner,Yr
					  """%('","'.join(reportings),partners_clause)
				)
	flows=[]
	partners_meta={}
	for (r,p,p_type,p_central,p_continent,y,expimp_g,flow_g) in cursor:
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
			dups.append((r,"Imp from",p,Yr," | ".join(imports)))
		if len(exports)>1:
			dups.append((r,"Exp to",p,Yr," | ".join(exports)))
		for dup in dups:
			print "Warning duplicated flows for %s,%s in %s with dup flows in pounds : %s"%dup
		imp=max(imports) if len(imports)>0 else 0# in case of duplicates
		exp=max(exports) if len(exports)>0 else 0 # in case of duplicates
		flows.append({
			"partner":p,
      		"year":y,
      		"imp": imp,
      		"exp": exp,
      		"total": imp+exp,
      		"currency":"£",
			})
	return {"flows":flows,"partners_meta":partners_meta}


def get_flows_in_pounds(reportings=[],partners=[]):
	
	json_response={"meta":{"reportings":reportings,"partners":partners}}
	data=flows_data(reportings,partners)
	json_response["flows_in_pounds"]=data["flows"]
	json_response["partners"]=data["partners_meta"].values()

	if len(reportings)==1 and len(partners)==1:
		#bilateral : add mirror
		data=flows_data(partners,reportings)
		json_response["mirror_flows"]=data["flows"]


	return json.dumps(json_response,encoding="UTF8",indent=4)

# inputs
reportings=["France"]
partners=["United Kingdom"]

with codecs.open("flows_in_pounds.json","w") as f:
	f.write(get_flows_in_pounds(reportings,partners))