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
		print "%s: got %s lines of sql"%(table,len(sql.split(";\n")))
		#c.execute("BEGIN TRANSACTION")
		for insert in sql.split(";\n"):
			try :
				c.execute(insert)
			except Exception as e:
				print "'%s'"%insert
				raise e
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

# cleaning dups in to-be-joined tables

# duplicates in currency
c.execute(""" DELETE FROM currency WHERE ID_Curr_Yr_RepEntity IN (SELECT ID_Curr_Yr_RepEntity from currency GROUP BY `Original Currency`,`Reporting Entity (Original Name)`,Yr HAVING count(*)>1)""")
# duplicates in exp-imp
c.execute("DELETE FROM `Exp-Imp-Standard` WHERE `ID_Exp_spe` in (7,16,25)")

# checking unique on to-be-joined tables
c.execute(""" CREATE UNIQUE INDEX unique_currency ON  currency (`Original Currency`,`Reporting Entity (Original Name)`,Yr); """)
c.execute(""" CREATE UNIQUE INDEX unique_expimp ON `Exp-Imp-Standard` (`Exp / Imp`,`Spe/Gen/Tot`)""")
c.execute(""" CREATE UNIQUE INDEX unique_rate ON rate (Yr,`Modified Currency`)""")

# clean data
# trim and lower
c.execute("UPDATE flow SET `Exp / Imp`=trim(lower(`Exp / Imp`)), `Spe/Gen/Tot`=trim(lower(`Spe/Gen/Tot`)) WHERE 1")
c.execute("UPDATE `Exp-Imp-Standard` SET `Exp / Imp`=trim(lower(`Exp / Imp`)), `Spe/Gen/Tot`=trim(lower(`Spe/Gen/Tot`)) WHERE 1")
c.execute("UPDATE flow SET `Initial Currency`=trim(lower(`Initial Currency`)),`Reporting Entity_Original Name`=trim(lower(`Reporting Entity_Original Name`)) WHERE 1")
c.execute("UPDATE `currency` SET `Original Currency`=trim(lower(`Original Currency`)),`Modified Currency`=trim(lower(`Modified Currency`)),`Reporting Entity (Original Name)`=trim(lower(`Reporting Entity (Original Name)`)) WHERE 1")
c.execute("UPDATE `rate` SET `Modified Currency`=trim(lower(`Modified Currency`)) WHERE 1")
c.execute("""UPDATE RICentities SET type=lower(replace(trim(type)," ","_")) WHERE 1""")

# one lower on reporting 
#c.execute("""UPDATE flow SET `Reporting Entity_Original Name`="espagne (îles baléares)" WHERE `Reporting Entity_Original Name`="espagne (Îles baléares)";""")

# clean Land/Sea
c.execute("UPDATE `flow` SET `Land/Sea` = null WHERE `Land/Sea` = ' '")
#clean total type
c.execute("UPDATE `flow` SET `Total_type` = lower(`Total_type`) WHERE `Total_type` is not null")

# RICENTITIES
# add a slug as RICentities id
c.execute("""UPDATE RICentities SET id=REPLACE(RICname," ","") WHERE 1""")
c.execute("""UPDATE RICentities SET id=REPLACE(id,"&","_") WHERE 1""")
c.execute("""UPDATE RICentities SET id=REPLACE(id,"/","") WHERE 1""")
c.execute("""UPDATE RICentities SET id=REPLACE(id,"(","") WHERE 1""")
c.execute("""UPDATE RICentities SET id=REPLACE(id,")","") WHERE 1""")
c.execute("""UPDATE RICentities SET id=REPLACE(id,"***","") WHERE 1""")



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
c.execute('INSERT INTO `entity_names_cleaning` (`original_name`, `name`, `RICname`) VALUES ("Haïti","Haïti","Haiti");')

##################################################
##			Create views on flow
#####################################################
c.execute("""DROP TABLE IF EXISTS flow_joined;""")
c.execute("""CREATE TABLE IF NOT EXISTS flow_joined AS 
	 SELECT f.*, `Exp / Imp (standard)` as expimp, `Spe/Gen/Tot (standard)` as spegen, `FX rate (NCU/£)` as rate ,`Modified Currency` as currency, r2.RICname as reporting,r2.id as reporting_id, p2.RICname as partner,p2.id as partner_id, r.original_name as reporting_original_name, p.original_name as partner_original_name
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
	 	and partner is not null
	 	and expimp != "Re-exp"
	""")

# taking care of Total_type flag to define the world partner
# and ((`Total Trade Estimation` is null and partner != "World" )or(`Total Trade Estimation`=1 and partner = "World"))
c.execute("""INSERT INTO RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldestimated","World_estimated","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World_estimated", partner_id="Worldestimated" WHERE partner="World" and Total_type="total_estimated" """)
c.execute("""INSERT INTO RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldasreported","World_as_reported","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World_as_reported", partner_id="Worldasreported" WHERE partner="World" and Total_type="total_reporting1" """)
c.execute("""INSERT INTO RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldasreported2","World_as_reported2","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World_as_reported2", partner_id="Worldasreported2" WHERE partner="World" and Total_type="total_reporting2" """)
c.execute("""INSERT INTO RICentities (`id`,`RICname`,`type`,`continent`) VALUES ("Worldundefined","World_undefined","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World_undefined", partner_id="Worldundefined" WHERE partner="World" and Total_type is null """)

	 	

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
# merge duplicates from lan and sea 
########################################################################################

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
# remove "species and billions" remove species flows when exists
########################################################################################

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


########################################################################################
# remove GEN flows when duplicates with SPE flows
########################################################################################

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

if ids_to_remove:
	for r,ids in ids_to_remove.iteritems():
		print ("removing %s Gen or Species duplicates for %s"%(r,len(ids))).encode("utf8")
		c.execute("DELETE FROM flow_joined WHERE id IN (%s)"%",".join(ids))

# INDEX
c.execute("""CREATE INDEX i_rid ON flow_joined (reporting_id)""")
c.execute("""CREATE INDEX i_pid ON flow_joined (partner_id)""")
c.execute("""CREATE INDEX i_yr ON flow_joined (Yr)""")
c.execute("""CREATE INDEX i_r ON flow_joined (reporting)""")
c.execute("""CREATE INDEX i_p ON flow_joined (partner)""")
c.execute("""CREATE UNIQUE INDEX i_re_id ON RICentities (id)""")
c.execute("""CREATE INDEX i_re_rn ON RICentities (RICname)""")

print "cleaning done"
conn.commit()
print "commited"
