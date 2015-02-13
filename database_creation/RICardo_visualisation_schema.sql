--renamed flow
CREATE TABLE `RawData v1`
 (
	`ID`			INTEGER  PRIMARY KEY ASC, 
	`File Name`			TEXT, 
	`Original No`			REAL, 
	`Flow`			REAL, 
	`Unit`			INTEGER, 
	`Initial Currency`			TEXT, 
	`Exp / Imp`			TEXT, 
	`Spe/Gen/Tot`			TEXT, 
	`Yr`			INTEGER, 
	`Reporting Entity_Original Name`			TEXT, 
	`Partner Entity_Original Name`			TEXT, 
	`Partner Entity_Sum`			INTEGER, 
	`Total Trade Estimation`			INTEGER, 
	`Species and Bullions`			TEXT, 
	`Land/Sea`			TEXT, 
	`Statistical Period`			TEXT, 
	`Source`			TEXT, 
	`Source suite`			TEXT, 
	`Pages`			TEXT, 
	`Notes`			TEXT, 
	`Supplementary Notes`			TEXT,
	`Total_Type`			TEXT
);

-- renamed currency
CREATE TABLE `Currency Name v1`
 (
	`ID_Curr_Yr_RepEntity`			INTEGER  PRIMARY KEY ASC, 
	`Original Currency`			TEXT, 
	`Yr`			INTEGER, 
	`Reporting entity (Original name)`			TEXT, 
	`Modified Currency`			TEXT

);

--renamed rate
CREATE TABLE `Exchange Rate v1`
 (
	`ID_Curr_Yr`			INTEGER  PRIMARY KEY ASC, 
	`Modified Currency`			TEXT, 
	`Yr`			INTEGER, 
	`FX rate (NCU/£)`			REAL, 
	`Source Currency`			TEXT, 
	`Note Currency`			TEXT, 
	`Champ7`			TEXT
	
);

CREATE TABLE `Exp-Imp-Standard v1`
 (
	`ID_Exp_spe`			INTEGER  PRIMARY KEY ASC, 
	`Exp / Imp`			TEXT, 
	`Spe/Gen/Tot`			TEXT, 
	`Exp / Imp (standard)`			TEXT, 
	`Spe/Gen/Tot (standard)`			TEXT
	
);

-- renamed entity_names_cleaning
DROP TABLE IF EXISTS `Entity_Names v1`;
CREATE TABLE IF NOT EXISTS `Entity_Names v1`
 (
	`original_name`			TEXT PRIMARY KEY ASC, 
	`name`			TEXT,
	`RICname`		TEXT
);

DROP TABLE IF EXISTS `RICentities v1`;
CREATE TABLE IF NOT EXISTS `RICentities v1`
 (
	`id`			TEXT,
	`RICname`			TEXT UNIQUE, 
	`type`			TEXT, 
	`central_state`			TEXT,
	`continent`		TEXT,
	`COW_code` 		INTEGER
);


DROP TABLE IF EXISTS `RICentities_groups v1`;
CREATE TABLE IF NOT EXISTS `RICentities_groups v1`
 (
	`ID`			INTEGER, 
	`RICname_group`			TEXT,
	`RICname_part`			TEXT
);
