export default class AnnotationCreationObject {
  constructor(
    readonly start: number,
    readonly end: number,
    readonly content: string,
  ) {}
};
