




<h2><center>RICardo World Trade Web, 1834-1938
</center></h2>
<center>Department of Economic History <br> Lund University<br>research seminar - 10/10/2018</center>
<br>
<center>Paul Girard [@paulanomalie](https://twitter.com/paulanomalie)<br>
Béatrice Dedinger 
</center>


<center>
[![médialab, Sciences Po](img/SciencesPO_MEDIALAB.png)<!-- .element: style="height: 150px;"-->](http://medialab.sciencespo.fr)
[![Centre d'Histoire de Sciences Po](img/SciencesPO_CHSP.png)<!-- .element: style="height: 150px;margin-left:200px;"-->](http://chsp.sciencespo.fr)
</center>

---

# Homogeneization
#    ≠
# cleaning

---

- convergence of entity names and type
- coding metadata (Imp/Exp, general/special...)
- exchange rates to £ sterling (current price)

=> to build a common structure for the source data
---
![relational database schema](./img/ricardo_database_schema.png)

---
# I. heterogeneity
---
## 1. RICentities
---
![RICentities by types](./img/RICentities_types.png)

---
### Top 20 (in value) only-partner countries 
![Top 20 (in value) only-partner countries](./img/country_only_partner_top20_in_value.png)
---
### Quantifying the issue
![partner types breakdown in part of number and values of flows](./img/value_flows_partner_types_by_source.png)

---

## 2. mirror flows discrepencies
---
<center>![mirror flows](./img/bilateraltrade.svg)<!-- .element: style="width:50%" --></center>
---

![bilateral France Sweden discrepencies](./img/bilateral_France_Sweden.png)
---
### Quantifying the issue

![distribution of discrepency index](./img/discrepency_index_distirbution.png)<!-- .element: style="width:70%" --></center>
---

# II. variability in time

---
## number of reporting through time
![distribution of reporting types trhough time](./img/reporting_by_type_through_time.png)<!-- .element: style="width:100%" --></center>

---
## number of flows though time

![number of flows with and without mirrors](./img/nb_flows_mirror.png)
---

![number of partner types through time](./img/partner_types_part_of_flows_values_through_time.png)

---
# III. Reducing complexity
---
## Groups desaggregation <br> direct method

![](./img/group_desaggregation_direct_method.png)
---
## Groups desaggregation <br> mirror method

![](./img/group_desaggregation_mirror_method.png)
---
## City part ofs

- group 'city/part of' flows by reporting, year, expimp, country_part_of
- sum the flow values
- create a new flow to the partner "country_part_of"
- delete the original flows
- delete generated flows when duplicates of existing ones from source

---
## Quality tags

Generated flows are tagged, indicating the method used :

- group_desaggregation_direct_diffYear
- group_desaggregation_mirror_diffYear
- city_part_of_partner_aggregation

---
## Colonial areas

- for each colonial areas
- to manually define the composition
- by selecting the possible colonies listing in COW dataset
- the composition variations through time will be done automatically
- transform the colonial areas into groups

---
# IV. Quality measures
---

![](./img/group_desaggregation_quality_treshold.png)<!-- .element: style="margin:0px;width:90%"-->

---
![with diff_year_treshold = 10 ](./img/partner_types_through_time_diff.png)
---
![](./img/part_of_partner_types_diff.png)
---
#  IV. network analysis
---
<section data-background-image="./img/network_1878.png">
</section>

Note:
- asymetric link weight
- inclusion links

