import Range from './range';
import Annotation from './annotation';

export default function rangesFromAnnotations(annotations: Annotation[]): Range[] {
  if (annotations.length === 0) return [];

  // sort ranges ascending by start
  annotations.sort((a, b) => a.start - b.start);

  const active = new Set<Annotation>();       // currently active ranges
  let index: number = 0;                  // current index
  const result: Range[] = [];              // resulting ranges

  // initialize
  console.log(JSON.stringify(annotations));
  const first = annotations.shift() as Annotation;  // ranges cannot be empty here
  index = first.start;
  active.add(first);

  while ((active.size > 0) || (annotations.length > 0)) {
    console.log(index, active);
    const next_beginning: Annotation = annotations.length
      ? annotations[0]
      : new Annotation(Infinity, Infinity);
    const next_ending: Annotation = active.size
      ? Array.from(active).sort((a,b) => a.end - b.end)[0]
      : new Annotation(Infinity, Infinity);

    if (next_beginning.start < next_ending.end) {
      if (active.size) result.push(new Range(index, next_beginning.start, Array.from(active)));
      index = next_beginning.start;

      // get all starting here
      while (annotations.length > 0 && annotations[0].start === index) {
        active.add(annotations.shift() as Annotation);
      }
    } else if (next_beginning.start === next_ending.end) {
      if (active.size) result.push(new Range(index, next_beginning.start, Array.from(active)));
      index = next_beginning.start;

      // remove all ending here
      Array.from(active)
        .filter(d => d.end === index)
        .forEach(active.delete.bind(active));

      // get all starting here
      while (annotations.length > 0 && annotations[0].start === index) {
        active.add(annotations.shift() as Annotation);
      }
    } else {
      if (active.size) result.push(new Range(index, next_ending.end, Array.from(active)));
      index = next_ending.end;

      // remove all ending here
      Array.from(active)
        .filter(d => d.end === index)
        .forEach(active.delete.bind(active));
    }
  }

  return result;
}

