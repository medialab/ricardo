# python script to build sqlite for visualization
# coding=utf8
import subprocess
import sqlite3
import os
import json
import itertools
from csv_unicode import UnicodeReader
from csv_unicode import UnicodeWriter

try :
	conf=json.load(open("config.json","r"))
except :
	print "couldn't load config.json database"
	exit(1)

# sqlite_viz=os.path.join("out_data",conf["sqlite_viz"])
conn=sqlite3.connect("out_data/RICardo_visualisation.sqlite")
c=conn.cursor()

################################################################################
##			Create table flow_joined
################################################################################

print "Create table flow_joined"
print "-------------------------------------------------------------------------"

c.execute("""DROP TABLE IF EXISTS flow_joined;""")
c.execute("""CREATE TABLE IF NOT EXISTS flow_joined AS
	 SELECT f.id, f.source, s.type, f.flow, f.year,
	 	f.unit as unit,
		eisg.modified_export_import as expimp,
		eisg.modified_special_general as spegen,
		rate.rate_to_pounds as rate,
		c.modified_currency as currency,
		r1.RICname as reporting,
		r2.slug as reporting_slug,
		CASE
			WHEN p2.RICname="World" and world_trade_type="total_estimated" THEN "Worldestimated"
			WHEN p2.RICname="World" and world_trade_type="total_reporting1" THEN "Worldasreported"
			WHEN p2.RICname="World" and world_trade_type="total_reporting2" THEN "Worldasreported2"
			WHEN p2.RICname="World" and world_trade_type is null THEN "Worldundefined"
			ELSE p2.slug
		END as partner_slug,
		CASE
			WHEN p2.RICname="World" and world_trade_type="total_estimated" THEN "World estimated"
			WHEN p2.RICname="World" and world_trade_type="total_reporting1" THEN "World as reported"
			WHEN p2.RICname="World" and world_trade_type="total_reporting2" THEN "World as reported2"
			WHEN p2.RICname="World" and world_trade_type is null THEN "World undefined"
			ELSE p2.RICname
		END as partner,
		r2.type as reporting_type,
		r2.continent as reporting_continent,
		p2.type as partner_type,
		p2.continent as partner_continent,
		transport_type,
		f.notes,
		species_bullions
		from flows as f
		LEFT OUTER JOIN currencies as c
			ON f.currency=c.currency
			    AND f.year=c.year
			    AND f.reporting = c.reporting
		LEFT OUTER JOIN exchange_rates as rate
			ON c.modified_currency=rate.modified_currency
			    AND c.year=rate.year
		LEFT OUTER JOIN entity_names as r1
			 	ON r1.original_name=f.reporting COLLATE NOCASE
		LEFT OUTER JOIN entity_names as p1
			 	ON p1.original_name=f.partner COLLATE NOCASE
		LEFT OUTER JOIN RICentities as p2
			 	ON p2.RICname=p1.RICname COLLATE NOCASE
		LEFT OUTER JOIN RICentities as r2
			 	ON r2.RICname=r1.RICname COLLATE NOCASE
		LEFT OUTER JOIN expimp_spegen as eisg
			 	USING (export_import, special_general)
		LEFT OUTER JOIN sources as s
				ON s.slug=f.source
		WHERE expimp != "Re-exp"
			and partner is not null
			and partner_sum is null
			and s.type != "OUPS"
	""")

print "flow_joined created"
print "-------------------------------------------------------------------------"

# taking care of Total_type flag to define the world partner
# and ((`Total Trade Estimation` is null and partner != "World" )or(`Total Trade Estimation`=1 and partner = "World"))

# c.execute("""Select count(*) from flow_joined """)
# print list(c), "lines in flow_joined"

c.execute("""INSERT INTO RICentities (`RICname`,`type`,`continent`)
	VALUES ("World estimated","geographical_area","World")""")

print "World estimated added to RICentities"

c.execute("""INSERT INTO RICentities (`RICname`,`type`,`continent`)
	VALUES ("World as reported","geographical_area","World")""")

print "World as reported added to RICentities"

c.execute("""INSERT INTO RICentities (`RICname`,`type`,`continent`)
	VALUES ("World as reported2","geographical_area","World")""")

print "World as reported2 added to RICentities"

c.execute("""INSERT INTO RICentities (`RICname`,`type`,`continent`)
	VALUES ("World undefined","geographical_area","World")""")

print "World undefined added to RICentities"
print "-------------------------------------------------------------------------"

#
# Add World estimations to sq lite viz
# MAJ it's ADD during first iteration on flow

# c.execute("""UPDATE flow_joined SET partner="Worldestimated"
# 	WHERE partner="World" and world_trade_type="total_estimated" """)
# print "Worldestimated added to flow_joind"

# c.execute("""UPDATE flow_joined SET partner="Worldasreported"
# 	WHERE partner="World" and world_trade_type="total_reporting1" """)
# print "Worldasreported added to flow_joind"

# c.execute("""UPDATE flow_joined SET partner="Worldasreported2"
# 	WHERE partner="World" and world_trade_type="total_reporting2" """)
# print "Worldasreported2 added to flow_joind"

# c.execute("""UPDATE flow_joined SET partner="Worldundefined"
# 	WHERE partner="World" and world_trade_type is null """)
# print "Worldundefined added to flow_joind"
print "-------------------------------------------------------------------------"
################################################################################
# merge duplicates from land and sea
################################################################################

c.execute("""SELECT count(*) as nb,group_concat(`flow`,'|'),group_concat(ID,'|'),
	group_concat(transport_type,'|')
	FROM `flow_joined`
	WHERE transport_type is not null
	GROUP BY year,expimp,reporting,partner HAVING count(*)>1
	""")
sub_c=conn.cursor()
rows_grouped=0
for n,flows,ids,land_seas in c :
	if n==2:
		land_sea=", ".join(set(land_seas.split("|")))
		if len(set(land_seas.split("|")))>1:
			# if notes :
			# 	notes=", ".join(set(notes.split("|")))
			sub_c.execute("""UPDATE `flow_joined` SET flow=%.1f,transport_type="%s"
				WHERE ID=%s"""%(sum(float(_) for _ in flows.split("|")),land_sea,ids.split("|")[0]))
			sub_c.execute("""DELETE FROM `flow_joined` WHERE ID=%s"""%ids.split("|")[1])
			rows_grouped+=2
if rows_grouped>0:
	print "removing %s land/seas duplicates by suming them"%rows_grouped
sub_c.close()

print "-------------------------------------------------------------------------"
# c.execute("""Select count(*) from flow_joined """)
# print list(c), "lines in flow_joined"
################################################################################
# remove 'valeurs officielles' when duplicates with 'Valeurs actuelles'
# for France between 1847 and 1856 both included
################################################################################

c.execute("""SELECT count(*) as nb,group_concat(notes,'|'),group_concat(ID,'|'),
	group_concat(Source,'|') as notes_group
	FROM `flow_joined`
	WHERE `reporting`="France"
		and year >= 1847 AND year <= 1856
		GROUP BY year,expimp,reporting,partner HAVING count(*)>1
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
# c.execute("""Select count(*) from flow_joined """)
# print list(c), "lines in flow_joined"
################################################################################
# remove "species and billions" remove species flows when exists
################################################################################

c.execute("""SELECT * from (SELECT count(*) as nb,
	group_concat(species_bullions,'|') as sb,group_concat(ID,'|'),
	reporting,partner
	FROM `flow_joined`
	GROUP BY year,expimp,reporting,partner HAVING count(*)>1)
	WHERE sb="S|NS"
	""")#
ids_to_remove=[]
rps=[]
for n,sb,ids,r,p in c :
	if n==2 :
		print sb
		i=sb.split("|").index("S")
		id=ids.split("|")[i]
		ids_to_remove.append(id)
		rps.append('"%s"'%"|".join((r,p)))
rps=set(rps)

if len(ids_to_remove)>0:
	print "removing %s flows S duplicated with NS for reporting|partner couples %s"%(len(ids_to_remove),",".join(rps))
	c.execute("DELETE FROM flow_joined WHERE id IN (%s)"%",".join(ids_to_remove))

print "-------------------------------------------------------------------------"
# c.execute("""Select count(*) from flow_joined """)
# print list(c), "lines in flow_joined"
################################################################################
# remove GEN flows when duplicates with SPE flows
################################################################################

c.execute("""SELECT count(*) as nb,group_concat(spegen,'|'),
	group_concat(species_bullions,'|') as sb,group_concat(ID,'|'),
	reporting,partner,year,expimp,group_concat(flow,'|')
	FROM `flow_joined`
	GROUP BY year,`expimp`,`reporting`,`partner` HAVING count(*)>1
	""")
lines=c.fetchall()
ids_to_remove={}
for n,spe_gens,sb,ids,reporting,partner,year,e_i,f in lines :
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
		print ("duplicate found :%s flows for %s,%s,%s,%s,%s,%s"%(n,year,reporting,
			partner,e_i,spe_gens,sb)).encode("utf8")
print "-------------------------------------------------------------------------"
# c.execute("""Select count(*) from flow_joined """)
# print list(c), "lines in flow_joined"
if ids_to_remove:
	for r,ids in ids_to_remove.iteritems():
		print ("removing %s Gen or Species duplicates for %s"%(r,len(ids))).encode("utf8")
		c.execute("DELETE FROM flow_joined WHERE id IN (%s)"%",".join(ids))

print "-------------------------------------------------------------------------"
# c.execute("""Select count(*) from flow_joined """)
# print list(c), "lines in flow_joined"

################################################################################
##			Create the partner World as sum of partners
################################################################################
c.execute("""INSERT INTO RICentities (`RICname`,`type`,`continent`)
	VALUES ("World sum partners","geographical_area","World")""")

print "World sum partners added to RICentities"

c.execute("""INSERT INTO flow_joined (flow, unit, reporting, reporting_slug, year, expimp, currency, partner, partner_slug, rate, source)
			SELECT sum(flow*unit) as flow,
				1 as unit,
				reporting,
				reporting_slug,
				year,
				expimp,
				currency,
				'World sum partners' as partner,
				'Worldsumpartners' as partner_slug,
				rate,
				source
				from flow_joined
			WHERE partner not like 'World%'
			group by reporting,expimp,year """)

print "World sum partners added to flow_joined"
print "-------------------------------------------------------------------------"
# c.execute("""Select count(*) from flow_joined """)
# print list(c), "lines in flow_joined"
# ################################################################################
# ##			Create the partner World as best guess
# ################################################################################
c.execute("""INSERT INTO RICentities (`RICname`,`type`,`continent`)
	VALUES ("World best guess","geographical_area","World")""")

print "World as best guess added to RICentities"
print "-------------------------------------------------------------------------"


c.execute("""SELECT year, expimp, partner, reporting, partner_slug, reporting_slug, flow,
	unit,currency,rate,source
	from flow_joined
	WHERE partner LIKE "World%"  """)
data=list(c)
data.sort(key=lambda _:(_[3],_[0],_[1]))
i = 0
world_best_guess_added = 0
for g,d in itertools.groupby(data,lambda _:(_[3],_[0],_[1])):
	dd=list(d)

	world_best_guess=[sd for sd in dd if sd[4]==u"Worldestimated"]
	if len(world_best_guess)==0:
		world_best_guess=[sd for sd in dd if sd[4]==u"Worldasreported"]
	if len(world_best_guess)==0:
		world_best_guess=[sd for sd in dd if sd[4]==u"Worldsumpartners"]
	if len(world_best_guess)==0:
		print g
		print dd
		print i, "ARG no best guess world flow found ?"
		i += 1
	else:
		world_best_guess=list(world_best_guess[0])
		world_best_guess[2]=u"World_best_guess"
		world_best_guess[4]=u"Worldbestguess"
		c.execute("""INSERT INTO flow_joined (year,expimp,partner,reporting, partner_slug, reporting_slug, flow, unit,currency,rate,source)
		VALUES (?,?,?,?,?,?,?,?,?,?,?)""",world_best_guess)
		world_best_guess_added += 1

print "World best guess added to flow_joined", world_best_guess_added
print "-------------------------------------------------------------------------"

conn.commit()
