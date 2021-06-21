import Range from './range';
import Annotation from './annotation';

export default function insertRanges(
  innerHTML: string,
  nonoverlapping_ranges: Range[]
): string {
  const d = document.createElement('div') as HTMLDivElement;
  d.innerHTML = innerHTML;

  const [_, [new_div]] = handleNode(d, 0, nonoverlapping_ranges);
  //d.remove();
  return (<HTMLElement>new_div).innerHTML;
}

function handleNode(node: Node, text_position: number, range_list: Range[]): [number, Node[]] {
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

    let last_range: Range | null = null;
    while (range_list.length > 0 && range_list[0].start < text_position + length) {
      // insert text node between ranges if non-empty
      if (last_range !== null && last_range.end < range_list[0].start) {
        output_nodes.push(document.createTextNode(node.data.slice(last_range.end - text_position, range_list[0].start - text_position)));
      }

      const clone = node.cloneNode();
      const range = range_list.shift() as Range;
      last_range = range;

      const range_start = Math.max(range.start, text_position) - text_position; // range starts either at start of node, or later
      const range_end = Math.min(range.end, text_position + length) - text_position;  // range ends either at end of node, or earlier

      const text_content = node.data.slice(range_start, range_end);

      // if the text only consists of newlines, it can be ignored as part of the annotation
      if (!text_content.match(/^\n+$/)) {
        const span = document.createElement('span');
        span.classList.add('annotation');
        span.setAttribute('data-annotation-ids', range.annotations.map(d => d.data['id']).join(','));

        // use innerHTML to avoid creation of additional <br /> elements
        span.innerHTML = text_content;
        output_nodes.push(span);
      } else {
        // still need that content
        output_nodes.push(document.createTextNode(text_content));
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

    const clone = node.cloneNode() as HTMLElement;
    clone.innerHTML = '';

    let offset = 0;
    for (let i = 0; i < node.childNodes.length; ++i) {
      // for each child, recurse, get back total text length of child and new child nodes
      const [len, inner_nodes] = handleNode(node.childNodes[i], text_position + offset, range_list);

      offset += len;
      inner_nodes.forEach(d => clone.appendChild(d));
    }

    return [offset, [clone]];
  }
}
