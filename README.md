# Mammoth .docx to HTML converter

Mammoth is designed to convert .docx documents,
such as those created by Microsoft Word,
and convert them to HTML.
Mammoth aims to produce simple and clean HTML by using semantic information in the document,
and ignoring other details.
For instance,
Mammoth converts any paragraph with the style `Heading1` to `h1` elements,
rather than attempting to exactly copy the styling (font, text size, colour, etc.) of the heading.

There's a large mismatch between the structure used by .docx and the structure of HTML,
meaning that the conversion is unlikely to be perfect for more complicated documents.
Mammoth works best if you only use styles to semantically mark up your document.

## Installation

    npm install mammoth
    
## Usage

### Web interface

The easiest way to try out mammoth is to use the demo web server.
You can start it up by running `node lib/web.js` from the project directory.

Browserify can be used to run Mammoth in the browser.
To see an example, run `make setup` and open `browser-demo/index.html` in a web browser.

### Library

#### Basic conversion

To convert an existing .docx file to HTML, use `mammoth.convertToHtml`:

```javascript
var mammoth = require("mammoth");

mammoth.convertToHtml({path: "path/to/document.docx"})
    .then(function(result){
        var html = result.value; // The generated HTML
        var messages = result.messages; // Any messages, such as warnings during conversion
    })
    .fail(function(err){
        console.log(err); // Something failed, output the error.
    });
```

### Custom style map

By default,
Mammoth maps some common .docx styles to HTML elements.
For instance,
a paragraph with the style `Heading1` is converted to a `h1` element.
You can pass in a custom map for styles by passing an options object with a `styleMap` property as a second argument to `convertToHtml`.
A description of the syntax for style maps can be found in the section "Writing style maps".
For instance, if paragraphs with the style `SectionTitle` should be converted to `h1` elements,
and paragraphs with the style `SubSectionTitle` should be converted to `h2` elements:

```javascript
var mammoth = require("mammoth");
var styleMapping = mammoth.styleMapping;

var options = {
    styleMap: [
        styleMapping("p.SectionTitle => h1:fresh"),
        styleMapping("p.SubSectionTitle => h2:fresh")
    ]
};
mammoth.convertToHtml({path: "path/to/document.docx"}, options);
```

To more easily support style maps stored in text files,
`styleMap` can also be a string.
Each non-blank line is treated as a separate style mapping:

```javascript
var options = {
    styleMap: "p.SectionTitle => h1:fresh\n" +
        "p.SubSectionTitle => h2:fresh"
};
```

User-defined style mappings are used in preference to the default style mappings.
To stop using the default style mappings altogether,
set `options.includeDefaultStyleMap` to `false`:

```javascript
var options = {
    styleMap: [
        styleMapping("p.SectionTitle => h1:fresh"),
        styleMapping("p.SubSectionTitle => h2:fresh")
    ],
    includeDefaultStyleMap: false
};
```

### Document transforms

Mammoth allows a document to be transformed before it is converted.
For instance,
suppose that document has not been semantically marked up,
but you know that any centre-aligned paragraph should be a heading.
You can use the `transformDocument` argument to modify the document appropriately:

```javascript
function transformElement(element) {
  if (element.children) {
      element.children.forEach(transformElement);
  }
  if (element.type === "paragraph") {
      if (element.alignment === "center" && !element.styleName) {
          element.styleName = "Heading2";
      }
  }
  return element;
}

var options = {
    transformDocument: transformElement
};
```

### API

#### `mammoth.convertToHtml(input, options)`

Converts the source document to HTML.

* `input`: an object describing the source document.
  To read the file found at `path`, pass in `{path: path}`.
  
* `options` (optional): options for the conversion.
  May have the following properties:
  
  * `styleMap`: controls the mapping of Word styles to HTML.
     If `options.styleMap` is a string,
     each non-blank line is treated as a separate style mapping.
     If `options.styleMap` is an array,
     each element is expected to be the result of a call to `mammoth.styleMapping`.
     See "Writing style maps" for a reference to the syntax for style maps.

  * `includeDefaultStyleMap`: by default,
     the style map passed in `styleMap` is combined with the default style map.
     To stop using the default style map altogether,
     set `options.includeDefaultStyleMap` to `false`.
  
  * `transformDocument`: if set,
    this function is applied to the document read from the docx file before the conversion to HTML.

* Returns a promise containing a result.
  This result has the following properties:

  * `value`: the generated HTML

  * `messages`: any messages, such as errors and warnings, generated during the conversion

#### `mammoth.styleMapping(string)`

Creates a style mapping using the passed string.

#### Messages

Each message has the following properties:

* `type`: a string representing the type of the message, such as `"warning"`

* `message`: a string containing the actual message

## Writing style maps

A style map is made up of a number of style mappings separated by new lines.

A style mapping has two parts:

* On the left, before the arrow, is the document element matcher.
* On the right, after the arrow, is the HTML path.

When converting each paragraph,
Mammoth finds the first style mapping where the document element matcher matches the current paragraph.
Mammoth then ensures the HTML path is satisfied.

### Freshness

When writing style mappings, it's helpful to understand Mammoth's notion of freshness.
When generating, Mammoth will only close an HTML element when necessary.
Otherwise, elements are reused.

For instance, suppose one of the specified style mappings is `p.Heading1 => h1`.
If Mammoth encounters a .docx paragraph with the style `Heading1`,
the .docx paragraph is converted to a `h1` element with the same text.
If the next .docx paragraph also has the style `Heading1`,
then the text of that paragraph will be appended to the *existing* `h1` element,
rather than creating a new `h1` element.

In most cases, you'll probably want to generate a new `h1` element instead.
You can specify this by using the `:fresh` modifier:

`p.Heading1 => h1:fresh`

The two consective `Heading1` .docx paragraphs will then be converted to two separate `h1` elements.

Reusing elements is useful in generating more complicated HTML structures.
For instance, suppose your .docx contains asides.
Each aside might have a heading and some body text,
which should be contained within a single `div.aside` element.
In this case, style mappings similar to `p.AsideHeading => div.aside > h2:fresh` and
`p.AsideText => div.aside > p:fresh` might be helpful.

### Document element matchers

#### Paragraphs and runs

Match any paragraph:

```
p
```

Match any run:

```
r
```

To match a paragraph or run with a specific style name,
append a dot followed by the style name.
For instance, to match a paragraph with the style `Heading1`:

```
p.Heading1
```

### HTML paths

#### Single elements

The simplest HTML path is to specify a single element.
For instance, to specify an `h1` element:

```
h1
```

To give an element a CSS class,
append a dot followed by the name of the class:

```
h1.section-title
```

To require that an element is fresh, use `:fresh`:

```
h1:fresh
```

Modifiers must be used in the correct order:

```
h1.section-title:fresh
```

#### Nested elements

Use `>` to specify nested elements.
For instance, to specify `h2` within `div.aside`:

```
div.aside > h2
```

You can nest elements to any depth.
