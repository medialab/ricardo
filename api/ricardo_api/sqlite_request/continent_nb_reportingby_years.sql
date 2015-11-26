SELECT  RICentities.continent, Yr, COUNT(distinct(RICentities.id)), group_concat(RICentities.id,";") as entities
FROM RICentities
INNER JOIN flow_joined  
	on RICentities.id = flow_joined.reporting_id
GROUP BY Yr, RICentities.continent
ORDER BY Yr ASC