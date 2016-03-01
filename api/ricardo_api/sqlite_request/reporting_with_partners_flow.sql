SELECT reporting, partner, Flow, expimp
FROM flow_joined
WHERE reporting  NOT  LIKE 'Worl%'
AND  partner  NOT  LIKE 'Worl%'
AND Flow != 'null'
AND Yr =1905