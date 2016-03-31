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

	cursor.execute("""SELECT slug FROM sources""")
	set_source = set(cursor)

	print "nb elem in source", len(set_source)
 
	missing_flow_source_list = set_flow - set_source

	writer = UnicodeWriter(open(os.path.join("../out_data", "missing_flow_source_list" + ".csv"), "wb"))
	writer.writerows(missing_flow_source_list)


	missing_ex_source_list = set_ex - set_source

	writer = UnicodeWriter(open(os.path.join("../out_data", "missing_ex_source_list" + ".csv"), "wb"))
	writer.writerows(missing_ex_source_list)

	
