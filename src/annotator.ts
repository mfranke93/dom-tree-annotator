import Annotation from './annotation';
import TextRange from './text-range';
import rangesFromAnnotations from './unoverlap-ranges';
import insertRanges from './insert-ranges';
import AnnotationCreationObject from './annotation-creation-object';
import AnnotationCreationHook from './annotation-creation-hook';
import defaultAnnotationCreationHook from './default-annotation-creation-hook';

export default class Annotator extends EventTarget {
  private readonly _innerHTML: string;
  private _annotations: Annotation[] = [];
  private _ranges: TextRange[] = [];

  constructor(
    private readonly _target_node: HTMLElement,
    private _annotation_creation_hook: AnnotationCreationHook = defaultAnnotationCreationHook,
  ) {
    super();

    this._innerHTML = _target_node.innerHTML;

    this._target_node.addEventListener('mouseup', this.onPointerUp.bind(this));
  }

  private async onPointerUp(_: PointerEvent | MouseEvent) {
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

    // create annotation, ask for extra data
    const start = pre_contents.length;
    const end = start + selection_content.length;

    const annotationCreationObject = new AnnotationCreationObject(start, end, selection_content);
    try {
      const annotation_data = await new Promise((resolve, reject) => this._annotation_creation_hook.call(this, annotationCreationObject, resolve, reject));
      this._annotations.push(new Annotation(start, end, annotation_data));
      this.recalculate();
    } catch (err) {
      console.error(err);
      selection?.empty();
    }
  }

  private recalculate() {
    const annotations = this._annotations.map(a => {
      a.ranges = [];
      return a;
    });  // flat copy, empty out old range references
    const ranges = rangesFromAnnotations(annotations);

    this._ranges = ranges;

    const evt = new CustomEvent('annotationchange', { detail: { ranges, annotations: this._annotations }});
    this.dispatchEvent(evt);

    const ranges_flat_copy = ranges.map(d => d);  // flat copy because insertRanges consumes array
    const fragment = insertRanges(this._innerHTML, ranges_flat_copy);
    this._target_node.innerHTML = '';  // clear content
    this._target_node.appendChild(fragment);  // append DocumentFragment
  }

  get ranges(): TextRange[] {
    return this._ranges;
  }

  get annotations(): Annotation[] {
    return this._annotations;
  }

  set annotations(annotations: Annotation[]) {
    this._annotations = annotations;
    this.recalculate();
  }

  setAnnotationCreationHook(hook: AnnotationCreationHook): void {
    this._annotation_creation_hook = hook;
  }
};
