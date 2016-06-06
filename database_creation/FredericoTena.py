import csvkit
import os
import json
import re


# create flows
def import_flows(filename,imp_exp,c):
	with open(filename) as f:
		importscsvs=csvkit.DictReader(f)
		for line in importscsvs:
			year=line["year"]
			for reporting,flow in line.iteritems():
				if flow !="":
					try:
						flow=float(flow.replace(",","."))
					except :
						print year,reporting,"'%s'"%flow
						continue
					# remove 0 values
					if reporting!="year" and flow!=0.0:
						data=["FREDERICO-TENA",flow,"1000000","sterling pound",int(year),reporting,"World FredericoTena",imp_exp,"total_fredericaotena"]
						c.execute("INSERT INTO flows (source, flow, unit, currency, year, reporting, partner, export_import, world_trade_type) VALUES (?,?,?,?,?,?,?,?,?)",data)


def import_fredericotena(c):
	FT_PATH = "in_data/FredericoTena"
	ENTITIES_CSV = "FredericoTena_entities.csv"
	IMPORTS_CSV = "FredericoTena_imports.csv"
	EXPORTS_CSV = "FredericoTena_exports.csv"


	# create source done
	source_id="FREDERICO-TENA"
	source_authors="Federico G. & A. Tena-Junguito"
	source_type="estimation"
	source_edition_year="2016"
	source_url="http://www.ehes.org/EHES_93.pdf"
	source_title="World trade, 1800-1938: a new data-set, EHES Working Paper 93"
	c.execute("INSERT INTO source_types (acronym,reference,type,author,URL) VALUES (?,?,?,?,?)",(source_id,source_title,source_type,source_authors,source_url))
	c.execute("INSERT INTO sources (slug,acronym,name,edition_date) VALUES (?,?,?,?)",(source_id,source_id,source_title,source_edition_year))
	print "created FT source"

	# read entities

	ricslug=lambda _: re.sub("[ ()/]","",re.sub("&","_",_))

	with open(os.path.join(FT_PATH,ENTITIES_CSV)) as f:
		entitiescsv=csvkit.DictReader(f)
		for entity in entitiescsv:
			if entity["new"]!="":
				# create new entities
				print "inserting new entity %s"%entity["ricname"]
				# todo add continent
				c.execute("INSERT OR IGNORE INTO RICentities (RICname,type,continent,COW_code,slug) VALUES (?,?,?,?,?)",(entity["ricname"],entity["rictype"],"?",entity["cow"],ricslug(entity["ricname"])))
				# todo check for the group
			c.execute("INSERT OR IGNORE INTO entity_names (original_name,RICname) VALUES (?,?) ",(entity["Polity Federico-Tena"],entity["ricname"]))

	# add World Frederico Tena entity
	c.execute("INSERT OR IGNORE INTO entity_names (original_name,RICname) VALUES (?,?) ",("World FredericoTena","World FredericoTena"))
	c.execute("""INSERT OR IGNORE INTO RICentities (RICname,type,continent,slug) VALUES ("World FredericoTena","geographical_area","World", "WorldFredericoTena")""")
			
	# read import
	import_flows(os.path.join(FT_PATH,IMPORTS_CSV),"Imp",c)
	# read export
	import_flows(os.path.join(FT_PATH,EXPORTS_CSV),"Exp",c)
