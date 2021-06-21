import Range from './range';

export default class Annotation {
  constructor(
    readonly start: number,
    readonly end: number,
    readonly data: any = {},
  ) {

  }
};
