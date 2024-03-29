# coding=utf8

from ricardo_api import app
from ricardo_api import get_db

import json
import networkx as nx


def ric_entities_data(ids=[]):
    cursor = get_db().cursor()
    where_clause = (
        """WHERE slug in ("%s")""" % ('","'.join(ids)) if len(ids) > 0 else ""
    )

    cursor.execute(
        """SELECT slug,RICname,type,continent
                      FROM  RICentities
                      %s"""
        % where_clause
    )

    rics = []
    for id, r, t, continent in cursor:
        rics.append({"RICid": id, "RICname": r, "type": t, "continent": continent})
    rics = sorted(rics, key=lambda k: k["RICid"])
    return rics


def flows_data(
    reporting_ids,
    partner_ids,
    original_currency,
    from_year,
    to_year,
    with_sources,
    group_reporting_by="",
    search_by_reporting=False,
):
    cursor = get_db().cursor()

    reports_clause = (
        """ AND reporting_slug IN ("%s")""" % '","'.join(reporting_ids)
        if len(reporting_ids) > 0
        else ""
    )
    partners_clause = (
        """ AND partner_slug IN ("%s")""" % '","'.join(partner_ids)
        if len(partner_ids) > 0
        else ""
    )
    # world_partner_clause = "AND partner_slug NOT LIKE 'Worl%%'" if "Worldbestguess" not in partner_ids else ""
    from_year_clause = """ AND year>%s""" % from_year if from_year != "" else ""
    to_year_clause = """ AND year<%s""" % to_year if to_year != "" else ""

    print(original_currency)
    flow_field = "Flow*Unit/ifnull(rate,1)" if not original_currency else "Flow*Unit"
    source_field = """,group_concat(Source,"|")""" if with_sources else ""

    if group_reporting_by == "":
        cursor.execute(
            """
            SELECT
                reporting_slug,
                reporting,
                partner_slug,
                partner,
                year,
                group_concat(expimp,"|"),
                group_concat(%s,"|"),
                currency%s
            FROM
                flow_joined
            WHERE
                flow IS NOT NULL
                AND partner_slug IS NOT NULL
                %s
            GROUP BY
                reporting,
                partner,
                year
            ORDER BY
                year ASC
            """
            % (
                flow_field,
                source_field,
                reports_clause + partners_clause + from_year_clause + to_year_clause,
            )
        )

    elif (
        group_reporting_by == "continent"
    ):  # in these 2 usecases, reporting_ids are continents
        if (
            search_by_reporting
        ):  # In this usecase, partner_ids are actually reporting_ids
            cursor.execute(
                """
                SELECT
                    reporting_slug,
                    reporting,
                    partner_continent,
                    partner_continent,
                    year,
                    group_concat(expimp,"|"),
                    group_concat(%s,"|"),
                    currency%s
                FROM
                    flow_joined
                WHERE
                    reporting_slug IN ("%s")
                    AND partner_continent IN ("%s")
                    %s
                    AND ( flow IS NOT null)
                    AND partner_slug IS NOT NULL
                GROUP BY
                    partner_continent,
                    reporting_slug,
                    year
                ORDER BY
                    year ASC
                """
                % (
                    flow_field,
                    source_field,
                    '","'.join(partner_ids),
                    '","'.join(reporting_ids),
                    from_year_clause + to_year_clause,
                )
            )
        else:
            cursor.execute(
                """
                SELECT
                    reporting_continent,
                    reporting_continent,
                    partner_slug,
                    partner,
                    year,
                    group_concat(expimp,"|"),
                    group_concat(%s,"|"),
                    currency%s
                FROM
                    flow_joined
                WHERE
                    reporting_continent IN ("%s")
                    AND partner_continent NOT IN ("%s")
                    %s
                    AND ( flow IS NOT NULL)
                    AND partner_slug IS NOT NULL
                GROUP BY
                    reporting_continent,
                    partner,
                    year
                ORDER BY
                    year ASC
                """
                % (
                    flow_field,
                    source_field,
                    '","'.join(reporting_ids),
                    '","'.join(reporting_ids),
                    partners_clause + from_year_clause + to_year_clause,
                )
            )

    flows = []
    partners_meta = {}
    last_y = {}
    for fields in cursor:
        if with_sources:
            (
                r_id,
                r_name,
                p_id,
                p_name,
                y,
                expimp_g,
                flow_g,
                currency,
                source_g,
            ) = fields
        else:
            (r_id, r_name, p_id, p_name, y, expimp_g, flow_g, currency) = fields

        imports = []
        exports = []
        if p_id not in list(last_y.keys()):
            last_y[p_id] = y
        if flow_g:
            if len(expimp_g.split("|")) != len(flow_g.split("|")):
                app.logger.debug("%s %s" % (expimp_g, flow_g))
            for i, ei in enumerate(expimp_g.split("|")):
                if ei == "Imp":
                    imports.append(float(flow_g.split("|")[i]))
                elif ei == "Exp":
                    exports.append(float(flow_g.split("|")[i]))
        if group_reporting_by == "":
            # duplicates are only possible when not grouping
            dups = []
            if len(imports) > 1:
                dups.append((r_id, "Imp from", p_id, y, imports))
            if len(exports) > 1:
                dups.append((r_id, "Exp to", p_id, y, exports))
            for dup in dups:
                app.logger.warning(
                    "Warning duplicated flows for %s %s %s in %s with dup flows in pounds : %s"
                    % dup
                )
        if group_reporting_by == "":
            # resolve duplicates and null cases
            imp = max(imports) if len(imports) > 0 else None
            exp = max(exports) if len(exports) > 0 else None
        else:
            # when grouping we sum exp imp
            imp = sum(imports)
            exp = sum(exports)
        total = (imp if imp else 0) + (exp if exp else 0)
        # deal with missing years in flows list
        for missing_year in (
            last_y[p_id] + i + 1 for i in range(y - (last_y[p_id] + 1))
        ):
            flows.append(
                {
                    "reporting_id": r_id,
                    "reporting_name": r_name,
                    "partner_id": p_id,
                    "partner_name": p_name,
                    "year": missing_year,
                    "imp": None,
                    "exp": None,
                    "total": None,
                    "currency": currency if original_currency else "sterling pound",
                }
            )
        flows.append(
            {
                "reporting_id": r_id,
                "reporting_name": r_name,
                "partner_id": p_id,
                "partner_name": p_name,
                "year": y,
                "imp": imp,
                "exp": exp,
                "total": total,
                "currency": currency if original_currency else "sterling pound",
            }
        )
        last_y[p_id] = y
        if with_sources:
            sources = set(source_g.split("|") if source_g else [])
            flows[-1]["sources"] = list(sources)[0] if sources else ""

    return flows


def get_flows_sources(reporting_ids, partner_ids, from_year, to_year):
    cursor = get_db().cursor()
    partners_clause = (
        """ AND partner_slug IN ("%s")""" % '","'.join(partner_ids)
        if len(partner_ids) > 0
        else ""
    )
    from_year_clause = """ AND year>%s""" % from_year if from_year != "" else ""
    to_year_clause = """ AND year<%s""" % to_year if to_year != "" else ""

    cursor.execute(
        """SELECT distinct(Source)
                      FROM flow_joined
                      where reporting_slug IN ("%s")
                      %s
                      and rate is not null
                      and Flow is not null
                      """
        % (
            '","'.join(reporting_ids),
            partners_clause + from_year_clause + to_year_clause,
        )
    )

    return json.dumps({"sources": [_[0] for _ in cursor]})


def get_world_flows(from_year, to_year):
    cursor = get_db().cursor()
    from_year_clause = """ AND year>%s""" % from_year if from_year != "" else ""
    to_year_clause = """ AND year<%s""" % to_year if to_year != "" else ""
    # print from_year_clause, to_year_clause
    cursor.execute(
        """SELECT SUM(flow*Unit/ifnull(rate,1)), partner_slug,year, COUNT(*), expimp, Source
                      FROM flow_joined
                      WHERE (
                       partner_slug like 'Worldasreported'
                       OR partner_slug like 'Worldbestguess'
                       OR partner_slug like 'Worldsumpartners'
                       OR partner_slug like 'WorldFedericoTena')
                      %s
                      GROUP BY year, expimp,partner_slug
                      ORDER BY year ASC
                      """
        % (from_year_clause + to_year_clause)
    )

    json_response = []
    for flow, partner, year, nb_reporting, type, sources in cursor:
        json_response.append(
            {
                "year": year,
                "partner": partner,
                "flows": flow,
                "nb_reporting": nb_reporting,
                "type": type,
                "sources": sources,
            }
        )

    return json.dumps(json_response)


def get_nb_flows(flow):
    cursor = get_db().cursor()
    if flow == "bilateral":
        cursor.execute(
            """
                  SELECT year , count(*), "Bilateral" as partner,expimp
                  FROM flow_joined
                  WHERE partner_slug not like "World%"
                  AND flow is not NULL
                  GROUP BY year,expimp
                  UNION
                  SELECT year , count(*), "Bilateral" as partner,"total" as expimp
                  FROM flow_joined
                  WHERE partner_slug not like "World%"
                  AND flow is not NULL
                  GROUP BY year
                  """
        )
    else:
        cursor.execute(
            """SELECT year , count(*), "RICardo" as partner,expimp
                  FROM flow_joined
                  WHERE
                  partner_slug = 'Worldbestguess'
                  AND flow is not NULL
                  GROUP BY year,expimp
                  union
                  SELECT year , count(*), "FedericoTena" as partner,expimp
                  FROM flow_joined
                  WHERE partner_slug = 'WorldFedericoTena'
                  AND flow is not NULL
                  GROUP BY year,expimp
                  union
                  SELECT year , count(*), "RICardo" as partner,  "total" as expimp
                  FROM flow_joined
                  WHERE
                  partner_slug = 'Worldbestguess'
                  AND flow is not NULL
                  GROUP BY year
                  union
                  SELECT year , count(*), "FedericoTena" as partner,"total" as expimp
                  FROM flow_joined
                  WHERE partner_slug = "WorldFedericoTena"
                  AND flow is not NULL
                  GROUP BY year
                  """
        )
    json_response = []
    for year, nb_flows, partner, expimp in cursor:
        json_response.append(
            {"year": year, "nb_flows": nb_flows, "partner": partner, "expimp": expimp}
        )
    return json.dumps(json_response)


def get_reportings_available_by_year(flow):
    cursor = get_db().cursor()
    if flow == "bilateral":
        cursor.execute("""SELECT * FROM metadata_bilateral""")
    else:
        cursor.execute("""SELECT * FROM metadata_world""")
    # cursor.execute("""Select metadata.*, b.flow as best_flow
    #                   From metadata
    #                   Left outer Join
    #                   (SELECT reporting_slug, group_concat(flow*Unit/ifnull(rate,1),"|")  as flow, group_concat(expimp,"|") as expimp,year
    #                   from flow_joined
    #                   where reporting_slug is not null
    #                   and partner_slug is "Worldbestguess"
    #                   group by reporting_slug,year) b
    #                   on metadata.reporting_id=b.reporting_slug and metadata.year=b.year""")
    json_response = []
    table = [list(r) for r in cursor]
    for row in table:
        total = 0
        if flow == "bilateral":
            total_partner = []
            total_partner_mirror = []
            total_source = row[7].split("|")[0] if row[8] == 1 else row[7].split("|")
            total_sourcetypelist = []
            for i in range(len(row[3].split("|"))):
                total += float(row[2].split("|")[i])
                total_partner += row[4].split("|")[i].split(",")
                if row[11] is not None and len(row[11].split("|")) == len(
                    row[3].split("|")
                ):
                    partner_mirror = row[11].split("|")[i].split("+")[0].split(",")
                    total_partner_mirror += partner_mirror
                elif (
                    row[11] is not None
                    and len(row[11].split("|")) == 1
                    and row[11].split("+")[1] != row[3].split("|")[i]
                ):
                    partner_mirror = row[11].split("+")[0].split(",")
                    total_partner_mirror = partner_mirror
                else:
                    partner_mirror = []

                sourcetypelist = row[6].split("|")[i].split(",")
                if "primary" in sourcetypelist:
                    sourcetype = "primary"
                elif "primary_yearbook" in sourcetypelist:
                    sourcetype = "primary_yearbook"
                elif "secondary" in sourcetypelist:
                    sourcetype = "secondary"
                else:
                    sourcetype = "estimation"
                sourceIndex = sourcetypelist.index(sourcetype)
                total_sourcetypelist.append(sourcetype)

                # sourcelist=row[7].split("|")[i].split(",")
                # source=sourcelist[sourceIndex]
                # total_source.append(source)
                json_response.append(
                    {
                        "reporting_id": row[0],
                        "reporting": row[1],
                        "flow": float(row[2].split("|")[i]),
                        "expimp": row[3].split("|")[i],
                        "partners": row[4].split("|")[i].split(","),
                        "year": row[5],
                        "sourcetype": sourcetype.capitalize(),
                        "source": row[7].split("|")[i],
                        "continent": row[9],
                        "type": row[10],
                        "partners_mirror": partner_mirror,
                    }
                )

            if "primary" in total_sourcetypelist:
                total_sourcetype = "primary"
            elif "primary_yearbook" in total_sourcetypelist:
                total_sourcetype = "primary_yearbook"
            elif "secondary" in total_sourcetypelist:
                total_sourcetype = "secondary"
            else:
                total_sourcetype = "estimation"
            json_response.append(
                {
                    "reporting_id": row[0],
                    "reporting": row[1],
                    "flow": total,
                    "expimp": "total",
                    "partners": list(set(total_partner)),
                    "year": row[5],
                    "sourcetype": total_sourcetype.capitalize(),
                    "source": total_source,
                    "continent": row[9],
                    "type": row[10],
                    "partners_mirror": list(set(total_partner_mirror)),
                }
            )
        else:
            total_source = row[7].split("|")[0] if row[8] == 1 else row[7]
            total_partner = []
            total_source = []
            total_sourcetypelist = []
            for i in range(len(row[3].split("|"))):
                total += float(row[2].split("|")[i])
                partnerlist = row[4].split("|")[i].split("+")
                if "World estimated" in partnerlist:
                    partner = "World estimated"
                elif "World as reported" in partnerlist:
                    partner = "World as reported"
                elif "World Federico Tena" in partnerlist:
                    partner = "World Federico Tena"
                else:
                    partner = "World sum partners"
                total_partner.append(partner)

                sourcetypelist = row[6].split("|")[i].split("+")

                if "primary" in sourcetypelist:
                    sourcetype = "primary"
                elif "primary_yearbook" in sourcetypelist:
                    sourcetype = "primary_yearbook"
                elif "secondary" in sourcetypelist:
                    sourcetype = "secondary"
                elif "estimation" in sourcetypelist:
                    sourcetype = "estimation"
                else:
                    sourcetype = "FedericoTena"
                sourceIndex = sourcetypelist.index(sourcetype)
                total_sourcetypelist.append(sourcetype)

                sourcelist = row[7].split("|")[i].split("+")
                source = sourcelist[sourceIndex]
                total_source.append(source)

                # if row[12] is not None and len(row[12].split("|"))==len(row[3].split("|")):
                #   partner_mirror=row[12].split("|")[i].split("+")[0].split(",")
                #   total_partner_mirror+=partner_mirror
                # elif row[12] is not None and len(row[12].split("|"))==1 and row[12].split("+")[1]!=row[3].split("|")[i]:
                #   partner_mirror=row[12].split("+")[0].split(",")
                #   total_partner_mirror=partner_mirror
                # else:
                #   partner_mirror=[]
                json_response.append(
                    {
                        "reporting_id": row[0],
                        "reporting": row[1],
                        "flow": float(row[2].split("|")[i]),
                        "expimp": row[3].split("|")[i],
                        "partner": [],
                        "reference": partner,
                        "year": row[5],
                        "sourcetype": "FedericoTena"
                        if sourcetype == "FedericoTena"
                        else sourcetype.capitalize(),
                        "source": source,
                        "continent": row[9],
                        "type": row[10],
                    }
                )

            if "primary" in total_sourcetypelist:
                total_sourcetype = "primary"
            elif "primary_yearbook" in total_sourcetypelist:
                total_sourcetype = "primary_yearbook"
            elif "secondary" in total_sourcetypelist:
                total_sourcetype = "secondary"
            elif "estimation" in total_sourcetypelist:
                total_sourcetype = "estimation"
            else:
                total_sourcetype = "FedericoTena"
            json_response.append(
                {
                    "reporting_id": row[0],
                    "reporting": row[1],
                    "flow": total,
                    "expimp": "total",
                    "partner": [],
                    "reference": ("|").join(list(set(total_partner))),
                    "year": row[5],
                    # "sourcetype": ("|").join(list(set(total_sourcetypelist))),
                    "sourcetype": "FedericoTena"
                    if total_sourcetype == "FedericoTena"
                    else total_sourcetype.capitalize(),
                    "source": ("|").join(list(set(total_source))),
                    "continent": row[9],
                    "type": row[10],
                }
            )
    return json.dumps(json_response)


# def get_reportings_available_by_year():
#   json_response=json.load(open("ricardo_api/metadata.json","r"))
#   return json.dumps(json_response)


def get_world_available():
    cursor = get_db().cursor()
    cursor.execute(
        """SELECT  group_concat(tot.flow,"|") as flow, group_concat(tot.expimp,"|") as expimp, partner,year,source
                    from
                    (SELECT sum(t.flow) as flow, partner, year, expimp,source
                    from
                    (SELECT flow*Unit/ifnull(rate,1) as flow, partner, year, expimp,source
                    FROM flow_joined
                    WHERE flow is not NULL
                    AND(partner_slug like 'Worldbestguess'
                    OR partner_slug like 'Worldasreported'
                    OR partner_slug like 'Worldsumpartners'
                    OR partner_slug like 'WorldFedericoTena')
                    GROUP BY  reporting_slug, partner,year,expimp) t
                    group by partner,year,expimp) tot
                    group by partner,year
                    """
    )
    json_response = []
    table = [list(r) for r in cursor]
    for row in table:
        expimp = row[1].split("|")
        if len(expimp) == 2:
            json_response.append(
                {
                    expimp[0]: float(row[0].split("|")[0]),
                    expimp[1]: float(row[0].split("|")[1]),
                    "total": float(row[0].split("|")[0]) + float(row[0].split("|")[1]),
                    "partner": row[2],
                    "year": row[3],
                    "source": row[4],
                }
            )
        if len(expimp) == 1 and expimp[0] == "Exp":
            json_response.append(
                {
                    expimp[0]: float(row[0].split("|")[0]),
                    "Imp": 0,
                    "total": float(row[0].split("|")[0]),
                    "partner": row[2],
                    "year": row[3],
                    "source": row[4],
                }
            )
        if len(expimp) == 1 and expimp[0] == "Imp":
            json_response.append(
                {
                    expimp[0]: float(row[0].split("|")[0]),
                    "Exp": 0,
                    "total": float(row[0].split("|")[0]),
                    "partner": row[2],
                    "year": row[3],
                    "source": row[4],
                }
            )
    return json.dumps(json_response)


# not compatible so for


def get_reportings_overview(partner_ids):
    cursor = get_db().cursor()
    if partner_ids == "actualreported":
        cursor.execute(
            """SELECT t1.reporting_slug as reporting_id,t1.reporting as reporting,t1.reporting_continent  as continent, t1.reporting_type as type, t1.year as year,
                    ifnull(SUM(t1.exports),0) as exports,ifnull(SUM(t2.imports),0) as imports,
                    group_concat(t1.partner_slug,"|") as exp_partners, group_concat(t1.partner_continent,"|") as exp_continents,group_concat(t1.partner_type,"|") as exp_types,
                    group_concat(t2.partner_slug,"|") as imp_partners, group_concat(t2.partner_continent,"|") as imp_continents,group_concat(t2.partner_type,"|") as imp_types,
                    group_concat(t1.source,"|") as sources,
                    group_concat (DISTINCT t1.type) as sourcetype
                    FROM
                    (SELECT reporting, reporting_slug , partner_slug, partner_continent,partner_type,(flow*Unit/rate) as exports, expimp, year, Source, type, reporting_continent,reporting_type
                    FROM flow_joined
                    WHERE partner_slug NOT LIKE 'World%' AND reporting_continent is not 'World'
                    AND expimp = "Exp"
                    AND Flow is not NULL) t1
                    LEFT OUTER JOIN
                      (SELECT reporting_slug,partner_slug, partner_continent,partner_type,(flow*Unit/rate) as imports, expimp, year, source,type
                    FROM flow_joined
                    WHERE partner_slug NOT LIKE 'World%'
                    AND expimp = "Imp"
                    AND Flow is not NULL) t2
                    ON  t1.year = t2.year AND  t1.reporting_slug = t2.reporting_slug AND t1.partner_slug = t2.partner_slug
                    GROUP BY  t1.reporting_slug, t1.year
                    """
        )
    else:
        cursor.execute(
            """SELECT t1.reporting_slug as reporting_id,t1.reporting as reporting,t1.reporting_continent  as continent, t1.reporting_type as type, t1.year as year,
                      t1.exports as exports, t2.imports as imports,
                      t1.partner as partner,t1.source as source,t1.type as sourcetype
                      FROM
                      (SELECT reporting, reporting_slug , partner,partner_slug, (flow*Unit/rate) as exports, year, Source, type, reporting_continent,reporting_type
                      FROM flow_joined
                      WHERE  expimp = "Exp"
                      AND (flow*Unit/rate) is not NULL
                      AND (partner_slug like 'Worldbestguess'
                      OR partner_slug like 'Worldestimated'
                      OR partner_slug like 'Worldasreported'
                      OR partner_slug like 'Worldsumpartners')
                      ) t1
                      LEFT OUTER JOIN
                      (SELECT reporting_slug, (flow*Unit/rate) as imports, partner,partner_slug,year,source,type
                      FROM flow_joined
                      WHERE  expimp = "Imp"
                      AND (flow*Unit/rate) is not NULL
                      AND( partner_slug like 'Worldbestguess'
                      OR partner_slug like 'Worldestimated'
                      OR partner_slug like 'Worldasreported'
                      OR partner_slug like 'Worldsumpartners')
                      ) t2
                      ON  t1.year = t2.year AND  t1.reporting_slug = t2.reporting_slug AND t1.partner_slug = t2.partner_slug
                     """
        )

    json_response = []
    table = [list(r) for r in cursor]
    if partner_ids == "actualreported":
        for row in table:
            exp_partners = row[7].split("|") if row[7] is not None else []
            imp_partners = row[10].split("|") if row[10] is not None else []
            sourcetype = row[14].split(",")[0] if row[14] is not None else []

            json_response.append(
                {
                    "reporting_id": row[0],
                    "reporting": row[1],
                    "continent": row[2],
                    "type": row[3],
                    "year": row[4],
                    "exp_flow": round(row[5], 2),
                    "imp_flow": round(row[6], 2),
                    "total_flow": round(row[5] + row[6], 2),
                    "exp_partner": row[7],
                    "exp_continent": row[8],
                    "exp_type": row[9],
                    "imp_partner": row[10],
                    "imp_continent": row[11] if row[11] is not None else [],
                    "imp_type": row[12],
                    "total_partner": ("|").join(
                        list(set(exp_partners) | set(imp_partners))
                    ),
                    "source": row[13].split("|")[0] if row[7] is not None else None,
                    "sourcetype": sourcetype,
                }
            )
    else:
        for row in table:
            json_response.append(
                {
                    "reporting_id": row[0],
                    "reporting": row[1],
                    "continent": row[2],
                    "type": row[3],
                    "year": row[4],
                    "exp_flow": round(row[5], 2) if row[5] is not None else row[5],
                    "imp_flow": round(row[6], 2) if row[6] is not None else row[6],
                    "total_flow": round(sum([_f for _f in [row[5], row[6]] if _f]), 2),
                    "partner": row[7],
                    "source": row[8],
                    "sourcetype": row[9],
                }
            )
        json_response = [
            dict(t) for t in set([tuple(d.items()) for d in json_response])
        ]

    return json.dumps(json_response)


def get_nations_network_by_year(year):
    cursor = get_db().cursor()
    cursor.execute(
        """SELECT reporting, reporting_slug, partner, partner_slug, flow*Unit/ifnull(rate,1) as flow, expimp,
                    reporting_continent, partner_continent,reporting_type,partner_type
                    FROM flow_joined
                    WHERE reporting NOT LIKE "Worl%%"
                    AND partner NOT LIKE "Worl%%"
                    AND partner_slug IS NOT "NA"
                    AND partner_slug IS NOT "Unknown"
                    AND flow is not NULL
                    AND year = %s
                    """
        % (year)
    )

    table = [list(r) for r in cursor]

    json_sql_response = []

    for row in table:
        json_sql_response.append(
            {
                "reporting": row[0],
                "reporting_id": row[1],
                "partner": row[2],
                "partner_id": row[3],
                "flow": row[4],
                "expimp": row[5],
                "reporting_continent": row[6],
                "partner_continent": row[7],
                "reporting_type": row[8],
                "partner_type": row[9],
            }
        )

    # Create a graph instance
    G = nx.Graph()

    nodes = []
    for row in table:
        nodes.append(row[1])
        nodes.append(row[3])
        # add edge to the graph
        G.add_edge(row[1], row[3])

    nodes = set(nodes)

    # add nodes to graph
    G.add_nodes_from(nodes)
    if len(G.nodes()) > 0:
        stats = {
            "average_clustering": nx.average_clustering(G),
            "center": nx.center(G),
            "diameter": nx.diameter(G),
            "eccentricity": nx.eccentricity(G),
        }
    else:
        stats = []
    json_response = {}
    json_response["stats"] = stats
    json_response["network"] = json_sql_response

    return json.dumps(json_response)


def get_continent_nb_partners(from_year, to_year):
    cursor = get_db().cursor()
    from_year_clause = """ AND year>%s""" % from_year if from_year != "" else ""
    to_year_clause = """ AND year<%s""" % to_year if to_year != "" else ""
    print(from_year_clause, to_year_clause)
    cursor.execute(
        """SELECT reporting_continent, partner_continent,
                    year, COUNT(distinct(partner_slug)) as nb_partners
                    FROM flow_joined
                    %s
                    GROUP BY year, reporting_continent, partner_continent
                    """
        % (from_year_clause + to_year_clause)
    )

    json_response = []
    for reporting_continent, partner_continent, year, nb_partners in cursor:
        json_response.append(
            {
                "year": year,
                "reporting_continent": reporting_continent,
                "partner_continent": partner_continent,
                "nb_partners": nb_partners,
            }
        )

        return json.dumps(json_response)


def get_flows(
    reporting_ids, partner_ids, original_currency, from_year, to_year, with_sources
):
    json_response = {}
    json_response["flows"] = flows_data(
        reporting_ids, partner_ids, original_currency, from_year, to_year, with_sources
    )
    if len(partner_ids) == 0:
        partner_ids = list(set(_["partner_id"] for _ in json_response["flows"]))
    partners = ric_entities_data(partner_ids) if len(partner_ids) > 0 else []
    json_response["RICentities"] = {
        "reportings": ric_entities_data(reporting_ids)
        if len(reporting_ids) > 0
        else [],
        "partners": partners,
    }

    if len(reporting_ids) == 1 and len(partner_ids) == 1:
        # bilateral : add mirror
        # restrict the mirror flows to the time span of the reporting flows to the partner
        from_year_in_flow = min(_["year"] for _ in json_response["flows"])
        to_year_in_flow = max(_["year"] for _ in json_response["flows"])
        json_response["mirror_flows"] = flows_data(
            partner_ids,
            reporting_ids,
            original_currency,
            from_year_in_flow,
            to_year_in_flow,
            with_sources,
        )

    return json.dumps(json_response)


def get_continent_flows(continents, partner_ids, from_year, to_year, with_sources):
    json_response = {}
    json_response["flows"] = flows_data(
        continents,
        partner_ids,
        False,
        from_year,
        to_year,
        with_sources,
        group_reporting_by="continent",
    )
    if len(partner_ids) == 0:
        partner_ids = list(set(_["partner_id"] for _ in json_response["flows"]))
    partners = ric_entities_data(partner_ids) if len(partner_ids) > 0 else []
    json_response["RICentities"] = {"reportings": continents, "partners": partners}

    return json.dumps(json_response)


def get_continent_flows_for_reporting(
    continents, reporting_ids, from_year, to_year, with_sources
):
    json_response = {
        "flows": flows_data(
            continents,
            reporting_ids,
            False,
            from_year,
            to_year,
            with_sources,
            group_reporting_by="continent",
            search_by_reporting=True,
        )
    }
    partner_ids = list(set(_["partner_id"] for _ in json_response["flows"]))
    partners = ric_entities_data(partner_ids) if partner_ids else []
    reporting_ids = list(set(_["reporting_id"] for _ in json_response["flows"]))
    reportings = ric_entities_data(reporting_ids) if reporting_ids else []
    json_response["RICentities"] = {"reportings": reportings, "partners": partners}

    return json.dumps(json_response, indent=4)


def get_mirror_entities(reporting_id):
    cursor = get_db().cursor()
    cursor.execute(
        """SELECT f.reporting_slug,f.reporting,f.reporting_type,f.continent,group_concat(f.year),rpp.years_from_reporting
                          FROM flow_joined f
                          LEFT OUTER JOIN (
                                SELECT partner_slug,group_concat(year) as years_from_reporting
                                from flow_joined where reporting_slug='%s'
                                group by partner_slug)
                                rpp
                                on rpp.partner_slug=f.reporting_slug
                          WHERE f.partner_slug='%s' and rpp.partner_slug not null
                          group by f.reporting_slug
                          """
        % (reporting_id, reporting_id)
    )
    json_response = []
    for id, r, t, continent, years_from_partner, years_from_reporting in cursor:
        # let's check if the mirror flows partner->reporting match the time span of the reporting->partner flows
        if (
            len(
                set(years_from_partner.split(","))
                & set(years_from_reporting.split(","))
            )
            > 0
        ):
            json_response.append(
                {"RICid": id, "RICname": r, "type": t, "continent": continent}
            )
    return json.dumps(json_response)


def get_reporting_years():
    cursor = get_db().cursor()
    cursor.execute(
        """SELECT distinct year
                      FROM flow_joined
                      Where partner_slug NOT LIKE 'Worl%%'"""
    )
    json_response = []
    for year in cursor:
        json_response.append(year[0])

    return json.dumps(json_response)


def get_reporting_or_partner_entities(types=[], related_to_ids=[], type="reporting"):
    from_prefix = type
    to_prefix = "partner" if type == "reporting" else "reporting"
    cursor = get_db().cursor()
    if "continent" in types:
        types.remove("continent")
        cursor.execute(
            """SELECT [FROM_PREFIX]_continent
                          FROM flow_joined
                          group by [FROM_PREFIX]_continent ORDER BY count(*) DESC""".replace(
                "[FROM_PREFIX]", from_prefix
            )
        )
        json_response = []
        for continent in cursor:
            json_response.append(
                {
                    "RICname": continent[0],
                    "type": "continent",
                }
            )

        if len(types) == 0:
            # nothing to add so return
            return json.dumps(json_response)
    else:
        json_response = []
    type_clause = (
        '[FROM_PREFIX]_type IN ("%s")' % '","'.join(types) if len(types) > 0 else ""
    )
    related_to_clause = (
        " [TO_PREFIX]_slug IN ('%s') " % "','".join(related_to_ids)
        if len(related_to_ids) > 0
        else ""
    )
    if type_clause != "" or related_to_clause != "":
        where_clause = " AND ".join(
            _ for _ in [type_clause, related_to_clause] if _ != ""
        )
        where_clause = "WHERE " + where_clause if where_clause != "" else ""
    else:
        where_clause = ""

    sql = (
        (
            """SELECT distinct [FROM_PREFIX]_slug,[FROM_PREFIX],[FROM_PREFIX]_type,[FROM_PREFIX]_continent, [FROM_PREFIX]_GPH_code
              FROM flow_joined
              %s"""
            % where_clause
        )
        .replace("[FROM_PREFIX]", from_prefix)
        .replace("[TO_PREFIX]", to_prefix)
    )
    cursor.execute(sql)

    for id, r, t, continent, GPH_code in cursor:
        json_response.append(
            {
                "RICid": id,
                "RICname": r,
                "type": t,
                "continent": continent,
                "GPH_code": GPH_code,
            }
        )
    json_response = sorted(json_response, key=lambda k: k["RICid"])
    return json.dumps(json_response)


def get_bilateral_entities():
    cursor = get_db().cursor()
    sql = """select distinct reporting_slug,reporting,reporting_type,reporting_continent
            from flow_joined
            WHERE (partner_slug is not 'Worldestimated'
            and  partner_slug is not 'Worldasreported'
            and partner_slug is not 'Worldasreported2'
            and  partner_slug is not'Worldsumpartners'
            and partner_slug is not 'WorldFedericoTena'
            and partner_slug is not 'Worldbestguess')
            and reporting_type is "GPH_entity"
            group by reporting
            having count(*)>0
        """
    cursor.execute(sql)
    json_response = []
    for id, r, t, continent in cursor:
        json_response.append(
            {"RICid": id, "RICname": r, "type": t, "continent": continent}
        )
    json_response = sorted(json_response, key=lambda k: k["RICid"])
    return json.dumps(json_response)


def get_RICentities():
    return json.dumps(ric_entities_data())


def get_echange_rates():
    cursor = get_db().cursor()
    sql = """SELECT year, modified_currency, rate_to_pounds, source
            FROM exchange_rates
        """
    cursor.execute(sql)
    json_response = []
    for year, modified_currency, rate_to_pounds, source in cursor:
        json_response.append(
            {
                "currency": modified_currency,
                "year": year,
                "rate_to_pounds": rate_to_pounds,
                "source": source,
            }
        )
    json_response = json_response
    return json.dumps(json_response)
