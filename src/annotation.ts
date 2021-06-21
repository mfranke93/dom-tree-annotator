import Range from './range';

export default class Annotation {
  ranges: Range[] = [];

  constructor(
    readonly start: number,
    readonly end: number,
    readonly data: any = {},
  ) {

  }
};
