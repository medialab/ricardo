
# Protocol
GET HTTP request

## Arguments norm
All routes take only GET request parameters as URL query, no inputs


## API calls
### all routes

* /flows
* /reporting_entities
* /world_flows
* /continent_flows
* /continent_with_partners
* /nations_network
* /reportings_available_by_years
* /flows_sources
* /mirror_entities


#/flows

The main raw data API. flows will provide the exp/imp flows between countries.

## views
API root used in

- bilateral : in this case, API call specifies only one reporting and a partner. The outputs adds mirror_flows.
- country view : in this case no partner should be specified.
- world view : specifies many reporting and "WorldBestGuess" as partner.


## inputs

```
reporting_ids =string 
partner_ids = string - Optional
original_currency = boolean - Optionnal
with_sources = boolean - Optionnal
from = integer(YYYY)- Optionnal
to = integer(YYYY) - Optionnal
```


## example

```
ricardo_server.tld/flows?partner_ids=Italy&reporting_ids=France&with_sources=1
```
## outputs
```
json
{
  "RICentities": {
     "partners": [
      {
        "RICid": "Italy",
        "type": "country",
        "central_state": "Italy",
        "RICname": "Italy",
        "continent": "Europe"
      }
    ],
    "reportings": [
      {
        "RICid": "France",
        "type": "country",
        "central_state": "France",
        "RICname": "France",
        "continent": "Europe"
      }
    ]
  },
  "flows"|"mirror_flows":
  [
    {
      "currency": "sterling pound",
      "reporting_id": "France",
      "imp": 4673659.21718832,
      "sources": "Société des Nations, Statistiques du commerce extérieur. ",
      "exp": 5164761.76190163,
      "year": 1937,
      "total": 9838420.97908995,
      "partner_id": "Italy",
      "imp_mirror": 5221479.06666448,
      "exp_mirror": 4657857.09001841,
      "date": "1936-12-31T23:00:00.000Z"
     },...
  ],
}
```


#/reporting_entities

List entities which has reported Imp/Exp flows.

## views
API root used in

- bilateral view 
- country view 
- world view 

## inputs

```
type_filter = city/part_of,colonial_area,country,geographical_area,group,continent - Optional 
to_partner_id =string - Optional
```
## example

```
ricardo_server.tld/reporting_entities?type_filter=country&to_partner_id=WorldBestGuess
```
## outputs

```
json
[
  {
    "RICid": "Bahamas",
    "type": "country",
    "central_state": "Bahamas",
    "RICname": "Bahamas",
    "continent": "America",
   }...
]
```

#/world_flows

Aggregate the exp/imp flows by partner_id="WorldBestGuess"

## views
API root used in

- world view 

## inputs

```
from = integer(YYYY)- Optionnal
to = integer(YYYY) - Optionnal
```

## example

```
ricardo_server.tld/world_flows
```
## outputs
```
json
[
 {
    "sources": "Statistique générale de la France (1838)",
    "nb_reporting": 1,
    "type": "Exp",
    "flows": 18300329.271390893,
    "year": 1787
  },
  {
    "sources": "Statistique générale de la France (1838)",
    "nb_reporting": 1,
    "type": "Imp",
    "flows": 22912660.961069968,
    "year": 1787
  }...
]
```

#/continent_flows

Flows aggregated by continent

## views

API root used in
- country view : get continent flow by selected reporting country
- world view : specifies continents and "WorldBestGuess" as partner.
- continent view : in this case no reporting/partner should be specified.


### inputs
```
continents = string
reporting_ids= string - Optional
partner_ids = string - Optional
with_sources = boolean - Optionnal
from = integer(YYYY)- Optionnal
to = integer(YYYY) - Optionnal
```

not implemented yet :
- null flows ?

### example

```
ricardo_server.tld/continent_flows?continents=Asia&reporting_ids=France
```
## outputs
```
json
{
   "RICentities": {
    "partners": [
      {
        "RICid": "Asia",
        "type": "geographical_area",
        "central_state": null,
        "RICname": "Asia",
        "continent": "Asia"
      }
    ],
    "reportings": [
      {
        "RICid": "France",
        "type": "country",
        "central_state": "France",
        "RICname": "France",
        "continent": "Europe"
      }
    ]
  },
  "flows": [
    {
      "currency": "sterling pound",
      "reporting_id": "France",
      "imp": 592768.2276229986,
      "exp": 343805.5720213398,
      "year": 1827,
      "total": 936573.7996443384,
      "partner_id": "Asia"
    } ...
   ]
}
```

#/continent_with_partners

Aggregate number of partners between continents by year

## inputs
```
from = integer(YYYY)- Optionnal
to = integer(YYYY) - Optionnal
```

## example

```
ricardo_server.tld/continent_with_partners?from=1878&to=1912
```
##outputs
```
json
[
  {
    "reporting_continent": "Europe",
    "partner_continent": "America",
    "year":1878,
    "nb_partners":64
   }...
]
```

#/nations_network

Create network graph of flows between entities by year, with an average clustering coefficient for the graph.

## views
API root used in

-network view

### inputs

```
year = integer(YYYY)
```

### example

```
ricardo_server.tld/nations_network?year=1857
```
## outputs

```
{
  "stats": {
    "average_clustering": 0,
    "diameter": 2,
    "center": [
      "France"
    ],
    "eccentricity": {
      "Netherlands": 2,
      "FrenchColonies": 2,
      "KingdomofSardinia_Genoa": 2,
      "Portugal": 2,
      "Denmark_Norway": 2,
      "TwoSicilies": 2,
      "France": 1,
      "Prussia": 2,
      "RussiaUSSR": 2,
      "UnitedKingdom": 2,
      "Milan_PapalStates_Tuscany": 2,
      "Sweden": 2,
      "Germany": 2,
      "Switzerland": 2,
      "Austria": 2,
      "Bremen_Hamburg_Lubeck": 2,
      "UnitedStatesofAmerica": 2,
      "Spain": 2,
      "Turkey_BarbaryCoast": 2
    }
  },
  "network": [
    {
      "reporting_continent": "Europe",
      "partner_type": "country",
      "expimp": "Imp",
      "partner_continent": "Europe",
      "partner": "United Kingdom",
      "reporting": "France",
      "partner_id": "UnitedKingdom",
      "flow": 60912,
      "reporting_id": "France",
      "reporting_type": "country"
    }...
   ]
}
```

#/reportings_available_by_years

Get aggregated flow/partners and by entity with whole time span(1787 to 1938)

## views
API root used in

-metadata view: specify partner groups for query
## inputs

```
partner_ids= string(either World estimation or actual reporting entities)
```
## example

```
ricardo_server.tld/reportings_available_by_years?partner_ids=Worldbestguess
```
## outputs

```
json
[
  {
	"reporting": "Albania",
    "year": "1935",
    "exp_flow": "6027",
    "imp_flow": "9637",
    "total_flow": "15664",
    "exp_partner": 10,
    "imp_partner": 10,
    "total_partner": 10,
    "source": "Société des Nations",
    "continent": "Europe"
  }...
]
```

#/flows_sources
(NOT CALLED)

Provide a list of all sources used in a flow API call.
Used to get them all at once without repeating them in flow.

### inputs

```
reporting_ids = string 
partner_ids = string - Optional
from = integer(YYYY)- Optionnal
to = integer(YYYY) - Optionnal
```

### outputs
```
json
{
  "sources":["source1","source2",...]
}
```
#/mirror_entities
(NOT CALLED)

Get all reporting entities by year which is a partner of the given reporting entitiy

### inputs


```
reporting_ids = string 
```

### outputs

```
json
[
	{
	"RICid":"Austria",
    "RICname":"Austria",
    "type":"country",
    "central_state":"Austria",
    "continent":"Europe",
    "year":1880
	}...
]
```

