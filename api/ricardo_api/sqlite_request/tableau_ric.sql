SELECT 
	flow_joined.reporting_id, 
	RIC_reporting.type as reporting_type, 
	RIC_reporting.continent as reporting_continent, 
	flow_joined.partner_id, 
	RIC_partner.continent as partner_continent,
	RIC_partner.type as partner_type,
	MIN(Yr) as min_date, MAX(Yr) as max_date, count(distinct(Yr)) as nb_Yr,
	group_concat(flow_joined.Source,";") as sources 
FROM flow_joined
INNER JOIN RICentities as RIC_reporting 
	on flow_joined.reporting_id = RIC_reporting.id
INNER JOIN RICentities as RIC_partner 
	on flow_joined.partner_id = RIC_partner.id
GROUP BY reporting_id, partner_id