# coding=utf8
import subprocess
import sqlite3
import os
import json
import itertools
import csv
from csv_unicode import UnicodeReader
from csv_unicode import UnicodeWriter


################################################################################
##          MDB to SQLite
################################################################################

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

print "______ _____ _____   ___  ____________ _____ "
print "| ___ \_   _/  __ \ / _ \ | ___ \  _  \  _  |"
print "| |_/ / | | | /  \// /_\ \| |_/ / | | | | | |"
print "|    /  | | | |    |  _  ||    /| | | | | | |"
print "| |\ \ _| |_| \__/\| | | || |\ \| |/ /\ \_/ /"
print "\_| \_|\___/ \____/\_| |_/\_| \_|___/  \___/ "

################################################################################
##          Schema SQLite to copy ACCESS
################################################################################
print "-------------------------------------------------------------------------"
print "Read the old schema of the data base to transfert access base into sqlite"
with open(conf["sqlite_schema"],"r") as schema:
	c.executescript(schema.read())

################################################################################
##          Schema SQLite with good tables 
################################################################################
print "-------------------------------------------------------------------------"
print "Read the schema of the new data base"
with open(conf["new_sqlite_schema"],"r") as new_schema:
	c.executescript(new_schema.read())


print "-------------------------------------------------------------------------"
print "Copy access tables into sqlite"
print "-------------------------------------------------------------------------"
for table in ["Entity_Names v1","RawData v1","Currency Name v1","Exchange Rate v1",
"Exp-Imp-Standard v1","RICentities v1","RICentities_groups v1"]:
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
c.execute(""" DELETE FROM old_currency 
	WHERE ID_Curr_Yr_RepEntity 
	IN (SELECT ID_Curr_Yr_RepEntity 
		from old_currency 
		GROUP BY `Original Currency`,`Reporting Entity (Original Name)`,Yr HAVING count(*)>1)""")

# duplicates in exp-imp
c.execute("DELETE FROM `old_Exp-Imp-Standard` WHERE `ID_Exp_spe` in (7,16,25)")

# checking unique on to-be-joined tables
c.execute(""" CREATE UNIQUE INDEX unique_currency ON  old_currency (`Original Currency`,
	`Reporting Entity (Original Name)`,Yr); """)
c.execute(""" CREATE UNIQUE INDEX unique_expimp ON `old_Exp-Imp-Standard` (`Exp / Imp`,`Spe/Gen/Tot`)""")
c.execute(""" CREATE UNIQUE INDEX unique_rate ON old_rate (Yr,`Modified Currency`)""")

################################################################################
##          clean data - trim and lower
################################################################################
c.execute("""UPDATE old_flow SET `Exp / Imp`=trim(lower(`Exp / Imp`)), 
	`Spe/Gen/Tot`=trim(lower(`Spe/Gen/Tot`)) WHERE 1""")
c.execute("""UPDATE `old_Exp-Imp-Standard` SET `Exp / Imp`=trim(lower(`Exp / Imp`)), 
	`Spe/Gen/Tot`=trim(lower(`Spe/Gen/Tot`)) WHERE 1""")
c.execute("""UPDATE old_flow SET `Initial Currency`=trim(lower(`Initial Currency`)),
	`Reporting Entity_Original Name`=trim(lower(`Reporting Entity_Original Name`)) 
	WHERE 1""")
c.execute("""UPDATE `old_currency` SET `Original Currency`=trim(lower(`Original Currency`)),
	`Modified Currency`=trim(lower(`Modified Currency`)),
	`Reporting Entity (Original Name)`=trim(lower(`Reporting Entity (Original Name)`)) 
	WHERE 1""")
c.execute("""UPDATE `old_rate` SET `Modified Currency`=trim(lower(`Modified Currency`)) 
	WHERE 1""")
c.execute("""UPDATE `old_rate` SET `FX rate (NCU/£)`=replace(`FX rate (NCU/£)`,",",".") 
	WHERE 1""")
c.execute("""UPDATE old_RICentities SET type=lower(replace(trim(type)," ","_")) 
	WHERE 1""")

# DELETE unused spe/gen cleaning rows ID=13 

# one lower on reporting 
#c.execute("""UPDATE flow SET `Reporting Entity_Original Name`="espagne (îles baléares)" 
# WHERE `Reporting Entity_Original Name`="espagne (Îles baléares)";""")

# clean Land/Sea
c.execute("UPDATE `old_flow` SET `Land/Sea` = null WHERE `Land/Sea` = ' '")
#clean total type
c.execute("""UPDATE `old_flow` SET `Total_type` = lower(`Total_type`) 
	WHERE `Total_type` is not null""")

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


################################################################################
##          Import RICnames definition from CSV
################################################################################
# import RICnames_from_csv
# RICnames_from_csv.import_in_sqlite(conn, conf)
#  depecrated since RICnames were included into mdb file by Karine

# add the missing Haïti
c.execute("""INSERT INTO `old_entity_names_cleaning` (`original_name`, `name`, `RICname`) 
	VALUES ("Haïti","Haïti","Haiti");""")


print "-------------------------------------------------------------------------"
print "Transfert old sqlite into the new sqlite database"
print "-------------------------------------------------------------------------"

################################################################################
##			Create table currency_sources
################################################################################
# print "Create currency_sources"
# c.execute("""DROP TABLE IF EXISTS currency_sources;""")
# c.execute("""CREATE TABLE IF NOT EXISTS currency_sources AS 
# 	SELECT `Source Currency` as currency, `Note Currency`as notes 
# 	FROM old_rate
# 	""")
# print "currency_sources created"


################################################################################
##			Create table flow_sources
################################################################################
print "create flow_sources"
c.execute("""CREATE TABLE IF NOT EXISTS flow_sources (source, 
	transcript_filename, country, volume, date, cote, url)""")
with open('in_data/ricardo_flow_sources_final.csv', 'r') as sources:
	reader=UnicodeReader(sources)
	reader.next()
	for row in reader:
		c.execute("""INSERT INTO flow_sources (source, transcript_filename, 
			country, volume, date, cote, url) 
			VALUES (?, ?, ?, ?, ?, ?, ?)""",(row[0].strip(), row[1].strip(), 
				row[2].strip(), row[3].strip(), row[4].strip(), row[5].strip(), row[7].strip()))
print "flow_sources create"
print "-------------------------------------------------------------------------"

################################################################################
##			Create table sources
################################################################################
print "Create sources"
c.execute("""INSERT INTO sources(source_name, shelf_number, volume, url, dates) 
	SELECT fs.source as source_name, fs.cote as shelf_number, 
	group_concat(fs.country, fs.volume) as volume, fs.url, fs.date as dates
	FROM flow_sources fs
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

################################################################################
##			Create table exchanges_rates
################################################################################
print "Create exchanges_rates"
c.execute("""INSERT INTO exchange_rates(year, modified_currency, 
	rate_to_pounds, source)
	SELECT Yr as year, `Modified currency` as modified_currency,
	`FX rate (NCU/£)` as rate_to_pounds, src.id
	FROM old_rate
	INNER JOIN sources as src
	WHERE old_rate.`Source Currency` = src.source_name
	GROUP BY rate_to_pounds
	""")
print "exchanges_rates created"
print "-------------------------------------------------------------------------"

################################################################################
##			Create table expimp_spegen
################################################################################
print "Create expimp_spegen"
c.execute("""INSERT INTO expimp_spegen
	SELECT `Exp / Imp` as export_import, `Spe/Gen/Tot` as special_general,
	`Exp / Imp (standard)` as modified_export_import, 
	`Spe/Gen/Tot (standard)` as modified_special_general
	FROM `old_Exp-Imp-Standard`
	""")
print "expimp_spegen created"
print "-------------------------------------------------------------------------"

################################################################################
##			Create table currencies
################################################################################
print "Create currencies"
c.execute("""INSERT INTO currencies
	SELECT `Original Currency` as currency, Yr as year, 
	`reporting entity (Original name)` as reporting, 
	`Modified Currency` as modified_currency
	FROM old_currency
	""")
print "currencies created"
print "-------------------------------------------------------------------------"


################################################################################
##			Create table RICentities
################################################################################
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

################################################################################
##			Create table entity_names
################################################################################
#create temp table to save RICentities
print "Create entity_names"
c.execute("""INSERT INTO entity_names 
	SELECT original_name, name as french_name, RICname
	FROM old_entity_names_cleaning
	""")
print "entity_names created"
print "-------------------------------------------------------------------------"


################################################################################
##			Create table RICentities_groups
################################################################################
#create temp table to save RICentities
print "Create RICentities_groups"
c.execute("""INSERT INTO RICentities_groups 
	SELECT id, RICname_group, RICname_part
	FROM old_RICentities_groups
	""")
print "RICentities_groups created"
print "-------------------------------------------------------------------------"

################################################################################
##			Create table flows : TO BE UPDATED 
################################################################################

# print "Create flows"
# c.execute("""INSERT INTO flows(source, flow, unit, currency, year, reporting, 
# 	partner, export_import, special_general, species_bullions, transport_type, 
# 	statistical_period, partner_sum, world_trade_type)
# 	SELECT src.id as source, Flow, Unit, currency, Yr as Year, 
# 	reporting_original_name as reporting, partner_original_name as partner, 
# 	expimp as export_import, spegen as special_general, 
# 	`Species and Bullions` as species_bullions, `Land/Sea` as transport_type, 
# 	`Statistical Period` as statistical_period, `Partner Entity_Sum` as partner_sum, 
# 	Total_type as world_trade_type
# 	FROM flow_joined
# 	INNER JOIN sources as src
# 	WHERE flow_joined.source = src.source_name
# 	GROUP BY Year,export_import,reporting,partner
# 	""")
# print "flows created"
# print "-------------------------------------------------------------------------"

# INDEX

# c.execute("""CREATE INDEX i_rid ON flow_joined (reporting_id)""")
# c.execute("""CREATE INDEX i_pid ON flow_joined (partner_id)""")
# c.execute("""CREATE INDEX i_yr ON flow_joined (Yr)""")
# c.execute("""CREATE INDEX i_r ON flow_joined (reporting)""")
# c.execute("""CREATE INDEX i_p ON flow_joined (partner)""")
# c.execute("""CREATE UNIQUE INDEX i_re_id ON RICentities (id)""")
# c.execute("""CREATE INDEX i_re_rn ON RICentities (RICname)""")

# c.execute("""DROP TABLE IF EXISTS flow_joined;""")
# print "drop flow_joined"
# print "-------------------------------------------------------------------------"
c.execute("""DROP TABLE IF EXISTS old_rate;""")
print "drop old_rate"
print "-------------------------------------------------------------------------"
c.execute("""DROP TABLE IF EXISTS old_RICentities;""")
print "drop old_RICentities"
print "-------------------------------------------------------------------------"
c.execute("""DROP TABLE IF EXISTS RICentities_backup;""")
print "drop RICentities_backup"
print "-------------------------------------------------------------------------"
c.execute("""DROP TABLE IF EXISTS old_currency;""")
print "drop old_currency"
print "-------------------------------------------------------------------------"
c.execute("""DROP TABLE IF EXISTS old_flow;""")
print "drop old_flow"
print "-------------------------------------------------------------------------"
c.execute("""DROP TABLE IF EXISTS old_RICentities_groups;""")
print "drop old_RICentities_groups"
print "-------------------------------------------------------------------------"
c.execute("""DROP TABLE IF EXISTS old_entity_names_cleaning;""")
print "drop old_entity_names_cleaning"
print "-------------------------------------------------------------------------"
c.execute("""DROP TABLE IF EXISTS 'old_Exp-Imp-Standard';""")
print "drop old_Exp-Imp-Standard"
print "-------------------------------------------------------------------------"


print "cleaning done"
conn.commit()
print "commited"
print "-------------------------------------------------------------------------"

################################################################################
##			Export all tables in csv files
################################################################################

tables = [
		"sources",
		"entity_names",
		"RICentities",
		"exchange_rates",
		"currencies",
		"expimp_spegen",
		"RICentities_groups",
		"flows"
		]

for item in tables:
	c.execute("select * from " + item)
	writer = UnicodeWriter(open(os.path.join("out_data", item + ".csv"), "wb"))
	writer.writerow([description[0] for description in c.description])
	writer.writerows(c)
	print "export " + item + ".csv done"
	print "-------------------------------------------------------------------------"
