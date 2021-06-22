import Annotation from './annotation';

export default class TextRange {
  element: HTMLElement | null = null;

  constructor(
    readonly start: number,
    readonly end: number,
    readonly annotations: Annotation[],
  ) {

  }
};
