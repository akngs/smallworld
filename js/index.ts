declare var jsnx: any

import "babel-polyfill"
import 'whatwg-fetch'
import * as d3 from 'd3'
import Awesomplete from 'awesomplete'
import Promise from "promise-polyfill";

const DATA_HASH = 'f35990d'
const PARSE_TIME = d3.timeParse('%Y-%m-%dT%H:%M:%SZ')
const KINSHIP_RELS = ['child', 'mother', 'father', 'spouse']

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

export interface Graph {
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
  graph: Graph
}

let data: DataSet
let linksSel: d3.Selection<SVGLineElement, PersonLink, SVGGElement, undefined>
let personsSel: d3.Selection<SVGGElement, PersonNode, SVGGElement, undefined>
let force: d3.Simulation<PersonNode, PersonLink>
let forceLink: d3.ForceLink<PersonNode, PersonLink>
let activePerson: PersonNode | null

async function main() {
  showMessage('Loading...')
  data = await loadData()
  hideMessage()

  // Initialize autocomplete
  const q = document.querySelector('.query input') as HTMLInputElement | null
  if (!q) throw new Error('Not found: ".query input"')
  if (!q.form) throw new Error('Not found: "q.form')
  q.disabled = false

  new Awesomplete(q, {
    list: (data.nodes.persons).map(person => {
      return {label: renderPersonBrief(person), value: person.key}
    }),
    minChars: 1,
    autoFirst: true
  })
  q.form.addEventListener('submit', e => {
    e.preventDefault()
    q.value = ''
  })
  q.addEventListener('awesomplete-selectcomplete', (e: any) => {
    const person: PersonNode = data.nodesMap.persons[e.text.value]
    selectPerson(person)
    activatePerson(person)
    updatePersons()
    q.value = ''
  })

  // Initialize SVG area
  const svg = d3.select<SVGGElement, undefined>('svg .root')
  linksSel = svg.select<SVGLineElement>('.links').selectAll('.link')
  personsSel = svg.select<SVGGElement>('.nodes').selectAll('.node')

  forceLink = d3.forceLink<PersonNode, PersonLink>(linksSel.data())
    .distance(50)

  force = d3.forceSimulation<PersonNode, PersonLink>(personsSel.data())
    .force("link", forceLink)
    .force("x", d3.forceX(0).strength(0.05))
    .force("y", d3.forceY(0).strength(0.05))
    .force("collide", d3.forceCollide(20))
    .force("charge", d3.forceManyBody().strength(-200))
    .on('tick', onTick)

  onResize()
  window.addEventListener('resize', onResize)

  onInit()
}

function selectPerson(person: PersonNode): void {
  if (person.selected) return

  person.selected = true
  person.x = person.x || Math.random() - 0.5
  person.y = person.y || Math.random() - 0.5
  updateFullyExpandedFlag(person)
}

function deselectPerson(person: PersonNode): void {
  if (!person.selected) return

  person.selected = false
  delete person.x
  delete person.y

  if (person === activePerson) deactivateNode()

  updateFullyExpandedFlag(person)
}

function updateFullyExpandedFlag(person: PersonNode): void {
  person.fullyExpanded = isFullyExpanded(person)
  person.links
    .filter(link => link.kinship)
    .forEach(link => {
      link.source.fullyExpanded = isFullyExpanded(link.source)
      link.target.fullyExpanded = isFullyExpanded(link.target)
    })
}

function isFullyExpanded(person: PersonNode): boolean {
  return person.links
    .filter(link => link.kinship)
    .filter(link => !link.source.selected || !link.target.selected)
    .length === 0
}

function expandPerson(person: PersonNode, depth: number = 1): void {
  selectPerson(person)

  if (depth === 0) return
  if (!person.links) return

  person.links.forEach(link => {
    if (data.nodesMap.persons[link.source.key]) {
      if (!link.source.selected) {
        link.source.x = person.x
        link.source.y = person.y
      }
      expandPerson(link.source, depth - 1)
    }
    if (data.nodesMap.persons[link.target.key]) {
      if (!link.target.selected) {
        link.target.x = person.x
        link.target.y = person.y
      }
      expandPerson(link.target, depth - 1)
    }
  })
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

function onInit(): void {
  // Select top 10 hubs
  data['hubs'].slice(0, 10).forEach(hub => expandPerson(hub, 0))

  updatePersons()
}

function onResize(): void {
  d3.select('svg')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .select('.root')
    .attr('transform', `translate(${innerWidth * 0.5}, ${innerHeight * 0.5})`)

  force.alpha(1.0)
  force.restart()
}

function onTick(): void {
  renderGraph()
}

function onPersonClick(person: PersonNode): void {
  if (d3.event['shiftKey']) {
    activatePerson(person)
    expandPerson(person)
  } else if (d3.event['altKey']) {
    deselectPerson(person)
  } else if (person === activePerson) {
    deactivateNode()
  } else {
    activatePerson(person)
  }

  updatePersons()
}

function onPersonDragStart(person: PersonNode): void {
  person.x = person.fx = d3.event.x
  person.y = person.fy = d3.event.y
  force.alphaTarget(0.3).restart()
}

function onPersonDrag(this: SVGGElement, person: PersonNode): void {
  person.x = person.fx = d3.event.x
  person.y = person.fy = d3.event.y

  d3.select<SVGGElement, Node>(this)
    .attr("transform", `translate(${person.x}, ${person.y})`)
}

function onPersonDragEnd(person: PersonNode): void {
  if (person !== activePerson) {
    delete person.fx
    delete person.fy
  }
  force.alphaTarget(0)
}

function activatePerson(person: PersonNode) {
  if (activePerson === person) return
  if (activePerson) deactivateNode()

  activePerson = person
  activePerson.fx = activePerson.x
  activePerson.fy = activePerson.y

  renderInfobox(activePerson)

  selectPerson(person)

  pushDataLayer({
    'event': 'activateNode',
    'key': activePerson.key,
    'name': activePerson.name,
  })
}

function deactivateNode(): void {
  if (!activePerson) return

  delete activePerson.fx
  delete activePerson.fy
  activePerson = null

  const infobox = document.querySelector('.infobox')
  if (!infobox) throw new Error('Not found: ".infobox"')
  infobox.innerHTML = ''
}

// function findShortestPath(person0: PersonNode, person1: PersonNode): PersonNode[] {
//   return jsnx
//     .bidirectionalShortestPath(data.graph, person0.key, person1.key)
//     .map((key: string) => data.nodesMap.persons[key])
// }

/**
 * Apply changes in selected nodes
 */
function updatePersons(): void {
  // Update nodes
  const persons = data.nodes.persons.filter((person: PersonNode) => person.selected)

  personsSel = personsSel.data(persons, person => person.key)
  personsSel.exit().remove()
  personsSel = personsSel.enter()
    .append('g')
    .attr('class', 'node person')
    .each(function (person) {
      d3.select(this).append('circle')
      d3.select(this).append('text')
        .attr('class', 'name')
        .attr('transform', 'translate(8, 8)')
        .text(person.name)
    })
    .on('click', onPersonClick)
    .call(d3.drag()
      .on('start', onPersonDragStart as any)
      .on('drag', onPersonDrag as any)
      .on('end', onPersonDragEnd as any) as any
    )
    .merge(personsSel as any) as any

  // Update links
  linksSel = linksSel.data(data.links.filter(d => d.source.selected && d.target.selected))

  linksSel.exit().remove()
  linksSel = linksSel.enter()
    .append('line')
    .merge(linksSel as any)
    .attr('class', d => `link ${d.rel}`)
    .attr('marker-end', d => d.rel === 'child' ? 'url(#arrowMarker)' : '') as any

  // Trigger layout
  force.nodes(personsSel.data())
  forceLink.links(linksSel.data())

  force.alpha(1.0)
  force.restart()
}

function renderInfobox(person: PersonNode): void {
  const info = person.info
  const infobox = d3.select('.infobox').html(
    `<h2>${renderPersonBrief(person)}</h2>` +
    '<div class="item occupation"><h3>직업</h3><ul></ul></div>' +
    '<div class="item affiliation"><h3>소속</h3><ul></ul></div>' +
    '<div class="item position"><h3>직위 </h3><ul></ul></div>' +
    '<div class="item membership"><h3>멤버십</h3><ul></ul></div>' +
    '<div class="item education"><h3>출신학교</h3><ul></ul></div>' +
    '<div class="item birthplace"><h3>출생지</h3><ul></ul></div>' +
    '<div class="item mother"><h3>어머니</h3><ul></ul></div>' +
    '<div class="item father"><h3>아버지</h3><ul></ul></div>' +
    '<div class="item spouse"><h3>배우자</h3><ul></ul></div>' +
    '<div class="item child"><h3>자녀</h3><ul></ul></div>' +
    `<img class="item image" src="#" alt="profile">` +
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
    .text(d => renderPersonBrief(d.target as PersonNode))

  // Father
  infobox.select('.father').classed('show', !!info.father)
  infobox.select('.father ul').selectAll('li').data(info.father || []).enter()
    .append('li')
    .text(d => renderPersonBrief(d.target as PersonNode))

  // Spouse
  infobox.select('.spouse').classed('show', !!info.spouse)
  infobox.select('.spouse ul').selectAll('li').data(info.spouse || []).enter()
    .append('li')
    .text(d => renderPersonBrief(d.target as PersonNode))

  // Child
  infobox.select('.child').classed('show', !!info.child)
  infobox.select('.child ul').selectAll('li').data(info.child || []).enter()
    .append('li')
    .text(d => renderPersonBrief(d.target as PersonNode))

  // Image
  infobox.select('.image').classed('show', !!person.image)
  if (person.image) {
    infobox.select('.image').attr('src', person.image.replace('http:', 'https:'))
  }

  // Actions
  infobox.select('.actions .edit a').attr('href', `https://www.wikidata.org/entity/${person.key}`)
  infobox.select('.actions .expand a').on('click', () => {
    expandPerson(person)
    updatePersons()
  })
  infobox.select('.actions .hide a').on('click', () => {
    deselectPerson(person)
    updatePersons()
  })
}

function renderGraph(): void {
  // Calculate bounding box
  const svg = d3.select('svg')
  const margin = 20
  const width = +svg.attr('width')
  const height = +svg.attr('height')
  const xMin = width * -0.5 + margin
  const xMax = width * +0.5 - margin
  const yMin = height * -0.5 + margin
  const gyMax = height * +0.5 - margin

  personsSel
    .classed('active', person => person === activePerson)
    .classed('fully-expanded', person => person.fullyExpanded)
    .attr('transform', person => {
      // Make nodes to respect bounding box
      person.x = Math.max(xMin, Math.min(xMax, person.x || 0))
      person.y = Math.max(yMin, Math.min(gyMax, person.y || 0))

      return `translate(${person.x}, ${person.y})`
    })
    .select('circle')
    .attr('r', node => node.fullyExpanded ? 5 : 7)
    .attr('filter', node => node === activePerson ? 'url(#dropShadow)' : '')

  linksSel
    .attr('x1', person => person.source.x || 0)
    .attr('y1', person => person.source.y || 0)
    .attr('x2', person => person.target.x || 0)
    .attr('y2', person => person.target.y || 0)
}

function renderPersonBrief(person: PersonNode) {
  const name = person['name']

  // Try description
  const description = person['description']
  if (description) return `${name} (${description})`

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

async function loadData(): Promise<DataSet> {
  const urlPrefix = `//cdn.rawgit.com/akngs/smallworld/${DATA_HASH}/data/`

  const data: any[][] = await Promise.all([
    d3.csv(urlPrefix + 'affiliations.csv', parseAffiliation),
    d3.csv(urlPrefix + 'birthplaces.csv', parseBirthplace),
    d3.csv(urlPrefix + 'educations.csv', parseEducation),
    d3.csv(urlPrefix + 'memberships.csv', parseMembership),
    d3.csv(urlPrefix + 'occupations.csv', parseOccupation),
    d3.csv(urlPrefix + 'persons.csv', parsePerson),
    d3.csv(urlPrefix + 'positions.csv', parsePosition),
    d3.csv(urlPrefix + 'links.csv', parseLink),
    d3.csv(urlPrefix + 'hubs.csv', parsePerson),
  ])

  const affiliations = data[0] as AffiliationNode[]
  const birthplaces = data[1] as BirthplaceNode[]
  const educations = data[2] as EducationNode[]
  const memberships = data[3] as MembershipNode[]
  const occupations = data[4] as OccupationNode[]
  const persons = data[5] as PersonNode[]
  const positions = data[6] as PositionNode[]

  const rawLinks = data[7] as any[]
  const rawHubs = data[8] as PersonNode[]

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
  const graph: Graph = buildGraph(links)

  return {
    nodes,
    links,
    nodesMap,
    hubs,
    graph,
  }
}

function parseNode(raw: any): Node {
  return {
    key: raw.key,
    name: raw.name,
    ins: [],
    outs: [],
    links: []
  }
}

function parseAffiliation(raw: any): AffiliationNode {
  return parseNode(raw)
}

function parseBirthplace(raw: any): BirthplaceNode {
  return parseNode(raw)
}

function parseEducation(raw: any): EducationNode {
  return parseNode(raw)
}

function parseMembership(raw: any): MembershipNode {
  return parseNode(raw)
}

function parseOccupation(raw: any): OccupationNode {
  return parseNode(raw)
}

function parsePosition(raw: any): PositionNode {
  return parseNode(raw)
}

function parsePerson(raw: any): PersonNode {
  return {
    key: raw.key,
    name: raw.name,
    description: raw.description,
    image: raw.image,
    birthdate: raw['birthdate'] ? PARSE_TIME(raw['birthdate']) as Date : undefined,
    deathdate: raw['deathdate'] ? PARSE_TIME(raw['deathdate']) as Date : undefined,

    ins: [],
    outs: [],
    links: [],

    info: {},
    selected: false,
    fullyExpanded: false,
  }
}

function parseLink(raw: any): any {
  return {
    source: raw.source,
    target: raw.target,
    rel: raw.rel,
    kinship: KINSHIP_RELS.indexOf(raw.rel) !== -1
  }
}

function buildGraph(links: Link[]): Graph {
  const graph = new jsnx.Graph()
  links
    .filter(link => link.kinship)
    .forEach(link => graph.addEdge(link.source.key, link.target.key))
  return graph
}

function pushDataLayer(obj: any) {
  (window as any).dataLayer.push(obj)
}

window.addEventListener("DOMContentLoaded", function () {
  main().then()
})
