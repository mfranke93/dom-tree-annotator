export function unoverlapRanges(ranges: any[]): any[] {
  if (ranges.length === 0) return [];

  // sort ranges ascending by start
  ranges.sort((a, b) => a.start - b.start);

  const active = new Set<any>();       // currently active ranges
  let index = 0;                  // current index
  const result: any[] = [];              // resulting ranges

  // initialize
  const first = ranges.shift();
  index = first.start;
  active.add(first);

  while ((active.size > 0) || (ranges.length > 0)) {
    const next_beginning = ranges.length
      ? ranges[0]
      : { start: Infinity };
    const next_ending: any = active.size
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
        start: index, end: next_beginning.start,
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

export function insertRanges(innerHTML, nonoverlapping_ranges) {
  const d = document.createElement('div');
  d.innerHTML = innerHTML;

  const [_, [new_div]] = handleNode(d, 0, nonoverlapping_ranges);
  return (<HTMLElement>new_div).innerHTML;
}

function handleNode(node, text_position, range_list): [number, Node[]] {
  // TODO: bug when creating annotation later: position off-by-n error
  const output_nodes: Node[] = [];
  // node is text_node (recursion abort)
  if (node instanceof Text) {
    const length = node.length;

    if (range_list.length === 0) {
      // entire text node has no ranges
      output_nodes.push(node.cloneNode());
    } else if (range_list[0].start > text_position) {
      // text node at start
      output_nodes.push(document.createTextNode(node.data.slice(0, range_list[0].start - text_position)));
    }

    let last_range: any = null;
    while (range_list.length > 0 && range_list[0].start < text_position + length) {
      // insert text node between ranges if non-empty
      if (last_range !== null && last_range.end < range_list[0].start) {
        output_nodes.push(document.createTextNode(node.data.slice(last_range.end - text_position, range_list[0].start - text_position)));
      }

      const clone = node.cloneNode();
      const range = range_list.shift();
      last_range = range;

      const range_start = Math.max(range.start, text_position) - text_position; // range starts either at start of node, or later
      const range_end = Math.min(range.end, text_position + length) - text_position;  // range ends either at end of node, or earlier

      const span = document.createElement('span');
      span.classList.add('annotation');
      span.setAttribute('data-annotation-ids', range.ranges.map(d => d.id).join(','));
      const text_content = node.data.slice(range_start, range_end);

      // if the text only consists of newlines, it can be ignored
      if (!text_content.match(/^\n+$/)) {
        // use innerHTML to avoid creation of additional <br /> elements
        span.innerHTML = text_content;
        output_nodes.push(span);
      }

      // last range exceeds text node
      if (range.end > text_position + length) {
        range_list.unshift(range);
        break;
      }
    }

    if (last_range !== null && last_range.end < text_position + length) {
      // text node at end
      output_nodes.push(document.createTextNode(node.data.slice(last_range.end - text_position)));
    }

    return [length, output_nodes];
  } else {
    // HTMLElement

    const clone = node.cloneNode();
    clone.innerHTML = '';

    let offset = 0;
    for (let i = 0; i < node.childNodes.length; ++i) {
      // for each child, recurse, get back total text length of child and new child nodes
      const [len, inner_nodes] = handleNode(node.childNodes[i], text_position + offset, range_list);

      console.log(clone.nodeName, node.childNodes[i].nodeName, inner_nodes);

      offset += len;
      inner_nodes.forEach(d => clone.appendChild(d));
    }

    return [offset, [clone]];
  }
}

