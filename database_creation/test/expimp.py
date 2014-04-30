# coding=utf8


def test(cursor):
	cursor.execute("""  SELECT flow.*, `Exp / Imp (standard)`, `Spe/Gen/Tot (standard)` 
					  	from flow 
					  	LEFT OUTER JOIN `Exp-Imp-Standard` USING (`Exp / Imp`,`Spe/Gen/Tot`)
					  	WHERE `Spe/Gen/Tot (standard)` is null AND `Exp / Imp (standard)` is null				  	
					  """)
						
	missings_expimp=cursor.fetchall()
	print "missing expimp spe/gen in standards :%s"%len(missings_expimp)
	if len(missings_expimp)==0:
		return True
	else:
		for t in missings_expimp:
			print t