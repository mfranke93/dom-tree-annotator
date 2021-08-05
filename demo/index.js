import { Annotator } from '../lib/index.js';
// or: <script> tag with lib/dom-tree-annotator.min.js and
// const { Annotator } = DomTreeAnnotator;

import { TreeVis } from './tree-vis.js';

const text_content = `<p id="first">
  Consectetur enim laborum velit porro earum quae vitae?
  <b>Illum</b> sit autem eos eos labore reprehenderit.
  Sed quo labore soluta eius.
</p>

<p style="color: red;">
  Foo bar baz; bak foo. Sed quo labore soluta eius.
</p>`;
const log_content = d3.select('.content');
log_content.append('h3').text('Non-overlapping Ranges');
const listing = log_content.append('ol');
log_content.append('h3').text('As spans');
const p = log_content.append('p').classed('annotated-text', true).html(text_content);

log_content.append('h3').text('Tree visualization');
const tree = log_content.append('div').classed('tree-vis', true);
const treeVis = new TreeVis(tree);

function onAnnotationChange(evt) {
  const annotations = evt.detail;
  const ranges = (() => {
    const rs = new Set();
    annotations.forEach(a => a.ranges.forEach(r => rs.add(r)));
    return Array.from(rs);
  })();
  console.log(annotations);

  // text
  let text = '';
  const traverse = (n) => {
    if (n instanceof Text)
      text += n.data;
    else
      n.childNodes.forEach(c => traverse(c));
  };
  const d = document.createElement('div');
  d.innerHTML = text_content;
  traverse(d);

  const x = d3.scaleLinear()
    .domain([0, text.length])
    .range([20, 1180]);
  const y = d3.scaleBand()
    .domain([...annotations.map(d => d.data.id), 'dummy'])
    .range([30, 400])
    .paddingInner(0.2)
    .paddingOuter(0.2);
  const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(annotations.map(d => d.data.id));

  // visualize
  d3.select('svg').selectAll('text').remove();
  let sel = d3.select('svg')
    .selectAll('.range')
    .data(annotations, d => d.data.id);
  sel.enter()
    .append('rect')
    .classed('range', true)
    .each(function (d) {
      d3.select(this).append('title').text('Range ' + d.data.id);
    })
    .merge(sel)
    .attr('x', d => x(d.start))
    .attr('width', d => x(d.end) - x(d.start))
    .attr('y', d => y(d.data.id))
    .attr('height', y.bandwidth())
    .attr('fill', d => color(d.data.id))
    .each(function () {
      const d = d3.select(this).datum();
      d3.select('svg')
        .append('text')
        .attr('x', x(d.start) + 5)
        .attr('y', y(d.data.id) + y.bandwidth() - 5)
        .text(d.data.id)
        .attr('fill', 'white')
        .attr('font-size', 12);
    });

  // calculate and list
  const sel3 = listing.selectAll('li').data(ranges, (d, i) => i);
  sel3.enter()
    .append('li')
    .merge(sel3)
    .text(d => {
      return "Range from " + d.start + " to " + d.end + " containing " + d.annotations.map(d => d.data.id).join(", ");
    });
  sel3.exit().remove();

  // visualize
  let sel2 = d3.select('svg')
    .selectAll('.range-nonoverlapping')
    .data(ranges);
  sel2.enter()
    .append('rect')
    .classed('range-nonoverlapping', true)
    .each(function (d) {
      d3.select(this).append('title').text(d => 'Range for items ' + d.annotations.map(d => d.data.id).join(', '));
    })
    .merge(sel2)
    .attr('x', d => x(d.start))
    .attr('width', d => x(d.end) - x(d.start))
    .attr('y', y('dummy'))
    .attr('height', y.bandwidth())
    .attr('fill', (_, i) => color(i))
    .each(function () {
      const d = d3.select(this).datum();
      d3.select('svg')
        .append('text')
        .attr('x', x(d.start) + 5)
        .attr('y', y('dummy') + y.bandwidth() - 5)
        .text(d.annotations.map(d => d.data.id).join(','))
        .attr('fill', 'white')
        .attr('font-size', 12);
    });

  d3.select('svg')
    .selectAll('.dummy')
    .data(text.split(''))
    .enter()
    .append('text')
    .attr('x', (d, i) => x(i) + (x(1) - x(0)) / 2)
    .attr('y', y('dummy') + y.bandwidth() + 10)
    .text(d => d)
    .attr('font-size', 10)
    .attr('font-family', 'monospace')
    .attr('text-anchor', 'middle');

  // axis
  const ticks = x.ticks();
  if (ticks[ticks.length - 1] !== x.domain()[1]) ticks.push(x.domain()[1]);  // add end

  d3.selectAll('svg g.axis').remove();
  d3.select('svg')
    .append('g')
    .classed('axis', true)
    .attr('transform', `translate(0, ${y('dummy') + y.bandwidth() + 20})`)
    .call(d3.axisBottom(x).tickValues(ticks));

  p.selectAll('span.annotation').on('click', function () {
    console.log(this.getAttribute('data-annotation-ids'));
  });

  requestAnimationFrame(() => treeVis.render(text_content, p.node()));
}

const annotator = new Annotator(p.node());
annotator.addEventListener('change', onAnnotationChange);
annotator.addEventListener('hoverstart', evt => console.log('hoverstart', evt.detail));
annotator.addEventListener('hoverend', evt => console.log('hoverend'));
annotator.addEventListener('click', evt => console.log('click', evt.detail));

// give each annotation a number
let _next_id = 1;
annotator.setAnnotationCreationHook(async function(_, resolve, __) {
  const data = {id: _next_id++};
  const classList = [];

  const color = Math.random();
  if (color < 0.2) classList.push('annotation--red');
  else if (color < 0.7) classList.push('annotation--green');
  else classList.push('annotation--blue');

  if (Math.random() > 0.8) classList.push('annotation--underlined');
  resolve({data, classList});
});

// load/clear/store annotations
d3.select('#clear-annotations').on('click', function() {
  annotator.annotations = [];
});
d3.select('#store-annotations').on('click', function() {
  const ann = annotator.annotations.map(a => a.clone());
  window.localStorage.setItem('dom-tree-annotator.annotations', JSON.stringify(ann));
});
d3.select('#load-annotations').on('click', function() {
  const ann = JSON.parse(window.localStorage.getItem('dom-tree-annotator.annotations') || '[]');
  annotator.annotations = ann;
});

// bootstrap
annotator.annotations = [];
