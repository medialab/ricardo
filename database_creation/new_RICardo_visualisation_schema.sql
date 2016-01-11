--sources
CREATE TABLE `sources`
(
	`ID`			INTEGER  PRIMARY KEY AUTOINCREMENT,
	`source_name`	TEXT,
	`shelf_number`	TEXT,
	`volume`		TEXT,
	`pages`			TEXT,
	`URL`			TEXT,
	`dates`			TEXT,
	`notes`			TEXT
);

CREATE TABLE `exchange_rates`
(
	`year`					INTEGER,
	`modified_currency`		TEXT,
	`rate_to_pounds`		REAL,
	`source`			 	INTEGER,
	FOREIGN KEY (year) 					REFERENCES currencies(ID),
	FOREIGN KEY (modified_currency) 	REFERENCES currencies(ID),
	FOREIGN KEY (source) 	REFERENCES sources(ID)
);
	-- PRIMARY KEY (`year`, `modified_currency`),

--currencies
CREATE TABLE `currencies`
(
	`currency`							TEXT,
	`year`								INTEGER,
	`reporting`							TEXT,
	`modified_currency`					TEXT,
	PRIMARY KEY (`currency`, `year`, `reporting`)
);
	-- FOREIGN KEY (year)					REFERENCES exchange_rates(year),
	-- FOREIGN KEY (modified_currency)		REFERENCES exchange_rates(modified_currency)

CREATE TABLE `expimp_spegen`
(
	`export_import`				REAL,
	`special_general`			REAL,
	`modified_export_import`	REAL,
	`modified_special_general`	REAL,
	PRIMARY KEY (`export_import`, `special_general`)
);


CREATE TABLE `RICentities`
(
	`RICname`			TEXT PRIMARY KEY,
	`type`				TEXT,
	`continent`			TEXT,
	`COW_code` 			INTEGER,
	`slug`				TEXT
);

--territorial entities
CREATE TABLE `entity_names`
(
	`original_name`			TEXT PRIMARY KEY,
	`french_name`			TEXT,
	`RICname`				TEXT,
	FOREIGN KEY (RICname) 	REFERENCES RICentities(RICname)
);

CREATE TABLE `RICentities_groups`
(
	`ID`						INTEGER PRIMARY KEY AUTOINCREMENT, 
	`RICname_group`				TEXT,
	`RICname_part`				TEXT,
	FOREIGN KEY (RICname_part) 	REFERENCES RICentities(RICname),
	FOREIGN KEY (RICname_group) REFERENCES RICentities(RICname)
);

--flows data
CREATE TABLE `flows`
(
	`ID`							INTEGER  PRIMARY KEY AUTOINCREMENT, 
	`source`		 				INTEGER,
	`pages`							TEXT, 
	`notes`							TEXT, 
	`flow`							REAL,
	`unit`							INTEGER, 
	`currency`						TEXT, 
	`year`							INTEGER,
	`reporting`						TEXT,
	`partner`						TEXT,	 
	`export_import`					TEXT, 
	`special_general`				TEXT, 
	`species_bullions`				TEXT, 
	`transport_type`				TEXT, 
	`statistical_period`			TEXT, 
	`partner_sum`					TEXT, 
	`world_trade_type`				TEXT,
	FOREIGN KEY (source) 			REFERENCES sources(ID),
	FOREIGN KEY (reporting) 		REFERENCES entity_names(original_name),
	FOREIGN KEY (partner) 			REFERENCES entity_names(original_name),
	FOREIGN KEY (currency) 			REFERENCES currencies(currency),
	FOREIGN KEY (year) 				REFERENCES currencies(year),
	FOREIGN KEY (reporting) 		REFERENCES currencies(reporting),
	FOREIGN KEY (export_import)		REFERENCES expimp_spegen(export_import),
	FOREIGN KEY (special_general)	REFERENCES expimp_spegen(special_general)
);