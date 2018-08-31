import * as d3 from 'd3'
import Promise from 'promise-polyfill'


export let data
export let linksSel
export let nodesSel
export let force
export let forceLink
export let activeNode


export function findNodes(name) {
  return data.nodes['persons'].filter(n => n.name === name)
}


export function toggleNode(key, force) {
  const node = data.nodesMap['persons'][key]
  if (force && node.selected) return

  // Toggle node
  node.selected = force || !node.selected

  // Update panel
  const element = document.querySelector(`#person-${key}`)
  if (node.selected) {
    node.x = node.x || Math.random() - 0.5
    node.y = node.y || Math.random() - 0.5
    element.classList.add('selected')
  } else {
    element.classList.remove('selected')
  }

  // Update "fullyExpanded" flags
  node.fullyExpanded = isFullyExpanded(node)
  node.links.filter(l => ['child', 'father', 'mother'].indexOf(l.rel) !== -1).forEach(l => {
    l.source.fullyExpanded = isFullyExpanded(l.source)
    l.target.fullyExpanded = isFullyExpanded(l.target)
  })
}


export function expandNode(key) {
  toggleNode(key, true)

  const node = data.nodesMap['persons'][key]

  if (!node.links) return

  node.links.forEach(link => {
    if (data.nodesMap['persons'][link.source.key]) {
      if (!link.source.selected) {
        link.source.x = node.x
        link.source.y = node.y
      }
      toggleNode(link.source.key, true)
    }
    if (data.nodesMap['persons'][link.target.key]) {
      if (!link.target.selected) {
        link.target.x = node.x
        link.target.y = node.y
      }
      toggleNode(link.target.key, true)
    }
  })
}


async function main() {
  data = await loadData()

  // Initialize person list
  const personsHtml = []
  data.nodes['persons'].forEach(person => {
    personsHtml.push(`<li id="person-${person.key}" data-key="${person.key}">${person.name}</li>`)
  })
  document.querySelector('.panels .persons').innerHTML = personsHtml.join('')
  document.querySelector('.panels .persons').addEventListener('click', function (e) {
    toggleNode(e.target.dataset['key'])
    updateNodes()
  })

  // Initialize SVG area
  const width = document.querySelector('svg').clientWidth
  const height = document.querySelector('svg').clientHeight

  const svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height)
    .select('.root')
    .style('transform', `translate(${width * 0.5}px, ${height * 0.5}px)`)

  linksSel = svg.select('.links').selectAll('.link')
  nodesSel = svg.select('.nodes').selectAll('.node')

  forceLink = d3.forceLink(linksSel.data())
    .distance(50)

  force = d3.forceSimulation(nodesSel.data())
    .force("link", forceLink)
    .force("center", d3.forceCenter(0, 0))
    .force("x", d3.forceX(0).strength(0.01))
    .force("y", d3.forceY(0).strength(0.01))
    .force("collide", d3.forceCollide(10))
    .force("charge", d3.forceManyBody().strength(-50))
    .on('tick', onTick)

  onInit()
}


async function loadData() {
  const urlPrefix = '//cdn.rawgit.com/akngs/smallworld/90ff0cf2/data/'
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

  const data = await Promise.all(dataNames.map(n => d3.csv(urlPrefix + n + '.csv')))
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
  const linkTargets = {
    'spouse': 'persons',
    'father': 'persons',
    'mother': 'persons',
    'child': 'persons',
    'birthplace': 'birthplaces',
    'membership': 'memberships',
    'affiliation': 'affiliations',
    'occupation': 'occupations',
    'education': 'educations',
    'position': 'positions',
  }
  result.links.forEach(link => {
    // Replace key strings in links into node references
    link.source = result.nodesMap['persons'][link.a]
    link.target = result.nodesMap[linkTargets[link.rel]][link.b]
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

  return result
}


function isFullyExpanded(node) {
  return node.links
    .filter(l => ['child', 'father', 'mother'].indexOf(l.rel) !== -1)
    .filter(l => !l.source.selected || !l.target.selected)
    .length === 0
}

function onInit() {
  toggleNode("Q45785")
  toggleNode("Q12589753")
  updateNodes()
}


function onTick() {
  rerender()
}


function onNodeClick(person) {
  if (activeNode === person) {
    activeNode = null
  } else {
    activeNode = person
  }

  d3.select(this).raise()

  expandNode(person.key)
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
    .style("transform", `translate(${d.x}px, ${d.y}px)`)
}


function onNodeDragEnd(d) {
  delete d.fx
  delete d.fy
  force.alphaTarget(0)
}


/**
 * Apply changes in active node
 */
function updateActiveNode() {
  rerender()
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
        .attr('fill', 'steelblue')
      d3.select(this).append('text')
        .attr('class', 'name')
        .style('transform', 'translate(8px, 8px)')
        .text(d.name)
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
    .attr('class', 'link')
    .attr('stroke', '#444')
    .merge(linksSel)

  // Trigger layout
  force.nodes(nodesSel.data())
  forceLink.links(linksSel.data())
  force.alphaTarget(0.3).restart()
}


function rerender() {
  nodesSel
    .classed('active', node => node === activeNode)
    .classed('fully-expanded', node => node.fullyExpanded)
    .style('transform', node => `translate(${node.x}px, ${node.y}px)`)
    .select('circle')
    .attr('r', node => node.fullyExpanded ? 5 : 8)
  linksSel
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
}


window.addEventListener("DOMContentLoaded", function () {
  main().then()
})
