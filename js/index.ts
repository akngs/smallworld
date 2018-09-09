declare var jsnx: any

import "babel-polyfill"
import 'whatwg-fetch'
import * as d3 from 'd3'
import Awesomplete from 'awesomplete'
import Promise from "promise-polyfill"

const DATA_HASH = '46242eb'

let renderer: Renderer

export async function explorerMain() {
  const rootEl = document.querySelector<SVGElement>('svg')
  if (!rootEl) throw new Error('Not found: "svg"')

  showMessage('Loading...')
  const loader = new Loader()
  const data = await loader.loadData()
  hideMessage()

  const network = new Network(data, {
    onActivated: (network, node) => {
      renderInfobox(network, node)
      pushDataLayer({
        'event': 'activateNode',
        'key': node.key,
        'name': node.name
      })
    },
    onDeactivate: node => {
      const infobox = document.querySelector('.infobox')
      if (!infobox) throw new Error('Not found: ".infobox"')
      infobox.innerHTML = ''
    }
  })
  renderer = new Renderer(network, rootEl)
  window.addEventListener('resize', () => renderer.resize())

  // Init autocomplete
  const q = document.querySelector<HTMLInputElement>('.query input')
  if (!q) throw new Error('Not found: ".query input"')
  if (!q.form) throw new Error('Not found: "q.form')
  q.disabled = false

  new Awesomplete(q, {
    list: network.getNodes().map(node => {
      return {label: network.getPersonBrief(node.key), value: node.key}
    }),
    minChars: 1,
    autoFirst: true
  })
  q.form.addEventListener('submit', e => {
    e.preventDefault()
    q.value = ''
  })
  q.addEventListener('awesomplete-selectcomplete', (e: any) => {
    const node = network.getNode(e.text.value)
    if (node) {
      network.select(node)
      network.activate(node)
      renderer.rerender()
    }
    q.value = ''
  })

  // Apply querystring
  const query = parseQuery(location.href)
  if (query['keys']) {
    query['keys'].split(',').forEach(key => {
      const node = network.getNode(key)
      network.expand(node, 1)
    })
  } else if (query['paths']) {
    query['paths'].split(',').forEach(path => {
      const keys = path.split('-')
      const node1 = network.getNode(keys[0])
      const node2 = network.getNode(keys[1])
      network
        .findShortestPath(node1, node2)
        .forEach(key => network.expand(key, 0))
    })
  } else {
    // Do nothing
  }

  // Done
  renderer.rerender()
}

function showMessage(message: string): void {
  const element = document.querySelector('.message')
  if (!element) throw new Error('Not found: ".message"')

  element.textContent = message
  element.classList.add('show')
}

function hideMessage(): void {
  const element = document.querySelector('.message')
  if (!element) throw new Error('Not found: ".message"')

  element.classList.remove('show')
}

function renderInfobox(network: Network, node: NetworkNode): void {
  const info = node.info
  const infobox = d3.select('.infobox').html(
    `<h2>${network.getPersonBrief(node.key)}</h2>` +
    `<img class="item image" src="#" alt="profile">` +
    '<div class="item occupation"><h3>직업</h3><ul></ul></div>' +
    '<div class="item affiliation"><h3>소속</h3><ul></ul></div>' +
    '<div class="item position"><h3>직위 </h3><ul></ul></div>' +
    '<div class="item membership"><h3>멤버십</h3><ul></ul></div>' +
    '<div class="item education"><h3>학교</h3><ul></ul></div>' +
    '<div class="item birthplace"><h3>출생</h3><ul></ul></div>' +
    '<div class="item mother"><h3>어머니</h3><ul></ul></div>' +
    '<div class="item father"><h3>아버지</h3><ul></ul></div>' +
    '<div class="item spouse"><h3>배우자</h3><ul></ul></div>' +
    '<div class="item child"><h3>자녀</h3><ul></ul></div>' +
    '<ul class="actions">' +
    '  <li class="edit"><a href="#" target="_blank">edit</a></li>' +
    '  <li class="expand"><a href="#">expand</a></li>' +
    '  <li class="hide"><a href="#">hide</a></li>' +
    '</ul>' +
    ''
  )

  // Occupation
  infobox.select('.occupation').classed('show', !!info.occupation)
  infobox.select('.occupation ul').selectAll('li').data(info.occupation || []).enter()
    .append('li')
    .text(d => d.name)

  // Affiliation
  infobox.select('.affiliation').classed('show', !!info.affiliation)
  infobox.select('.affiliation ul').selectAll('li').data(info.affiliation || []).enter()
    .append('li')
    .text(d => d.name)

  // Position
  infobox.select('.position').classed('show', !!info.position)
  infobox.select('.position ul').selectAll('li').data(info.position || []).enter()
    .append('li')
    .text(d => d.name)

  // Membership
  infobox.select('.membership').classed('show', !!info.membership)
  infobox.select('.membership ul').selectAll('li').data(info.membership || []).enter()
    .append('li')
    .text(d => d.name)

  // Education
  infobox.select('.education').classed('show', !!info.education)
  infobox.select('.education ul').selectAll('li').data(info.education || []).enter()
    .append('li')
    .text(d => d.name)

  // Birthplace
  infobox.select('.birthplace').classed('show', !!info.birthplace)
  infobox.select('.birthplace ul').selectAll('li').data(info.birthplace || []).enter()
    .append('li')
    .text(d => d.name)

  // Mother
  infobox.select('.mother').classed('show', !!info.mother)
  infobox.select('.mother ul').selectAll('li').data(info.mother || []).enter()
    .append('li')
    .text(d => network.getPersonBrief(d.key))

  // Father
  infobox.select('.father').classed('show', !!info.father)
  infobox.select('.father ul').selectAll('li').data(info.father || []).enter()
    .append('li')
    .text(d => network.getPersonBrief(d.key))

  // Spouse
  infobox.select('.spouse').classed('show', !!info.spouse)
  infobox.select('.spouse ul').selectAll('li').data(info.spouse || []).enter()
    .append('li')
    .text(d => network.getPersonBrief(d.key))

  // Child
  infobox.select('.child').classed('show', !!info.child)
  infobox.select('.child ul').selectAll('li').data(info.child || []).enter()
    .append('li')
    .text(d => network.getPersonBrief(d.key))

  // Image
  infobox.select('.image').classed('show', !!node.image)
  if (node.image) {
    infobox.select('.image').attr('src', node.image.replace('http:', 'https:'))
  }

  // Actions
  infobox.select('.actions .edit a').attr('href', `https://www.wikidata.org/entity/${node.key}`)
  infobox.select('.actions .expand a').on('click', () => {
    d3.event.preventDefault()
    network.expand(node)
    renderer.rerender()
  })
  infobox.select('.actions .hide a').on('click', () => {
    d3.event.preventDefault()
    network.deselect(node)
    renderer.rerender()
  })
}

function pushDataLayer(obj: any): void {
  (window as any).dataLayer.push(obj)
}

function parseQuery(url: string): { [key: string]: string } {
  const result: { [key: string]: string } = {}
  const qs: string | undefined = url.split('?')[1]
  if (!qs) return result

  qs.split('&').forEach(pair => {
    const tokens = pair.split('=')
    result[tokens[0] || ''] = tokens[1] || ''
  })
  return result
}


///////////////////////////////////////////////////////////////////////////////////////////////////


export interface Node {
  type: string
  key: string
  name: string
  ins: Link<Node, Node>[]
  outs: Link<Node, Node>[]
  links: Link<Node, Node>[]
}

export interface PersonNode extends Node {
  ins: Link<Node, PersonNode>[]
  outs: Link<PersonNode, Node>[]
  description?: string
  birthdate?: Date
  deathdate?: Date
  image?: string
  info: { [key: string]: Node[] }
}

export interface Link<S extends Node, T extends Node> {
  source: S
  target: T
  rel: string
}

export interface GraphStats {
  nNodes: number
  nEdges: number
  subgraphs: {
    nodes: PersonNode[],
    nNodes: number,
    nEdges: number,
    avgShortestPath: number,
  }[]
}

export interface JsnxGraph {
  addEdge: (a: string, b: string) => void
}

export interface DataSet {
  nodes: Node[]
  nodeMap: Map<string, Node>
  hubs: PersonNode[]
  links: Link<Node, Node>[]
  stats: GraphStats
}

const parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%SZ')

class Loader {
  async loadData(): Promise<DataSet> {
    const urlPrefix = `//cdn.rawgit.com/akngs/smallworld/${DATA_HASH}/data/`

    const data = await Promise.all<Node[],
      Node[],
      Node[],
      Node[],
      Node[],
      PersonNode[],
      Node[],
      any[],
      any[],
      any>([
      d3.csv(urlPrefix + 'affiliations.csv', raw => this.parseNode(raw, 'affiliation')),
      d3.csv(urlPrefix + 'birthplaces.csv', raw => this.parseNode(raw, 'birthplaces')),
      d3.csv(urlPrefix + 'educations.csv', raw => this.parseNode(raw, 'education')),
      d3.csv(urlPrefix + 'memberships.csv', raw => this.parseNode(raw, 'membership')),
      d3.csv(urlPrefix + 'occupations.csv', raw => this.parseNode(raw, 'occupation')),
      d3.csv(urlPrefix + 'persons.csv', raw => this.parsePerson(raw)),
      d3.csv(urlPrefix + 'positions.csv', raw => this.parseNode(raw, 'position')),
      d3.csv(urlPrefix + 'links.csv', this.parseLink),
      d3.csv(urlPrefix + 'hubs.csv'),
      d3.json(urlPrefix + 'stats.json'),
    ])

    const affiliations = data[0]
    const birthplaces = data[1]
    const educations = data[2]
    const memberships = data[3]
    const occupations = data[4]
    const persons = data[5]
    const positions = data[6]

    const rawLinks = data[7]
    const rawHubs = data[8]
    const rawStats = data[9]

    // Generate concatenated node list
    const nodes: Node[] = [
      ...affiliations,
      ...birthplaces,
      ...educations,
      ...memberships,
      ...occupations,
      ...persons,
      ...positions,
    ]

    // Generate key-value maps for nodes
    const nodeMap: Map<string, Node> = new Map()
    nodes.forEach(node => nodeMap.set(node.key, node))

    // Process links
    const links = rawLinks
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
      link.source.outs.push(link)
      link.source.links.push(link)
      link.target.ins.push(link)
      link.target.links.push(link)
    })

    // Generate brief info for persons
    const personNodes = nodes.filter(node => node.type === 'person') as PersonNode[]
    personNodes.forEach(person => {
      person.info = {}
      d3.nest<Link<Node, Node>>()
        .key(link => link.rel)
        .entries(person.outs)
        .forEach(g => {
          person.info[g.key] = g.values.map((link: Link<Node, Node>) => link.target)
        })
    })

    const hubs = rawHubs.map(raw => nodeMap.get(raw.key)) as PersonNode[]

    // Process stats
    rawStats.subgraphs.forEach((g: any) => {
      g.nodes = g.nodes.map((key: string) => nodeMap.get(key))
    })
    const stats = rawStats as GraphStats

    return {
      nodes,
      links,
      nodeMap,
      hubs,
      stats,
    }
  }

  private parseNode(raw: any, type: string): Node {
    return {
      type: type,
      key: raw.key,
      name: raw.name,
      ins: [],
      outs: [],
      links: []
    }
  }

  private parsePerson(raw: any): PersonNode {
    return {
      type: 'person',
      key: raw.key,
      name: raw.name,
      description: raw.description,
      image: raw.image,
      birthdate: raw['birthdate'] ? parseTime(raw['birthdate']) as Date : undefined,
      deathdate: raw['deathdate'] ? parseTime(raw['deathdate']) as Date : undefined,

      ins: [],
      outs: [],
      links: [],

      info: {},
    }
  }

  private parseLink(raw: any): any {
    return {
      source: raw.source,
      target: raw.target,
      rel: raw.rel,
    }
  }
}

interface NetworkStateListener {
  onActivated?: (network: Network, node: NetworkNode) => void
  onDeactivate?: (network: Network, node: NetworkNode) => void
}

interface NetworkNode extends PersonNode, d3.SimulationNodeDatum {
  selected: boolean
  fullyExpanded: boolean
}

class Network {
  private readonly kinship: Set<string>
  private readonly nodeMap: Map<string, NetworkNode>
  private readonly nodes: NetworkNode[]
  private readonly links: Link<NetworkNode, NetworkNode>[]
  private readonly graph: JsnxGraph
  private activatedNode: NetworkNode | null
  private readonly listener: NetworkStateListener

  constructor(data: DataSet, listener?: NetworkStateListener) {
    this.kinship = new Set(['mother', 'father', 'child', 'spouse'])

    // Convert Nodes into NetworkNodes
    this.nodes = data.nodes
      .filter(node => node.type === 'person')
      .map(node => {
        return {
          ...node,
          selected: false,
          fullyExpanded: false,
        }
      }) as NetworkNode[]

    // Build map for fast lookup
    this.nodeMap = new Map()
    this.nodes.forEach(node => this.nodeMap.set(node.key, node))

    // Replace links in nodes
    this.nodes.forEach(node => {
      node.links = node.links
        .filter(link => this.isKinship(link))
        .map(link => {
          return {
            source: this.nodeMap.get(link.source.key),
            target: this.nodeMap.get(link.target.key),
            rel: link.rel,
          }
        }) as Link<NetworkNode, NetworkNode>[]
    })

    // Convert links
    this.links = data.links
      .filter(link => this.isKinship(link))
      .map(link => {
        return {
          source: this.getNode(link.source.key),
          target: this.getNode(link.target.key),
          rel: link.rel,
        }
      }) as Link<NetworkNode, NetworkNode>[]

    this.graph = new jsnx.Graph()
    this.links.forEach(link => this.graph.addEdge(link.source.key, link.target.key))

    this.activatedNode = null
    this.listener = listener || {}
  }

  select(node: NetworkNode): void {
    if (node.selected) return

    node.selected = true
    this.updateFullyExpandedFlag(node)
  }

  deselect(node: NetworkNode): void {
    if (!node.selected) return

    node.selected = false
    node.x = undefined
    node.y = undefined

    if (this.isActivated(node)) this.deactivate()
    this.updateFullyExpandedFlag(node)
  }

  expand(node: NetworkNode, depth: number = 1): void {
    this.select(node)

    if (depth === 0) return
    if (!node.links) return

    node.links
      .filter(link => this.isKinship(link))
      .forEach(link => {
        this.expand(link.source as NetworkNode, depth - 1)
        this.expand(link.target as NetworkNode, depth - 1)
      })
  }

  activate(node: NetworkNode) {
    if (this.activatedNode === node) return
    if (this.activatedNode) this.deactivate()

    node.fx = node.x
    node.fy = node.y
    this.activatedNode = node

    this.select(node)
    if (this.listener.onActivated) {
      this.listener.onActivated(this, node)
    }
  }

  deactivate(): void {
    if (!this.activatedNode) return

    const node = this.activatedNode

    delete this.activatedNode.fx
    delete this.activatedNode.fy
    this.activatedNode = null

    if (this.listener.onDeactivate) {
      this.listener.onDeactivate(this, node)
    }
  }

  isActivated(node: NetworkNode): boolean {
    return this.activatedNode === node
  }

  findShortestPath(node1: NetworkNode, node2: NetworkNode): NetworkNode[] {
    return jsnx.bidirectionalShortestPath(this.graph, node1.key, node2.key).map((key: string) => this.nodeMap.get(key))
  }

  getNode(key: string): NetworkNode {
    const node = this.nodeMap.get(key)
    if (!node) throw new Error(`Node not found: ${key}`)
    return node
  }

  getPersonBrief(key: string): string {
    const node = this.getNode(key)
    const name = node.name

    // Try description
    const description = node.description
    if (description) {
      const short = description.replace(/(한국의|대한민국의) /, '')
      return `${name} (${short})`
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
    if (birth) return `${name} (${birth})`

    // Use name as fallback
    return `${name}`
  }

  getNodes(): NetworkNode[] {
    return Array.from(this.nodes.values())
  }

  getSelectedNodes(): NetworkNode[] {
    return this.nodes.filter(node => node.selected)
  }

  getSelectedLinks(): Link<NetworkNode, NetworkNode>[] {
    return this.links.filter(link => link.source.selected && link.target.selected)
  }

  private isKinship(link: Link<Node, Node>): boolean {
    return this.kinship.has(link.rel)
  }

  private updateFullyExpandedFlag(node: NetworkNode): void {
    node.fullyExpanded = this.checkIfFullyExpanded(node)
    node.links
      .filter(link => this.isKinship(link))
      .forEach(link => {
        const source = link.source as NetworkNode
        const target = link.target as NetworkNode
        source.fullyExpanded = this.checkIfFullyExpanded(source)
        target.fullyExpanded = this.checkIfFullyExpanded(target)
      })
  }

  private checkIfFullyExpanded(node: NetworkNode): boolean {
    return node.links
      .filter(link => this.isKinship(link))
      .filter(link => {
        const source = link.source as NetworkNode
        const target = link.target as NetworkNode
        return !source.selected || !target.selected
      })
      .length === 0
  }
}

class Renderer {
  private readonly network: Network

  private svg: SVGElement
  private linksSel: d3.Selection<SVGLineElement, Link<NetworkNode, NetworkNode>, SVGGElement, undefined>
  private nodesSel: d3.Selection<SVGGElement, NetworkNode, SVGGElement, undefined>
  private readonly forceSim: d3.Simulation<NetworkNode, Link<NetworkNode, NetworkNode>>
  private readonly forceLink: d3.ForceLink<NetworkNode, Link<NetworkNode, NetworkNode>>

  private readonly clickHandler: (this: SVGGElement, node: NetworkNode) => void
  private readonly dragHandler: d3.DragBehavior<SVGGElement, NetworkNode, any>

  constructor(network: Network, svg: SVGElement) {
    this.network = network

    // Initialize SVG
    this.svg = svg
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
    const root = d3.select<SVGElement, undefined>(this.svg)
      .append('g')
      .attr('class', 'root')
    this.linksSel = root
      .append<SVGGElement>('g').attr('class', 'links')
      .selectAll<SVGLineElement, Link<NetworkNode, NetworkNode>>('.link')
      .data(network.getSelectedLinks())
    this.nodesSel = root.append<SVGGElement>('g').attr('class', 'nodes')
      .selectAll<SVGGElement, NetworkNode>('.node')
      .data(network.getSelectedNodes())

    // Initialize layout simulation
    this.forceLink = d3.forceLink<NetworkNode, Link<NetworkNode, NetworkNode>>(this.linksSel.data())
      .distance(50)
    this.forceSim = d3.forceSimulation<NetworkNode, Link<NetworkNode, NetworkNode>>(this.nodesSel.data())
      .force("link", this.forceLink)
      .force("x", d3.forceX(0).strength(0.05))
      .force("y", d3.forceY(0).strength(0.05))
      .force("collide", d3.forceCollide(20))
      .force("charge", d3.forceManyBody().strength(-200))
      .on('tick', this.tick.bind(this))

    // Click and drag handler
    const self = this
    this.clickHandler = function (this: SVGGElement, node: NetworkNode) {
      self.onNodeClick(this, node)
    }
    this.dragHandler = d3.drag<SVGGElement, NetworkNode>()
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

  rerender(): void {
    // Update nodes
    // 1. Join new data
    this.nodesSel = this.nodesSel
      .data(this.network.getSelectedNodes(), node => node.key)

    // 2. Exit
    this.nodesSel.exit().remove()

    // 3. Enter and update
    this.nodesSel = this.nodesSel.enter()
      .append<SVGGElement>('g')
      .attr('class', 'node person')
      .each(function (node) {
        d3.select(this).append('circle')
        d3.select(this).append('text')
          .attr('class', 'name')
          .attr('transform', 'translate(8, 8)')
          .text(node.name)
      })
      .on('click', this.clickHandler)
      .call(this.dragHandler)
      .merge(this.nodesSel)

    // Update links
    // 1. Join new data
    this.linksSel = this.linksSel
      .data(this.network.getSelectedLinks())

    // 2. Exit
    this.linksSel.exit().remove()

    // 3. Enter and update
    this.linksSel = this.linksSel.enter()
      .append<SVGLineElement>('line')
      .merge(this.linksSel)
      .attr('class', d => `link ${d.rel}`)
      .attr('marker-end', d => d.rel === 'child' ? 'url(#arrowMarker)' : '')

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

    this.forceSim.alpha(1.0)
    this.forceSim.restart()
  }

  private tick(): void {
    // Calculate bounding box
    const margin = 20
    const width = +(this.svg.getAttribute('width') || 0)
    const height = +(this.svg.getAttribute('height') || 0)
    const xMin = width * -0.5 + margin
    const xMax = width * +0.5 - margin
    const yMin = height * -0.5 + margin
    const gyMax = height * +0.5 - margin

    // Update nodes
    this.nodesSel
      .classed('active', node => this.network.isActivated(node))
      .classed('fully-expanded', node => node.fullyExpanded)
      .attr('transform', node => {
        // Make nodes to respect bounding box
        node.x = Math.max(xMin, Math.min(xMax, node.x || 0))
        node.y = Math.max(yMin, Math.min(gyMax, node.y || 0))

        return `translate(${node.x}, ${node.y})`
      })
      .select('circle')
      .attr('r', node => node.fullyExpanded ? 5 : 7)
      .attr('filter', node => this.network.isActivated(node) ? 'url(#dropShadow)' : '')

    // Update links
    this.linksSel
      .attr('x1', node => node.source.x || 0)
      .attr('y1', node => node.source.y || 0)
      .attr('x2', node => node.target.x || 0)
      .attr('y2', node => node.target.y || 0)
  }

  private onNodeClick(element: SVGGElement, node: NetworkNode): void {
    if (d3.event['altKey']) {
      this.network.deselect(node)
    } else if (this.network.isActivated(node)) {
      this.network.deactivate()
    } else if (d3.event['shiftKey']) {
      this.network.activate(node)
    } else {
      this.network.activate(node)
      this.network.expand(node)
    }
    this.rerender()
  }

  private onNodeDragStart(element: SVGGElement, node: NetworkNode): void {
    d3.select(element).classed('drag', true)
    node.x = node.fx = d3.event.x
    node.y = node.fy = d3.event.y
    this.forceSim.alphaTarget(0.3).restart()
  }

  private onNodeDrag(element: SVGGElement, node: NetworkNode): void {
    node.x = node.fx = d3.event.x
    node.y = node.fy = d3.event.y

    d3.select<SVGGElement, Node>(element)
      .attr("transform", `translate(${node.x}, ${node.y})`)
  }

  private onNodeDragEnd(element: SVGGElement, node: NetworkNode): void {
    d3.select(element).classed('drag', false)
    if (!this.network.isActivated(node)) {
      delete node.fx
      delete node.fy
    }
    this.forceSim.alphaTarget(0)
  }
}
