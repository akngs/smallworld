declare let jsnx: any

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
  highlighted: boolean
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
    if (description) `${node.name} (${description})`

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
          link.rel === 'spouse' && link.source.gender === 'M'
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
  private readonly GRID_UNIT = 32

  private readonly svg: SVGElement
  private readonly graphDs: GraphDataSource
  private readonly graphMan?: GraphManipulation

  private linksSel: d3.Selection<SVGLineElement, Link<GraphNode, GraphNode>, SVGGElement, undefined>
  private nodesSel: d3.Selection<SVGGElement, GraphNode, SVGGElement, undefined>
  private readonly root: d3.Selection<SVGGElement, undefined, null, undefined>;
  private readonly forceSim: d3.Simulation<GraphNode, Link<GraphNode, GraphNode>>
  private readonly forceLink: d3.ForceLink<GraphNode, Link<GraphNode, GraphNode>>

  private useAutoColor: boolean
  private readonly autoColor: d3.ScaleOrdinal<string, any>

  private readonly timeAxis: d3.Axis<number>
  private useTimeScale: boolean
  private readonly timeScale: d3.ScaleTime<number, number>

  private bbox: {x0: number, x1: number, y0: number, y1: number}

  private readonly clickHandler: (this: SVGGElement, node: GraphNode) => void
  private readonly doubleclickHandler: (this: SVGGElement, node: GraphNode) => void
  private readonly mouseoverHandler: (this: SVGGElement, node: GraphNode) => void
  private readonly mouseoutHandler: (this: SVGGElement, node: GraphNode) => void
  private readonly dragHandler: d3.DragBehavior<SVGGElement, GraphNode, any>

  constructor(svg: SVGElement, graphDs: GraphDataSource, graphMan?: GraphManipulation) {
    this.svg = svg
    this.graphDs = graphDs
    this.graphMan = graphMan

    // Initialize SVG
    this.svg.innerHTML = `
      <defs>
          <marker id="arrowMarker" viewBox="0 -5 10 10" refX="20" refY="-1.5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,-5L10,0L0,5" class="arrow"></path>
          </marker>
          <marker id="arrowMarkerHighlighted" viewBox="0 -5 10 10" refX="20" refY="-1.5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,-5L10,0L0,5" class="arrow highlighted"></path>
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
    // 1. Color scale: Tableau10 except for gray
    const tableau10 = ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f']
      .map(c => (d3.color(c) as any).darker(0.1))
    this.useAutoColor = true
    this.autoColor = d3.scaleOrdinal(tableau10)

    // 2. Time scale
    this.useTimeScale = false
    this.timeScale = d3.scaleTime()
    this.timeAxis = d3.axisBottom(this.timeScale)
      .tickFormat(d => "" + new Date(+d).getFullYear()) as d3.Axis<number>

    // Initialize SVG groups
    this.root = d3.select<SVGElement, undefined>(this.svg)
      .append<SVGGElement>('g')
      .attr('class', 'root')
    this.root.append<SVGGElement>('g')
      .attr('class', 'grid')
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
      .distance(80)
    this.forceSim = d3.forceSimulation<GraphNode, Link<GraphNode, GraphNode>>(this.nodesSel.data())
      .alphaDecay(0.05)
      .on('tick', this.tick.bind(this))
    this.setUseTimeScale(false)

    // Bounding box
    this.bbox = {x0: 0, x1: 0, y0: 0, y1: 0}

    // Event handlers
    const self = this
    this.clickHandler = function (this: SVGGElement, node: GraphNode) {
      self.onNodeClick(this, node)
    }
    this.doubleclickHandler = function (this: SVGGElement, node: GraphNode) {
      self.onNodeDoubleclick(this, node)
    }
    this.mouseoverHandler = function (this: SVGGElement, node: GraphNode) {
      self.onNodeMouseover(this, node)
    }
    this.mouseoutHandler = function (this: SVGGElement, node: GraphNode) {
      self.onNodeMouseout(this, node)
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

  setUseAutoColor(enable: boolean): void {
    this.useAutoColor = enable
  }

  setUseTimeScale(enable: boolean): void {
    this.useTimeScale = enable

    if (this.useTimeScale) {
      this.forceSim
        .force("link", this.forceLink.strength(0.01))
        .force("x", d3.forceX((node: GraphNode) => {
          const date = node.estimateBirthdate
          return this.timeScale(date ? date.getTime() : 0)
        }))
        .force("y", d3.forceY(0).strength(0.05))
        .force("charge", d3.forceManyBody().distanceMax(150).strength(-150))
        .force("collide", d3.forceCollide(30))
    } else {
      this.forceSim
        .force("link", this.forceLink.strength(1))
        .force("x", d3.forceX(0).strength(0.01))
        .force("y", d3.forceY(0).strength(0.01))
        .force("charge", d3.forceManyBody().distanceMax(150).strength(-150))
        .force("collide", d3.forceCollide(30))
    }
  }

  rerender(selectedNode: GraphNode | null, triggerLayout: boolean): void {
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
    const color = this.autoColor
    const useAutoColor = this.useAutoColor

    this.nodesSel = this.nodesSel.enter()
      .append<SVGGElement>('g')
      .attr('class', 'node person')
      .each(function (node: GraphNode) {
        d3.select<SVGGElement, GraphNode>(this).append('circle')
        const text = d3.select<SVGGElement, GraphNode>(this).append('text')
          .attr('class', 'main')
          .attr('x', 10)
          .attr('y', '0.4em')
        text.append('tspan')
          .attr('class', 'name')
          .text(node.name)
        text.append('tspan')
          .attr('class', 'birthdate')
          .text(node.birthdate ? '' + node.birthdate.getFullYear() : '')
        d3.select<SVGGElement, GraphNode>(this).append('text')
          .attr('class', 'description')
          .attr('x', 10)
          .attr('y', '1.7em')
          .text(node.description || '')
      })
      .on('click', this.clickHandler)
      .on('dblclick', this.doubleclickHandler)
      .on('mouseover', this.mouseoverHandler)
      .on('mouseout', this.mouseoutHandler)
      .call(this.dragHandler)
      .merge(this.nodesSel)
      .classed('highlighted', node => {
        for (let i = 0; i < node.links.length; i++) {
          const link = node.links[i] as Link<GraphNode, GraphNode>
          if (link.source.highlighted || link.target.highlighted) return true
        }
        return false
      })
      .each(function (node) {
        d3.select<SVGGElement, GraphNode>(this).select('circle')
          .transition()
          .attr('r', node => node.fullyExpanded ? 5 : 7)
          .attr('filter', node => node.selected || node.highlighted ? 'url(#dropShadow)' : '')
          .style('fill', node => {
            if (!useAutoColor) return '#888888'

            // Find visible links
            let links = node.links
              .filter(l => l.source === node && (l.target as GraphNode).shown)

            // If one or more parents are visible, use parents' key as color
            let key = links
              .filter(link => link.rel === 'father' || link.rel === 'mother')
              .map(link => link.target.key)
              .sort()
              .join('-')

            // If one or more children are visible, use children's key as color
            if (key === '') key = links
              .filter(link => link.rel === 'child')
              .map(link => link.target.key)
              .sort()
              .join('-')

            // Use pale gray if the node is insignificant
            return key ? color(key) : '#CCCCCC'
          })
      })

    // Update links
    // 1. Join new data
    this.linksSel = this.linksSel
      .data(visibleLinks, link => link.source.key + '-' + link.target.key)

    // 2. Exit
    this.linksSel.exit().remove()

    // 3. Enter and update
    this.linksSel = this.linksSel.enter()
      .append<SVGLineElement>('path')
      .attr('class', d => {
        return `link link-${d.source.key} link-${d.target.key} ${d.rel}`
      })
      .merge(this.linksSel)
      .classed('highlighted', d => d.source.highlighted || d.target.highlighted)
      .attr('marker-end', d => {
        if (d.rel === 'spouse') return ''

        const highlighted = d.source.highlighted || d.target.highlighted
        return highlighted ? 'url(#arrowMarkerHighlighted)' : 'url(#arrowMarker)'
      })

    // 4. Update axis
    this.updateAxis()

    // Trigger layout
    this.forceSim.nodes(this.nodesSel.data())
    this.forceLink.links(this.linksSel.data())
    if (triggerLayout) this.restartForce()
  }

  /**
   * Resize SVG according to the parent node
   */
  resize(): void {
    const parent: HTMLElement = this.svg.parentNode as HTMLElement
    const width = parent.clientWidth
    const height = parent.clientHeight

    // Recalculate bounding box
    this.bbox = {
      x0: width * -0.5 + this.MARGIN_L,
      x1: width * +0.5 - this.MARGIN_R,
      y0: height * -0.5 + this.MARGIN_T,
      y1: height * +0.5 - this.MARGIN_B,
    }

    // Resize SVG
    d3.select('svg')
      .attr('width', width)
      .attr('height', height)
      .select('.root')
      .attr('transform', `translate(${width * 0.5}, ${height * 0.5})`)

    // Adjust time scale's range
    this.timeScale.range(
      [width * -0.5 + this.MARGIN_L, width * 0.5 - this.MARGIN_R]
    )

    // Update grids
    const gridXStart = Math.floor(width * -0.5 / this.GRID_UNIT) * this.GRID_UNIT
    const gridXLen = Math.ceil(width / this.GRID_UNIT)
    const gridX = this.root.select('.grid').selectAll('line.x')
      .data(d3.range(gridXLen))
    gridX.exit()
      .remove()
    gridX.enter()
      .append('line')
      .attr('class', 'x')
      .merge(gridX)
      .classed('major', d => (gridXStart + d * this.GRID_UNIT) % (4 * this.GRID_UNIT) === 0)
      .attr('x1', d => gridXStart + d * this.GRID_UNIT)
      .attr('x2', d => gridXStart + d * this.GRID_UNIT)
      .attr('y1', -height * 0.5)
      .attr('y2', height * 0.5)

    const gridYStart = Math.floor(height * -0.5 / this.GRID_UNIT) * this.GRID_UNIT
    const gridYLen = Math.ceil(height / this.GRID_UNIT)
    const gridY = this.root.select('.grid').selectAll('line.y')
      .data(d3.range(gridYLen))
    gridY.exit()
      .remove()
    gridY.enter()
      .append('line')
      .attr('class', 'y')
      .merge(gridY)
      .classed('major', d => (gridXStart + d * this.GRID_UNIT) % (4 * this.GRID_UNIT) === 0)
      .attr('x1', -width * 0.5)
      .attr('x2', width * 0.5)
      .attr('y1', d => gridYStart + d * this.GRID_UNIT)
      .attr('y2', d => gridYStart + d * this.GRID_UNIT)

    // Update axis
    this.updateAxis()

    // Restart force-simulation
    this.restartForce()
  }

  private restartForce(): void {
    this.forceSim.alpha(1.0)
    this.forceSim.restart()
  }

  private tick(): void {
    const bbox = this.bbox
    // Update nodes
    this.nodesSel
      .classed('selected', node => node.selected)
      .classed('fully-expanded', node => node.fullyExpanded)
      .attr('transform', node => {
        return `translate(${node.x = Math.max(bbox.x0, Math.min(bbox.x1, node.x || 0))}, ${node.y = Math.max(bbox.y0, Math.min(bbox.y1, node.y || 0))})`
      })

    // Update links
    this.linksSel.attr("d", this.generateLink)
  }

  private generateLink(d: Link<GraphNode, GraphNode>): string {
    const sx = (d.source as GraphNode).x as number
    const sy = (d.source as GraphNode).y as number
    const tx = (d.target as GraphNode).x as number
    const ty = (d.target as GraphNode).y as number

    if (d.rel === 'spouse') {
      return `M${sx},${sy} L${tx},${ty}`
    } else {
      const dr = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2) * 1.4
      return `M${sx},${sy}A${dr},${dr} 0 0 1 ${tx},${ty}`
    }
  }

  private onNodeClick(element: SVGGElement, node: GraphNode): void {
    if (!this.graphMan) return

    if (d3.event['altKey']) {
      delete node.fx
      delete node.fy
      node.highlighted = false
      this.graphMan.hide(node)
    } else if (node.selected) {
      this.graphMan.deselect()
    } else if (d3.event['shiftKey']) {
      this.graphMan.select(node)
    } else {
      this.graphMan.select(node)
      this.graphMan.expand(node)
    }
    this.rerender(node, true)
  }

  private onNodeDoubleclick(element: SVGGElement, node: GraphNode): void {
    delete node.fx
    delete node.fy

    d3.select(element)
      .classed('fixed', false)

    this.rerender(node, true)
  }

  private onNodeMouseover(element: SVGGElement, node: GraphNode): void {
    node.fx = node.x
    node.fy = node.y

    node.highlighted = true
    this.rerender(null, false)
    d3.select(element).raise()
    d3.select(this.svg).selectAll(`.link-${node.key}`).raise()
  }

  private onNodeMouseout(element: SVGGElement, node: GraphNode): void {
    if (!d3.select(element).classed('fixed')) {
      delete node.fx
      delete node.fy
    }

    node.highlighted = false
    this.rerender(null, false)
  }

  private onNodeDragStart(element: SVGGElement, node: GraphNode): void {
  }

  private onNodeDrag(element: SVGGElement, node: GraphNode): void {
    node.x = node.fx = d3.event.x
    node.y = node.fy = d3.event.y

    if (d3.select(element).classed('drag')) return

    this.root.select('g.grid')
      .classed('visible', true)
    d3.select<SVGGElement, Node>(element)
      .classed('drag', true)
      .classed('fixed', true)
      .attr("transform", `translate(${node.x}, ${node.y})`)
    this.forceSim.alphaTarget(0.3).restart()
  }

  private onNodeDragEnd(element: SVGGElement, node: GraphNode): void {
    if (!d3.select(element).classed('drag')) return

    node.x = node.fx = Math.round(d3.event.x / this.GRID_UNIT) * this.GRID_UNIT
    node.y = node.fy = Math.round(d3.event.y / this.GRID_UNIT) * this.GRID_UNIT

    this.root.select('g.grid')
      .classed('visible', false)
    d3.select(element)
      .classed('drag', false)
    this.forceSim.alphaTarget(0)
  }

  private updateAxis(): void {
    const width = +(this.svg.getAttribute('width') || 0)
    const ticks = Math.max(2, Math.floor(width / 150))

    this.timeAxis
      .ticks(ticks)
      .tickValues(ticks == 2 ? this.timeScale.domain() as any : null)

    this.root.select('g.axis')
      .transition()
      .duration(1000)
      .call(this.timeAxis as any)
      .attr('opacity', this.useTimeScale ? 0.6 : 0)
  }
}
