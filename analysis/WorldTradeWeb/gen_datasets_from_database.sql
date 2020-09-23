.open ../../../ricardo_data/sqlite_data/RICardo_viz.sqlite
.mode csv
.headers on
.once './data/reporting_types_through_time_flow_joined.csv'
SELECT reporting_type as type,year,count(distinct reporting) as nb from flow_joined
WHERE partner not like '%world%'
group by year, reporting_type ORDER BY year, reporting_type ASC;

.once './data/nb_flows_by_mirror.csv'
SELECT f1.year as year, CASE WHEN f2.reporting IS NOT NULL AND f2.flow IS NOT NULL THEN 'has mirror' ELSE 'no mirror' END AS ftype, count(*) as nb
FROM flow_joined f1 LEFT JOIN flow_joined f2 ON f1.reporting = f2.partner AND f1.partner = f2.reporting AND f1.year=f2.year AND f1.expimp != f2.expimp 
WHERE f1.partner NOT LIKE '%world%'
GROUP BY f1.year, ftype;

.once './data/partner_types_through_time_flow_joined.csv'
SELECT partner_type as type,year,count(distinct partner) as nb from flow_joined LEFT JOIN
(SELECT year as ryear, reporting as rreporting FROM flow_joined WHERE partner not like '%world%' and partner is not null)
 ON ryear=year AND rreporting = partner 
WHERE partner not like '%world%' AND rreporting is null AND partner_type is not null
group by year, partner_type ORDER BY year, partner_type ASC;

.once './data/partner_types_through_time_flow_aggregated.csv'
SELECT partner_type as type,year,count(distinct partner) as nb 
FROM flow_aggregated LEFT JOIN
(SELECT year as ryear, reporting as rreporting FROM flow_aggregated WHERE partner not like '%world%' and partner is not null)
 ON ryear=year AND rreporting = partner 
WHERE partner not like '%world%' AND rreporting is null AND partner_type is not null
group by year, partner_type ORDER BY year, partner_type ASC;

.once './data/partner_types_through_time_diff.csv'
SELECT year,  type, COALESCE(aggregated.nb,0) - COALESCE(joined.nb,0) as nb
FROM (
	SELECT partner_type as type,year,count(distinct partner) as nb from flow_joined LEFT JOIN
		(SELECT year as ryear, reporting as rreporting FROM flow_joined WHERE partner not like '%world%' and partner is not null)
 			ON ryear=year AND rreporting = partner 
	WHERE partner not like '%world%' AND partner_type is not null AND rreporting is null
	group by year, partner_type )
as joined
LEFT JOIN (
	SELECT partner_type as type,year,count(distinct partner) as nb FROM flow_aggregated LEFT JOIN
		(SELECT year as ryear, reporting as rreporting FROM flow_aggregated WHERE partner not like '%world%' and partner is not null)
 			ON ryear=year AND rreporting = partner 
	WHERE partner not like '%world%'  AND partner_type is not null AND rreporting is null 
	group by year, partner_type )
as aggregated 
USING (year,type);


.once './data/remaining_group_partners.csv'
SELECT partner, count(*) as nb_flows, count(DISTINCT year) as nb_years, count(distinct reporting) as nb_reportings, min(year) as min_year, max(year) as max_year, sum(flow*unit/rate) as total_value, group_concat(DISTINCT reporting)
FROM flow_aggregated
WHERE partner not like '%world%' and partner_type = 'group'
group by partner
ORDER BY  total_value DESC;

.once './data/original_group_partners.csv'
SELECT partner, count(*) as nb_flows, count(DISTINCT year) as nb_years, count(distinct reporting) as nb_reportings, min(year) as min_year, max(year) as max_year, sum(flow*unit/rate) as total_value, group_concat(DISTINCT reporting)
FROM flow_joined
WHERE partner not like '%world%' and partner_type = 'group'
group by partner
ORDER BY  total_value DESC;

.once './data/country_only_partners.csv' 
SELECT partner, count(DISTINCT year) as nb_years, min(year) as min_year, max(year) as max_year, count(distinct reporting) as nb_reporting, count(*) as nb_flow, sum(flow*rate/unit) as total_value
FROM flow_joined
WHERE partner_type = 'country' AND partner not in (SELECT distinct reporting from flow_joined)
group by partner
ORDER BY total_value DESC;

.once './data/partner_types_part_of_flows_values_through_time.csv'
SELECT partner_type as type, year, count(*) as nb, total_nb, sum(flow*unit/rate) as value, 1.0*count(*)/total_nb as part_of_flows, sum(flow*unit/rate)/total_value as part_of_value
FROM flow_aggregated LEFT JOIN (
	SELECT year, count(*) as total_nb, sum(flow*unit/rate) as total_value  from flow_aggregated WHERE partner not like '%world%' and partner_type is not null group by year) using (year)
WHERE  partner not like '%world%' and partner_type is not null
GROUP bY partner_type, year
ORDER BY year, partner_type DESC;

.once './data/partner_types_part_of_flows_values_diff.csv'
SELECT type, year, (ifnull(agg.part_of_value,0) - joined.part_of_value) as part_of_value, (ifnull(agg.part_of_flows,0) - joined.part_of_flows) as part_of_flows 
FROM 
(SELECT partner_type as type, year, count(*) as nb, total_nb, sum(flow*unit/rate) as value, 1.0*count(*)/total_nb as part_of_flows, sum(flow*unit/rate)/total_value as part_of_value
FROM flow_joined LEFT JOIN (SELECT year, count(*) as total_nb, sum(flow*unit/rate) as total_value  from flow_joined WHERE partner not like '%world%' and partner_type is not null group by year) using (year)
WHERE  partner not like '%world%' and partner_type is not null
GROUP bY partner_type, year
ORDER BY year, partner_type DESC) as joined
LEFT JOIN (SELECT partner_type as type, year, count(*) as nb, total_nb, sum(flow*unit/rate) as value, 1.0*count(*)/total_nb as part_of_flows, sum(flow*unit/rate)/total_value as part_of_value
FROM flow_aggregated LEFT JOIN (SELECT year, count(*) as total_nb, sum(flow*unit/rate) as total_value  from flow_aggregated WHERE partner not like '%world%' and partner_type is not null group by year) using (year)
WHERE  partner not like '%world%' and partner_type is not null
GROUP bY partner_type, year
ORDER BY year, partner_type DESC) as agg
USING (year, type);


.once './data/discrepency_distribution.csv'
SELECT count(*) as nb_flows, discrepency 
FROM(
SELECT f1.year as year, ROUND((f1.flow*f1.unit/f1.rate - f2.flow*f2.unit/f2.rate)/ (f1.flow*f1.unit/f1.rate),1) as discrepency
FROM flow_joined f1 LEFT JOIN flow_joined f2 ON f1.reporting = f2.partner AND f1.partner = f2.reporting AND f1.year=f2.year AND f1.expimp != f2.expimp 
WHERE f2.reporting IS NOT NULL AND discrepency IS NOT NULL
)
GROUP BY discrepency 
ORDER BY discrepency ASC;

.once './data/country_entities_diff_with_FT.csv'
SELECT nb_reporting, nb_partner, count(distinct reporting) as nb_FT,(nb_reporting+nb_partner) - count(distinct reporting) as diff_all, nb_reporting - count(distinct reporting) as diff_reporting, nb_partner - count(distinct reporting) as diff_partner,  year
FROM flow_aggregated LEFT JOIN (SELECT count(distinct reporting) as nb_reporting, year FROM flow_aggregated 
	WHERE partner not like '%world%' and reporting_type = 'country' group by year) USING (year)
	LEFT JOIN (
	SELECT count(distinct partner) as nb_partner, year FROM flow_aggregated LEFT JOIN (SELECT 1 as reports,year as jyear,reporting as jreporting FROM flow_aggregated WHERE partner not like '%world%' and partner is not null) as g ON jyear=year AND jreporting = partner 
	WHERE partner not like '%world%' and partner_type = 'country' aND g.reports is null  group by year) USING (year)
WHERE partner = 'World Federico Tena'
GROUP by year;


-- list of entities used by FT by year
.once './data/FT_entities_by_year.csv'
SELECT year, group_concat(reporting, ';') as reportings
FROM (SELECT year, reporting from flow_aggregated WHERE partner = "World Federico Tena" group by year, reporting)
GROUP BY year; 

