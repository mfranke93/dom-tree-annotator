import Annotation from './annotation';

export default class Range {
  constructor(
    readonly start: number,
    readonly end: number,
    readonly annotations: Annotation[],
  ) {

  }
};
