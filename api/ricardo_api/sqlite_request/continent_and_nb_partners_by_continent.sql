SELECT 
	RIC_reporting.continent as reporting_continent, 
	RIC_partner.continent as partner_continent,
	Yr,
	count(distinct(RIC_partner.id)) as nb_partners
FROM flow_joined
INNER JOIN RICentities as RIC_reporting 
	on flow_joined.reporting_id = RIC_reporting.id 
INNER JOIN RICentities as RIC_partner 
	on flow_joined.partner_id = RIC_partner.id
WHERE reporting_continent = "Europe"
GROUP BY Yr, reporting_continent, partner_continent