# DOM Tree Annotator

## Table of Contents

 1. [About](#about)
 1. [Building](#building)
 1. [Basic Usage](#basic-usage)
 1. [Styling](#styling)
 1. [API Reference](#api-reference)

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
By default, created annotations will contain a unique ID and their textual content as extra data, but you can set a different `AnnotationCreationHook` on the `Annotator` (see [API reference](#api-Annotator-setAnnotationCreationHook)).

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

c
