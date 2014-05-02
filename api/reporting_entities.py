import sqlite3
import json
import codecs


def get(types=["Country"],to_world_only=False):
	try :
		conf=json.load(open("config.json","r"))
	except :
		print "500 ERROR"
		exit(1)

	conn=sqlite3.connect(conf["sqlite_filename"])
	cursor=conn.cursor()



	partner_clause="and partner='World'" if to_world_only else ""

	cursor.execute("""SELECT reporting,type,central_state,continent
					  FROM flow_joined
					  LEFT OUTER JOIN RICentities ON RICname=reporting
					  where type IN ("%s")
					  %s
					  group by reporting"""%('","'.join(types),partner_clause))
	
	json_response=[]
	for (r,t,central,continent) in cursor:
		json_response.append({
			"reporting":r,
			"type":t,
			"central_state":central,
			"continent":continent
			})
	return json.dumps(json_response,encoding="UTF8",indent=4)

# type possible values
# 'Geographical Area'
# 'City/Part of'
# 'Country'
# 'group'
# 'Colonial Area'
type_arg=["Country"]


with codecs.open("reporting_countries.json","w") as f:
	f.write(get(type_arg,True))