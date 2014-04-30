# coding=utf8
import sqlite3
import codecs

conn=sqlite3.connect("RICardo_Basic_avril14b.sqlite")
c=conn.cursor()

c.execute("""DROP VIEW IF EXISTS flows_intra;""")
c.execute(""" CREATE VIEW IF NOT EXISTS flows_intra AS 
	 SELECT f.ID,f.Flow as flow,f.Unit as unit,
	 		`Modified Currency` as currency,`FX rate (NCU/£)` as rate_to_pounds,flow*unit/`FX rate (NCU/£)` as flow_total_rated,
	 		`Exp / Imp (standard)` as exp_imp, f.Yr,f.`Reporting Entity_Original Name` as reporting,f.`Partner Entity_Original Name` as partner,
	 		`Source` 
	 from flow as f
	 LEFT OUTER JOIN `Exp-Imp-Standard` USING (`Exp / Imp`,`Spe/Gen/Tot`)
	 LEFT OUTER JOIN currency as c
			ON f.`Initial Currency`=c.`Original Currency` 
			AND f.`Reporting Entity_Original Name`=c.`Reporting Entity (Original Name)`
			AND f.Yr=c.Yr
	 LEFT OUTER JOIN rate as r USING (Yr,`Modified Currency`)
	 WHERE 
	 	`Total Trade Estimation` is null 
	 	and flow is not null
	 	and `Partner Entity_Sum` is null
	""")

c.execute("""DROP VIEW IF EXISTS flows_world;""")
c.execute(""" CREATE VIEW IF NOT EXISTS flows_world AS 
	 SELECT f.ID,f.Flow as flow,f.Unit as unit,
	 		`Modified Currency` as currency,`FX rate (NCU/£)` as rate_to_pounds,flow*unit/`FX rate (NCU/£)` as flow_total_rated,
	 		`Exp / Imp (standard)` as exp_imp, f.Yr,f.`Reporting Entity_Original Name` as reporting,f.`Partner Entity_Original Name` as partner,
	 		`Source` 
	 from flow as f
	 LEFT OUTER JOIN `Exp-Imp-Standard` USING (`Exp / Imp`,`Spe/Gen/Tot`)
	 LEFT OUTER JOIN currency as c
			ON f.`Initial Currency`=c.`Original Currency` 
			AND f.`Reporting Entity_Original Name`=c.`Reporting Entity (Original Name)`
			AND f.Yr=c.Yr
	 LEFT OUTER JOIN rate as r USING (Yr,`Modified Currency`)
	 WHERE 
	 	`Total Trade Estimation` is not null 
	 	and flow is not null
	 	and `Partner Entity_Sum` is null
	""")
conn.commit()
c.execute("""SELECT sum(flow_total_rated),exp_imp
			 from flows_intra 
			 WHERE Yr>=1837 and Yr<=1887 and reporting='france' and (lower(partner) LIKE lower('Etats-unis') OR lower(partner) LIKE lower('Etats*unis*amerique')) 
			 GROUP BY exp_imp
			""")



for l in c:
	print l