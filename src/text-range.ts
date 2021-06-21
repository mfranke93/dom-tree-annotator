import Annotation from './annotation';

export default class TextRange {
  constructor(
    readonly start: number,
    readonly end: number,
    readonly annotations: Annotation[],
  ) {

  }
};
