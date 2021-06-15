const text_content = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

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
  d3.select('svg')
    .selectAll('.dummy')
    .data(text_content.split(''))
    .enter()
    .append('text')
    .attr('x', (d,i) => x(i) + (x(1) - x(0))/2)
    .attr('y', y('dummy') + y.bandwidth() + 10)
    .text(d => d)
    .attr('font-size', 12)
    .attr('text-anchor', 'middle');


  // fill in text nodes
  const text_length = text_content.length;
  const text_nodes = [];
  if (nonoverlapping.length) {
    if (nonoverlapping[0].start > 0) text_nodes.push({start: 0, end: nonoverlapping[0].start, ranges: null});

    for (let i = 0; i < nonoverlapping.length - 1; ++i)
      if (nonoverlapping[i].end !== nonoverlapping[i+1].start)
        text_nodes.push({start:nonoverlapping[i].end, end: nonoverlapping[i+1].start, ranges: null});

    if (nonoverlapping[nonoverlapping.length - 1].end !== text_length) text_nodes.push({start: nonoverlapping[nonoverlapping.length - 1].end, end: text_length, ranges: null});
  } else {
    text_nodes.push({start: 0, end: text_length, ranges: null});
  }

  const all_ranges = [...nonoverlapping, ...text_nodes]
    .sort((a,b) => a.start - b.start)
    .map(d => {
      d.text = text_content.slice(d.start, d.end);
      return d;
    });

  let text = '';
  for (const node of all_ranges) {
    if (node.ranges === null) {
      text += node.text;
    } else {
      text += `<span class="annotation" data-items="${node.ranges.map(d => d.id).join(', ')}">${node.text}</span>`;
    }
  }
  p.html(text);
}


function unoverlapRanges(ranges) {
  if (ranges.length === 0) return [];

  // sort ranges ascending by start
  ranges.sort((a, b) => a.start - b.start);

  const active = new Set();       // currently active ranges
  let index = 0;                  // current index
  const result = [];              // resulting ranges

  // initialize
  const first = ranges.shift();
  index = first.start;
  active.add(first);

  while ((active.size > 0) || (ranges.length > 0)) {
    const next_beginning = ranges.length
      ? ranges[0]
      : { start: Infinity };
    const next_ending = active.size
      ? Array.from(active).sort((a,b) => a.end - b.end)[0]
      : { end: Infinity };

    if (next_beginning.start < next_ending.end) {
      if (active.size) result.push({
        start: index,
        end: next_beginning.start,
        ranges: Array.from(active)
      });
      index = next_beginning.start;
      // get all starting here
      while (ranges.length > 0 && ranges[0].start === index) {
        active.add(ranges.shift());
      }
    } else if (next_beginning.start === next_ending.end) {
      if (active.size) result.push({
        start: index,
        end: next_beginning.start,
        ranges: Array.from(active)
      });
      index = next_beginning.start;
      // remove all ending here
      Array.from(active)
        .filter(d => d.end === index)
        .forEach(active.delete.bind(active));
      // get all starting here
      while (ranges.length > 0 && ranges[0].start === index) {
        active.add(ranges.shift());
      }
    } else {
      if (active.size) result.push({
        start: index,
        end: next_ending.end,
        ranges: Array.from(active)
      });
      index = next_ending.end;
      // remove all ending here
      Array.from(active)
        .filter(d => d.end === index)
        .forEach(active.delete.bind(active));
    }
  }

  return result;
}

let next_id = 0;
const _ranges = [];

p.on('mouseup', () => {
  const selection = document.getSelection();
  const range = selection.getRangeAt(0);

  // find offset from start
  const r2 = new Range();
  r2.setStart(p.node(), 0);
  r2.setEnd(range.startContainer, range.startOffset);
  const pre_contents = r2.cloneContents().textContent;

  _ranges.push({id: next_id++, start: pre_contents.length, end: pre_contents.length + range.cloneContents().textContent.length});

  recalculateAndVisualize(_ranges);
});

recalculateAndVisualize(_ranges);
