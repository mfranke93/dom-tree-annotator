export default interface AnnotationMetadata {
  data: any;  // this is the actual metadata attributed to the Annotation object
  classList?: string[];  // this is a list of classes that each *single-use*
                         // DOM node created from the annotation will get
  dominantClasses?: boolean;  // signifies whether the classes should spill
                              // into overlapping segments also
};
