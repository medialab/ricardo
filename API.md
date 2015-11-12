
# Protocol
GET HTTP request

## Arguments norm
All routes take only GET request parameters as URL query, no inputs


## API calls
### all routes

* /reporting_entities
* /flows
* /continent_flows
* /world_flows
* /mirror_entities
* /RICentities



### Example

  ricardo_server.tld/RICentities

### Outputs

```
json
[
  {
    "RICid":456
    "RICname":"Germany",
    "type":"city/part_of"|"colonial_area"|"country"|"geographical_area"|"group",
    "continent":"europe"|"asia"|africa"...,
    "central_state":"Germany"
  },...
]
```

# reporting_entities

List entities which has reported Imp/Exp flows.

### root

  /reporting_entities

### inputs

- type_filter = city/part_of,colonial_area,country,geographical_area,group,continent - Optional
- to_world_only = 1|0 - Optional

### example

  ricardo_server.tld/reporting_entities?type_filter=country,group&to_world_only=1

## outputs

```
json
[
  {
        "type": "continent", 
        "RICname": "Europe"
  },
  {
    "RICid":456
    "RICname":"Germany",
    "type":"city/part_of"|"colonial_area"|"country"|"geographical_area"|"group",
    "continent":"europe"|"asia"|africa"...,
    "central_state":"Germany"
  },...
]
```

# flows

The main raw data API. flows will provide the exp/imp flows between countries.

## views
API root used in 
- bilateral : in this case, API call specifies only one reporting and a partner. The outputs adds mirror_flows.
- country view : in this case no partner should be specified.
- world view : specifies many reporting and "world" as partner.

### root 

  /flows

### inputs

- reporting_ids = 456,53
- partner_ids = 598 - Optional
- original_currency = 1|0 - Optionnal
- with_sources - Optionnal
- from=YYYY - Optionnal
- to=YYYY - Optionnal

ids are provided by the reporting_entities API call

not implemented yet :
- null flows ?

### example

  ricardo_server.tld/flows?reporting_ids=885&partner_ids=841

## outputs
```
json
{ 
  "RICentities": [
    "reportings":[
    {
      RICid: 442,
      type: "geographical_area",
      central_state: "",
      RICname: "World",
      continent: "World"
    }]
    "partners":[
    {
      RICid: 885,
      type: "country",
      central_state: "France",
      RICname: "France",
      continent: "Europe"
    }]
  ],
  "flows"|"mirror_flows":
  [
    {
      "reporting_id":456
      "partner_id":598,
      "year":1865,
      "imp": 655488.123,
      "exp":1225488.123,
      "total":135353513,
      "currency":"pounds",
      ("source":"tableau pioioirezj")
    },...
  ],
}
```

not implemented:

```
json
"metadata":
      {
        reporting_ids:[456,53],
        (partner_ids:[598],)
        type:"flow_in_pounds",
        (from:YYYY,)
        (to:YYYY,)
        (with_sources)
      }
```

# continent_flows

Flows aggregated by continent

## views
API root used in 
- continent view : in this case no partner should be specified.
- world view : specifies continents and "world" as partner.

### root 

  /continent_flows

### inputs

- continents = Europe,Asia
- partner_ids = 598 - Optional
- with_sources - Optionnal
- from=YYYY - Optionnal
- to=YYYY - Optionnal

not implemented yet :
- null flows ?

### example

  ricardo_server.tld/continent_flows?continent=Asiapartner_ids=841

## outputs
```
json
{
    "RICentities": {
        "partners": [
            {
                "RICid": 1382, 
                "type": "Geographical Area", 
                "central_state": null, 
                "RICname": "World", 
                "continent": "World"
            }
        ], 
        "reportings": [
            "Europe"
        ]
    }, 
    "flows": [
        {
            "currency": "sterling pound", 
            "reporting_id": "Europe", 
            "imp": 31100000.0, 
            "exp": 30100000.0, 
            "year": 1796, 
            "total": 61200000.0, 
            "partner_id": 1382
        }, 
        {
            "currency": "sterling pound", 
            "reporting_id": "Europe", 
            "imp": 25100000.0, 
            "exp": 27500000.0, 
            "year": 1797, 
            "total": 52600000.0, 
            "partner_id": 1382
        },
        ... 
      ]
}
```
  
# flows_sources

Provide a list of all sources used in a flow API call.
Used to get them all at once without repeating them in flow.

### inputs
- reporting_ids = 456,53
- partner_ids = 598 - Optional
- from=YYYY - Optionnal
- to=YYYY - Optionnal

### outputs
```
json
{
  "sources":["source1","source2",...]
}
```



