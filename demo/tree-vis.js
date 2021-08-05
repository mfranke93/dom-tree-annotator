export class TreeVis {
  constructor(node) {
    this.parentNode = node;
    this.svg = node.append('svg');

    new ResizeObserver(([entry]) => {
      this.svg.attr('width', entry.contentRect.width)
        .attr('height', entry.contentRect.height);
    }).observe(this.parentNode.node());

    this.parentNode.style('height', '600px');
  }

  render(initialContent, renderedNode) {
    this.svg.node().innerHTML = '';

    // get tree from initialcontent
    const p = document.createElement('div');
    p.innerHTML = initialContent;

    const { width, height } = this.svg.node().getBoundingClientRect();
    [
      [ p, 0, width/2 ],
      [ renderedNode, width/2, width ],
    ].forEach(([p, x0, x1]) => {
      const h = d3.hierarchy(p, d => d.childNodes);
      const c = d3.cluster()(h);

      const xi = d3.scaleLinear().domain([0, h.height]);
      const x = d3.scaleLinear().domain([0, h.height]).range([x0 + 20, x1 - 150]);
      const y = d3.scaleLinear().range([20, height - 20]);

      // nodes
      const nodes = c.descendants();

      nodes.forEach(node => {
        const name = (node === c)
          ? '[root]'
          : node.data.nodeName === '#text'
            ? textNode(node.data)
            : node.data.nodeName;

        const nodeX = x(xi.invert(node.y));
        const nodeY = y(node.x);

        const g = this.svg.append('g');
        g.append('circle')
          .attr('cx', nodeX)
          .attr('cy', nodeY)
          .attr('r', 3);
        g.append('text')
          .attr('x', node.data.nodeName === '#text' ? nodeX + 10 : nodeX)
          .attr('y', node.data.nodeName === '#text' ? nodeY + 3 : nodeY - 10)
          .attr('font-size', 10)
          .attr('text-anchor', node.data.nodeName === '#text' ? 'start' : 'middle')
          .text(name);
        g.append('title')
          .text(node.data.innerText || node.data.data);
        g.append('circle')
          .attr('opacity', 0)
          .attr('cx', nodeX)
          .attr('cy', nodeY)
          .attr('r', 20);

        g.on('mouseenter', () => {
          if (node.data.nodeName === '#text') return;

          node.data.style.outline = '2px solid hotpink';
        });
        g.on('mouseleave', () => {
          if (node.data.nodeName === '#text') return;

          node.data.style.outline = null;
        });

        node.children?.forEach(child => {
          const childX = x(xi.invert(child.y));
          const childY = y(child.x);

          this.svg.append('path')
            .attr('stroke', '#444')
            .attr('stroke-width', 1)
            .attr('fill', 'none')
            .attr('d', `M ${nodeX} ${nodeY} l ${50} ${childY - nodeY} L ${childX} ${childY}`);
        });
      });
    });
  }
};

function textNode(node) {
  const text = node.data;
  if (text.length > 10) return `#text: ${text.slice(0,4)}...${text.slice(-4)}`;
  return `#text: ${text}`;
}
