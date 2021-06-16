import {unoverlapRanges, insertRanges} from './util.js';

const text_content = `<p id="first">
  Consectetur enim laborum velit porro earum quae vitae?
  <b>Illum</b> sit autem eos eos labore reprehenderit.
  Sed quo labore soluta eius.
</p>

<p style="color: red;">
  Foo bar baz; bak foo. Sed quo labore soluta eius.
</P`;

const log_content = d3.select('.content');
log_content.append('h3').text('Non-overlapping Ranges');
const listing = log_content.append('ol');
log_content.append('h3').text('As spans');
const p = log_content.append('p').classed('annotated-text', true);

function recalculateAndVisualize(ranges) {
  const x = d3.scaleLinear()
    .domain([0, text_content.length])
    .range([20, 1180]);
  const y = d3.scaleBand()
    .domain([...ranges.map(d => d.id), 'dummy'])
    .range([30, 430])
    .paddingInner(0.2)
    .paddingOuter(0.2);
  const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(ranges.map(d => d.id));

  // visualize
  d3.select('svg').selectAll('text').remove();
  let sel = d3.select('svg')
    .selectAll('.range')
    .data(ranges, d => d.id);
  sel.enter()
    .append('rect')
    .classed('range', true)
    .each(function(d) {
      d3.select(this).append('title').text(d => 'Range ' + d.id);
    })
    .merge(sel)
    .attr('x', d => x(d.start))
    .attr('width', d => x(d.end) - x(d.start))
    .attr('y', d => y(d.id))
    .attr('height', y.bandwidth())
    .attr('fill', d => color(d.id))
    .each(function() {
      const d = d3.select(this).datum();
      d3.select('svg')
        .append('text')
        .attr('x', x(d.start) + 5)
        .attr('y', y(d.id) + y.bandwidth() - 5)
        .text(d.id)
        .attr('fill', 'white')
        .attr('font-size', 12);
    });

  // calculate and list
  const nonoverlapping = unoverlapRanges(JSON.parse(JSON.stringify(ranges)));
  const sel3 = listing.selectAll('li').data(nonoverlapping, (d,i)=>i);
  sel3.enter()
    .append('li')
    .merge(sel3)
    .text(d => {
      return "Range from " + d.start + " to " + d.end + " containing " + d.ranges.map(d => d.id).join(", ");
    });
  sel3.exit().remove();

  // visualize
  let sel2 = d3.select('svg')
    .selectAll('.range-nonoverlapping')
    .data(nonoverlapping);
  sel2.enter()
    .append('rect')
    .classed('range-nonoverlapping', true)
    .each(function(d) {
      d3.select(this).append('title').text(d => 'Range for items ' + d.ranges.map(d => d.id).join(', '));
    })
    .merge(sel2)
    .attr('x', d => x(d.start))
    .attr('width', d => x(d.end) - x(d.start))
    .attr('y', y('dummy'))
    .attr('height', y.bandwidth())
    .attr('fill', (_,i) => color(i))
    .each(function() {
      const d = d3.select(this).datum();
      d3.select('svg')
        .append('text')
        .attr('x', x(d.start) + 5)
        .attr('y', y('dummy') + y.bandwidth() - 5)
        .text(d.ranges.map(d => d.id).join(','))
        .attr('fill', 'white')
        .attr('font-size', 12);
    });

  // text
  let text = '';
  const traverse = (n) => {
    if (n instanceof Text) text += n.data;
    else n.childNodes.forEach(c => traverse(c));
  };
  const d = document.createElement('div');
  d.innerHTML = text_content;
  traverse(d);
  d3.select('svg')
    .selectAll('.dummy')
    .data(text.split(''))
    .enter()
    .append('text')
    .attr('x', (d,i) => x(i) + (x(1) - x(0))/2)
    .attr('y', y('dummy') + y.bandwidth() + 10)
    .text(d => d)
    .attr('font-size', 10)
    .attr('font-family', 'monospace')
    .attr('text-anchor', 'middle');


  // fill in text nodes
  p.html(insertRanges(text_content, nonoverlapping));
  p.selectAll('span.annotation').on('click', function() {
    console.log(this.getAttribute('data-annotation-ids'));
  });
}

let next_id = 0;
const _ranges = [];

p.on('mouseup', () => {
  const selection = document.getSelection();
  if (selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const selection_content = range.cloneContents().textContent;
  if (selection_content.length === 0) return;

  // find offset from start
  const r2 = new Range();
  r2.setStart(p.node(), 0);
  r2.setEnd(range.startContainer, range.startOffset);
  const pre_contents = r2.cloneContents().textContent;

  _ranges.push({id: next_id++, start: pre_contents.length, end: pre_contents.length + selection_content.length});

  recalculateAndVisualize(_ranges);
});

recalculateAndVisualize(_ranges);
