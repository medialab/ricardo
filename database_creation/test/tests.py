# coding=utf8
import subprocess
import sqlite3
import os
import json


try :
	conf=json.load(open(os.path.join("..","config.json"),"r"))
except :
	print "couldn't load config.json database"
	exit(1)

mdb_sqlite_filename=os.path.join("..","out_data",conf["sqlite_filename"])

conn=sqlite3.connect(mdb_sqlite_filename)
cursor=conn.cursor()

import RICnames
RICnames_status="OK" if RICnames.test(cursor) else "FAILED"
print "CURRENCY TEST : %s"%RICnames_status
import expimp
import currency
currency_status="OK" if currency.test(cursor) else "FAILED"
print "CURRENCY TEST : %s"%currency_status
import expimp
expimp_status="OK" if expimp.test(cursor) else "FAILED"
print "EXP IMP TEST : %s"%expimp_status
import flow
flow_status="OK" if flow.test(cursor) else "FAILED"
print "FLOW TAST : %s"%flow_status

# c.execute("""SELECT  `Reporting Entity_Original Name`
# 	FROM flow
# 	LEFT OUTER JOIN entity_names_cleaning ON `Reporting Entity_Original Name`=original_name COLLATE NOCASE
# 	WHERE RICname is Null
# 	group by `Reporting Entity_Original Name`
# 	""")
# r=list(c)
# print "nb of missing RICname %s in reporting"%len(r)
# if len(r)<100:
# 	for l in r:
# 		print (",".join(l)).encode("UTF8")

# c.execute("""SELECT count(*),trim(`Partner Entity_Original Name`)
# 	FROM flow 
# 	LEFT OUTER JOIN entity_names_cleaning ON trim(`Partner Entity_Original Name`) = original_name COLLATE NOCASE
# 	WHERE RICname is Null
# 	group by trim(`Partner Entity_Original Name`)
# 	""")
# r=list(c)
# print "nb of missing RICname %s in partners"%len(r)
# if len(r)<100:
# 	for l in r:
# 		print ("%s,'%s'"%l).encode("UTF8")


# # tests 
# 	c.execute("""SELECT original_name,name,RICname,type,central_state,continent,RICname_part
# 		FROM entity_names_cleaning 
# 		LEFT OUTER JOIN RICentities USING (RICname)
# 	    LEFT OUTER JOIN RICentities_groups ON RICname = RICname_group
# 		WHERE original_name='Azores, Madeira, and Cap de Verde Islands' OR original_name like 'British Possessions in America'""")
# 	for l in c:
# 		print l