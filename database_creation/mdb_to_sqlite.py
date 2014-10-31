# coding=utf8
import subprocess
import sqlite3
import os
import json


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


with open(conf["sqlite_schema"],"r") as schema:
	#c.executescript(subprocess.check_output("mdb-schema %s sqlite 2>/dev/null"%mdb_filename,shell=True))
	c.executescript(schema.read())

for table in subprocess.check_output("mdb-tables -1 %s 2>/dev/null"%mdb_filename,shell=True).split("\n")[0:-1]:
 	if table in ["RawData v1","Currency Name v1","Exchange Rate v1","Exp-Imp-Standard v1","Entity_Names v1","RICentities v1","RICentities_groups v1"]:
	 	# new_table_name=table.lower().replace(" ","_").replace("-","_")
	 	# print new_table_name
		#c.executescript()
		sql=subprocess.check_output("mdb-export -I sqlite %s '%s'"%(mdb_filename,table),shell=True)
		print "%s: got %s lines of sql"%(table,len(sql.split("\n")))
		#c.execute("BEGIN TRANSACTION")
		for insert in sql.split("\n"):
			c.execute(insert)
		#c.execute("END")

print "inserts done"
c.execute("ALTER TABLE `RawData v1` RENAME TO flow")
c.execute("ALTER TABLE `Currency Name v1` RENAME TO currency")
c.execute("ALTER TABLE `Exchange Rate v1` RENAME TO rate")
c.execute("ALTER TABLE `Entity_Names v1` RENAME TO entity_names_cleaning")
c.execute("ALTER TABLE `Exp-Imp-Standard v1` RENAME TO `Exp-Imp-Standard`")
c.execute("ALTER TABLE `RICentities v1` RENAME TO RICentities")
c.execute("ALTER TABLE `RICentities_groups v1` RENAME TO RICentities_groups")
print "renaming table done"
# clean data
# trim and lower
c.execute("UPDATE flow SET `Exp / Imp`=trim(lower(`Exp / Imp`)), `Spe/Gen/Tot`=trim(lower(`Spe/Gen/Tot`)) WHERE 1")
c.execute("UPDATE `Exp-Imp-Standard` SET `Exp / Imp`=trim(lower(`Exp / Imp`)), `Spe/Gen/Tot`=trim(lower(`Spe/Gen/Tot`)) WHERE 1")
c.execute("UPDATE flow SET `Initial Currency`=trim(lower(`Initial Currency`)),`Reporting Entity_Original Name`=trim(lower(`Reporting Entity_Original Name`)) WHERE 1")
c.execute("UPDATE `currency` SET `Original Currency`=trim(lower(`Original Currency`)),`Modified Currency`=trim(lower(`Modified Currency`)),`Reporting Entity (Original Name)`=trim(lower(`Reporting Entity (Original Name)`)) WHERE 1")
c.execute("UPDATE `rate` SET `Modified Currency`=trim(lower(`Modified Currency`)) WHERE 1")

# one lower on reporting 
#c.execute("""UPDATE flow SET `Reporting Entity_Original Name`="espagne (îles baléares)" WHERE `Reporting Entity_Original Name`="espagne (Îles baléares)";""")


# duplicates in exp-imp
c.execute("DELETE FROM `Exp-Imp-Standard` WHERE `ID_Exp_spe` in (7,16,25)")

# remove 770 'Pas de données'
c.execute("SELECT count(*) from flow where notes='Pas de données' and Flow is null")
print "removing %s flows with Notes='Pas de données'"%c.fetchone()[0]
c.execute("DELETE FROM flow WHERE notes ='Pas de données' and Flow is null")

# remove Null rates from rate
c.execute("DELETE FROM rate WHERE `FX rate (NCU/£)` is null")


###################################################
##          Import RICnames definition from CSV
###################################################
# import RICnames_from_csv
# RICnames_from_csv.import_in_sqlite(conn, conf)
#  depecrated since RICnames were included into mdb file by Karine

# add the missing Haïti
c.execute('INSERT INTO `entity_names_cleaning` (`original_name`, `name`, `RICname`) VALUES ("Haïti","Haïti","Haiti");')

##################################################
##			Create views on flow
#####################################################
c.execute("""DROP TABLE IF EXISTS flow_joined;""")
c.execute("""CREATE TABLE IF NOT EXISTS flow_joined AS 
	 SELECT f.*, `Exp / Imp (standard)` as expimp, `Spe/Gen/Tot (standard)` as spegen, `FX rate (NCU/£)` as rate ,`Modified Currency` as currency, r2.RICname as reporting,r2.id as reporting_id, p2.RICname as partner,p2.id as partner_id
	 from flow as f
	 LEFT OUTER JOIN `Exp-Imp-Standard` USING (`Exp / Imp`,`Spe/Gen/Tot`)
	 LEFT OUTER JOIN currency as c
		ON f.`Initial Currency`=c.`Original Currency` 
		   AND f.`Reporting Entity_Original Name`=c.`Reporting Entity (Original Name)`
		   AND f.Yr=c.Yr
	 LEFT OUTER JOIN rate as r USING (Yr,`Modified Currency`)
	 LEFT OUTER JOIN entity_names_cleaning as r ON `Reporting Entity_Original Name`=r.original_name COLLATE NOCASE
	 LEFT OUTER JOIN RICentities r2 ON r2.RICname=r.RICname
	 LEFT OUTER JOIN entity_names_cleaning as p ON trim(`Partner Entity_Original Name`)=p.original_name COLLATE NOCASE
	 LEFT OUTER JOIN RICentities p2 ON p2.RICname=p.RICname
	 WHERE 	
		`Partner Entity_Sum` is null
	 	and ((`Total Trade Estimation` is null and partner != "World" )or(`Total Trade Estimation`=1 and partner = "World"))
	 	and partner is not null
	 	and expimp != "Re-exp"
	""")

# INDEX
c.execute("""CREATE INDEX i_rid ON flow_joined (reporting_id)""")
c.execute("""CREATE INDEX i_pid ON flow_joined (partner_id)""")
c.execute("""CREATE INDEX i_yr ON flow_joined (Yr)""")
c.execute("""CREATE INDEX i_r ON flow_joined (reporting)""")
c.execute("""CREATE INDEX i_p ON flow_joined (partner)""")
c.execute("""CREATE INDEX i_re_rn ON RICentities (RICname)""")

	 	

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

########################################################################################
# remove 'valeurs officielles' when duplicates with 'Valeurs actuelles' for France between 1847 and 1856 both included
########################################################################################

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



########################################################################################
# remove GEN flows when duplicates with SPE flows
########################################################################################

c.execute("""SELECT count(*) as nb,group_concat(`spegen`,'|'),group_concat(ID,'|'),`reporting`,`partner`,Yr,`expimp` 
	FROM `flow_joined`
	GROUP BY Yr,`expimp`,`reporting`,`partner` HAVING count(*)>1
	""")
lines=c.fetchall()
ids_to_remove={}
for n,spe_gens,ids,reporting,partner,Yr,e_i in lines :
	if n==2 and spe_gens and "Gen" in spe_gens.split("|") and "Spe" in spe_gens.split("|"):
		i=spe_gens.split("|").index("Gen")
		id=ids.split("|")[i]
		if reporting in ids_to_remove.keys():
			ids_to_remove[reporting].append(id)
		else:
		 	ids_to_remove[reporting]=[id]
	else:
		print ("duplicate found :%s flows for %s,%s,%s,%s,%s"%(n,Yr,reporting,partner,e_i,spe_gens)).encode("utf8")

if ids_to_remove:
	for r,ids in ids_to_remove.iteritems():
		print ("removing %s Gen duplicates for %s"%(r,len(ids))).encode("utf8")
		c.execute("DELETE FROM flow_joined WHERE id IN (%s)"%",".join(ids))




print "cleaning done"
conn.commit()
print "commited"
