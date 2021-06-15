const ranges = [
  { id: 1, start:  0, end: 6 },
  { id: 2, start:  5, end: 15 },
  { id: 3, start:  8, end: 12 },
  { id: 4, start: 10, end: 11 },
  { id: 5, start: 17, end: 21 },
  { id: 6, start: 21, end: 28 },
  { id: 7, start: 25, end: 30 },
];

const x = d3.scaleLinear()
  .domain([0, 30])
  .range([20, 1180]);
const y = d3.scaleBand()
  .domain(ranges.map(d => d.id))
  .range([30, 330])
  .paddingInner(0.2)
  .paddingOuter(0.2);
const color = d3.scaleOrdinal(d3.schemeCategory10)
  .domain(ranges.map(d => d.id));

// visualize
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

// calculate and list
const nonoverlapping = unoverlapRanges(ranges);
console.log('Non-overlapping ranges: ', nonoverlapping);
let log_content = d3.select('.content')
  .append('div')
  .classed('listing', true);
log_content.append('h3').text('Non-overlapping Ranges');
const lst = log_content.append('ol');
lst.selectAll('li')
  .data(nonoverlapping)
  .enter()
    .append('li')
    .text(d => {
      return "Range from " + d.start + " to " + d.end + " containing " + d.ranges.map(d => d.id).join(", ");
    });

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
    .attr('y', 400)
    .attr('height', y.bandwidth())
    .attr('fill', (_,i) => color(i))
    .each(function() {
      const d = d3.select(this).datum();
      d3.select('svg')
        .append('text')
        .attr('x', x(d.start) + 5)
        .attr('y', 400 + y.bandwidth() - 5)
        .text(d.ranges.map(d => d.id).join(','))
        .attr('fill', 'white')
        .attr('font-size', 12);
    });
