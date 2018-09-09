import 'whatwg-fetch'
import * as d3 from 'd3'
import Awesomplete from 'awesomplete'
import {Graph, GraphNode, GraphRenderer, Loader, PersonNode} from './graph'

const DATA_HASH = '46242eb'

let renderer: GraphRenderer

export async function explorerMain() {
  const rootEl = document.querySelector<SVGElement>('svg')
  if (!rootEl) throw new Error('Not found: "svg"')

  showMessage('Loading...')
  const loader = new Loader(DATA_HASH)
  const data = await loader.loadData()
  hideMessage()

  const network = new Graph(data, {
    onSelect: (network, node) => {
      renderInfobox(network, node)
      pushDataLayer({
        'event': 'activateNode',
        'key': node.key,
        'name': node.name
      })
    },
    onDeselect: node => {
      const infobox = document.querySelector('.infobox')
      if (!infobox) throw new Error('Not found: ".infobox"')
      infobox.innerHTML = ''
    }
  })
  renderer = new GraphRenderer(rootEl, network, network)
  window.addEventListener('resize', () => renderer.resize())

  // Init autocomplete
  const q = document.querySelector<HTMLInputElement>('.query input')
  if (!q) throw new Error('Not found: ".query input"')
  if (!q.form) throw new Error('Not found: "q.form')
  q.disabled = false

  new Awesomplete(q, {
    list: network.allNodes.map(node => {
      return {label: network.getPersonBrief(node), value: node.key}
    }),
    minChars: 1,
    autoFirst: true
  })
  q.form.addEventListener('submit', e => {
    e.preventDefault()
    q.value = ''
  })
  q.addEventListener('awesomplete-selectcomplete', (e: any) => {
    q.value = ''

    const node = network.getNode(e.text.value)
    network.expand(node, 1)
    network.select(node)
    renderer.rerender()
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

function renderInfobox(network: Graph, node: GraphNode): void {
  const info = node.info
  const infobox = d3.select('.infobox').html(
    `<h2>${network.getPersonBrief(node)}</h2>` +
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
    .text(node => node.name)

  // Affiliation
  infobox.select('.affiliation').classed('show', !!info.affiliation)
  infobox.select('.affiliation ul').selectAll('li').data(info.affiliation || []).enter()
    .append('li')
    .text(node => node.name)

  // Position
  infobox.select('.position').classed('show', !!info.position)
  infobox.select('.position ul').selectAll('li').data(info.position || []).enter()
    .append('li')
    .text(node => node.name)

  // Membership
  infobox.select('.membership').classed('show', !!info.membership)
  infobox.select('.membership ul').selectAll('li').data(info.membership || []).enter()
    .append('li')
    .text(node => node.name)

  // Education
  infobox.select('.education').classed('show', !!info.education)
  infobox.select('.education ul').selectAll('li').data(info.education || []).enter()
    .append('li')
    .text(node => node.name)

  // Birthplace
  infobox.select('.birthplace').classed('show', !!info.birthplace)
  infobox.select('.birthplace ul').selectAll('li').data(info.birthplace || []).enter()
    .append('li')
    .text(node => node.name)

  // Mother
  infobox.select('.mother').classed('show', !!info.mother)
  infobox.select('.mother ul').selectAll('li').data(info.mother || []).enter()
    .append('li')
    .text(node => network.getPersonBrief(node as PersonNode))

  // Father
  infobox.select('.father').classed('show', !!info.father)
  infobox.select('.father ul').selectAll('li').data(info.father || []).enter()
    .append('li')
    .text(node => network.getPersonBrief(node as PersonNode))

  // Spouse
  infobox.select('.spouse').classed('show', !!info.spouse)
  infobox.select('.spouse ul').selectAll('li').data(info.spouse || []).enter()
    .append('li')
    .text(node => network.getPersonBrief(node as PersonNode))

  // Child
  infobox.select('.child').classed('show', !!info.child)
  infobox.select('.child ul').selectAll('li').data(info.child || []).enter()
    .append('li')
    .text(node => network.getPersonBrief(node as PersonNode))

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
    network.hide(node)
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
