import TextRange from './text-range';

export default function insertRanges(
  innerHTML: string,
  nonoverlapping_ranges: TextRange[]
): DocumentFragment {
  // create dummy element to hold contents
  const d = document.createElement('div') as HTMLDivElement;
  d.innerHTML = innerHTML;

  // recurse through tree, insert TextRanges as <span>s, return top-level element
  const [_, [new_div]] = handleNode(d, 0, nonoverlapping_ranges);

  // copy actual DOM nodes to a DocumentFragment, so that the references in the TextRanges are still correct
  const fragment = new DocumentFragment();

  // Store NodeList to array first, because it is a live NodeList and appending
  // the nodes to the DocumentFragment will remove them from the document. That
  // in turn messes up the loop, which will jump over each second element.
  Array.from(new_div.childNodes).forEach(node => fragment.appendChild(node));

  return fragment;
}

function handleNode(node: Node, text_position: number, range_list: TextRange[]): [number, Node[]] {
  const output_nodes: Node[] = [];

  // node is text_node (recursion abort)
  if (node instanceof Text) {
    const nodeData = Array.from(node.textContent ?? []);
    const length = nodeData.length;

    if (range_list.length === 0) {
      // entire text node has no ranges
      output_nodes.push(node.cloneNode());
    } else if (range_list[0].start > text_position) {
      // text node at start
      output_nodes.push(document.createTextNode(nodeData.slice(0, range_list[0].start - text_position).join('')));
    }

    let last_range: TextRange | null = null;
    while (range_list.length > 0 && range_list[0].start < text_position + length) {
      // insert text node between ranges if non-empty
      if (last_range !== null && last_range.end < range_list[0].start) {
        output_nodes.push(document.createTextNode(nodeData.slice(last_range.end - text_position, range_list[0].start - text_position).join('')));
      }

      const range = range_list.shift() as TextRange;
      last_range = range;

      const range_start = Math.max(range.start, text_position) - text_position; // range starts either at start of node, or later
      const range_end = Math.min(range.end, text_position + length) - text_position;  // range ends either at end of node, or earlier

      const text_content = nodeData.slice(range_start, range_end);

      // if the text only consists of newlines, it can be ignored as part of the annotation
      if (text_content.every(d => d === '\n')) {
        // still need that content
        output_nodes.push(document.createTextNode(text_content.join('')));
      } else {
        // create actual span
        const span = document.createElement('span');
        span.classList.add('annotation');

        if (range.annotations.length > 1) span.classList.add('annotation--overlap');
        else span.classList.add(...range.annotations[0].classList);

        // if one or more annotations has DOMINANT classes, add them regardless of overlap
        range.annotations.forEach(ann => {
          if (ann.dominantClasses) {
            span.classList.add(...ann.classList);
          }
        });

        span.setAttribute('data-annotation-ids', range.annotations.map(d => d.data['id']).join(','));

        // use innerHTML to avoid creation of additional <br /> elements
        span.innerHTML = text_content.join('');
        output_nodes.push(span);

        // set element
        range.elements.push(span);
      }

      // last range exceeds text node
      if (range.end > text_position + length) {
        range_list.unshift(range);
        break;
      }
    }

    if (last_range !== null && last_range.end < text_position + length) {
      // text node at end
      output_nodes.push(document.createTextNode(nodeData.slice(last_range.end - text_position).join('')));
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

