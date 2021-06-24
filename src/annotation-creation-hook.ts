import AnnotationCreationObject from './annotation-creation-object';
import AnnotationMetadata from './annotation-metadata';
import Annotator from './annotator';

type AnnotationCreationHook = (
  (
    this: Annotator,
    annotation: AnnotationCreationObject,
    resolve: (annotation_metadata: AnnotationMetadata) => void,
    reject: (reason?: any) => void
  ) => void
);

export default AnnotationCreationHook;
