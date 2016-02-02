



################################################################################
##			Create table flow_joined
################################################################################

print "Create table flow_joined"
print "-------------------------------------------------------------------------"

c.execute("""DROP TABLE IF EXISTS flow_joined;""")
c.execute("""CREATE TABLE IF NOT EXISTS flow_joined AS 
	 SELECT f.*, `Exp / Imp (standard)` as expimp, `Spe/Gen/Tot (standard)` as spegen, 
	 `FX rate (NCU/£)` as rate ,`Modified Currency` as currency, 
	 r2.RICname as reporting,r2.id as reporting_id, 
	 p2.RICname as partner,p2.id as partner_id, 
	 r.original_name as reporting_original_name, 
	 p.original_name as partner_original_name
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
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) 
	VALUES ("Worldestimated","World estimated","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World estimated", partner_id="Worldestimated" 
	WHERE partner="World" and Total_type="total_estimated" """)
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) 
	VALUES ("Worldasreported","World as reported","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World as reported", partner_id="Worldasreported" 
	WHERE partner="World" and Total_type="total_reporting1" """)
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) 
	VALUES ("Worldasreported2","World as reported2","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World as reported2", partner_id="Worldasreported2" 
	WHERE partner="World" and Total_type="total_reporting2" """)
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) 
	VALUES ("Worldundefined","World undefined","geographical_area","World")""")
c.execute("""UPDATE flow_joined SET partner="World undefined", partner_id="Worldundefined" 
	WHERE partner="World" and Total_type is null """)


# c.execute("""DROP VIEW IF EXISTS flow_impexp_total;""")
# c.execute(""" CREATE VIEW IF NOT EXISTS flow_impexp_world AS 
# 	SELECT f.*, `Exp / Imp (standard)` as expimp, `Spe/Gen/Tot (standard)` as spegen, 
# `FX rate (NCU/£)` as rate ,r2.RICname as reporting, p2.RICname as partner
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

c.execute("""SELECT count(*) as nb,group_concat(`flow`,'|'),group_concat(ID,'|'),
	group_concat(`Land/Sea`,'|'),group_concat(`Notes`,'|'),group_concat(`Original No`,'|')
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
			sub_c.execute("""UPDATE `flow_joined` SET flow=%.1f,notes="%s",`Land/Sea`="%s" 
				WHERE ID=%s"""%(sum(float(_) for _ in flows.split("|")),notes,land_sea,ids.split("|")[0]))
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

c.execute("""SELECT count(*) as nb,group_concat(Notes,'|'),group_concat(ID,'|'),
	group_concat(Source,'|') as notes_group
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

c.execute("""SELECT * from (SELECT count(*) as nb,
	group_concat(`Species and Bullions`,'|') as sb,group_concat(ID,'|'),
	reporting,partner
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

c.execute("""SELECT count(*) as nb,group_concat(`spegen`,'|'),
	group_concat(`Species and Bullions`,'|') as sb,group_concat(ID,'|'),
	`reporting`,`partner`,Yr,`expimp`,group_concat(`flow`,'|') 
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
		print ("duplicate found :%s flows for %s,%s,%s,%s,%s,%s"%(n,Yr,reporting,
			partner,e_i,spe_gens,sb)).encode("utf8")
print "-------------------------------------------------------------------------"
if ids_to_remove:
	for r,ids in ids_to_remove.iteritems():
		print ("removing %s Gen or Species duplicates for %s"%(r,len(ids))).encode("utf8")
		c.execute("DELETE FROM flow_joined WHERE id IN (%s)"%",".join(ids))

print "-------------------------------------------------------------------------"
 
################################################################################
##			Create the partner World as sum of partners
################################################################################
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) 
	VALUES ("Worldsumpartners","World sum partners","geographical_area","World")""")
c.execute("""INSERT INTO flow_joined (flow,unit,reporting,reporting_id,Yr,expimp,
	currency,spegen,partner,partner_id,rate,Source,`Source suite`) 
	SELECT sum(flow*unit) as flow, 1 as unit, reporting, reporting_id, Yr, 
	expimp, currency, '' as spegen,  'World_sum_partners' as partner, 
	'Worldsumpartners' as partner_id,rate,Source,`Source suite` 
	from flow_joined 
	WHERE partner not like 'World%' 
	group by reporting,expimp,Yr """)

################################################################################
##			Create the partner World as best guess
################################################################################
c.execute("""INSERT INTO old_RICentities (`id`,`RICname`,`type`,`continent`) 
	VALUES ("Worldbestguess","World best guess","geographical_area","World")""")

conn.commit()

c.execute("""SELECT Yr,expimp,partner,reporting,partner_id,reporting_id,flow,
	unit,currency,spegen,rate,Source,`Source suite` 
	from flow_joined 
	WHERE partner LIKE "World%"  """)
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
		c.execute("""INSERT INTO flow_joined (Yr,expimp,partner,reporting,partner_id,
			reporting_id,flow,unit,currency,spegen,rate,Source,`Source suite`) 
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",world_best_guess)