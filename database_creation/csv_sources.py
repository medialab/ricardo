# python script to export data by source
# coding=utf8
import subprocess
import sqlite3
import os
import json
import itertools
import unicodedata
#import csv
import csvkit
from csv_unicode import UnicodeReader
from csv_unicode import UnicodeWriter

try :
	conf=json.load(open("config.json","r"))
except :
	print "couldn't load config.json database"
	exit(1)

mdb_sqlite_filename=os.path.join("out_data",conf["sqlite_filename"])
conn=sqlite3.connect(mdb_sqlite_filename)
c=conn.cursor()

c.execute(""" SELECT sources.source_name as source_name, *
				From flows
				left join sources on source = sources.id
				order by source
			""")

table = [list(r) for r in  c]

newCSV = []
i = 0
for i_source, row in enumerate(table):
	if row[0] == None:
		# print i, " - ", row[1], " - ", row[2]
		# i += 1
		current_source = row[2]
		next_source = table[i_source+1][2]
	else:
		current_source = row[0]
		next_source = table[i_source+1][0]
	if (current_source == next_source):
		newCSV.append(row);
	else:
	# csvTitle = unicode(current_source, 'utf-8')
		csvTitle = unicodedata.normalize('NFD', current_source).encode('ascii', 'ignore')
		csvTitle = csvTitle.replace(" ", "_")
		writer = UnicodeWriter(open(os.path.join("out_data/sources", csvTitle +'.csv'), "wb"))
		writer.writerow([description[0] for description in c.description])
		writer.writerows(newCSV)
		newCSV = []


