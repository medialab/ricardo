import utils
import sqlite3
import os

def test():
	test_sqlite_filename="out_data/RICardo.sqlite"

	conn=sqlite3.connect(test_sqlite_filename)
	c=conn.cursor()
	c.execute("""select name from sqlite_master where type='table' and name!="sqlite_sequence" """)
	sc=conn.cursor()
	tables={}
	for t in c : 
		t=t[0]
		sc.execute("""select count(*) from `%s`"""%t)
		tables[t]=sc.next()[0]
	
	if not os.path.exists("out_data/test_csvs"):
		os.makedirs("out_data/test_csvs")
	utils.sqlitedatabase2csv(test_sqlite_filename,"out_data/test_csvs")

	if os.path.exists("test.sqlite"):
		os.remove("test.sqlite")
	utils.csv2sqlite("out_data/test_csvs/*.csv","test.sqlite","RICardo_schema.sql")


	conn=sqlite3.connect("test.sqlite")
	c=conn.cursor()
	c.execute("""select name from sqlite_master where type='table' and name!="sqlite_sequence" """)
	sc=conn.cursor()

	test_passed=True
	for t in c :
		t=t[0]
		sc.execute("""select count(*) from `%s`"""%t)
		table_test_result="ok"
		nb_rows=sc.next()[0]
		if t not in tables or tables[t]!=nb_rows:
			table_test_result="failed"
			test_passed=False
		print "test %s for table %s, exported/imported %s/%s rows"%(table_test_result,t,tables[t],nb_rows)
		os.remove("out_data/test_csvs/%s.csv"%t)
	os.remove("test.sqlite")
	os.rmdir("out_data/test_csvs/")
	return test_passed

if test():
	print "test utils OK"
else:
	print "test utils WRONG"