import sqlite3
import json


def get(types=["Country"],to_world_only=False):
	try :
		conf=json.load(open("config.json","r"))
	except :
		print "500 ERROR"
		exit(1)

	conn=sqlite3.connect(conf["sqlite_filename"])
	cursor=conn.cursor()



	table="flow_impexp_bilateral" if not to_world_only else "flow_impexp_world"




	cursor.execute("""SELECT reporting,type,central_state,continent
					  FROM %s 
					  LEFT OUTER JOIN RICentities ON RICname=reporting
					  where type IN ("%s")
					  group by reporting"""%(table,'","'.join(types)))
	
	json_response=[]
	for (r,t,central,continent) in cursor:
		json_response.append({
			"reporting":r,
			"type":t,
			"central_state":central,
			"continent":continent
			})
	return json.dumps(json_response,encoding="UTF8")

# type possible values
# 'Geographical Area'
# 'City/Part of'
# 'Country'
# 'group'
# 'Colonial Area'


print get(["City/Part of"])