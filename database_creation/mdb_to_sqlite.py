# coding=utf8
import subprocess
import sqlite3
import os
import json
import itertools
import csv
from csv_unicode import UnicodeReader


###################################################
##          MDB to SQLite
###################################################

try :
	conf=json.load(open("config.json","r"))
except :
	print "couldn't laod config.json database"
	exit(1)

mdb_filename=os.path.join("in_data",conf["mdb_filename"])
mdb_sqlite_filename=os.path.join("out_data",conf["sqlite_filename"])
try:
	if os.path.isfile(mdb_sqlite_filename):
		os.remove(mdb_sqlite_filename)
except:
	print "couldn't delete target sqlite database file"
	exit(1)

conn=sqlite3.connect(mdb_sqlite_filename)
c=conn.cursor()

###################################################
##          Schema SQLite to copy ACCESS
###################################################
print "-------------------------------------------------------------------------"
print "Read the old schema of the data base to transfert access base into sqlite"
with open(conf["sqlite_schema"],"r") as schema:
	#c.executescript(subprocess.check_output("mdb-schema %s sqlite 2>/dev/null"%mdb_filename,shell=True))
	c.executescript(schema.read())

###################################################
##          Schema SQLite with good tables 
###################################################
print "-------------------------------------------------------------------------"
print "Read the schema of the new data base"
with open(conf["new_sqlite_schema"],"r") as new_schema:
	#c.executescript(subprocess.check_output("mdb-schema %s sqlite 2>/dev/null"%mdb_filename,shell=True))
	c.executescript(new_schema.read())


print "-------------------------------------------------------------------------"
print "Copy access tables into sqlite"
print "-------------------------------------------------------------------------"
for table in ["Entity_Names v1","RawData v1","Currency Name v1","Exchange Rate v1","Exp-Imp-Standard v1","RICentities v1","RICentities_groups v1"]:
 	 	# new_table_name=table.lower().replace(" ","_").replace("-","_")
	 	# print new_table_name
		#c.executescript()
		sql=subprocess.check_output("mdb-export -I sqlite %s '%s'"%(mdb_filename,table),shell=True)
		print "%s: got %s lines of sql"%(table,len(sql.split(";\n")))
		#c.execute("BEGIN TRANSACTION")
		# insert access data in sqlite
		for insert in sql.split(";\n"):
			try :
				c.execute(insert)
			except Exception as e:
				print "'%s'"%insert
				raise e
		conn.commit()
		#c.execute("END")

print "-------------------------------------------------------------------------"
print "inserts into sqlite done"
print "-------------------------------------------------------------------------"
c.execute("ALTER TABLE `RawData v1` RENAME TO old_flow")
c.execute("ALTER TABLE `Currency Name v1` RENAME TO old_currency")
c.execute("ALTER TABLE `Exchange Rate v1` RENAME TO old_rate")
c.execute("ALTER TABLE `Entity_Names v1` RENAME TO old_entity_names_cleaning")
c.execute("ALTER TABLE `Exp-Imp-Standard v1` RENAME TO `old_Exp-Imp-Standard`")
c.execute("ALTER TABLE `RICentities v1` RENAME TO old_RICentities")
c.execute("ALTER TABLE `RICentities_groups v1` RENAME TO old_RICentities_groups")
print "renaming table done 1"
print "-------------------------------------------------------------------------"

print "cleaning dups in to-be-joined tables"
print "-------------------------------------------------------------------------"
# cleaning dups in to-be-joined tables

# duplicates in currency
c.execute(""" DELETE FROM old_currency WHERE ID_Curr_Yr_RepEntity IN (SELECT ID_Curr_Yr_RepEntity from old_currency GROUP BY `Original Currency`,`Reporting Entity (Original Name)`,Yr HAVING count(*)>1)""")

# duplicates in exp-imp
c.execute("DELETE FROM `old_Exp-Imp-Standard` WHERE `ID_Exp_spe` in (7,16,25)")

# checking unique on to-be-joined tables
c.execute(""" CREATE UNIQUE INDEX unique_currency ON  old_currency (`Original Currency`,`Reporting Entity (Original Name)`,Yr); """)
c.execute(""" CREATE UNIQUE INDEX unique_expimp ON `old_Exp-Imp-Standard` (`Exp / Imp`,`Spe/Gen/Tot`)""")
c.execute(""" CREATE UNIQUE INDEX unique_rate ON old_rate (Yr,`Modified Currency`)""")

# clean data
# trim and lower
c.execute("UPDATE old_flow SET `Exp / Imp`=trim(lower(`Exp / Imp`)), `Spe/Gen/Tot`=trim(lower(`Spe/Gen/Tot`)) WHERE 1")
c.execute("UPDATE `old_Exp-Imp-Standard` SET `Exp / Imp`=trim(lower(`Exp / Imp`)), `Spe/Gen/Tot`=trim(lower(`Spe/Gen/Tot`)) WHERE 1")
c.execute("UPDATE old_flow SET `Initial Currency`=trim(lower(`Initial Currency`)),`Reporting Entity_Original Name`=trim(lower(`Reporting Entity_Original Name`)) WHERE 1")
c.execute("UPDATE `old_currency` SET `Original Currency`=trim(lower(`Original Currency`)),`Modified Currency`=trim(lower(`Modified Currency`)),`Reporting Entity (Original Name)`=trim(lower(`Reporting Entity (Original Name)`)) WHERE 1")
c.execute("UPDATE `old_rate` SET `Modified Currency`=trim(lower(`Modified Currency`)) WHERE 1")
c.execute("""UPDATE `old_rate` SET `FX rate (NCU/£)`=replace(`FX rate (NCU/£)`,",",".") WHERE 1""")
c.execute("""UPDATE old_RICentities SET type=lower(replace(trim(type)," ","_")) WHERE 1""")

# DELETE unused spe/gen cleaning rows ID=13 

# one lower on reporting 
#c.execute("""UPDATE flow SET `Reporting Entity_Original Name`="espagne (îles baléares)" WHERE `Reporting Entity_Original Name`="espagne (Îles baléares)";""")

# clean Land/Sea
c.execute("UPDATE `old_flow` SET `Land/Sea` = null WHERE `Land/Sea` = ' '")
#clean total type
c.execute("UPDATE `old_flow` SET `Total_type` = lower(`Total_type`) WHERE `Total_type` is not null")

# RICENTITIES
# add a slug as RICentities id
c.execute("""UPDATE old_RICentities SET id=REPLACE(RICname," ","") WHERE 1""")
c.execute("""UPDATE old_RICentities SET id=REPLACE(id,"&","_") WHERE 1""")
c.execute("""UPDATE old_RICentities SET id=REPLACE(id,"/","") WHERE 1""")
c.execute("""UPDATE old_RICentities SET id=REPLACE(id,"(","") WHERE 1""")
c.execute("""UPDATE old_RICentities SET id=REPLACE(id,")","") WHERE 1""")
c.execute("""UPDATE old_RICentities SET id=REPLACE(id,"***","") WHERE 1""")



# remove 770 'Pas de données' : a priori on tente de les garder 
# c.execute("SELECT count(*) from flow where notes='Pas de données' and Flow is null")
# print "removing %s flows with Notes='Pas de données'"%c.fetchone()[0]
# c.execute("DELETE FROM flow WHERE notes ='Pas de données' and Flow is null")

# remove Null rates from rate : normalement on devrait avoir des taux pour tout
#c.execute("DELETE FROM rate WHERE `FX rate (NCU/£)` is null")


###################################################
##          Import RICnames definition from CSV
###################################################
# import RICnames_from_csv
# RICnames_from_csv.import_in_sqlite(conn, conf)
#  depecrated since RICnames were included into mdb file by Karine

# add the missing Haïti
c.execute('INSERT INTO `old_entity_names_cleaning` (`original_name`, `name`, `RICname`) VALUES ("Haïti","Haïti","Haiti");')

##################################################
##			Create table flow_joined
#####################################################

print "Create table flow_joined"
print "-------------------------------------------------------------------------"

c.execute("""DROP TABLE IF EXISTS flow_joined;""")
c.execute("""CREATE TABLE IF NOT EXISTS flow_joined AS 
	 SELECT f.*, `Exp / Imp (standard)` as expimp, `Spe/Gen/Tot (standard)` as spegen, `FX rate (NCU/£)` as rate ,`Modified Currency` as currency, r2.RICname as reporting,r2.id as reporting_id, p2.RICname as partner,p2.id as partner_id, r.original_name as reporting_original_name, p.original_name as partner_original_name
	 from old_flow as f
	 LEFT OUTER JOIN `old_Exp-Imp-Standard` USING (`Exp / Imp`,`Spe/Gen/Tot`)
	 LEFT OUTER JOIN old_currency as c
		ON f.`Initial Currency`=c.`Original Currency` 
		   AND f.`Reporting Entity_Original Name`=c.`Reporting Entity (Original Name)`
		   AND f.Yr=c.Yr
	 LEFT OUTER JOIN old_rate as r USING (Yr,`Modified Currency`)
	 LEFT OUTER JOIN old_entity_names_cleaning as r ON `Reporting Entity_Original Name`=r.original_name COLLATE NOCASE
	 LEFT OUTER JOIN old_RICentities r2 ON r2.RICname=r.RICname
	 LEFT OUTER JOIN old_entity_names_cleaning as p ON trim(`Partner Entity_Original Name`)=p.original_name COLLATE NOCASE
	 LEFT OUTER JOIN old_RICentities p2 ON p2.RICname=p.RICname
	 WHERE 	
		`Partner Entity_Sum` is null	 	
	 	and partner is not null
	 	and expimp != "Re-exp"
	""")



# taking care of Total_type flag to define the world partner
# and ((`Total Trade Estimation` is null and partner != "World" )or(`Total Trade Estimation`=1 and partner = "World"))
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldestimated","World estimated","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World estimated", partner_id="Worldestimated" WHERE partner="World" and Total_type="total_estimated" """)
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldasreported","World as reported","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World as reported", partner_id="Worldasreported" WHERE partner="World" and Total_type="total_reporting1" """)
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldasreported2","World as reported2","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World as reported2", partner_id="Worldasreported2" WHERE partner="World" and Total_type="total_reporting2" """)
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldundefined","World undefined","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World undefined", partner_id="Worldundefined" WHERE partner="World" and Total_type is null """)


# c.execute("""DROP VIEW IF EXISTS flow_impexp_total;""")
# c.execute(""" CREATE VIEW IF NOT EXISTS flow_impexp_world AS 
# 	SELECT f.*, `Exp / Imp (standard)` as expimp, `Spe/Gen/Tot (standard)` as spegen, `FX rate (NCU/£)` as rate ,r2.RICname as reporting, p2.RICname as partner
# 	 from flow as f
# 	 LEFT OUTER JOIN `Exp-Imp-Standard` USING (`Exp / Imp`,`Spe/Gen/Tot`)
# 	 LEFT OUTER JOIN currency as c
# 		ON f.`Initial Currency`=c.`Original Currency` 
# 		   AND f.`Reporting Entity_Original Name`=c.`Reporting Entity (Original Name)`
# 		   AND f.Yr=c.Yr
# 	 LEFT OUTER JOIN rate as r USING (Yr,`Modified Currency`)
# 	 LEFT OUTER JOIN entity_names_cleaning as r ON `Reporting Entity_Original Name`=r.original_name COLLATE NOCASE
# 	 LEFT OUTER JOIN RICentities r2 ON r2.RICname=r.RICname
# 	 LEFT OUTER JOIN entity_names_cleaning as p ON trim(`Partner Entity_Original Name`)=p.original_name COLLATE NOCASE
# 	 LEFT OUTER JOIN RICentities p2 ON p2.RICname=p.RICname
# 	 WHERE 
# 	 	`Total Trade Estimation` is not null 
# 	 	and `notes` != "Pas de données" 
# 	 	and partner is not null
# """)#and `Partner Entity_Original Name`!="Total"

################################################################################
# merge duplicates from land and sea 
################################################################################

c.execute("""SELECT count(*) as nb,group_concat(`flow`,'|'),group_concat(ID,'|'),group_concat(`Land/Sea`,'|'),group_concat(`Notes`,'|'),group_concat(`Original No`,'|')
	FROM `flow_joined`
	WHERE `Land/Sea` is not null
	GROUP BY Yr,expimp,reporting_original_name,partner_original_name HAVING count(*)>1
	""")
sub_c=conn.cursor()
rows_grouped=0
for n,flows,ids,land_seas,notes,original_nos in c :
	if n==2:
		original_no="Original Nos:"+", ".join(set(original_nos.split("|")))
		land_sea=", ".join(set(land_seas.split("|")))
		if len(set(land_seas.split("|")))>1:
			if notes :
				notes=", ".join(set(notes.split("|")))+" ; "+original_no
			sub_c.execute("""UPDATE `flow_joined` SET flow=%.1f,notes="%s",`Land/Sea`="%s" WHERE ID=%s"""%(sum(float(_) for _ in flows.split("|")),notes,land_sea,ids.split("|")[0]))
			sub_c.execute("""DELETE FROM `flow_joined` WHERE ID=%s"""%ids.split("|")[1])
			rows_grouped+=2
if rows_grouped>0:
	print "removing %s land/seas duplicates by suming them"%rows_grouped
sub_c.close()

print "-------------------------------------------------------------------------"
################################################################################
# remove 'valeurs officielles' when duplicates with 'Valeurs actuelles' 
# for France between 1847 and 1856 both included
################################################################################

c.execute("""SELECT count(*) as nb,group_concat(Notes,'|'),group_concat(ID,'|'),group_concat(Source,'|') as notes_group
	FROM `flow_joined`
	WHERE `reporting`="France" 
		and Yr >= 1847 AND Yr <= 1856
		GROUP BY Yr,expimp,reporting,partner HAVING count(*)>1
	""")

ids_to_remove=[]
for n,notes,ids,sources in c :
	if n==2:
		i=notes.split("|").index("Valeur officielle")
		id=ids.split("|")[i]
		#print sources.split("|")[i].encode("UTF8")
		if sources.split("|")[i] == u"Tableau décennal du commerce de la France avec ses colonies et les puissances étrangères, 1847-1856, vol. 1.":
			ids_to_remove.append(id)
		else:
			raise
	else:
		raise
if len(ids_to_remove)>0:
	print "removing %s 'Valeur officielle' noted duplicates for France between 1847 1856"%len(ids_to_remove)
	c.execute("DELETE FROM flow_joined WHERE id IN (%s)"%",".join(ids_to_remove))

print "-------------------------------------------------------------------------"
################################################################################
# remove "species and billions" remove species flows when exists
################################################################################

c.execute("""SELECT * from (SELECT count(*) as nb,group_concat(`Species and Bullions`,'|') as sb,group_concat(ID,'|'),reporting,partner
	FROM `flow_joined`		
	GROUP BY Yr,expimp,reporting,partner HAVING count(*)>1)
	WHERE sb="S|NS"
	""")#
ids_to_remove=[]
rps=[]
for n,sb,ids,r,p in c :
	if n==2 :
		i=sb.split("|").index("S")
		id=ids.split("|")[i]
		ids_to_remove.append(id)
		rps.append('"%s"'%"|".join((r,p)))
rps=set(rps)
		
if len(ids_to_remove)>0:
	print "removing %s flows S duplicated with NS for reporting|partner couples %s"%(len(ids_to_remove),",".join(rps))
	c.execute("DELETE FROM flow_joined WHERE id IN (%s)"%",".join(ids_to_remove))

print "-------------------------------------------------------------------------"
################################################################################
# remove GEN flows when duplicates with SPE flows
################################################################################

c.execute("""SELECT count(*) as nb,group_concat(`spegen`,'|'),group_concat(`Species and Bullions`,'|') as sb,group_concat(ID,'|'),`reporting`,`partner`,Yr,`expimp`,group_concat(`flow`,'|') 
	FROM `flow_joined`
	GROUP BY Yr,`expimp`,`reporting`,`partner` HAVING count(*)>1
	""")
lines=c.fetchall()
ids_to_remove={}
for n,spe_gens,sb,ids,reporting,partner,Yr,e_i,f in lines :
	local_ids_to_remove=[]
	dup_found=True
	if spe_gens and "Gen" in spe_gens.split("|") and "Spe" in spe_gens.split("|") :
		spe_indeces=[k for k,v in enumerate(spe_gens.split("|")) if v =="Spe"]
		if len(spe_indeces)>1 :
			#if we have more than 1 Spe as dups
			speNS_indeces=[k for k,v in enumerate(sb.split("|")) if v =="NS" and k in spe_indeces]
			if len(speNS_indeces)>1:
			#if we have more than 1 NS in Spe dups
				dup_found=False
			elif len(ids.split("|"))==len(sb.split("|")):
				#keep only the Spe & NS flow when duplicate and if no nulls in sb other wse we can't figure out which ID to remove
				local_ids_to_remove=[v for k,v in enumerate(ids.split("|")) if k!=speNS_indeces[0]]
			else:
				dup_found=False
		elif len(ids.split("|"))==len(spe_gens.split("|")):
			#remove the Gen flows which dups with one Spe flow and if no nulls in spe_gens other wise we can't figure out which ID to remove
			local_ids_to_remove=[v for k,v in enumerate(ids.split("|")) if k!=spe_indeces[0]]
		else:
			dup_found=False
		if len(local_ids_to_remove)>0:
			if reporting in ids_to_remove.keys():
				ids_to_remove[reporting]+=local_ids_to_remove
			else:
			 	ids_to_remove[reporting]=local_ids_to_remove
	else:
		dup_found=False

	if not dup_found:
		# flows are dups but not on GEN/SPE distinction or some null values in the groupings
		print ("duplicate found :%s flows for %s,%s,%s,%s,%s,%s"%(n,Yr,reporting,partner,e_i,spe_gens,sb)).encode("utf8")
print "-------------------------------------------------------------------------"
if ids_to_remove:
	for r,ids in ids_to_remove.iteritems():
		print ("removing %s Gen or Species duplicates for %s"%(r,len(ids))).encode("utf8")
		c.execute("DELETE FROM flow_joined WHERE id IN (%s)"%",".join(ids))

print "-------------------------------------------------------------------------"
# create the partner World as sum of partners 
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldsumpartners","World sum partners","geographical_area","World")""")
c.execute("INSERT INTO flow_joined (flow,unit,reporting,reporting_id,Yr,expimp,currency,spegen,partner,partner_id,rate,Source,`Source suite`) SELECT sum(flow*unit) as flow, 1 as unit, reporting, reporting_id, Yr, expimp, currency, '' as spegen,  'World_sum_partners' as partner, 'Worldsumpartners' as partner_id,rate,Source,`Source suite` from flow_joined WHERE partner not like 'World%' group by reporting,expimp,Yr ")

# create the partner World as best guess
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldbestguess","World best guess","geographical_area","World")""")

conn.commit()

c.execute("""SELECT Yr,expimp,partner,reporting,partner_id,reporting_id,flow,unit,currency,spegen,rate,Source,`Source suite` from flow_joined WHERE partner LIKE "World%"  """)
data=list(c)
data.sort(key=lambda _:(_[3],_[0],_[1]))
for g,d in itertools.groupby(data,lambda _:(_[3],_[0],_[1])):
	dd=list(d)
	
	world_best_guess=[sd for sd in dd if sd[4]==u"Worldestimated"]
	if len(world_best_guess)==0:
		world_best_guess=[sd for sd in dd if sd[4]==u"Worldasreported"]
	if len(world_best_guess)==0:
		world_best_guess=[sd for sd in dd if sd[4]==u"Worldsumpartners"]
	if len(world_best_guess)==0:
		print g
		print "ARG no best guess world flow found ?"
	else:
		world_best_guess=list(world_best_guess[0])
		world_best_guess[2]=u"World_best_guess"
		world_best_guess[4]=u"Worldbestguess"
		c.execute("""INSERT INTO flow_joined (Yr,expimp,partner,reporting,partner_id,reporting_id,flow,unit,currency,spegen,rate,Source,`Source suite`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",world_best_guess)


print "-------------------------------------------------------------------------"
print "Transfert old sqlite into the new sqlite database"
print "-------------------------------------------------------------------------"

#####################################################
##			Create table currency_sources
#####################################################
# print "Create currency_sources"
# c.execute("""DROP TABLE IF EXISTS currency_sources;""")
# c.execute("""CREATE TABLE IF NOT EXISTS currency_sources AS 
# 	SELECT `Source Currency` as currency, `Note Currency`as notes 
# 	FROM old_rate
# 	""")
# print "currency_sources created"


#####################################################
##			Create table flow_sources
#####################################################
print "create flow_sources"
c.execute("""CREATE TABLE IF NOT EXISTS flow_sources (source, transcript_filename, country, volume, date, cote, url)""")
with open('in_data/ricardo_flow_sources_final.csv', 'r') as sources:
	reader=UnicodeReader(sources)
	reader.next()
	for row in reader:
		c.execute("INSERT INTO flow_sources (source, transcript_filename, country, volume, date, cote, url) VALUES (?, ?, ?, ?, ?, ?, ?)",(row[0].strip(), row[1].strip(), row[2].strip(), row[3].strip(), row[4].strip(), row[5].strip(), row[7].strip()))
print "flow_sources create"
print "-------------------------------------------------------------------------"

#####################################################
##			Create table sources
#####################################################
print "Create sources"
c.execute("""INSERT INTO sources(source_name, shelf_number, volume, url, dates) 
	SELECT source as source_name, cote as shelf_number, group_concat(country, volume) as volume, url, date as dates
	FROM flow_sources
	GROUP BY source_name, shelf_number, volume
	""")    
print "sources created"
print "-------------------------------------------------------------------------"

print "Insert currency_sources into sources"
c.execute("""INSERT into sources(source_name, notes) 
	SELECT `Source Currency` as source_name, `Note Currency`as notes 
	FROM old_rate
	""")
print "currency_sources added into source"
print "-------------------------------------------------------------------------"

#####################################################
##			Create table exchanges_rates
#####################################################
print "Create exchanges_rates"
c.execute("""INSERT INTO exchange_rates(year, modified_currency, rate_to_pounds, source)
	SELECT Yr as year, `Modified currency` as modified_currency,`FX rate (NCU/£)` as rate_to_pounds, src.id
	FROM old_rate
	INNER JOIN sources as src
	WHERE old_rate.`Source Currency` = src.source_name
	GROUP BY rate_to_pounds
	""")
print "exchanges_rates created"
print "-------------------------------------------------------------------------"

#####################################################
##			Create table expimp_spegen
#####################################################
print "Create expimp_spegen"
c.execute("""INSERT INTO expimp_spegen
	SELECT `Exp / Imp` as export_import, `Spe/Gen/Tot` as special_general,
	`Exp / Imp (standard)` as modified_export_import, 
	`Spe/Gen/Tot (standard)` as modified_special_general
	FROM `old_Exp-Imp-Standard`
	""")
print "expimp_spegen created"
print "-------------------------------------------------------------------------"

#####################################################
##			Create table currencies
#####################################################
print "Create currencies"
c.execute("""INSERT INTO currencies
	SELECT `Original Currency` as currency, Yr as year, 
	`reporting entity (Original name)` as reporting, 
	`Modified Currency` as modified_currency
	FROM old_currency
	""")
print "currencies created"
print "-------------------------------------------------------------------------"


#####################################################
##			Create table RICentities
#####################################################
#create temp table to save RICentities
print "Create RICentities_backup"
c.execute("""DROP TABLE IF EXISTS RICentities_backup;""")
c.execute("""CREATE TABLE IF NOT EXISTS RICentities_backup AS 
	SELECT ID, RICname, type, central_state, continent, COW_code
	FROM old_RICentities
	""")
print "RICentities_backup created"
print "-------------------------------------------------------------------------"
# create new table RICentities
print "Create RICentities"
c.execute("""INSERT INTO RICentities 
	SELECT RICname, type, continent, COW_code, ID as slug
	FROM RICentities_backup
	""")
print "RICentities created"
print "-------------------------------------------------------------------------"

#####################################################
##			Create table entity_names
#####################################################
#create temp table to save RICentities
print "Create entity_names"
c.execute("""INSERT INTO entity_names 
	SELECT original_name, name as french_name, RICname
	FROM old_entity_names_cleaning
	""")
print "entity_names created"
print "-------------------------------------------------------------------------"


#####################################################
##			Create table RICentities_groups
#####################################################
#create temp table to save RICentities
print "Create RICentities_groups"
c.execute("""INSERT INTO RICentities_groups 
	SELECT id, RICname_group, RICname_part
	FROM old_RICentities_groups
	""")
print "RICentities_groups created"
print "-------------------------------------------------------------------------"

##################################################
##			Create table flows
#####################################################

print "Create flows"
c.execute("""INSERT INTO flows(source, flow, unit, currency, year, reporting, partner, export_import, special_general, species_bullions, transport_type, statistical_period, partner_sum, world_trade_type)
	SELECT src.id as source, Flow, Unit, currency, Yr as Year, reporting_original_name as reporting, partner_original_name as partner, expimp as export_import, spegen as special_general, `Species and Bullions` as species_bullions, `Land/Sea` as transport_type, `Statistical Period` as statistical_period, `Partner Entity_Sum` as partner_sum, Total_type as world_trade_type
	FROM flow_joined
	INNER JOIN sources as src
	WHERE flow_joined.source = src.source_name
	GROUP BY Year,export_import,reporting,partner
	""")
print "flows created"
print "-------------------------------------------------------------------------"

# DESIGN NEWS TABLES WITH THE NEW SCHEMA

# INDEX

# c.execute("""CREATE INDEX i_rid ON flow_joined (reporting_id)""")
# c.execute("""CREATE INDEX i_pid ON flow_joined (partner_id)""")
# c.execute("""CREATE INDEX i_yr ON flow_joined (Yr)""")
# c.execute("""CREATE INDEX i_r ON flow_joined (reporting)""")
# c.execute("""CREATE INDEX i_p ON flow_joined (partner)""")
# c.execute("""CREATE UNIQUE INDEX i_re_id ON RICentities (id)""")
# c.execute("""CREATE INDEX i_re_rn ON RICentities (RICname)""")

print "cleaning done"
conn.commit()
print "commited"
print "______ _____ _____   ___  ____________ _____ "
print "| ___ \_   _/  __ \ / _ \ | ___ \  _  \  _  |"
print "| |_/ / | | | /  \// /_\ \| |_/ / | | | | | |"
print "|    /  | | | |    |  _  ||    /| | | | | | |"
print "| |\ \ _| |_| \__/\| | | || |\ \| |/ /\ \_/ /"
print "\_| \_|\___/ \____/\_| |_/\_| \_|___/  \___/ "

