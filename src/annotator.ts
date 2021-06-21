import Annotation from './annotation';
import TextRange from './text-range';
import rangesFromAnnotations from './unoverlap-ranges';
import insertRanges from './insert-ranges';


export default class Annotator extends EventTarget {
  private readonly _innerHTML: string;
  private _annotations: Annotation[] = [];

  // TODO: temporary
  private _next_id: number = 1;

  private _connected_annotations: Annotation[] = [];
  private _ranges: TextRange[] = [];

  constructor(
    private readonly _target_node: HTMLElement,
  ) {
    super();

    this._innerHTML = _target_node.innerHTML;

    this._target_node.addEventListener('mouseup', this.onPointerUp.bind(this));
  }

  private onPointerUp(_: PointerEvent | MouseEvent) {
    const selection = document.getSelection();
    if (selection && selection.isCollapsed) return;

    const range = (selection as Selection).getRangeAt(0);
    const selection_content = range.cloneContents().textContent;

    if (selection_content === null || selection_content.length === 0) return;

    if (!this._target_node.contains(range.commonAncestorContainer)) {
      console.error('Selection not completely contained in target node.');
      selection?.empty();
      return;
    }

    // find offset from start
    const r2 = new Range();
    r2.setStart(this._target_node, 0);
    r2.setEnd(range.startContainer, range.startOffset);
    const pre_contents = r2.cloneContents().textContent as string;
    r2.detach();

    this._annotations.push(new Annotation(pre_contents.length, pre_contents.length + selection_content.length, {id: this._next_id++}));

    this.recalculate();
  }

  private recalculate() {
    const annotations = this._annotations.map(a => {
      a.ranges = [];
      return a;
    });  // flat copy
    const ranges = rangesFromAnnotations(annotations);

    this._ranges = ranges;

    const evt = new CustomEvent('annotationchange', {detail: {ranges,annotations:this._annotations}});
    this.dispatchEvent(evt);

    const ranges_flat_copy = ranges.map(d => d);
    const new_inner = insertRanges(this._innerHTML, ranges_flat_copy);
    this._target_node.innerHTML = new_inner;
  }

  get ranges(): TextRange[] {
    return this._ranges;
  }

  get annotations(): Annotation[] {
    return this._annotations;
  }
};
