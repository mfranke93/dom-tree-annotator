import TextRange from './text-range';

export default class Annotation {
  ranges: TextRange[] = [];

  constructor(
    readonly start: number,
    readonly end: number,
    readonly data: any = {},
    readonly classList: string[] = [],
    readonly dominantClasses: boolean = false,
  ) {

  }

  clone(): Annotation {
    return new Annotation(this.start, this.end, this.data, this.classList, this.dominantClasses);
  }
};
