# DOM Tree Annotator

## Table of Contents

 1. [About](#about)
 1. [Building](#building)
 1. [Basic Usage](#basic-usage)
 1. [Styling](#styling)
 1. [API Reference](#api-reference)

    1. [Annotator](#annotator)
    1. [Annotation](#annotation)

## About

This is a JavaScript/TypeScript library for adding annotations to HTML text.
The library automatically handles overlapping annotations, as well as annotations that cross node boundaries already present in the HTML DOM.
For example, consider what happens when we add an annotation (as a `<span>` tag) to the following markup:

``` html
<p id="first">
  This is some text, but
  <em>
    this text now is emphasized,
  <em>
  and
  <b>
    this
  </b>
  is bold.
</p>
```

Keep in mind that there are some additional newlines and whitespace present here to emphasize structure, but the library handles those very well if they are present.
In reality, the `<em>` and `<b>` tags would probably not contain any newlines and whitespace.
If we now add an annotation on the text "but this text is now emphasized, and this", the result would look as follows:

``` html

<p id="first">
  This is some text,
  <span class="annotation" data-annotation-ids="1">
    but
  </span>
  <em>
    <span class="annotation" data-annotation-ids="1">
      this text now is emphasized,
    </span>
  <em>
  <span class="annotation" data-annotation-ids="1">
    and
  </span>
  <b>
    <span class="annotation" data-annotation-ids="1">
      this
    </span>
  </b>
  is bold.
</p>
```

The nesting occurs because the annotation spans will only ever wrap `TextNode`s.
The library keeps track of which DOM nodes each annotation is associated with.
If annotations overlap, the `<span>` elements in the overlap will be associated with both (or all of them).


## Building

This repository is configured as an *npm* package, which means it can be added as a dependency using the syntax for [private GitHub repositories](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#git-urls-as-dependencies):

``` json
  ...
  "dependencies": {
    "dom-tree-annotator": "git+ssh://git@github.tik.uni-stuttgart.de:frankemx/dom-tree-annotator#v0.0.3"
  },
  ...
```

It can also be added as a local path.
When added via *npm*, the build process is handled automatically.
For a manual build, the *npm* dependencies need to be installed.
*Rollup.js* then handles the build:

``` sh
npm i
npx rollup -c
```

The built assets are then located in `lib/`:

 - `dom-tree-annotator.min.css`: CSS for basic styling (see [Styling](#styling) for more details)
 - `dom-tree-annotator.min.css.map`: CSS SourceMap
 - `dom-tree-annotator.min.js`: Browser JS that can be added in a `<script>` tag. Adds a single `DomTreeAnnotator` object to the global scope.
 - `dom-tree-annotator.min.js.map`: JS SourceMap
 - `index.js`: ES module bundle, to be used by other bundlers or by browsers with module support.
 - `index.js.map`: JS SourceMap
 - `index.d.ts`: TypeScript typings


## Basic Usage

To set up the annotator, create an [Annotator](#api-Annotator) class and pass its constructor a `HTMLElement`.
That element is the DOM node within which annotations will be possible.
By default, created annotations will contain a unique ID and their textual content as extra data, but you can set a different `AnnotationCreationHook` on the `Annotator` (see [API reference](#annotator)).

``` js
const { Annotator } = DomTreeAnnotator;  // library added via <script> tag
// import { Annotator } from '../lib/index.js';

let next_annotation_id = 1;
const annotator = new Annotator(document.querySelector('div#annotation-target'));
annotator.on('change', e => console.log('Annotations:', e.detail));
annotator.setAnnotationCreationHook(async function(context, resolve, reject) {
  // check if annotation correct
  const confirmation = window.confirm(`Create an annotation around "${context.content}"?`);
  if (confirm) resolve({id: next_annotation_id++});
  else reject('User did not want to create annotation.');
});
```

A basic example with a visualization of where the annotation spans are created is located in [`demo/`](./demo).
This also demonstrates how to subscribe to annotator events and how to set up the `Annotator` class.


## Styling

The `<span>` elements all get a class `.annotation` that handles the basic styling.
At the moment, that is a background color, which can be controlled by the CSS custom property `--annotation-bg-color`.
`<span>` elements in the overlap of two or more annotations additionally get the `.annotation--overlap` class, and are styled in grey by default.
When hovering over a `<span>`, all `<span>` elements that share an annotation with that `<span>` also get the `.annotation--hover-target` class, which by default adds a blue outline.

In the future, I will add functionality to manipulate the `classList` of associated `<span>` elements when creating annotations using a hook.
Minimal stylesheet example for now (or use the generated one):

``` css
.annotation {
  background: lightblue;
}
.annotation.annotation--overlap {
  background: lightgray;
}
.annotation.annotation--hover-target {
  outline: 1px solid darkblue;
}
```

## API Reference

---

### Annotator

This is the managing class for the creation and interaction with annotations.
In most cases, this is the only interfacing datatype you need to explicitely name.

#### Methods

``` typescript
constructor(node: HTMLElement, creationHook?: AnnotationCreationHook)
```

The first argument is mandatory and contains the HTML element of which the `Annotator` should control the contents; i.e., the element within which annotating should be possible.
You *may* pass the `AnnotationCreationHook` here directly, but may also do so using the `setAnnotationCreationHook` method later.
If not set, the `defaultAnnotationCreationHook` is used instead.


---

``` typescript
setAnnotationCreationHook(hook: AnnotationCreationHook): void
```

Set a hook that is called when creating annotation.
The method takes an [`AnnotationCreationObject`](#annotationcreationobject) with context data, a `resolve` function, and a `reject` function, and offers the possibility to add metadata to new annotations via the `resolve` function or to abort the creation with `reject`.
See [`AnnotationCreationHook`](#annotationcreationhook) for more details.


#### Public Members

| Member | Description |
|:-------|:------------|
| `ranges: TextRange[]` | The array of `TextRange` objects currently present. This is **read-only** (only a `get` property in TypeScript). |
| `annotations: Annotation[]` | The array of annotations. This is readable and writable (`get` and `set` defined in TypeScript). When assigning a value, the `TextRange`s are recalculated, the node is layed out, and the creation events are fired again. |


#### Events

`Annotator` inherits from `EventTarget` and fires events when certain actions happen.
Consequently, `Annotator` also has the `addEventListener` and `removeEventListener` methods.
All events are `CustomEvent` instances, and in all cases, the `annotations` member is passed as the `detail` attribute of the event.

| Event name | Description |
|:--|:--|
| `change` | This event is fired after the DOM has been rearranged and all annotation fragment `<span>` elements have been created anew; i.e., it is fired after the annotations have changed. |
| `click` | This event is fired after a click on any annotation span. |
| `hoverstart` | This event is fired when the mouse enters any annotation span. |
| `hoverend` | This event is fired when the mouse exits any annotation span. **Note:** This event is also fired when the mouse leaves one span while at the same time entering a neighboring span! |


### Annotation

An annotation is an object with data about the start and end of the annotated text, additional metadata, and the associated `TextRange` objects.

#### Methods

``` typescript
constructor(start: number, end: number, data: any = {})
```

Create a new `Annotation` object.
The constructor takes start and end position, and optional metadata.

---
``` typescript
clone(): Annotation
```
Returns a new `Annotation` with the same start, end, and metadata.
The metadata is a shallow copy, so be careful if your metadata contains volatile references.


#### Public Members

| Member | Description |
|:-------|:------------|
| `readonly start: number` | Start index |
| `readonly end: number` | End index |
| `readonly data: any` | Metadata |
| `ranges: TextRange[]` | Associated `TextRange` objects. This is populated by the `Annotator` and should only be read from, not written to. |

