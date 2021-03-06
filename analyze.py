import re
import networkx as nx

KINSHIP = {'mother', 'father', 'child', 'spouse'}
ITEM_URL_PREFIX = "http://www.wikidata.org/entity/"
IMAGE_URL_PREFIX = 'http://commons.wikimedia.org/'


def extract_nodes(data, fields):
    rows = (tuple(get_value(row, f) for f, _ in fields) for row in data)
    added_keys = set()
    unique_rows = []
    for cols in rows:
        key = cols[0]
        if key == "" or key in added_keys:
            continue
        added_keys.add(key)
        unique_rows.append(cols)
    return sorted(unique_rows, key=lambda r: (r[1:], r[0]))


def extract_links(data, links):
    unique_rows = set()
    for row in data:
        source = get_value(row, "human")
        for link in links:
            target = get_value(row, link)
            if len(target) == 0:
                continue
            unique_rows.add((link, source, target))
    return sorted(unique_rows)


def extract_hubs(links, min_degree):
    print(f'Extract hubs... ', end='', flush=True)
    # build graph from kinship
    g = nx.Graph()
    g.add_edges_from(
        (source, target)
        for rel, source, target in links
        if rel in KINSHIP
    )

    hubs = []
    while True:
        # find hub using betweenness centrality
        top = sorted(
            nx.betweenness_centrality(g).items(),
            key=lambda x: x[1], reverse=True
        )[0]

        neighbors = list(g.neighbors(top[0]))
        hub = [top[0], top[1], len(neighbors)]
        hubs.append(hub)

        # remove hub and neighbors, then repeat to find next hubs
        g.remove_nodes_from(neighbors)
        g.remove_node(top[0])

        if len(neighbors) < min_degree:
            break

        print(f'#', end='', flush=True)
    print()
    return hubs


def calc_stats(links):
    g = build_kinship_graph(links)
    n_nodes = g.number_of_nodes()
    n_edges = g.number_of_edges()

    subgraphs = (g.subgraph(c) for c in nx.connected_components(g))
    subgraphs = sorted([
        {
            "hub": sorted(nx.betweenness_centrality(subg).items(),
                          key=lambda x: x[1],
                          reverse=True)[0][0],
            "nodes": sorted(list(subg.nodes())),
            "nNodes": subg.number_of_nodes(),
            "nEdges": subg.number_of_edges(),
            "avgShortestPath": nx.average_shortest_path_length(subg),
        }
        for subg in subgraphs
    ], key=lambda subg: subg["nNodes"], reverse=True)

    return {
        "nNodes": n_nodes,
        "nEdges": n_edges,
        "nSubgraphs": len(subgraphs),
        "subgraphs": subgraphs,
    }


def build_kinship_graph(links):
    g = nx.Graph()
    g.add_edges_from(
        (source, target)
        for rel, source, target in links
        if rel in KINSHIP
    )
    return g


def get_value(row, key):
    value = row.get(key, {"value": ""})["value"]

    # Remove entity URL prefix
    if value.startswith(ITEM_URL_PREFIX):
        value = value[len(ITEM_URL_PREFIX):]

    # Replace http image url to https
    if key == 'image' and value.startswith(IMAGE_URL_PREFIX):
        value = 'https' + value[4:]

    # Convert gender values
    if key == 'gender':
        if value == 'Q6581072':
            return 'F'
        elif value == 'Q6581097':
            return 'M'
        else:
            # Non-binaries
            return 'Q'

    # Shorten description
    if key == 'humanDescription':
        value = re.sub(r'^(대한민국|한국)의 ', '', value)
        value = re.sub(r'^조선민주주의인민공화국의 ', '북한의 ', value)
        return value

    # Convert datetime values
    if key in ["birthdate", "deathdate"] and len(value) == 20:
        return value[0:4] + value[5:7] + value[8:10]

    return value
