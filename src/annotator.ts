import Annotation from './annotation';
import TextRange from './text-range';
import rangesFromAnnotations from './unoverlap-ranges';
import insertRanges from './insert-ranges';
import AnnotationCreationObject from './annotation-creation-object';
import AnnotationCreationHook from './annotation-creation-hook';
import defaultAnnotationCreationHook from './default-annotation-creation-hook';
import AnnotationMetadata from './annotation-metadata';

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
      const { data, classList = [] } = await new Promise<AnnotationMetadata>((resolve, reject) => this._annotation_creation_hook.call(this, annotationCreationObject, resolve, reject));
      this._annotations.push(new Annotation(start, end, data, classList));
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

    const evt = new CustomEvent('change', { detail: this._annotations });
    this.dispatchEvent(evt);

    const ranges_flat_copy = ranges.map(d => d);  // flat copy because insertRanges consumes array
    const fragment = insertRanges(this._innerHTML, ranges_flat_copy);
    this._target_node.innerHTML = '';  // clear content
    this._target_node.appendChild(fragment);  // append DocumentFragment

    const nodes = this._target_node.querySelectorAll(':scope .annotation');
    nodes.forEach(node => {
      node.addEventListener('mouseenter', () => {
        nodes.forEach(node2 => node2.classList.remove('annotation--hover-target'));
        const ranges = new Set<TextRange>();

        const annotations = this.annotationsAt(node as HTMLElement);
        annotations.forEach(a => a.ranges.forEach(r => ranges.add(r)));
        ranges.forEach(r => r.elements.forEach(d => d.classList.add('annotation--hover-target')));

        this.dispatchEvent(new CustomEvent('hoverstart', { detail: annotations }));
      });
      node.addEventListener('mouseleave', () => {
        nodes.forEach(node2 => node2.classList.remove('annotation--hover-target'));

        this.dispatchEvent(new CustomEvent('hoverend'));
      });
      node.addEventListener('click', () => {
        const annotations = this.annotationsAt(node as HTMLElement);

        this.dispatchEvent(new CustomEvent('click', { detail: annotations }));
      });
    });
  }

  private annotationsAt(elem: HTMLElement): Annotation[] {
    return this.ranges.find(r => r.elements.includes(elem))?.annotations || [];
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

  updateAnnotationSpan(ann: Annotation, start: number, end: number) {
    const newAnnotation = new Annotation(start, end, ann.data, ann.classList);
    const index = this._annotations.indexOf(ann);
    if (index >= 0) this._annotations.splice(index, 1, newAnnotation);
    this.recalculate();
  }

  setAnnotationCreationHook(hook: AnnotationCreationHook): void {
    this._annotation_creation_hook = hook;
  }

  getAnnotationCreationHook(): AnnotationCreationHook {
    return this._annotation_creation_hook;
  }
};
