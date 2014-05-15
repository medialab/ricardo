# coding=utf8
import codecs
import os
from csv_unicode import UnicodeReader
import sqlite3


def import_in_sqlite(conn, conf):
	c=conn.cursor()
	modified_names_table1=[]
	with open(os.path.join("in_data",conf["name_cleaning_csv"]),"r") as entity_names_cleaning_csv:
		reader=UnicodeReader(entity_names_cleaning_csv)
		reader.next()
		for row in reader:
			c.execute("INSERT INTO entity_names_cleaning VALUES (?,?,Null)",(row[1].strip(),row[2].strip()))#.lower() on row[1]
			modified_names_table1.append(row[2].strip())

	with open(os.path.join("in_data",conf["RICnames_csv"]),"r") as entity_RICnames_csv:
		reader=UnicodeReader(entity_RICnames_csv)
		reader.next()
		RICnames_groups_temp={}
		RICnames_groups_nb={}
		originalname_RICnames={}
		RICnames_in_flow=[]
		RICnames_groups_metadata={}
		for row in reader:
			if row[1]!="" and int(row[1])>1:
				
				if row[0] in RICnames_groups_temp.keys():
					RICnames_groups_temp[row[0].strip()].append(row[3].strip())
				else:
					RICnames_groups_temp[row[0].strip()]=[row[3].strip()]
					RICnames_groups_nb[row[0].strip()]=int(row[1])
				
			else:
				originalname_RICnames[row[0].strip()]={"RICname":row[3].strip()}
				RICnames_in_flow.append(row[3].strip())
		
		RICnames_groups={}
		for k,v in RICnames_groups_temp.iteritems():
			if(RICnames_groups_nb[k]!=len(v)):
			 	print ("ERROR with %s %s"%(k,v)).encode("UTF8")
			RICnames_groups[k]=" & ".join(v)
			RICnames_groups_metadata[" & ".join(v)]={"type":"group","RICname_parts":v,"central_state":None,"continent":"World","COW_code":None}

	# for k,v in RICnames_groups.iteritems():
	# 	print ("%s : %s (%s)"%(k,v["RICname"],v["type"])).encode("UTF8")

	RICnames_metadata={}
	with open(os.path.join("in_data",conf["RICnames_aggregation_csv"]),"r") as entity_RICnames_agg_csv:
		reader=UnicodeReader(entity_RICnames_agg_csv)
		reader.next()
		for row in reader:
			if row[0] not in RICnames_metadata:
				try:
					COW_code=int(row[1].strip())
				except:
					COW_code=None
				RICnames_metadata[row[0].strip()]={"type":row[2].strip(),"central_state":row[3].strip(),"continent":row[4].strip(),"COW_code":COW_code}
			else:
				print "Duplicate RICname : %s"%(row[0])

	# check RICname join table 1 table 2
	modifiednames_table1_notin_table2=set(_ for _ in modified_names_table1 if _ not in RICnames_groups.keys()) - set(originalname_RICnames.keys())
	print "%s modified names in table 1 : %s missing in table 2"%(len(set(modified_names_table1)),len(modifiednames_table1_notin_table2))
	print modifiednames_table1_notin_table2

	# check RICname join table 2 table 3
	RICname_in_table2=set(_["RICname"] for k,_ in originalname_RICnames.iteritems())
	RICname_table1_notin_table3 = RICname_in_table2 - set(RICnames_metadata.keys())
	print "%s ricname in table 2 : %s missing in table 3"%(len(RICname_in_table2),len(RICname_table1_notin_table3))
	print [m_n for m_n,meta in originalname_RICnames.iteritems() if meta["RICname"] in RICname_table1_notin_table3]

	# add group RICname to RICnames_metadata
	for RICnames_group,meta in RICnames_groups_metadata.iteritems():
		RICnames_metadata[RICnames_group]=meta

	# add RICnames to 'entity_names_cleaning'
	for modified_name,_ in originalname_RICnames.iteritems():
		c.execute("UPDATE entity_names_cleaning SET RICname=? WHERE name=?",(_["RICname"],modified_name))
	for modified_name,RICname in RICnames_groups.iteritems():
		c.execute("UPDATE entity_names_cleaning SET RICname=? WHERE name=?",(RICname,modified_name))

	# populate Ricentities table
	for RICname,meta in RICnames_metadata.iteritems():
		c.execute("INSERT INTO RICentities VALUES(null,?,?,?,?,?)",(RICname,meta["type"].lower().replace(" ","_"),meta["central_state"],meta["continent"],meta["COW_code"]))

	# populate Ricentities_groups table
	for RICname_group,d in RICnames_groups_metadata.iteritems():
		for ric in d["RICname_parts"]:
			c.execute("INSERT INTO RICentities_groups VALUES(?,?)",(RICname_group,ric))

	conn.commit()
	return True


