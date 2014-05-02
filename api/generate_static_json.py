import codecs

import reporting_entities

# type possible values
# 'Geographical Area'
# 'City/Part of'
# 'Country'
# 'group'
# 'Colonial Area'
type_arg=["Country"]
# to_corld_only possible values
# boolean : True or False
to_world_only_arg=False

with codecs.open("reporting_countries.json","w") as f:
	f.write(reporting_entities.get(type_arg,True))

import flows

# inputs
reportings=["France"]
partners=["United Kingdom"]

with codecs.open("bilateral_france_UK.json","w") as f:
	f.write(flows.get_flows_in_pounds(reportings,partners))