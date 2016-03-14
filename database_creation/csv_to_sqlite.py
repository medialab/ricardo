# coding=utf8
import subprocess
import sqlite3
import os
import json
import itertools
import csv
from csv_unicode import UnicodeReader
from csv_unicode import UnicodeWriter

if os.path.isfile('database_from_csv.db'):
    os.remove('database_from_csv.db')
    print 'Delete existing sqlite3'

print 'Create a new Database'
conn=sqlite3.connect('database_from_csv.db')
c=conn.cursor()
print "Database created and opened succesfully"
print "-------------------------------------------------------------------------"
print "-------------------------------------------------------------------------"

with open('new_RICardo_visualisation_schema.sql',"r") as new_schema:
  c.executescript(new_schema.read())
print "Schema of the new data base inserted"
print "-------------------------------------------------------------------------"

# INSERT SOURCE
print "Create sources"
c.execute(""" DROP TABLE IF EXISTS sources;""")
c.execute("""
  CREATE TABLE IF NOT EXISTS sources (id,source_name,shelf_number,volume,pages,URL,dates,notes,country)""")

reader = csv.reader(open('./out_data/sources.csv', 'r'), delimiter=',')
rows = list(reader)
for row in rows:
    if (len(row) == 9):
        # out of range because sometimes there is no value in row
        to_db = [unicode(row[0], "utf8"), unicode(row[1], "utf8"), unicode(row[2], "utf8"),
        unicode(row[3], "utf8"), unicode(row[4], "utf8"), unicode(row[5], "utf8"),
        unicode(row[6], "utf8"), unicode(row[7], "utf8"), unicode(row[8], "utf8")]
        c.execute("""INSERT INTO sources (id,source_name,shelf_number,volume,pages,URL,dates,notes,country)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", to_db)
    else:
        print len(row)
print "sources created"
print "-------------------------------------------------------------------------"

print "Create exchange_rates"
c.execute(""" DROP TABLE IF EXISTS exchange_rates;""")
c.execute("""
  CREATE TABLE IF NOT EXISTS exchange_rates (year,modified_currency,rate_to_pounds,source)""")

reader = csv.reader(open('./out_data/exchange_rates.csv', 'r'), delimiter=',')
rows = list(reader)
for row in rows:
    if (len(row) == 4):
        # out of range because sometimes there is no value in row
        to_db = [unicode(row[0], "utf8"), unicode(row[1], "utf8"), unicode(row[2], "utf8"),
        unicode(row[3], "utf8")]
        c.execute("""INSERT INTO exchange_rates (year,modified_currency,rate_to_pounds,source)
            VALUES (?, ?, ?, ?)""", to_db)
    else:
        print len(row)
print "exchange_rates created"
print "-------------------------------------------------------------------------"

print "Create currencies"
c.execute(""" DROP TABLE IF EXISTS currencies;""")
c.execute("""
  CREATE TABLE IF NOT EXISTS currencies (currency,year,reporting,modified_currency)""")

reader = csv.reader(open('./out_data/currencies.csv', 'r'), delimiter=',')
rows = list(reader)
for row in rows:
    if (len(row) == 4):
        # out of range because sometimes there is no value in row
        to_db = [unicode(row[0], "utf8"), unicode(row[1], "utf8"), unicode(row[2], "utf8"),
        unicode(row[3], "utf8")]
        c.execute("""INSERT INTO currencies (currency,year,reporting,modified_currency)
            VALUES (?, ?, ?, ?)""", to_db)
    else:
        print len(row)
print "currencies created"
print "-------------------------------------------------------------------------"

print "Create expimp_spegen"
c.execute(""" DROP TABLE IF EXISTS expimp_spegen;""")
c.execute("""
  CREATE TABLE IF NOT EXISTS expimp_spegen (export_import,special_general,
  modified_export_import,modified_special_general)""")

reader = csv.reader(open('./out_data/expimp_spegen.csv', 'r'), delimiter=',')
rows = list(reader)
for row in rows:
    if (len(row) == 4):
        # out of range because sometimes there is no value in row
        to_db = [unicode(row[0], "utf8"), unicode(row[1], "utf8"), unicode(row[2], "utf8"),
        unicode(row[3], "utf8")]
        c.execute("""INSERT INTO expimp_spegen (export_import,special_general,
            modified_export_import,modified_special_general)
            VALUES (?, ?, ?, ?)""", to_db)
    else:
        print len(row)
print "expimp_spegen created"
print "-------------------------------------------------------------------------"

print "Create RICentities"
c.execute(""" DROP TABLE IF EXISTS RICentities;""")
c.execute("""
    CREATE TABLE IF NOT EXISTS RICentities (RICname, type, continent, COW_code, slug)
    """)
reader = csv.reader(open('./out_data/RICentities.csv', 'r'), delimiter=',')
rows = list(reader)
for row in rows[1:]:
    if (len(row) == 5):
        to_db = [ unicode(row[0], "utf8"), unicode(row[1], "utf8"), unicode(row[2], "utf8"),
        unicode(row[3], "utf8") , unicode(row[4], "utf8")]
        c.execute("""INSERT INTO RICentities (RICname, type, continent, COW_code, slug)
            VALUES (?, ?, ?, ?, ?)""", to_db)
    else:
        print len(row)
print "RICentities created"
print "-------------------------------------------------------------------------"

print "Create entity_names"
c.execute("""
    CREATE TABLE IF NOT EXISTS entity_names (original_name, french_name, RICname)
    """)
reader = csv.reader(open('./out_data/entity_names.csv', 'r'), delimiter=',')
rows = list(reader)
for row in rows[1:]:
    if (len(row) == 3):
        to_db = [ unicode(row[0], "utf8"), unicode(row[1], "utf8"), unicode(row[2], "utf8") ]
        c.execute("""INSERT INTO entity_names (original_name, french_name, RICname)
            VALUES (?, ?, ?)""", to_db)
    else:
        print len(row)
print "entity_names created"
print "-------------------------------------------------------------------------"

print "Create RICentities_groups"
c.execute(""" DROP TABLE IF EXISTS RICentities_groups;""")
c.execute("""
    CREATE TABLE IF NOT EXISTS RICentities_groups (id, RICname_group, RICname_part)
    """)
reader = csv.reader(open('./out_data/RICentities_groups.csv', 'r'), delimiter=',')
rows = list(reader)
for row in rows[1:]:
    if (len(row) == 3):
        to_db = [ unicode(row[0], "utf8"), unicode(row[1], "utf8"), unicode(row[2], "utf8") ]
        c.execute("""INSERT INTO RICentities_groups (id, RICname_group, RICname_part)
            VALUES (?, ?, ?)""", to_db)
    else:
        print len(row)
print "RICentities_groups created"
print "-------------------------------------------------------------------------"

print "Create flows"
c.execute(""" DROP TABLE IF EXISTS flows;""")
c.execute("""
  CREATE TABLE IF NOT EXISTS flows (id,source,pages,notes,flow,unit,currency,year,
  reporting, partner, export_import, special_general, species_bullions, transport_type,
  statistical_period, partner_sum, world_trade_type)""")

reader = csv.reader(open('./out_data/flows.csv', 'r'), delimiter=',')
rows = list(reader)
for row in rows:
    if (len(row) == 17):
        # out of range because sometimes there is no value in row
        to_db = [unicode(row[0], "utf8"), unicode(row[1], "utf8"), unicode(row[2], "utf8"),
        unicode(row[3], "utf8"), unicode(row[4], "utf8"), unicode(row[5], "utf8"),
        unicode(row[6], "utf8"), unicode(row[7], "utf8"), unicode(row[8], "utf8"),
        unicode(row[9], "utf8"), unicode(row[10], "utf8"), unicode(row[11], "utf8"),
        unicode(row[12], "utf8"), unicode(row[13], "utf8"), unicode(row[14], "utf8"),
        unicode(row[15], "utf8"), unicode(row[16], "utf8")]
        c.execute("""INSERT INTO flows (id,source,pages,notes,flow,unit,currency,year,
            reporting, partner, export_import, special_general, species_bullions,
            transport_type, statistical_period, partner_sum, world_trade_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", to_db)
    else:
        print len(row)
print "flows created"
print "-------------------------------------------------------------------------"

conn.commit()
c.close()
conn.close()