import Annotation from './annotation';

export default class TextRange {
  elements: HTMLElement[] = [];

  constructor(
    readonly start: number,
    readonly end: number,
    readonly annotations: Annotation[],
  ) {

  }
};
