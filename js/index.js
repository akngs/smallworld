import Promise from 'promise-polyfill'
import "babel-polyfill"
import 'whatwg-fetch'

import * as d3 from 'd3'
import Awesomplete from 'awesomplete'


const DATA_HASH = '2375c41'

const KINSHIP_RELS = ['child', 'mother', 'father', 'spouse']

const LINK_TARGETS = {
  'spouse': 'persons',
  'mother': 'persons',
  'father': 'persons',
  'child': 'persons',
  'birthplace': 'birthplaces',
  'membership': 'memberships',
  'affiliation': 'affiliations',
  'occupation': 'occupations',
  'education': 'educations',
  'position': 'positions',
}

const PARSE_TIME = d3.timeParse('%Y-%m-%dT%H:%M:%SZ')


let data
let linksSel
let nodesSel
let force
let forceLink
let activeNode


async function main() {
  data = await loadData()

  // Initialize autocomplete
  const q = document.querySelector('.query input')
  new Awesomplete(q, {
    list: data.nodes['persons'].map(p => {
      return {label: renderNodeBrief(p), value: p.key}
    }),
    minChars: 1,
    autoFirst: true
  })
  q.form.addEventListener('submit', e => {
    e.preventDefault()
    q.value = ''
  })
  q.addEventListener('awesomplete-selectcomplete', e => {
    const node = data.nodesMap['persons'][e.text.value]
    selectNode(node)
    setActivateNode(node)
    updateNodes()
    q.value = ''
  })

  // Initialize SVG area
  const svg = d3.select('svg .root')
  linksSel = svg.select('.links').selectAll('.link')
  nodesSel = svg.select('.nodes').selectAll('.node')

  forceLink = d3.forceLink(linksSel.data())
    .distance(50)

  force = d3.forceSimulation(nodesSel.data())
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


async function loadData() {
  const urlPrefix = location.hostname === 'localhost' ?
    '../data/' :
    `//cdn.rawgit.com/akngs/smallworld/${DATA_HASH}/data/`

  const dataNames = [
    'affiliations',
    'birthplaces',
    'educations',
    'memberships',
    'occupations',
    'persons',
    'positions',
    'links',
  ]

  showMessage('Loading...')
  const data = await Promise.all(dataNames.map(n => d3.csv(urlPrefix + n + '.csv')))
  hideMessage()

  const result = {
    nodes: {},
    nodesMap: {},
    links: data.pop()
  }
  data.forEach((datum, i) => {
    result.nodes[dataNames[i]] = datum
    datum.forEach(d => {
      d.ins = []
      d.outs = []
      d.links = []
    })
  })

  // Generate key-value maps for nodes
  data.forEach((datum, i) => {
    const map = {}
    datum.forEach(d => map[d.key] = d)
    result.nodesMap[dataNames[i]] = map
  })

  // Process links
  result.links.forEach(link => {
    // Replace key strings in links into node references
    link.source = result.nodesMap['persons'][link.a]
    link.target = result.nodesMap[LINK_TARGETS[link.rel]][link.b]
    delete link.a
    delete link.b
    if (!link.source || !link.target) {
      // Mark links to drop
      link.drop = true
      return
    }

    // Incoming/outgoing links
    link.source.outs.push(link)
    link.source.links.push(link)
    link.target.ins.push(link)
    link.target.links.push(link)
  })

  // Drop marked links
  result.links = result.links.filter(l => !l.drop)

  // Improve person nodes
  result.nodes['persons'].forEach((p, i) => {
    // Parse birthdate and deathdate
    if (p['birth_date']) p['birth_date'] = PARSE_TIME(p['birth_date'])
    if (p['death_date']) p['death_date'] = PARSE_TIME(p['death_date'])

    // Generate brief info for persons
    p.info = {}
    d3.nest().key(d => d.rel).entries(p.outs).forEach(g => p.info[g.key] = g.values)
  })
  return result
}


function selectNode(node) {
  if (node.selected) return

  node.selected = true
  node.x = node.x || Math.random() - 0.5
  node.y = node.y || Math.random() - 0.5
  updateFullyExpandedFlag(node)
}


function deselectNode(node) {
  if (!node.selected) return

  node.selected = false
  delete node.x
  delete node.y

  if (node === activeNode) deactivateNode()

  updateFullyExpandedFlag(node)
}


function updateFullyExpandedFlag(node) {
  node.fullyExpanded = isFullyExpanded(node)
  node.links.filter(isKinship).forEach(l => {
    l.source.fullyExpanded = isFullyExpanded(l.source)
    l.target.fullyExpanded = isFullyExpanded(l.target)
  })
}


function isKinship(link) {
  return KINSHIP_RELS.indexOf(link.rel) !== -1
}


function expandNode(node, depth = 1) {
  selectNode(node)

  if (depth === 0) return
  if (!node.links) return

  node.links.forEach(link => {
    if (data.nodesMap['persons'][link.source.key]) {
      if (!link.source.selected) {
        link.source.x = node.x
        link.source.y = node.y
      }
      expandNode(link.source, depth - 1)
    }
    if (data.nodesMap['persons'][link.target.key]) {
      if (!link.target.selected) {
        link.target.x = node.x
        link.target.y = node.y
      }
      expandNode(link.target, depth - 1)
    }
  })
}


function showMessage(message) {
  const element = document.querySelector('.message')
  element.textContent = message
  element.classList.add('show')
}


function hideMessage() {
  const element = document.querySelector('.message')
  element.classList.remove('show')
}


function isFullyExpanded(node) {
  return node.links
    .filter(isKinship)
    .filter(l => !l.source.selected || !l.target.selected)
    .length === 0
}


function onInit() {
  expandNode(data.nodesMap['persons']['Q445643'], 5)
  updateNodes()
}


function onResize() {
  d3.select('svg')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .select('.root')
    .attr('transform', `translate(${innerWidth * 0.5}, ${innerHeight * 0.5})`)

  force.alpha(1.0)
  force.restart()
}


function onTick() {
  renderGraph()
}


function onNodeClick(person) {
  if (d3.event['shiftKey']) {
    setActivateNode(person)
    expandNode(person)
  } else if (d3.event['altKey']) {
    deselectNode(person)
  } else if (person === activeNode) {
    deactivateNode()
  } else {
    setActivateNode(person)
  }

  updateNodes()
}


function onNodeDragStart(d) {
  d.x = d.fx = d3.event.x
  d.y = d.fy = d3.event.y
  force.alphaTarget(0.3).restart()
}


function onNodeDragMove(d) {
  d.x = d.fx = d3.event.x
  d.y = d.fy = d3.event.y
  d3.select(this)
    .attr("transform", `translate(${d.x}, ${d.y})`)
}


function onNodeDragEnd(d) {
  if (d !== activeNode) {
    delete d.fx
    delete d.fy
  }
  force.alphaTarget(0)
}


function setActivateNode(node) {
  if (activeNode === node) return
  if (activeNode) deactivateNode()

  activeNode = node
  activeNode.fx = activeNode.x
  activeNode.fy = activeNode.y

  renderInfobox(activeNode)

  d3.select(this).raise()
  selectNode(node)

  window['dataLayer'].push({
    'event': 'activateNode',
    'key': activeNode.key,
    'name': activeNode.name,
  })
}


function deactivateNode() {
  if (!activeNode) return

  delete activeNode.fx
  delete activeNode.fy
  activeNode = null
  document.querySelector('.infobox').innerHTML = ''
}


/**
 * Apply changes in selected nodes
 */
function updateNodes() {
  // Update nodes
  nodesSel = nodesSel.data(data.nodes['persons'].filter(d => d.selected), d => d.key)
  nodesSel.exit().remove()
  nodesSel = nodesSel.enter()
    .append('g')
    .attr('class', 'node person')
    .each(function (d) {
      d3.select(this).append('circle')
      d3.select(this).append('text')
        .attr('class', 'name')
        .attr('transform', 'translate(8, 8)')
        .text(d => d.name)
    })
    .on('click', onNodeClick)
    .call(d3.drag()
      .on('start', onNodeDragStart)
      .on('drag', onNodeDragMove)
      .on('end', onNodeDragEnd)
    )
    .merge(nodesSel)

  // Update links
  linksSel = linksSel.data(data.links.filter(d => d.source.selected && d.target.selected))

  linksSel.exit().remove()
  linksSel = linksSel.enter()
    .append('line')
    .merge(linksSel)
    .attr('class', d => `link ${d.rel}`)
    .attr('marker-end', d => d.rel === 'child' ? 'url(#arrowMarker)' : '')

  // Trigger layout
  force.nodes(nodesSel.data())
  forceLink.links(linksSel.data())

  force.alpha(1.0)
  force.restart()
}


function renderInfobox(node) {
  const info = node.info
  const infobox = d3.select('.infobox').html(
    `<h2>${renderNodeBrief(node)}</h2>` +
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
  infobox.select('.occupation').classed('show', info.occupation)
  infobox.select('.occupation ul').selectAll('li').data(info.occupation || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Affiliation
  infobox.select('.affiliation').classed('show', info.affiliation)
  infobox.select('.affiliation ul').selectAll('li').data(info.affiliation || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Position
  infobox.select('.position').classed('show', info.position)
  infobox.select('.position ul').selectAll('li').data(info.position || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Membership
  infobox.select('.membership').classed('show', info.membership)
  infobox.select('.membership ul').selectAll('li').data(info.membership || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Education
  infobox.select('.education').classed('show', info.education)
  infobox.select('.education ul').selectAll('li').data(info.education || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Birthplace
  infobox.select('.birthplace').classed('show', info.birthplace)
  infobox.select('.birthplace ul').selectAll('li').data(info.birthplace || []).enter()
    .append('li')
    .text(d => d.target.name)

  // Mother
  infobox.select('.mother').classed('show', info.mother)
  infobox.select('.mother ul').selectAll('li').data(info.mother || []).enter()
    .append('li')
    .text(d => renderNodeBrief(d.target))

  // Father
  infobox.select('.father').classed('show', info.father)
  infobox.select('.father ul').selectAll('li').data(info.father || []).enter()
    .append('li')
    .text(d => renderNodeBrief(d.target))

  // Spouse
  infobox.select('.spouse').classed('show', info.spouse)
  infobox.select('.spouse ul').selectAll('li').data(info.spouse || []).enter()
    .append('li')
    .text(d => renderNodeBrief(d.target))

  // Child
  infobox.select('.child').classed('show', info.child)
  infobox.select('.child ul').selectAll('li').data(info.child || []).enter()
    .append('li')
    .text(d => renderNodeBrief(d.target))

  // Image
  infobox.select('.image').classed('show', node.image)
  if (node.image) {
    infobox.select('.image').attr('src', node.image.replace('http:', 'https:'))
  }

  // Actions
  infobox.select('.actions .edit a').attr('href', `https://www.wikidata.org/entity/${node.key}`)
  infobox.select('.actions .expand a').on('click', () => {
    expandNode(activeNode)
    updateNodes()
  })
  infobox.select('.actions .hide a').on('click', () => {
    deselectNode(activeNode)
    updateNodes()
  })
}

function renderGraph() {
  // Calculate bounding box
  const svg = d3.select('svg')
  const margin = 20
  const width = +svg.attr('width')
  const height = +svg.attr('height')
  const xmin = width * -0.5 + margin
  const xmax = width * +0.5 - margin
  const ymin = height * -0.5 + margin
  const ymax = height * +0.5 - margin

  nodesSel
    .classed('active', node => node === activeNode)
    .classed('fully-expanded', node => node.fullyExpanded)
    .attr('transform', node => {
      // Make nodes to respect bounding box
      node.x = Math.max(xmin, Math.min(xmax, node.x))
      node.y = Math.max(ymin, Math.min(ymax, node.y))

      return `translate(${node.x}, ${node.y})`
    })
    .select('circle')
    .attr('r', node => node.fullyExpanded ? 5 : 7)
    .attr('filter', node => node === activeNode ? 'url(#dropShadow)' : '')

  linksSel
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
}

function renderNodeBrief(node) {
  const name = node['name']

  // Try description
  const description = node['description']
  if (description) return `${name} (${description})`

  // Try birthdate and deathdate
  const birthdate = node['birth_date'] || null
  const deathdate = node['death_date'] || null
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


window.addEventListener("DOMContentLoaded", function () {
  main().then()
})
