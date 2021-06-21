import TextRange from './text-range';

export default class Annotation {
  ranges: TextRange[] = [];

  constructor(
    readonly start: number,
    readonly end: number,
    readonly data: any = {},
  ) {

  }
};
