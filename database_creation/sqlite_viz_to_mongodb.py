# coding=utf8
# Script to create a MongoDB database from flow_joined table in sqlite database of RICardo
# The MongoDB skip the serialisation from sql to json
import subprocess
import sqlite3
import os
import json
import itertools
import csv
from csv_unicode import UnicodeReader
from csv_unicode import UnicodeWriter
import pymongo

from pymongo import MongoClient
client = MongoClient()

# Connect to RICardo's mongodb 
client = MongoClient('localhost', 27017)
db = client['RICardo']

# Connect to RICardo's sqlite
conn=sqlite3.connect("out_data/RICardo_visualisation.sqlite")
c=conn.cursor()

# Get flow_joined table
c.execute("""SELECT * FROM flow_joined""")

# Get the table flow_joined
table = [list(r) for r in  c]

# Add the table to mongodb
flow_joined_nb = 0
for row in table:
	# Create the document
	flow = {
		"_id": row[0],
		"source": row[1],
		"flow": row[2],
		"year": row[3],
		"unit": row[4],
		"expimp": row[5],
		"rate": row[7],
		"currency": row[8],
		"reporting": row[9],
		"reporting_id": row[10],
		"partner": row[11],
		"partner_id": row[12],
		"reporting_type": row[13],
		"reporting_continent": row[14],
		"partner_type": row[15],
		"partner_continent": row[16]
	}

	flows = db.flows
	flow = flows.insert_one(flow)

conn.close()