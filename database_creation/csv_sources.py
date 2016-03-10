# python script to export data by source
# coding:utf8
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
nameProblem = []
nameStats = []
errors = []
newSource = 0
for i_source, row in enumerate(table):
    if i_source <len(table)-1:
        if row[0] == None:
            name = row[2].encode('utf8')
            nameProblem.append(name)
            current_source = row[2]
            next_source = table[i_source+1][2]
        else:
            current_source = row[0]
            next_source = table[i_source+1][0]
        if (current_source == next_source):
            newCSV.append(row);
        else:
        # csvTitle = unicode(current_source, 'utf-8')
            print newSource
            nameStats.append([current_source, len(newCSV)])
            csvTitle = unicodedata.normalize('NFD', current_source).encode('ascii', 'ignore')
            csvTitle = csvTitle.replace(" ", "_")
            if len(csvTitle) > 255:
                csvTitle = csvTitle[:200]
            try:
                writer = UnicodeWriter(open(os.path.join("./out_data/sources", csvTitle +'.csv'), "w"))
                writer.writerow([description[0] for description in c.description])
                writer.writerows(newCSV)
                newCSV = []
            except IOError as e:
                print "I/O error({0}): {1}".format(e.errno, e.strerror)
                elem = csvTitle.encode('utf8')
                errors.append(elem)
                pass


errorsNameFormat = open('./out_data/errors/errorsNameFormat.txt', 'w')
for item in errors:
    print>>errorsNameFormat, item
print "errorsNameFormat.txt done"

sourceNameErrors = open('./out_data/errors/sourceNameErrors.txt', 'w')
for item in set(nameProblem):
    print>>sourceNameErrors, item
print "sourceNameErrors.txt done"

writerStat = UnicodeWriter(open(os.path.join("./out_data/", 'nameStats' +'.csv'), "w"))
writerStat.writerow(['name', 'length'])
writerStat.writerows(nameStats)















