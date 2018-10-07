declare var jsnx: any

import * as d3 from "d3"

interface Node {
  type: string
  key: string
  name: string
  links: Link<Node, Node>[]
}

export interface PersonNode extends Node {
  description?: string
  birthdate?: Date
  estimateBirthdate?: Date
  deathdate?: Date
  image?: string
  gender?: string
  info: { [key: string]: Node[] }
}

interface Link<S extends Node, T extends Node> {
  source: S
  target: T
  rel: string
}

interface GraphStats {
  nNodes: number
  nEdges: number
  subgraphs: {
    nodes: PersonNode[],
    nNodes: number,
    nEdges: number,
    avgShortestPath: number,
  }[]
}

interface JsnxGraph {
  addEdge: (a: string, b: string) => void
}

interface DataSet {
  nodes: Node[]
  nodeMap: Map<string, Node>
  links: Link<Node, Node>[]
  stats: GraphStats
}

export interface GraphNode extends PersonNode, d3.SimulationNodeDatum {
  selected: boolean
  shown: boolean
  fullyExpanded: boolean
}

interface GraphManipulation {
  show: (node: GraphNode) => void
  hide: (node: GraphNode) => void
  expand: (node: GraphNode, depth?: number) => void
  select: (node: GraphNode) => void
  deselect: () => void
}

interface GraphDataSource {
  allNodes: GraphNode[]
  visibleNodes: GraphNode[]
  visibleLinks: Link<GraphNode, GraphNode>[]
}

interface GraphListener {
  onSelect?: (network: Graph, node: GraphNode) => void
  onDeselect?: (network: Graph, node: GraphNode) => void
}

const parseTime = d3.timeParse('%Y%m%d')

export class Loader {
  private readonly dataHash: string

  constructor(dataHash: string) {
    this.dataHash = dataHash
  }

  async loadData(): Promise<DataSet> {
    const urlPrefix = location.hostname === '127.0.0.1' || location.hostname === 'localhost' ?
      `/smallworld/data/` :
      `//cdn.rawgit.com/akngs/smallworld/${this.dataHash}/data/`

    const data = await Promise.all([
      d3.csv(urlPrefix + 'affiliations.csv', raw => this.parseNode(raw, 'affiliation')),
      d3.csv(urlPrefix + 'birthplaces.csv', raw => this.parseNode(raw, 'birthplaces')),
      d3.csv(urlPrefix + 'educations.csv', raw => this.parseNode(raw, 'education')),
      d3.csv(urlPrefix + 'memberships.csv', raw => this.parseNode(raw, 'membership')),
      d3.csv(urlPrefix + 'occupations.csv', raw => this.parseNode(raw, 'occupation')),
      d3.csv(urlPrefix + 'positions.csv', raw => this.parseNode(raw, 'position')),
      d3.csv(urlPrefix + 'persons.csv', raw => this.parsePerson(raw)),
      d3.csv(urlPrefix + 'links.csv'),
      d3.json(urlPrefix + 'stats.json'),
    ])

    // Generate concatenated node list
    const nodes: Node[] = [
      ...data[0], ...data[1], ...data[2], ...data[3], ...data[4], ...data[5],
      ...data[6],
    ]

    // Generate key-value maps for nodes
    const nodeMap: Map<string, Node> = new Map()
    nodes.forEach(node => nodeMap.set(node.key, node))

    // Process links
    const links = data[7]
      .map((raw: any) => {
        return {
          source: nodeMap.get(raw.source),
          target: nodeMap.get(raw.target),
          rel: raw.rel,
        }
      })
      .filter((raw: any) => {
        return raw.source && raw.target
      }) as Link<Node, Node>[]

    links.forEach(link => {
      link.source.links.push(link)
      link.target.links.push(link)
    })

    // Generate brief info for persons
    const personNodes = nodes.filter(node => node.type === 'person') as PersonNode[]
    personNodes.forEach(person => {
      person.info = {}
      d3.nest<Link<Node, Node>>()
        .key(link => link.rel)
        .entries(person.links.filter(link => link.source === person))
        .forEach(g => {
          person.info[g.key] = g.values.map((link: Link<Node, Node>) => link.target)
        })
    })

    // Estimate birth dates
    personNodes.forEach(
      node => node.estimateBirthdate = this.estimateBirthdate(node)
    )

    // Process stats
    const stats = data[8] as any
    stats.subgraphs.forEach((g: any) => {
      g.nodes = g.nodes.map((key: string) => nodeMap.get(key))
    })

    return {nodes, links, nodeMap, stats}
  }

  private parseNode(raw: any, type: string): Node {
    return {
      type,
      key: raw.key,
      name: raw.name,
      links: []
    }
  }

  private parsePerson(raw: any): PersonNode {
    return {
      type: 'person',
      key: raw.key,
      name: raw.name,
      description: raw.description,
      gender: raw.gender,
      image: raw.image,
      birthdate: raw['birthdate'] ? parseTime(raw['birthdate']) as Date : undefined,
      deathdate: raw['deathdate'] ? parseTime(raw['deathdate']) as Date : undefined,
      links: [],
      info: {},
    }
  }

  private estimateBirthdate(node: PersonNode): Date | undefined {
    // If there's a birthday, use it
    if (node.birthdate) return node.birthdate

    // Try average of spouses' birthday
    const spouses = node.links
      .filter(link => link.rel === 'spouse')
      .map(link => (link.target as PersonNode).birthdate)
      .filter(date => !!date) as Date[]
    const spouseAvg = spouses.length ? d3.mean(spouses) : undefined
    if (spouseAvg) return new Date(+spouseAvg)

    // Try average of siblings' birthday
    const siblings = node.links
      .filter(link => link.rel === 'father' || link.rel === 'mother')
      .map(link => (link.target as PersonNode).links)
      .reduce(
        (flat, next) => flat.concat(next),
        []
      )
      .filter(link => link.rel === 'child')
      .map(link => (link.target as PersonNode).birthdate)
      .filter(date => !!date) as Date[]
    const siblingsAvg = siblings.length ? d3.mean(siblings) : undefined
    if (siblingsAvg) return new Date(+siblingsAvg)

    // Try average of parents' birthday
    const parents = node.links
      .filter(link => link.rel === 'father' || link.rel === 'mother')
      .map(link => (link.target as PersonNode).birthdate)
      .filter(date => !!date) as Date[]
    const parentsMax = parents.length ? d3.max(parents) : undefined
    if (parentsMax) return new Date(+parentsMax + 25 * 365 * 24 * 60 * 60 * 1000)

    // Try average of children's birthday
    const children = node.links
      .filter(link => link.rel === 'child')
      .map(link => (link.target as PersonNode).birthdate)
      .filter(date => !!date) as Date[]
    const childrenMin = children.length ? d3.min(children) : undefined
    if (childrenMin) return new Date(+childrenMin - 25 * 365 * 24 * 60 * 60 * 1000)

    return undefined
  }
}

export class Graph implements GraphManipulation, GraphDataSource {
  private static readonly KINSHIP = new Set(['mother', 'father', 'child', 'spouse'])

  private readonly _nodeMap: Map<string, GraphNode>
  private readonly _nodes: GraphNode[]
  private readonly _links: Link<GraphNode, GraphNode>[]
  private readonly _jsnxGraph: JsnxGraph
  private readonly _listener: GraphListener
  private _selectedNode: GraphNode | null

  constructor(dataSet: DataSet, listener?: GraphListener) {

    // Convert Nodes into NetworkNodes
    this._nodes = dataSet.nodes
      .filter(node => node.type === 'person')
      .map(node => {
        return {
          ...node,
          selected: false,
          shown: false,
          fullyExpanded: false,
        }
      }) as GraphNode[]

    // Build map for fast lookup
    this._nodeMap = new Map()
    this._nodes.forEach(node => this._nodeMap.set(node.key, node))

    // Replace links in nodes
    this._nodes.forEach(node => {
      node.links = node.links
        .filter(link => this.isKinship(link))
        .map(link => {
          return {
            source: this._nodeMap.get(link.source.key),
            target: this._nodeMap.get(link.target.key),
            rel: link.rel,
          }
        }) as Link<GraphNode, GraphNode>[]
    })

    // Convert links
    this._links = dataSet.links
      .filter(link => this.isKinship(link))
      .map(link => {
        return {
          source: this.getNode(link.source.key),
          target: this.getNode(link.target.key),
          rel: link.rel,
        }
      }) as Link<GraphNode, GraphNode>[]

    this._jsnxGraph = new jsnx.Graph()
    this._links.forEach(link => this._jsnxGraph.addEdge(link.source.key, link.target.key))

    this._selectedNode = null
    this._listener = listener || {}
  }

  show(node: GraphNode): void {
    if (node.shown) return

    node.shown = true
    this.updateFullyExpandedFlag(node)
  }

  hide(node: GraphNode): void {
    if (!node.shown) return

    node.shown = false
    node.x = undefined
    node.y = undefined

    if (node.selected) this.deselect()
    this.updateFullyExpandedFlag(node)
  }

  expand(node: GraphNode, depth: number = 1, visits?: Set<GraphNode>): void {
    if (!visits) visits = new Set()
    if (visits.has(node)) return

    this.show(node)
    visits.add(node)

    if (depth === 0) return
    if (!node.links) return

    node.links
      .filter(link => this.isKinship(link))
      .forEach(link => {
        this.expand(link.source as GraphNode, depth - 1, visits)
        this.expand(link.target as GraphNode, depth - 1, visits)
      })
  }

  select(node: GraphNode) {
    if (this._selectedNode === node) return
    if (this._selectedNode) this.deselect()

    node.selected = true
    this._selectedNode = node

    this.show(node)
    if (this._listener.onSelect) {
      this._listener.onSelect(this, node)
    }
  }

  deselect(): void {
    if (!this._selectedNode) return

    const node = this._selectedNode

    this._selectedNode.selected = false
    this._selectedNode = null

    if (this._listener.onDeselect) {
      this._listener.onDeselect(this, node)
    }
  }

  findShortestPath(node1: GraphNode, node2: GraphNode): GraphNode[] {
    return jsnx.bidirectionalShortestPath(this._jsnxGraph, node1.key, node2.key).map((key: string) => this._nodeMap.get(key))
  }

  getPersonBrief(node: PersonNode): string {
    // Try description
    const description = node.description
    if (description) {
      const short = description.replace(/(한국의|대한민국의) /, '')
      return `${node.name} (${short})`
    }

    // Try birthdate and deathdate
    const birthdate = node.birthdate || null
    const deathdate = node.deathdate || null
    let birth
    if (birthdate) {
      birth = `${birthdate.getFullYear()}`
    } else if (deathdate) {
      birth = `?-${deathdate.getFullYear()}`
    }
    if (birth) return `${node.name} (${birth})`

    // Use name as fallback
    return `${node.name}`
  }

  getNode(key: string): GraphNode {
    const node = this._nodeMap.get(key)
    if (!node) throw new Error(`Node not found: ${key}`)
    return node
  }

  getNodesByName(name: string): GraphNode[] {
    return this._nodes.filter(n => n.name === name)
  }

  get allNodes(): GraphNode[] {
    return Array.from(this._nodes.values())
  }

  get visibleNodes(): GraphNode[] {
    return this._nodes.filter(node => node.shown)
  }

  get selectedNode(): GraphNode | null {
    return this._selectedNode
  }

  get visibleLinks(): Link<GraphNode, GraphNode>[] {
    return this._links.filter(link => {
      return (
        // Test if both source and target nodes are visible
        (link.source.shown && link.target.shown) &&
        // Do not include reversed links since all relationships are symmetric
        (
          link.rel === 'child' ||
          link.rel === 'spouse' && link.source.gender === 'F'
        )
      )
    })
  }

  private isKinship(link: Link<Node, Node>): boolean {
    return Graph.KINSHIP.has(link.rel)
  }

  private updateFullyExpandedFlag(node: GraphNode): void {
    node.fullyExpanded = this.checkIfFullyExpanded(node)
    node.links
      .filter(link => this.isKinship(link))
      .forEach(link => {
        const source = link.source as GraphNode
        const target = link.target as GraphNode
        source.fullyExpanded = this.checkIfFullyExpanded(source)
        target.fullyExpanded = this.checkIfFullyExpanded(target)
      })
  }

  private checkIfFullyExpanded(node: GraphNode): boolean {
    return node.links
      .filter(link => this.isKinship(link))
      .filter(link => {
        const source = link.source as GraphNode
        const target = link.target as GraphNode
        return !source.shown || !target.shown
      })
      .length === 0
  }
}

export class GraphRenderer {
  private readonly MARGIN_T = 20
  private readonly MARGIN_B = 20
  private readonly MARGIN_L = 20
  private readonly MARGIN_R = 60

  private readonly svg: SVGElement
  private readonly graphDs: GraphDataSource
  private readonly graphMan?: GraphManipulation

  private linksSel: d3.Selection<SVGLineElement, Link<GraphNode, GraphNode>, SVGGElement, undefined>
  private nodesSel: d3.Selection<SVGGElement, GraphNode, SVGGElement, undefined>
  private readonly root: d3.Selection<SVGGElement, undefined, null, undefined>;
  private readonly forceSim: d3.Simulation<GraphNode, Link<GraphNode, GraphNode>>
  private readonly forceLink: d3.ForceLink<GraphNode, Link<GraphNode, GraphNode>>
  private readonly timeScale: d3.ScaleTime<number, number>
  private readonly timeAxis: d3.Axis<number>
  private useTimeScale: boolean

  private readonly clickHandler: (this: SVGGElement, node: GraphNode) => void
  private readonly dragHandler: d3.DragBehavior<SVGGElement, GraphNode, any>

  constructor(svg: SVGElement, graphDs: GraphDataSource, graphMan?: GraphManipulation) {
    this.svg = svg
    this.graphDs = graphDs
    this.graphMan = graphMan

    // Initialize SVG
    this.svg.innerHTML = `
      <defs>
          <marker id="arrowMarker" viewBox="0 -5 10 10" refX="23" refY="0" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,-5L10,0L0,5" class="arrow"></path>
          </marker>
          <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
              <feOffset dx="1" dy="1" result="offsetblur" />
              <feFlood flood-color="#000" />
              <feComposite in2="offsetblur" operator="in" />
              <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
              </feMerge>
          </filter>
      </defs>
    `
    // Initialize scales
    this.useTimeScale = false
    this.timeScale = d3.scaleTime()
    this.timeAxis = d3.axisBottom(this.timeScale)
      .tickFormat(d => "" + new Date(+d).getFullYear()) as d3.Axis<number>

    this.root = d3.select<SVGElement, undefined>(this.svg)
      .append<SVGGElement>('g')
      .attr('class', 'root')
    this.root.append<SVGGElement>('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0, 50)')
      .call(this.timeAxis)
    this.linksSel = this.root
      .append<SVGGElement>('g').attr('class', 'links')
      .selectAll<SVGLineElement, Link<GraphNode, GraphNode>>('.link')
      .data(this.graphDs.visibleLinks)
    this.nodesSel = this.root.append<SVGGElement>('g').attr('class', 'nodes')
      .selectAll<SVGGElement, GraphNode>('.node')
      .data(this.graphDs.visibleNodes)

    // Initialize layout simulation
    this.forceLink = d3.forceLink<GraphNode, Link<GraphNode, GraphNode>>(this.linksSel.data())
      .distance(50)
    this.forceSim = d3.forceSimulation<GraphNode, Link<GraphNode, GraphNode>>(this.nodesSel.data())
      .alphaDecay(0.02)
      .on('tick', this.tick.bind(this))
    this.setUseTimeScale(false)

    // Click and drag handler
    const self = this
    this.clickHandler = function (this: SVGGElement, node: GraphNode) {
      self.onNodeClick(this, node)
    }
    this.dragHandler = d3.drag<SVGGElement, GraphNode>()
      .on('start', function (node) {
        self.onNodeDragStart(this, node)
      })
      .on('drag', function (node) {
        self.onNodeDrag(this, node)
      })
      .on('end', function (node) {
        self.onNodeDragEnd(this, node)
      })

    this.resize()
  }

  setUseTimeScale(enable: boolean): void {
    this.useTimeScale = enable

    if (this.useTimeScale) {
      this.forceSim
        .force("center", null)
        .force("link", null)
        .force("x", d3.forceX((node: GraphNode) => {
          const birthdate = node.estimateBirthdate
          return this.timeScale(birthdate ? birthdate.getTime() : 0)
        }))
        .force("y", d3.forceY(0).strength(0.1))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("collide", d3.forceCollide(30))
    } else {
      this.forceSim
        .force("center", d3.forceCenter(0, 0))
        .force("link", this.forceLink)
        .force("x", d3.forceX(0).strength(0.1))
        .force("y", d3.forceY(0).strength(0.1))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("collide", d3.forceCollide(30))
    }
  }

  rerender(selectedNode: GraphNode | null): void {
    const visibleNodes = this.graphDs.visibleNodes
    const visibleLinks = this.graphDs.visibleLinks

    // Update scales
    this.timeScale.domain(
      d3.extent(visibleNodes.map(n => n.estimateBirthdate ? n.estimateBirthdate.getTime() : 0)) as number[]
    )

    // Update nodes
    // 1. Join new data
    this.nodesSel = this.nodesSel
      .data(visibleNodes, node => node.key)

    // 2. Exit
    this.nodesSel.exit().remove()

    // 3. Enter and update
    this.nodesSel = this.nodesSel.enter()
      .append<SVGGElement>('g')
      .attr('class', 'node person')
      .each(function (node) {
        d3.select<SVGGElement, GraphNode>(this).append('circle')
        d3.select<SVGGElement, GraphNode>(this).append('text')
          .attr('class', 'name')
          .attr('transform', 'translate(8, 8)')
          .text(node.name)
        if (selectedNode) {
          node.x = (selectedNode.x || 0) + 10 * (Math.random() - 0.5)
          node.y = (selectedNode.y || 0) + 10 * (Math.random() - 0.5)
        }
      })
      .on('click', this.clickHandler)
      .call(this.dragHandler)
      .merge(this.nodesSel)
    this.nodesSel
      .each(function (node) {
        d3.select<SVGGElement, GraphNode>(this).select('circle')
          .transition()
          .duration(1500)
          .ease(d3.easeElastic)
          .attr('r', node => node.fullyExpanded ? 5 : 7)
          .attr('filter', node => node.selected ? 'url(#dropShadow)' : '')
      })

    // Update links
    // 1. Join new data
    this.linksSel = this.linksSel
      .data(visibleLinks)

    // 2. Exit
    this.linksSel.exit().remove()

    // 3. Enter and update
    this.linksSel = this.linksSel.enter()
      .append<SVGLineElement>('line')
      .merge(this.linksSel)
      .attr('class', d => `link ${d.rel}`)
      .attr('marker-end', d => d.rel === 'child' ? 'url(#arrowMarker)' : '')

    // 4. Update axis
    this.updateAxis()

    // Trigger layout
    this.forceSim.nodes(this.nodesSel.data())
    this.forceLink.links(this.linksSel.data())
    this.forceSim.alpha(1.0)
    this.forceSim.restart()
  }

  /**
   * Resize SVG according to the parent node
   */
  resize(): void {
    const parent: HTMLElement = this.svg.parentNode as HTMLElement
    const width = parent.clientWidth
    const height = parent.clientHeight

    d3.select('svg')
      .attr('width', width)
      .attr('height', height)
      .select('.root')
      .attr('transform', `translate(${width * 0.5}, ${height * 0.5})`)

    this.timeScale.range(
      [width * -0.5 + this.MARGIN_L, width * 0.5 - this.MARGIN_R]
    )
    this.updateAxis()

    this.forceSim.alpha(1.0)
    this.forceSim.restart()
  }

  private tick(): void {
    // Calculate bounding box
    const width = +(this.svg.getAttribute('width') || 0)
    const height = +(this.svg.getAttribute('height') || 0)
    const x0 = width * -0.5 + this.MARGIN_L
    const x1 = width * +0.5 - this.MARGIN_R
    const y0 = height * -0.5 + this.MARGIN_T
    const y1 = height * +0.5 - this.MARGIN_B

    // Update nodes
    this.nodesSel
      .classed('selected', node => node.selected)
      .classed('fully-expanded', node => node.fullyExpanded)
      .attr('transform', node => {
        return `translate(${node.x = Math.max(x0, Math.min(x1, node.x || 0))}, ${node.y = Math.max(y0, Math.min(y1, node.y || 0))})`
      })

    // Update links
    this.linksSel
      .attr('x1', node => node.source.x || 0)
      .attr('y1', node => node.source.y || 0)
      .attr('x2', node => node.target.x || 0)
      .attr('y2', node => node.target.y || 0)
  }

  private onNodeClick(element: SVGGElement, node: GraphNode): void {
    if (!this.graphMan) return

    if (d3.event['altKey']) {
      this.graphMan.hide(node)
    } else if (node.selected) {
      this.graphMan.deselect()
    } else if (d3.event['shiftKey']) {
      this.graphMan.select(node)
    } else {
      this.graphMan.select(node)
      this.graphMan.expand(node)
    }
    this.rerender(node)
  }

  private onNodeDragStart(element: SVGGElement, node: GraphNode): void {
    d3.select(element).classed('drag', true)
    node.x = node.fx = d3.event.x
    node.y = node.fy = d3.event.y
    this.forceSim.alphaTarget(0.3).restart()
  }

  private onNodeDrag(element: SVGGElement, node: GraphNode): void {
    node.x = node.fx = d3.event.x
    node.y = node.fy = d3.event.y

    d3.select<SVGGElement, Node>(element)
      .attr("transform", `translate(${node.x}, ${node.y})`)
  }

  private onNodeDragEnd(element: SVGGElement, node: GraphNode): void {
    d3.select(element).classed('drag', false)
    if (!node.selected) {
      delete node.fx
      delete node.fy
    }
    this.forceSim.alphaTarget(0)
  }

  private updateAxis(): void {
    const width = +(this.svg.getAttribute('width') || 0)
    this.timeAxis.ticks(Math.max(2, Math.floor(width / 150)))

    this.root.select('g.axis')
      .transition()
      .duration(1000)
      .call(this.timeAxis as any)
      .attr('opacity', this.useTimeScale ? 0.6 : 0)
  }
}
