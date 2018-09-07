import csv
from json import JSONDecodeError
import networkx as nx

import requests


ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql"

QUERY_TEMPLATE = """
SELECT
  ?human ?humanLabel ?humanDescription ?image ?birthdate ?deathdate
  ?spouse ?mother ?father ?child
  ?birthplace ?birthplaceLabel
  ?membership ?membershipLabel
  ?affiliation ?affiliationLabel
  ?occupation ?occupationLabel
  ?education ?educationLabel
  ?position ?positionLabel
WHERE {
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }

  ?human wdt:P31 wd:Q5.

  %s

  OPTIONAL { ?human wdt:P18 ?image. }
  OPTIONAL { ?human wdt:P569 ?birthdate. }
  OPTIONAL { ?human wdt:P570 ?deathdate. }
  OPTIONAL { ?human wdt:P26 ?spouse. }
  OPTIONAL { ?human wdt:P25 ?mother. }
  OPTIONAL { ?human wdt:P22 ?father. }
  OPTIONAL { ?human wdt:P40 ?child. }
  OPTIONAL { ?human wdt:P19 ?birthplace. }
  OPTIONAL { ?human wdt:P463/wdt:P1647* ?membership. }
  OPTIONAL { ?human wdt:P1416/wdt:P1647* ?affiliation. }
  OPTIONAL { ?human wdt:P106/wdt:P1647* ?occupation. }
  OPTIONAL { ?human wdt:P69 ?education. }
  OPTIONAL { ?human wdt:P39 ?position. }
}
"""

QUERY_CONDITIONS = [
    (
        "Korean",
        "{ ?human wdt:P27 wd:Q884. } "
        "UNION { ?human wdt:P27 wd:Q423. } "
        "UNION { ?human wdt:P27 wd:Q28233. } "
        "UNION { ?human wdt:P27 wd:Q28179. } "
        "UNION { ?human wdt:P27 wd:Q18097. } ",
    ),
    (
        "who has Korean spouse",
        "?human wdt:P26 ?spouse. "
        "{ ?spouse wdt:P27 wd:Q884. } "
        "UNION { ?spouse wdt:P27 wd:Q423. } "
        "UNION { ?spouse wdt:P27 wd:Q28233. } "
        "UNION { ?spouse wdt:P27 wd:Q28179. } "
        "UNION { ?spouse wdt:P27 wd:Q18097. } ",
    ),
    (
        "who has Korean mother",
        "?human wdt:P25 ?mother. "
        "{ ?mother wdt:P27 wd:Q884. } "
        "UNION { ?mother wdt:P27 wd:Q423. } "
        "UNION { ?mother wdt:P27 wd:Q28233. } "
        "UNION { ?mother wdt:P27 wd:Q28179. } "
        "UNION { ?mother wdt:P27 wd:Q18097. } ",
    ),
    (
        "who has Korean father",
        "?human wdt:P22 ?father. "
        "{ ?father wdt:P27 wd:Q884. } "
        "UNION { ?father wdt:P27 wd:Q423. } "
        "UNION { ?father wdt:P27 wd:Q28233. } "
        "UNION { ?father wdt:P27 wd:Q28179. } "
        "UNION { ?father wdt:P27 wd:Q18097. } ",
    ),
    (
        "who has Korean child",
        "?human wdt:P40 ?child. "
        "{ ?child wdt:P27 wd:Q884. } "
        "UNION { ?child wdt:P27 wd:Q423. } "
        "UNION { ?child wdt:P27 wd:Q28233. } "
        "UNION { ?child wdt:P27 wd:Q28179. } "
        "UNION { ?child wdt:P27 wd:Q18097. } ",
    ),
]

NODES = {
    "persons": (
        ("human", "key"),
        ("humanLabel", "name"),
        ("humanDescription", "description"),
        ("image", "image"),
        ("birthdate", "birth_date"),
        ("deathdate", "death_date"),
    ),
    "birthplaces": (
        ("birthplace", "key"),
        ("birthplaceLabel", "name"),
    ),
    "memberships": (
        ("membership", "key"),
        ("membershipLabel", "name"),
    ),
    "affiliations": (
        ("affiliation", "key"),
        ("affiliationLabel", "name"),
    ),
    "occupations": (
        ("occupation", "key"),
        ("occupationLabel", "name"),
    ),
    "educations": (
        ("education", "key"),
        ("educationLabel", "name"),
    ),
    "positions": (
        ("position", "key"),
        ("positionLabel", "name"),
    ),
}

LINKS = [
    "spouse",
    "mother",
    "father",
    "child",
    "birthplace",
    "membership",
    "affiliation",
    "occupation",
    "education",
    "position",
]

KINSHIP = {'mother', 'father', 'child', 'spouse'}


def main():
    data = []
    for label, condition in QUERY_CONDITIONS:
        print(f'Collecting {label}... ', end='', flush=True)
        query = QUERY_TEMPLATE % condition
        while True:
            try:
                new_data = requests.get(
                    ENDPOINT,
                    {"query": query, "format": "json"}
                ).json()["results"]["bindings"]
                print(len(new_data))

                data += new_data
                break
            except JSONDecodeError:
                pass

    for k, v in NODES.items():
        with open(f"data/{k}.csv", "w", encoding="utf-8") as f:
            extract_nodes(data, k, v, f)

    with open(f"data/links.csv", "w", encoding="utf-8") as f:
        links = extract_links(data, LINKS, f)

    with open(f"data/hubs.csv", "w", encoding="utf-8") as f:
        extract_hubs(links, f)


def extract_nodes(data, node_type, fields, f):
    rows = (tuple(get_value(row, f) for f, _ in fields) for row in data)
    unique_rows = {cols for cols in rows if any(c != "" for c in cols)}
    print(f'Unique {node_type}: {len(unique_rows)}')

    w = csv.writer(f)
    w.writerow([f for _, f in fields])
    for row in sorted(unique_rows, key=lambda r: (r[1:], r[0])):
        w.writerow(row)


def extract_links(data, links, f):
    unique_rows = set()
    for row in data:
        a = get_value(row, "human")
        for link in links:
            b = get_value(row, link)
            if len(b) == 0:
                continue
            unique_rows.add((link, a, b))
    print(f'Unique links: {len(unique_rows)}')

    sorted_rows = sorted(unique_rows)
    w = csv.writer(f)
    w.writerow(["rel", "a", "b"])
    for row in sorted_rows:
        w.writerow(row)
    return sorted_rows


def extract_hubs(links, f):
    print(f'Extract hubs... ', end='', flush=True)
    # build graph from kinship
    g = nx.Graph()
    g.add_edges_from((a, b) for rel, a, b in links if rel in KINSHIP)

    hubs = []
    for _ in range(50):
        # find hub using betweenness centrality
        top = sorted(
            nx.betweenness_centrality(g).items(),
            key=lambda x: x[1], reverse=True
        )[0]
        hubs.append(top[0])

        # remove hub and neighbors, then repeat to find next hubs
        g.remove_nodes_from(list(g.neighbors(top[0])))
        g.remove_node(top[0])

        print(f'#', end='', flush=True)
    print()

    w = csv.writer(f)
    w.writerow(['key'])
    for hub in hubs:
        w.writerow([hub])
    return hubs


def get_value(row, key):
    value = row.get(key, {"value": ""})["value"]
    if value.startswith("http://www.wikidata.org/entity/"):
        value = value[len("http://www.wikidata.org/entity/"):]
    return value


if __name__ == '__main__':
    main()
