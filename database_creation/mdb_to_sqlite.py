# coding=utf8
import subprocess
import sqlite3
import os
import json
import itertools
import csv
from csv_unicode import UnicodeReader
from csv_unicode import UnicodeWriter
import unicodedata
import re
import utils

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
with open(conf["access_toconversion_schema"],"r") as schema:
	c.executescript(schema.read())

print "-------------------------------------------------------------------------"
print "Copy access tables into sqlite"
print "-------------------------------------------------------------------------"
for table in ["Entity_Names v1","RawData v1","Currency Name v1","Exchange Rate v1",
"Exp-Imp-Standard v1","RICentities v1","RICentities_groups v1"]:
		sql=subprocess.check_output("mdb-export -I sqlite %s '%s'"%(mdb_filename,table),shell=True)
		print "%s: got %s lines of sql"%(table,len(sql.split(";\n")))
		for insert in sql.split(";\n"):
			try :
				c.execute(insert)
			except Exception as e:
				print "'%s'"%insert
				raise e
		conn.commit()

print "-------------------------------------------------------------------------"
print "inserts into sqlite done"
print "-------------------------------------------------------------------------"

c.execute("ALTER TABLE `RawData v1` RENAME TO flows")
c.execute("ALTER TABLE `Currency Name v1` RENAME TO currencies")
c.execute("ALTER TABLE `Exchange Rate v1` RENAME TO exchange_rates")
c.execute("ALTER TABLE `Entity_Names v1` RENAME TO entity_names")
c.execute("ALTER TABLE `Exp-Imp-Standard v1` RENAME TO expimp_spegen")
c.execute("ALTER TABLE `RICentities v1` RENAME TO RICentities")
c.execute("ALTER TABLE `RICentities_groups v1` RENAME TO RICentities_groups")
print "renaming table done"
print "-------------------------------------------------------------------------"



#export access version to csv
print "-------------------------------------------------------------------------"
print "exports Access version to csv"
print "-------------------------------------------------------------------------"
utils.sqlitedatabase2csv(mdb_sqlite_filename,"out_data/access_version_csvs")

c.execute("ALTER TABLE flows RENAME TO old_flow")
c.execute("ALTER TABLE currencies RENAME TO old_currency")
c.execute("ALTER TABLE exchange_rates RENAME TO old_rate")
c.execute("ALTER TABLE entity_names RENAME TO old_entity_names_cleaning")
c.execute("ALTER TABLE expimp_spegen RENAME TO `old_Exp-Imp-Standard`")
c.execute("ALTER TABLE RICentities RENAME TO old_RICentities")
c.execute("ALTER TABLE RICentities_groups RENAME TO old_RICentities_groups")


################################################################################
##          Schema SQLite with good tables
################################################################################
print "-------------------------------------------------------------------------"
print "Read the schema of the new data base"
with open(conf["sqlite_schema"],"r") as new_schema:
	c.executescript(new_schema.read())




print "cleaning dups in to-be-joined tables"
print "-------------------------------------------------------------------------"
# cleaning dups in to-be-joined tables

# duplicates in currency
c.execute(""" DELETE FROM old_currency
	WHERE id_Curr_Yr_RepEntity
	IN (SELECT id_Curr_Yr_RepEntity
		from old_currency
		GROUP BY `Original Currency`,`Reporting Entity (Original Name)`,Yr HAVING count(*)>1)""")

# # duplicates in exp-imp
c.execute("DELETE FROM `old_Exp-Imp-Standard` WHERE `id_Exp_spe` in (7,16,25)")

# # checking unique on to-be-joined tables
c.execute(""" CREATE UNIQUE INDEX unique_currency ON old_currency (`Original Currency`,
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

# Cleaning old_rate
c.execute("""DELETE from old_rate WHERE  `FX rate (NCU/£)` is null""")

# DELETE unused spe/gen cleaning rows id=13

# one lower on reporting
# c.execute("""UPDATE flow SET `Reporting Entity_Original Name`="espagne (îles baléares)"
# WHERE `Reporting Entity_Original Name`="espagne (Îles baléares)";""")

# clean Land/Sea
c.execute("UPDATE `old_flow` SET `Land/Sea` = null WHERE `Land/Sea` = ' '")
# #clean total type
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
# c.execute("DELETE FROM rate WHERE `FX rate (NCU/£)` is null")


################################################################################
##          Import RICnames definition from CSV
################################################################################
# add the missing Haïti
c.execute("""INSERT INTO `old_entity_names_cleaning` (`original_name`, `name`, `RICname`)
VALUES ("Haïti","Haïti","Haiti");""")


print "-------------------------------------------------------------------------"
print "Transfert old sqlite into the new sqlite database"
print "-------------------------------------------------------------------------"

################################################################################
##			Create table sources
################################################################################

with open('in_data/patchs/refine_source_merge.csv', 'r') as sources:
	reader=UnicodeReader(sources)
	reader.next()
	uniqueId = []
	duplicate = []
	for row in reader:
		_id = row[7]
		if _id in uniqueId:
			duplicate.append(row)
			print row
			pass
		else:
			if row[0]!="":
				# if "New series of the Spanish foreign sector 1850-2000" == row[2].strip():
				# 	print "found in sources %s"%row[2].strip()
				uniqueId.append(_id)
				c.execute("""INSERT INTO sources (
					slug, acronym, name, edition_date, country, pages, volume, shelf_number, dates, notes)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",(row[7].strip(), row[0].strip(), 
						row[8].strip(), row[2].strip(),row[4].strip(),row[6].strip(),row[1].strip(),
						row[3].strip(),row[5].strip(),row[11].strip())
					)

				# c.execute("""INSERT INTO source_types (acronym, reference, type, author, url)
				# 	VALUES (?, ?, ?, ?, ?)""",(row[0].strip(), row[12].strip(), row[13].strip(), row[9].strip(), 
				# 		row[10].strip())
				# 	)
print "-------------------------------------------------------------------------"
print "create table source type"
################################################################################
##			Create table source_type
################################################################################
with open('in_data/patchs/refine_source_merge.csv', 'r') as sources:
	reader=UnicodeReader(sources)
	reader.next()
	

	sourceTypeTable = []
	
	for row in reader:
		if row[0]!="" and row[0] != "OUPS":
			sourceTypes= [None] * 5
			sourceTypes[0] = row[0].strip()
			sourceTypes[1] = row[12].strip()
			sourceTypes[2] = row[13].strip()
			sourceTypes[3] = row[9].strip()
			sourceTypes[4] = row[10].strip()
			sourceTypeTable.append(sourceTypes)

	data = [list(r) for r in sourceTypeTable]
	data.sort(key=lambda _:(_[0]))
	for k, group in itertools.groupby(data, lambda _:_[0]):
		print "source acronyme %s"%k 

		groups = list(group)
		def check_attributes(label,index):
			atts=set(_[index] for _ in groups if _[index]!="")
			if len(atts)>1:
				print "more than one %s: %s"%(label,atts)
			return " | ".join(atts)

		sref=check_attributes("refs",1)
		stype=check_attributes("type",2)
		sauthor=check_attributes("author",3)
		surl=check_attributes("url",4)

		c.execute("""INSERT INTO source_types (acronym, reference, type, author, url)
		VALUES (?,?,?,?,?)""", (k,sref,stype,sauthor,surl))

################################################################################
##			Create table exchanges_rates
################################################################################

print "Create exchanges_rates"
c.execute("""INSERT INTO exchange_rates(year, modified_currency,
	rate_to_pounds, source, notes)
	SELECT Yr as year, `Modified currency` as modified_currency,
	`FX rate (NCU/£)` as rate_to_pounds, trim('currency_' || `Source Currency`) as source, `Note Currency` as notes
	FROM old_rate
	WHERE rate_to_pounds is not null
	""")
print "exchanges_rates created"
print "-------------------------------------------------------------------------"
print "update exchange_rates"
c.execute("""SELECT * from exchange_rates""")
exchange_rates = [list(r) for r in c]

# resolve oups problem in refine source csv
with open('in_data/patchs/oups_fixed.csv', 'r') as oups_sources:
	oups=UnicodeReader(oups_sources)
	oups.next()
	oups = [list(r) for r in oups]
	oups = {row[0]:row for row in oups}

	sub_c=conn.cursor()
	for row in exchange_rates:
		if row[3] in oups.keys():
			if oups[row[3]][1] != "SOURCES TO BE FIXED":
				sub_c.execute("""UPDATE exchange_rates set source=?, notes=? WHERE source=?""",
					[oups[row[3]][1], oups[row[3]][3], row[3]])
				sub_c.execute("""DELETE from sources WHERE slug=? """,[row[3]])

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

print "Create RICentities"
c.execute("""INSERT INTO RICentities
	SELECT RICname, type, continent, COW_code, id as slug
	FROM old_RICentities
	""")
print "RICentities created"
print "-------------------------------------------------------------------------"

################################################################################
##			Create table entity_names
################################################################################
print "Create entity_names"
c.execute("""INSERT INTO entity_names
	SELECT trim(original_name), name as french_name, RICname
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

print "Create flows"
c.execute("""INSERT INTO flows(id, source, flow, unit, currency, year, reporting,
	partner, export_import, special_general, species_bullions, transport_type,
	statistical_period, partner_sum, world_trade_type, notes)
	SELECT ID, trim(Source), Flow, Unit, `Initial Currency`, Yr,
	trim(`Reporting Entity_Original Name`),
	trim(`Partner Entity_Original Name`),
	`Exp / Imp`, `Spe/Gen/Tot`,
	`Species and Bullions`, `Land/Sea`,
	`Statistical Period`, `Partner Entity_Sum`,
	Total_Type, Notes
	FROM old_flow

	""")
print "flows created"
print "-------------------------------------------------------------------------"
print "apply sources patch"
##copy notes to rate,source,flows first
with open('in_data/patchs/patch_sources_copy.csv', 'r') as patch:
	patch=UnicodeReader(patch)
	# patch.next()
	patch = [list(r) for r in patch]
	patch_number = 0
	for r in patch:
		if "\n" in r[0]:
			r[0]=re.sub("\n","\r\n",r[0],re.M)
		c.execute("""UPDATE flows SET notes=? WHERE source=?""",[r[1].strip(), r[0]])
		c.execute("""UPDATE exchange_rates SET notes=? WHERE source=?""",[r[1].strip(), r[0]])
		c.execute("""UPDATE sources SET notes=? WHERE slug=?""",[r[1].strip(), r[0]])
		patch_number +=1
	print "copy source nodes to flow,exchange_rates,sources patches : ", len(patch)

##remove notes from sources

with open('in_data/patchs/patch_sources_remove.csv', 'r') as patch:
	patch=UnicodeReader(patch)
	# patch.next()
	patch = [list(r) for r in patch]
	patch_number = 0
	for r in patch:
		if "\n" in r[0]:
			r[0]=re.sub("\n","\r\n",r[0],re.M)
		c.execute("""UPDATE sources SET notes='' WHERE slug=?""",[r[0]])
		patch_number +=1
	print "remove notes from sources patches : ", len(patch)

##replace sources
with open('in_data/patchs/patch_sources.csv', 'r') as patch:
	patch=UnicodeReader(patch)
	# patch.next()
	patch = [list(r) for r in patch]
	patch_number = 0
	for r in patch:
		if "\n" in r[0]:
			r[0]=re.sub("\n","\r\n",r[0],re.M)
		c.execute("""DELETE FROM sources WHERE slug=?""",[r[0]])
		c.execute("""UPDATE flows set source=? WHERE source=?""",[r[1].strip(), r[0]])
		c.execute("""UPDATE exchange_rates set source=? WHERE source=?""",[r[1].strip(), r[0]])
		patch_number +=1
	print "replace sources patch : ", len(patch)

# c.execute("""SELECT distinct(source) from flows""")
# table = [list(r) for r in c]
# # source_correction = [s.replace('"','') for s in table]
# # delete double quote from first and last position in source to match with sources slug
# for r in table:
# 	if '"' in r[0]:
# 		source = re.sub('"', '', r[0])
# 		c.execute("""UPDATE flows set source=? WHERE source=?""",[source, r[0]])

# INDEX

# c.execute("""CREATE INDEX i_rid ON flow_joined (reporting_id)""")
# c.execute("""CREATE INDEX i_pid ON flow_joined (partner_id)""")
# c.execute("""CREATE INDEX i_yr ON flow_joined (Yr)""")
# c.execute("""CREATE INDEX i_r ON flow_joined (reporting)""")
# c.execute("""CREATE INDEX i_p ON flow_joined (partner)""")
# c.execute("""CREATE UNIQUE INDEX i_re_id ON RICentities (id)""")
# c.execute("""CREATE INDEX i_re_rn ON RICentities (RICname)""")

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


#export access version to csv
print "-------------------------------------------------------------------------"
print "exports Access version to csv"
print "-------------------------------------------------------------------------"
utils.sqlitedatabase2csv(mdb_sqlite_filename,"out_data/csv_data")
