# coding=utf8
import sqlite3
import codecs
import os
import csv
import imp
csv_unicode = imp.load_source('csv_unicode', '../csv_unicode.py')
from csv_unicode import UnicodeReader
from csv_unicode import UnicodeWriter

def test(cursor):
	cursor.execute("""SELECT distinct(source) FROM flows""")
	set_flow= set(cursor)
	print "distinct source in flow", len(set_flow) 

	cursor.execute("""SELECT distinct(source) FROM exchange_rates""")
	set_ex = set(cursor)
	print "distinct source in exchange_rates", len(set_ex)

	cursor.execute("""SELECT distinct(slug) FROM sources""")
	set_source = set(cursor)

	print "nb elem in source", len(set_source)
 
	missing_flow_source_list = set_flow - set_source
	print "nb elem in missing_flow_source_list", len(missing_flow_source_list)

	writer = UnicodeWriter(open(os.path.join("../out_data/logs", "missing_flow_source_list" + ".csv"), "wb"))
	writer.writerows(missing_flow_source_list)

	missing_ex_source_list = set_ex - set_source
	print "nb elem in missing_ex_source_list", len(missing_ex_source_list)
	writer = UnicodeWriter(open(os.path.join("../out_data/logs", "missing_ex_source_list" + ".csv"), "wb"))
	writer.writerows(missing_ex_source_list)
	
	missing_flow_source_list_id =[]
	flow_matching = 0
	for row in missing_flow_source_list:
		cursor.execute("""SELECT * FROM flows where source=?""",[row[0]])
		table = [list(r) for r in cursor]
		flow_matching+=1
		for row in table:
			missing_flow_source_list_id.append(row)
	unique_flow = []
	for r in missing_flow_source_list_id:
		if r not in unique_flow:
			unique_flow.append(r)

	writer = UnicodeWriter(open(os.path.join("../out_data/logs", "missing_flow_source_list_id" + ".csv"), "wb"))
	writer.writerows(unique_flow)

	missing_ex_source_list_id =[]
	ex_matching = 0
	for row in missing_ex_source_list:
		cursor.execute("""SELECT * FROM exchange_rates where source=?""",[row[0]])
		table = [list(r) for r in cursor]
		ex_matching+=1
		for row in table:
			missing_ex_source_list_id.append(row)
	unique_ex = []
	for r in missing_ex_source_list_id:
		if r not in unique_ex:
			unique_ex.append(r)

	writer = UnicodeWriter(open(os.path.join("../out_data/logs", "missing_ex_source_list_id" + ".csv"), "wb"))
	writer.writerows(unique_ex)

	
