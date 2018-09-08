import networkx as nx

KINSHIP = {'mother', 'father', 'child', 'spouse'}


def extract_nodes(data, fields):
    rows = (tuple(get_value(row, f) for f, _ in fields) for row in data)
    unique_rows = {cols for cols in rows if any(c != "" for c in cols)}
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
        hubs.append([top[0]])
        neighbors = list(g.neighbors(top[0]))

        # remove hub and neighbors, then repeat to find next hubs
        g.remove_nodes_from(neighbors)
        g.remove_node(top[0])

        if len(neighbors) < min_degree:
            break

        print(f'#', end='', flush=True)
    print()
    return hubs


def get_value(row, key):
    value = row.get(key, {"value": ""})["value"]
    if value.startswith("http://www.wikidata.org/entity/"):
        value = value[len("http://www.wikidata.org/entity/"):]
    return value
