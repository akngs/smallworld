declare var jsnx: any

import "babel-polyfill"
import 'whatwg-fetch'
import * as d3 from 'd3'
import Awesomplete from 'awesomplete'
import Promise from "promise-polyfill";

const DATA_HASH = 'ede822c'

let renderer: Renderer

export async function explorerMain() {
  const rootEl = document.querySelector<SVGElement>('svg')
  if (!rootEl) throw new Error('Not found: "svg"')

  showMessage('Loading...')
  const loader = new Loader()
  const data = await loader.loadData()
  hideMessage()

  const network = new Network(data, {
    onActivated: (network, person) => {
      renderInfobox(network, person)
      pushDataLayer({
        'event': 'activateNode',
        'key': person.key,
        'name': person.name
      })
    },
    onDeactivate: person => {
      const infobox = document.querySelector('.infobox')
      if (!infobox) throw new Error('Not found: ".infobox"')
      infobox.innerHTML = ''
    }
  })
  renderer = new Renderer(network, rootEl)
  window.addEventListener('resize', () => renderer.resize())

  // Init autocomplete
  const q = document.querySelector('.query input') as HTMLInputElement | null
  if (!q) throw new Error('Not found: ".query input"')
  if (!q.form) throw new Error('Not found: "q.form')
  q.disabled = false

  new Awesomplete(q, {
    list: network.getPersons().map(person => {
      return {label: network.getPersonBrief(person), value: person.key}
    }),
    minChars: 1,
    autoFirst: true
  })
  q.form.addEventListener('submit', e => {
    e.preventDefault()
    q.value = ''
  })
  q.addEventListener('awesomplete-selectcomplete', (e: any) => {
    const person = network.getPerson(e.text.value)
    if (person) {
      network.select(person)
      network.activate(person)
      renderer.rerender()
    }
    q.value = ''
  })

  // Apply querystring
  const query = parseQuery(location.href)
  if (query['keys']) {
    query['keys'].split(',').forEach(key => {
      const person = network.getPerson(key)
      if (person) network.expand(person, 1)
    })
  } else if (query['paths']) {
    query['paths'].split(',').forEach(path => {
      const keys = path.split('-')
      const person0 = network.getPerson(keys[0])
      const person1 = network.getPerson(keys[1])
      if (person0 && person1) {
        network
          .findShortestPath(person0, person1)
          .forEach(p => network.expand(p, 0))
      }
    })
  } else {
    // Select top 10 hubs
    network.getHubs()
      .splice(0, 10)
      .forEach(hub => network.expand(hub, 0))
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

function renderInfobox(network: Network, person: PersonNode): void {
  const info = person.info
  const infobox = d3.select('.infobox').html(
    `<h2>${network.getPersonBrief(person)}</h2>` +
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
  infobox.select('.occupation ul').selectAll<HTMLLIElement, Link>('li').data(info.occupation || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Affiliation
  infobox.select('.affiliation').classed('show', !!info.affiliation)
  infobox.select('.affiliation ul').selectAll('li').data(info.affiliation || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Position
  infobox.select('.position').classed('show', !!info.position)
  infobox.select('.position ul').selectAll('li').data(info.position || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Membership
  infobox.select('.membership').classed('show', !!info.membership)
  infobox.select('.membership ul').selectAll('li').data(info.membership || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Education
  infobox.select('.education').classed('show', !!info.education)
  infobox.select('.education ul').selectAll('li').data(info.education || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Birthplace
  infobox.select('.birthplace').classed('show', !!info.birthplace)
  infobox.select('.birthplace ul').selectAll('li').data(info.birthplace || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Mother
  infobox.select('.mother').classed('show', !!info.mother)
  infobox.select('.mother ul').selectAll('li').data(info.mother || []).enter()
    .append('li')
    .text(d => network.getPersonBrief(d.target as PersonNode))

  // Father
  infobox.select('.father').classed('show', !!info.father)
  infobox.select('.father ul').selectAll('li').data(info.father || []).enter()
    .append('li')
    .text(d => network.getPersonBrief(d.target as PersonNode))

  // Spouse
  infobox.select('.spouse').classed('show', !!info.spouse)
  infobox.select('.spouse ul').selectAll('li').data(info.spouse || []).enter()
    .append('li')
    .text(d => network.getPersonBrief(d.target as PersonNode))

  // Child
  infobox.select('.child').classed('show', !!info.child)
  infobox.select('.child ul').selectAll('li').data(info.child || []).enter()
    .append('li')
    .text(d => network.getPersonBrief(d.target as PersonNode))

  // Image
  infobox.select('.image').classed('show', !!person.image)
  if (person.image) {
    infobox.select('.image').attr('src', person.image.replace('http:', 'https:'))
  }

  // Actions
  infobox.select('.actions .edit a').attr('href', `https://www.wikidata.org/entity/${person.key}`)
  infobox.select('.actions .expand a').on('click', () => {
    network.expand(person)
    renderer.rerender()
  })
  infobox.select('.actions .hide a').on('click', () => {
    network.deselect(person)
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
  key: string
  name: string
  ins: Link[]
  outs: Link[]
  links: Link[]
}

export interface AffiliationNode extends Node {
}

export interface BirthplaceNode extends Node {
}

export interface EducationNode extends Node {
}

export interface MembershipNode extends Node {
}

export interface OccupationNode extends Node {
}

export interface PositionNode extends Node {
}

export interface PersonNode extends Node, d3.SimulationNodeDatum {
  ins: PersonLink[]
  outs: PersonLink[]
  links: PersonLink[]

  description?: string
  birthdate?: Date
  deathdate?: Date
  image?: string

  info: { [key: string]: Link[] }

  selected: boolean
  fullyExpanded: boolean
}

export interface Link {
  source: Node
  target: Node
  rel: string
  kinship: boolean
}

export interface PersonLink extends d3.SimulationLinkDatum<PersonNode> {
  source: PersonNode
  target: PersonNode
  rel: string
  kinship: boolean
}

export interface JsnxGraph {
}

export interface Nodes {
  affiliations: AffiliationNode[]
  birthplaces: BirthplaceNode[]
  educations: EducationNode[]
  memberships: MembershipNode[]
  occupations: OccupationNode[]
  persons: PersonNode[]
  positions: PositionNode[]
}

export interface NodesMap {
  affiliations: { [key: string]: AffiliationNode }
  birthplaces: { [key: string]: BirthplaceNode }
  educations: { [key: string]: EducationNode }
  memberships: { [key: string]: MembershipNode }
  occupations: { [key: string]: OccupationNode }
  persons: { [key: string]: PersonNode }
  positions: { [key: string]: PositionNode }
}

export interface DataSet {
  nodes: Nodes
  nodesMap: NodesMap
  hubs: PersonNode[]
  links: PersonLink[]
  graph: JsnxGraph
}

const parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%SZ')

class Loader {
  async loadData(): Promise<DataSet> {
    const urlPrefix = `//cdn.rawgit.com/akngs/smallworld/${DATA_HASH}/data/`

    const data = await Promise.all<AffiliationNode[],
      BirthplaceNode[],
      EducationNode[],
      MembershipNode[],
      OccupationNode[],
      PersonNode[],
      PositionNode[],
      any[],
      any[]>([
      d3.csv(urlPrefix + 'affiliations.csv', this.parseNode),
      d3.csv(urlPrefix + 'birthplaces.csv', this.parseNode),
      d3.csv(urlPrefix + 'educations.csv', this.parseNode),
      d3.csv(urlPrefix + 'memberships.csv', this.parseNode),
      d3.csv(urlPrefix + 'occupations.csv', this.parseNode),
      d3.csv(urlPrefix + 'persons.csv', this.parsePerson),
      d3.csv(urlPrefix + 'positions.csv', this.parseNode),
      d3.csv(urlPrefix + 'links.csv', this.parseLink),
      d3.csv(urlPrefix + 'hubs.csv'),
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

    const nodes: Nodes = {
      affiliations,
      birthplaces,
      educations,
      memberships,
      occupations,
      persons,
      positions,
    }

    // Generate key-value maps for nodes
    const affiliationsMap: { [key: string]: AffiliationNode } = {}
    affiliations.forEach(n => affiliationsMap[n.key] = n)
    const birthplacesMap: { [key: string]: BirthplaceNode } = {}
    birthplaces.forEach(n => birthplacesMap[n.key] = n)
    const educationsMap: { [key: string]: EducationNode } = {}
    educations.forEach(n => educationsMap[n.key] = n)
    const membershipsMap: { [key: string]: MembershipNode } = {}
    memberships.forEach(n => membershipsMap[n.key] = n)
    const occupationsMap: { [key: string]: OccupationNode } = {}
    occupations.forEach(n => occupationsMap[n.key] = n)
    const personsMap: { [key: string]: PersonNode } = {}
    persons.forEach(n => personsMap[n.key] = n)
    const positionsMap: { [key: string]: PositionNode } = {}
    positions.forEach(n => positionsMap[n.key] = n)

    const nodesMap: NodesMap = {
      affiliations: affiliationsMap,
      birthplaces: birthplacesMap,
      educations: educationsMap,
      memberships: membershipsMap,
      occupations: occupationsMap,
      persons: personsMap,
      positions: positionsMap,
    }

    // Process links
    const links: PersonLink[] = rawLinks
      .map((raw: any) => {
        return {
          source: nodesMap.persons[raw.source],
          target: nodesMap.persons[raw.target],
          rel: raw.rel,
          kinship: true,
        }
      })
      .filter((link: any) => link.source && link.target)

    links.forEach(link => {
      link.source.outs.push(link)
      link.source.links.push(link)
      link.target.ins.push(link)
      link.target.links.push(link)
    })

    // Generate brief info for persons
    nodes.persons.forEach(person => {
      person.info = {}
      d3.nest<Link>()
        .key(link => link.rel)
        .entries(person.outs)
        .forEach(g => person.info[g.key] = g.values)
    })

    const hubs: PersonNode[] = rawHubs.map(raw => nodesMap.persons[raw.key])
    const graph: JsnxGraph = this.buildGraph(links)

    return {
      nodes,
      links,
      nodesMap,
      hubs,
      graph,
    }
  }

  private parseNode(raw: any): Node {
    return {
      key: raw.key,
      name: raw.name,
      ins: [],
      outs: [],
      links: []
    }
  }

  private parsePerson(raw: any): PersonNode {
    return {
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
      selected: false,
      fullyExpanded: false,
    }
  }

  private parseLink(raw: any): any {
    return {
      source: raw.source,
      target: raw.target,
      rel: raw.rel,
      kinship: ['child', 'mother', 'father', 'spouse'].indexOf(raw.rel) !== -1
    }
  }

  private buildGraph(links: Link[]): JsnxGraph {
    const graph = new jsnx.Graph()
    links
      .filter(link => link.kinship)
      .forEach(link => graph.addEdge(link.source.key, link.target.key))
    return graph
  }
}

interface NetworkStateListener {
  onActivated?: (network: Network, person: PersonNode) => void
  onDeactivate?: (network: Network, person: PersonNode) => void
}

class Network {
  private readonly data: DataSet
  private activatedPerson: PersonNode | null
  private readonly listener: NetworkStateListener

  constructor(data: DataSet, listener?: NetworkStateListener) {
    this.data = data
    this.activatedPerson = null
    this.listener = listener || {}
  }

  select(person: PersonNode): void {
    if (person.selected) return

    person.selected = true
    person.x = person.x || Math.random() - 0.5
    person.y = person.y || Math.random() - 0.5
    this.updateFullyExpandedFlag(person)
  }

  deselect(person: PersonNode): void {
    if (!person.selected) return

    person.selected = false
    delete person.x
    delete person.y

    if (person === this.activatedPerson) this.deactivate()

    this.updateFullyExpandedFlag(person)
  }

  expand(person: PersonNode, depth: number = 1): void {
    this.select(person)

    if (depth === 0) return
    if (!person.links) return

    person.links.forEach(link => {
      if (this.data.nodesMap.persons[link.source.key]) {
        if (!link.source.selected) {
          link.source.x = person.x
          link.source.y = person.y
        }
        this.expand(link.source, depth - 1)
      }
      if (this.data.nodesMap.persons[link.target.key]) {
        if (!link.target.selected) {
          link.target.x = person.x
          link.target.y = person.y
        }
        this.expand(link.target, depth - 1)
      }
    })
  }

  activate(person: PersonNode) {
    if (this.activatedPerson === person) return
    if (this.activatedPerson) this.deactivate()

    this.activatedPerson = person
    this.activatedPerson.fx = person.x
    this.activatedPerson.fy = person.y

    this.select(person)
    if (this.listener.onActivated) {
      this.listener.onActivated(this, person)
    }
  }

  deactivate(): void {
    if (!this.activatedPerson) return

    const person = this.activatedPerson

    delete this.activatedPerson.fx
    delete this.activatedPerson.fy
    this.activatedPerson = null

    if (this.listener.onDeactivate) {
      this.listener.onDeactivate(this, person)
    }
  }

  isActivated(person: PersonNode): boolean {
    return this.activatedPerson === person
  }

  findShortestPath(person0: PersonNode, person1: PersonNode): PersonNode[] {
    return jsnx
      .bidirectionalShortestPath(this.data.graph, person0.key, person1.key)
      .map((key: string) => this.data.nodesMap.persons[key])
  }

  getPerson(key: string): PersonNode | null {
    return this.data.nodesMap.persons[key]
  }

  getPersonBrief(person: PersonNode): string {
    const name = person['name']

    // Try description
    const description = person['description']
    if (description) {
      const short = description.replace(/(한국의|대한민국의) /, '')
      return `${name} (${short})`
    }

    // Try birthdate and deathdate
    const birthdate = person['birthdate'] || null
    const deathdate = person['deathdate'] || null
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

  getPersons(): PersonNode[] {
    return this.data.nodes.persons
  }

  getHubs(): PersonNode[] {
    return this.data.hubs
  }

  getSelectedPersons(): PersonNode[] {
    return this.data.nodes.persons.filter((person: PersonNode) => person.selected)
  }

  getSelectedLinks(): PersonLink[] {
    return this.data.links.filter(d => d.source.selected && d.target.selected)
  }

  private updateFullyExpandedFlag(person: PersonNode): void {
    person.fullyExpanded = Network.isFullyExpanded(person)
    person.links
      .filter(link => link.kinship)
      .forEach(link => {
        link.source.fullyExpanded = Network.isFullyExpanded(link.source)
        link.target.fullyExpanded = Network.isFullyExpanded(link.target)
      })
  }

  private static isFullyExpanded(person: PersonNode): boolean {
    return person.links
      .filter(link => link.kinship)
      .filter(link => !link.source.selected || !link.target.selected)
      .length === 0
  }
}

class Renderer {
  private readonly network: Network

  private svg: SVGElement
  private linksSel: d3.Selection<SVGLineElement, PersonLink, SVGGElement, undefined>
  private personsSel: d3.Selection<SVGGElement, PersonNode, SVGGElement, undefined>
  private readonly forceSim: d3.Simulation<PersonNode, PersonLink>
  private readonly forceLink: d3.ForceLink<PersonNode, PersonLink>

  private readonly clickHandler: (this: SVGGElement, person: PersonNode) => void
  private readonly dragHandler: d3.DragBehavior<SVGGElement, PersonNode, any>

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
      .selectAll<SVGLineElement, PersonLink>('.link')
      .data(network.getSelectedLinks())
    this.personsSel = root.append<SVGGElement>('g').attr('class', 'nodes')
      .selectAll<SVGGElement, PersonNode>('.node')
      .data(network.getSelectedPersons())

    // Initialize layout simulation
    this.forceLink = d3.forceLink<PersonNode, PersonLink>(this.linksSel.data())
      .distance(50)
    this.forceSim = d3.forceSimulation<PersonNode, PersonLink>(this.personsSel.data())
      .force("link", this.forceLink)
      .force("x", d3.forceX(0).strength(0.05))
      .force("y", d3.forceY(0).strength(0.05))
      .force("collide", d3.forceCollide(20))
      .force("charge", d3.forceManyBody().strength(-200))
      .on('tick', this.tick.bind(this))

    // Click and drag handler
    const self = this
    this.clickHandler = function (this: SVGGElement, person: PersonNode) {
      self.onPersonClick(this, person)
    }
    this.dragHandler = d3.drag<SVGGElement, PersonNode>()
      .on('start', function (person) {
        self.onPersonDragStart(this, person)
      })
      .on('drag', function (person) {
        self.onPersonDrag(this, person)
      })
      .on('end', function (person) {
        self.onPersonDragEnd(this, person)
      })

    this.resize()
  }

  rerender(): void {
    // Update persons
    // 1. Join new data
    this.personsSel = this.personsSel
      .data(this.network.getSelectedPersons(), person => person.key)

    // 2. Exit
    this.personsSel.exit().remove()

    // 3. Enter and update
    this.personsSel = this.personsSel.enter()
      .append<SVGGElement>('g')
      .attr('class', 'node person')
      .each(function (person) {
        d3.select(this).append('circle')
        d3.select(this).append('text')
          .attr('class', 'name')
          .attr('transform', 'translate(8, 8)')
          .text(person.name)
      })
      .on('click', this.clickHandler)
      .call(this.dragHandler)
      .merge(this.personsSel)

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
    this.forceSim.nodes(this.personsSel.data())
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

    // Update persons
    this.personsSel
      .classed('active', person => this.network.isActivated(person))
      .classed('fully-expanded', person => person.fullyExpanded)
      .attr('transform', person => {
        // Make nodes to respect bounding box
        person.x = Math.max(xMin, Math.min(xMax, person.x || 0))
        person.y = Math.max(yMin, Math.min(gyMax, person.y || 0))

        return `translate(${person.x}, ${person.y})`
      })
      .select('circle')
      .attr('r', person => person.fullyExpanded ? 5 : 7)
      .attr('filter', person => this.network.isActivated(person) ? 'url(#dropShadow)' : '')

    // Update links
    this.linksSel
      .attr('x1', person => person.source.x || 0)
      .attr('y1', person => person.source.y || 0)
      .attr('x2', person => person.target.x || 0)
      .attr('y2', person => person.target.y || 0)
  }

  private onPersonClick(element: SVGGElement, person: PersonNode): void {
    const network = this.network

    if (d3.event['altKey']) {
      network.deselect(person)
    } else if (network.isActivated(person)) {
      network.deactivate()
    } else if (d3.event['shiftKey']) {
      network.activate(person)
    } else {
      network.activate(person)
      network.expand(person)
    }
    this.rerender()
  }

  private onPersonDragStart(element: SVGGElement, person: PersonNode): void {
    d3.select(element).classed('drag', true)
    person.x = person.fx = d3.event.x
    person.y = person.fy = d3.event.y
    this.forceSim.alphaTarget(0.3).restart()
  }

  private onPersonDrag(element: SVGGElement, person: PersonNode): void {
    person.x = person.fx = d3.event.x
    person.y = person.fy = d3.event.y

    d3.select<SVGGElement, Node>(element)
      .attr("transform", `translate(${person.x}, ${person.y})`)
  }

  private onPersonDragEnd(element: SVGGElement, person: PersonNode): void {
    d3.select(element).classed('drag', false)
    if (!this.network.isActivated(person)) {
      delete person.fx
      delete person.fy
    }
    this.forceSim.alphaTarget(0)
  }
}
