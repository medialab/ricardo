# python script ask new sqlite for country sources by period
# coding=utf8
import subprocess
import sqlite3
import os
import json
import itertools
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


# Select all source in flows


c.execute("""SELECT RICname, sources.id as source, group_concat(distinct (year)) as years
			from flows
			left join entity_names on reporting = original_name COLLATE NOCASE
			left join sources on source = sources.id
			GROUP BY RICname, Source
			""")

def dateByReportingBySource(c): 
	""" Detect period in dates list """
	table = [list(r) for r in  c]

	#copy sql request result

	for row in table:

		dates = [int(d) for d in row[2].split(',')]

		periods=[dates[0]]

		for i_date,current_date in enumerate(dates):

			if i_date<len(dates)-1:
				next_date=dates[i_date+1]
				if current_date==next_date-1:
					pass
				else:
					periods[-1]="%s-%s"%(periods[-1],current_date) if periods[-1]!=current_date else str(current_date)
					periods.append(next_date)
					
			else:
				# fin 2 : fin de la liste
				periods[-1]="%s-%s"%(periods[-1],current_date) if periods[-1]!=current_date else str(current_date)


		row[2] =  ",".join(periods)
		if row[1] == None:
			row[1] = "champs vide"

	return table

writer = UnicodeWriter(open(os.path.join("out_data", 'report_by_sources_and_period.csv'), "wb"))
writer.writerow([description[0] for description in c.description])

data = dateByReportingBySource(c.fetchall())
for d in data:
	print d[2] 
writer.writerows(data)

