import AnnotationCreationObject from './annotation-creation-object';
import Annotator from './annotator';

type AnnotationCreationHook = (
  (
    this: Annotator,
    annotation: AnnotationCreationObject,
    resolve: (annotation_data: any) => void,
    reject: (reason?: any) => void
  ) => void
);

export default AnnotationCreationHook;
