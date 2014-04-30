# coding=utf8
import sqlite3
import codecs
import os

def test(cursor):
	#
	cursor.execute("""SELECT Yr,`Initial Currency`,`Reporting Entity_Original Name` 
						from flow 
						GROUP BY Yr,`Initial Currency`,`Reporting Entity_Original Name`""")

	initial_currency_years=[]
	for y,c,r in cursor:
	 	#print str(int(y))+" "+c.encode("UTF8")
	 	initial_currency_years.append((y,c.lower().strip(),r.lower().strip()))
	print "total number of currencies in flow %s"%len(initial_currency_years)

	cursor.execute("""SELECT c.Yr,c.`Original Currency`, c.`Modified Currency`,c.`Reporting entity (Original name)`
					from currency c GROUP BY c.Yr,c.`Original Currency`,c.`Reporting entity (Original name)`
						""")
	modified_currency={}
	for y,i_c,m_c,r in cursor:
		modified_currency[(y,i_c.lower().strip(),r.lower().strip())]=(m_c.lower().strip())

	#LEFT JOIN rate r USING (Yr,`Modified Currency`)
	print "check number before/after set currency : %s/%s"%(len(initial_currency_years),len(set(initial_currency_years)))
	print "check number before/after set modified_currency : %s/%s"%(len(modified_currency.keys()),len(set(modified_currency.keys())))

	incurrencynotinflow=set(modified_currency.keys())-set(initial_currency_years)
	print "in currency not in flow %s"%len(incurrencynotinflow)
	inflownotincurrency=set(initial_currency_years)-set(modified_currency.keys())
	print "in flow not in currency %s"%len(inflownotincurrency)
	inflowincurrency=set(initial_currency_years)&set(modified_currency.keys())
	print "in flow and in currency %s"%len(inflowincurrency)
	if len(inflownotincurrency):
		with codecs.open(os.path.join("..","out_data","missings_rates.csv"),"w",encoding="UTF8") as csv_f:
		 	csv_f.write('"year","Initial Currency","Reporting Entity_Original"\n')
		 	for t in inflownotincurrency:
		 		csv_f.write("%s,%s,%s\n"%t)

	cursor.execute("""SELECT r.Yr,r.`Modified Currency`,r.`FX rate (NCU/£)` from rate as r  where  `FX rate (NCU/£)` is not null""")

	rates={}
	for y,m_c,r in cursor:
		rates[(y,m_c.lower().strip())]=r

	inflowincurrency_rate=[]
	unknown_rates=[]
	for y,m_c,i_c,r in ((y,modified_currency[(y,i_c,r)],i_c,r) for (y,i_c,r) in inflowincurrency):
		try:
			inflowincurrency_rate.append((y,i_c,r,m_c,rates[(y,m_c)]))
		except:
			unknown_rates.append((y,m_c))

	print "in flow in currency not in rate %s"%len(unknown_rates)
	print "total known currencies in flow %s"%len(inflowincurrency_rate)

	
	#check twice
	cursor.execute("""SELECT count(*),"Modified Currency",Yr
						FROM
						(SELECT *
						from flow as f
						LEFT OUTER JOIN currency as c
						ON f.`Initial Currency`=c.`Original Currency` 
						   AND f.`Reporting Entity_Original Name`=c.`Reporting Entity (Original Name)`
						   AND f.Yr=c.Yr
						LEFT OUTER JOIN rate as r USING (Yr,`Modified Currency`)
						WHERE `FX rate (NCU/£)` is null
						)
						WHERE `FX rate (NCU/£)` is null
						
						
						GROUP BY "Modified Currency",Yr
					""")
	
	if len(list(cursor))==len(unknown_rates):
		with codecs.open(os.path.join("..","out_data","missings_rates.csv"),"w",encoding="UTF8") as csv_f:
		 	csv_f.write('"year","Modified Currency"\n')
		 	for t in unknown_rates:
		 		csv_f.write("%s,%s\n"%t)
		print "missign rates exported in out_data"
		return True
	else:
		print "test verification with alternative method failed !"
		return False 
