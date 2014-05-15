CREATE TABLE `RawData V4`
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
	`Supplementary Notes`			TEXT
);

CREATE TABLE `Currency Name V4`
 (
	`ID_Curr_Yr_RepEntity`			INTEGER  PRIMARY KEY ASC, 
	`Original Currency`			TEXT, 
	`Yr`			INTEGER, 
	`Reporting entity (Original name)`			TEXT, 
	`Modified Currency`			TEXT

);
	
CREATE TABLE `Exchange Rate V4`
 (
	`ID_Curr_Yr`			INTEGER  PRIMARY KEY ASC, 
	`Modified Currency`			TEXT, 
	`Yr`			INTEGER, 
	`FX rate (NCU/£)`			REAL, 
	`Source Currency`			TEXT, 
	`Note Currency`			TEXT, 
	`Champ7`			TEXT
	
);

CREATE TABLE `Exp-Imp-Standard`
 (
	`ID_Exp_spe`			INTEGER  PRIMARY KEY ASC, 
	`Exp / Imp`			TEXT, 
	`Spe/Gen/Tot`			TEXT, 
	`Exp / Imp (standard)`			TEXT, 
	`Spe/Gen/Tot (standard)`			TEXT
	
);

DROP TABLE IF EXISTS `entity_names_cleaning`;
CREATE TABLE IF NOT EXISTS `entity_names_cleaning`
 (
	`original_name`			TEXT PRIMARY KEY ASC, 
	`name`			TEXT,
	`RICname`		TEXT
);

DROP TABLE IF EXISTS `RICentities`;
CREATE TABLE IF NOT EXISTS `RICentities`
 (
	`id`			INTEGER PRIMARY KEY,
	`RICname`			TEXT UNIQUE, 
	`type`			TEXT, 
	`central_state`			TEXT,
	`continent`		TEXT,
	`COW_code` 		INTEGER
);

DROP TABLE IF EXISTS `RICentities_groups`;
CREATE TABLE IF NOT EXISTS `RICentities_groups`
 (
	`RICname_group`			TEXT,
	`RICname_part`			TEXT
);