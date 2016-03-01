SELECT Yr, continent, count(distinct reporting_id)
FROM flow_joined
left join RICentities on reporting_id = RICentities.id
group by continent, Yr