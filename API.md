
# Protocol
GET HTTP request

# arguments norm


# reporting_entities
## inputs
- (type_filter=["countries","city","colonial_area","geographic_area"])
- to_world_only=1/0

## outputs

```json
[
  {
    "reporting":"Germany",
    "type":"country"|"city"|"group"|"geo area"|"colonial area",
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

## inputs

- reporting = ["France"]
- (partner = "Germany")
- type = ["flow_in_pounds","null_flows","missing_rate_flows","flow_in_original_currency"]
- (with_sources)
- (from=YYYY)
- (to=YYYY)


## outputs
```json
{ "metadata":
      {
        reporting:["France"],
        (partner:"Germany",)
        type:"flow_in_pounds",
        (from:YYYY,)
        (to:YYYY,)
        (with_sources)
      },
  "partners":
  [
    {
    "partner":"Germany",
    "type":"country"|"city"|"group"|"geo area"|"colonial area",
    "continent":"europe"|"asia"|africa"...,
    "central_state":"Germany"
    },
  ],
  "flow_in_pounds"|"null_flows"|"missing_rate_flows"|"mirror_flow"|"flow_original_currency":
  [
    {
      "partner":"Germany",
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
  
# flows_sources

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



