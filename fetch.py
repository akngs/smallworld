import csv
import json
import os
import shutil
from json import JSONDecodeError

import requests

from analyze import extract_nodes, extract_links, extract_hubs, calc_stats

ENDPOINT = "https://query.wikidata.org/bigdata/namespace/wdq/sparql"

QUERY_TEMPLATE = """
SELECT
  ?human ?humanLabel ?humanDescription ?gender ?image ?birthdate ?deathdate
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

  ?human wdt:P21 ?gender.
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
        "UNION { ?human wdt:P27 wd:Q18097. } "
        "UNION { ?human wdt:P27 wd:Q503585. } "
    ),
    (
        "who has Korean spouse",
        "?human wdt:P26 ?spouse. "
        "{ ?spouse wdt:P27 wd:Q884. } "
        "UNION { ?spouse wdt:P27 wd:Q423. } "
        "UNION { ?spouse wdt:P27 wd:Q28233. } "
        "UNION { ?spouse wdt:P27 wd:Q28179. } "
        "UNION { ?spouse wdt:P27 wd:Q18097. } "
        "UNION { ?spouse wdt:P27 wd:Q503585. } "
    ),
    (
        "who has Korean mother",
        "?human wdt:P25 ?mother. "
        "{ ?mother wdt:P27 wd:Q884. } "
        "UNION { ?mother wdt:P27 wd:Q423. } "
        "UNION { ?mother wdt:P27 wd:Q28233. } "
        "UNION { ?mother wdt:P27 wd:Q28179. } "
        "UNION { ?mother wdt:P27 wd:Q18097. } "
        "UNION { ?mother wdt:P27 wd:Q503585. } "
    ),
    (
        "who has Korean father",
        "?human wdt:P22 ?father. "
        "{ ?father wdt:P27 wd:Q884. } "
        "UNION { ?father wdt:P27 wd:Q423. } "
        "UNION { ?father wdt:P27 wd:Q28233. } "
        "UNION { ?father wdt:P27 wd:Q28179. } "
        "UNION { ?father wdt:P27 wd:Q18097. } "
        "UNION { ?father wdt:P27 wd:Q503585. } "
    ),
    (
        "who has Korean child",
        "?human wdt:P40 ?child. "
        "{ ?child wdt:P27 wd:Q884. } "
        "UNION { ?child wdt:P27 wd:Q423. } "
        "UNION { ?child wdt:P27 wd:Q28233. } "
        "UNION { ?child wdt:P27 wd:Q28179. } "
        "UNION { ?child wdt:P27 wd:Q18097. } "
        "UNION { ?child wdt:P27 wd:Q503585. } "
    ),
]

NODES = {
    "persons": (
        ("human", "key"),
        ("humanLabel", "name"),
        ("humanDescription", "description"),
        ("gender", "gender"),
        ("image", "image"),
        ("birthdate", "birthdate"),
        ("deathdate", "deathdate"),
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


def main():
    # Load raw data
    force_fetch = os.environ.get('FORCE_FETCH', '0') == '1'
    if force_fetch or not os.path.exists('data/raw.json'):
        data = fetch_data()
        with open('data/raw.json', 'w', encoding="utf-8") as f:
            json.dump(data, f)
    else:
        with open('data/raw.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

    # Extract nodes
    nodes = {}
    for key, fields in NODES.items():
        rows = extract_nodes(data, fields)
        print(f'Unique {key}: {len(rows)}')
        header = [field for _, field in fields]
        with open(f"data/{key}.csv", "w", encoding="utf-8") as f:
            to_csv(rows, header, f)

        nodes[key] = {}
        for row in rows:
            node = dict(zip(header, row))
            nodes[key][node["key"]] = node

    # Extract links
    links = extract_links(data, LINKS)
    print(f'Unique links: {len(links)}')
    with open(f"data/links.csv", "w", encoding="utf-8") as f:
        to_csv(links, ["rel", "source", "target"], f)

    # Extract hubs
    hubs = extract_hubs(links, 3)[:100]
    with open(f"data/hubs.csv", "w", encoding="utf-8") as f:
        to_csv(hubs, ["key", "score", "degree"], f)

    # Generate markdowns for hubs
    shutil.rmtree('docs/_hubs/', ignore_errors=True)
    os.mkdir('docs/_hubs')

    for key, score, degree in hubs:
        person = nodes['persons'][key]
        with open(f"docs/_hubs/{person['key']}.md", "w", encoding="utf-8") as f:
            f.write("\n".join([
                "---",
                "layout: hubs",
                f"key: {person['key']}",
                f"title: {person['name']}",
                f"name: {person['name']}",
                f"image: {person['image']}",
                f"description: {person['description']}",
                f"score: {score}",
                f"degree: {degree}",
                "---",
            ]))

    # Calculate statistics
    print(f'Calculate statistics...', end='', flush=True)
    stats = calc_stats(links)
    subg = stats['subgraphs'][0]
    print()
    print(f'- n_nodes: {stats["nNodes"]}')
    print(f'- n_edges: {stats["nEdges"]}')
    print(f'- n_subgraphs: {len(stats["subgraphs"])}')
    print(f'- max subgraph n_nodes: {subg["nNodes"]}')
    print(f'- max subgraph avg. shortest path: {subg["avgShortestPath"]}')
    with open(f"data/stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)


def fetch_data():
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
    return data


def to_csv(rows, fields, f):
    w = csv.writer(f)
    w.writerow(fields)
    w.writerows(rows)


if __name__ == '__main__':
    main()
