import AnnotationCreationObject from './annotation-creation-object';
import Annotator from './annotator';
import AnnotationCreationHook from './annotation-creation-hook';

let _next_id: number = 1;
const defaultAnnotationCreationHook: AnnotationCreationHook = async function(
  this: Annotator,
  annotation: AnnotationCreationObject,
  resolve,
  reject
) {
  const comment = window.prompt(`Comment for annotation ${annotation.content}`);
  if (comment === null) reject('No comment given, aborting annotation.');
  const data = { id: _next_id++, comment };
  resolve(data);
}

export default defaultAnnotationCreationHook;
