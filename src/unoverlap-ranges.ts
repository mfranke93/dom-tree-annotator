import TextRange from './text-range';
import Annotation from './annotation';

export default function rangesFromAnnotations(annotations: Annotation[]): TextRange[] {
  if (annotations.length === 0) return [];

  // sort ranges ascending by start
  annotations.sort((a, b) => a.start - b.start);

  const active = new Set<Annotation>();       // currently active ranges
  let index: number = 0;                  // current index
  const result: TextRange[] = [];              // resulting ranges

  // initialize
  const first = annotations.shift() as Annotation;  // ranges cannot be empty here
  index = first.start;
  active.add(first);

  while ((active.size > 0) || (annotations.length > 0)) {
    const next_beginning: Annotation = annotations.length
      ? annotations[0]
      : new Annotation(Infinity, Infinity);
    const next_ending: Annotation = active.size
      ? Array.from(active).sort((a,b) => a.end - b.end)[0]
      : new Annotation(Infinity, Infinity);

    if (next_beginning.start < next_ending.end) {
      createRange(result, active, index, next_beginning.start);
      index = next_beginning.start;

      // get all starting here
      while (annotations.length > 0 && annotations[0].start === index) {
        active.add(annotations.shift() as Annotation);
      }
    } else if (next_beginning.start === next_ending.end) {
      createRange(result, active, index, next_beginning.start);
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
      createRange(result, active, index, next_ending.end);
      index = next_ending.end;

      // remove all ending here
      Array.from(active)
        .filter(d => d.end === index)
        .forEach(active.delete.bind(active));
    }
  }

  return result;
}

// helper function to handle addition and creation
function createRange(
  arr: TextRange[],
  active: Set<Annotation>,
  start_index: number,
  end_index: number
): void {
  if (active.size === 0) return;

  const active_arr = Array.from(active);
  const range = new TextRange(start_index, end_index, active_arr);

  arr.push(range);
  active_arr.forEach(ann => ann.ranges.push(range));
}

