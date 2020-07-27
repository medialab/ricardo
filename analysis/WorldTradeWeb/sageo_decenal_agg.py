import csv
import itertools

with open('./data/SAGEO_RICardo_edges.csv', 'r', encoding='utf8') as input_f, open('./data/SAGEO_RICardo_periode_edges.csv', 'w', encoding='utf8') as output_f:
    edges = csv.DictReader(input_f)
    agg_edges_csv = csv.DictWriter(output_f, fieldnames=('idorigine','iddestination','volume','periode'))
    agg_edges_csv.writeheader()
    period_group = lambda e : (e['idorigine'],e['iddestination'],e['periode'])
    edges = sorted(edges, key = period_group)
    for key, agg_edges in itertools.groupby(edges, key = period_group):
        agg_edges_csv.writerow({'idorigine':key[0], 'iddestination':key[1], 'periode':key[2], 'volume': sum(float(e['volume']) for e in agg_edges if e['volume'] !='undefined')})