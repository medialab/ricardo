
# Protocol
GET HTTP request

# arguments norm
GET request parameters as URL query


# RICentities

list all entities from the database

## API call
### root

  /RICentities

### inputs

No inputs

### example

  ricardo_server.tld/RICentities

## outputs

```json
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

list entities which has reported Imp/Exp flows.

## API call
### root

  /reporting_entities

### inputs

- type_filter = city/part_of,colonial_area,country,geographical_area,group - Optional
- to_world_only = 1|0 - Optional

### example

  ricardo_server.tld/reporting_entities?type_filter=country,group&to_world_only=1

## outputs

```json
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

# flows

The main raw data API. flows will provide the exp/imp flows between countries.

## views
API root used in 
- bilateral : in this case, API call specifies only one reporting and a partner. The outputs adds mirror_flows.
- country view : in this case no partner should be specified.
- world view : specifies many reporting and "world" as partner.

## API call
### root 

  /flows

### inputs

- reporting_ids = 456,53
- partner_ids = 598 - Optional
- original_currency = 1|0 - Optionnal

ids are provided by the reporting_entities API call

not implemented yet :
- null flows ?
- (with_sources)
- (from=YYYY)
- (to=YYYY)

### example

  ricardo_server.tld/flows?reporting_ids=885&partner_ids=841



## outputs
```json
{ 
  RICentities: [
    {
      RICid: 442,
      type: "geographical_area",
      central_state: "",
      RICname: "World",
      continent: "World"
    },
    {
      RICid: 885,
      type: "country",
      central_state: "France",
      RICname: "France",
      continent: "Europe"
    }
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
```json
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
  
# flows_sources (not implemented yet)

Provide a list of all sources used in a flow API call.
Used to get them all at once without repeating them in flow.

## inputs
- reporting = ["France"]
- (partner = "Germany")
- (from=YYYY)
- (to=YYYY)

## outputs
```json
["source1","source2",...]
```



