# Dependencies
```
mdbtools version >= 0.7.1
sqlite3
```

## Install on mac os x
```
brew install mdbtools
```

# Usage
```
* put the access database in the folder in_data
* python mdb_to_sqlite.py
* => output sqlite in the folder out_data
```

# Scripts to export csv files
* mdb_to_sqlite.py creates a csv file by database table
* csv_sources.py creates a csv file by source
* countries_by_sources_&_period.py creates a csv file as file title describe

# Tests
The tests check data integrity and delete duplicates information

# Tools
* csv_unicode.py to facilitate trad unicode <-> utf8