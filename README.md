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

To convert an existing .docx file to HTML, use `mammoth.convertToHtml`:

```javascript
var mammoth = require("mammoth");

var result = mammoth.convertToHtml({path: "path/to/document.docx"});
var html = result.value; // The generated HTML
var messages = result.messages; // Any messages, such as warnings during conversion
```

By default,
Mammoth maps some common .docx styles to HTML elements.
For instance,
a paragraph with the style `Heading1` is converted to a `h1` element.
You can pass in a custom map for styles by passing an options object as a second argument to `convertToHtml`:

```javascript
var mammoth = require("mammoth");
var style = mammoth.style;

var options = {
    styleMap: [
        style("p.Heading1 => h1"),
        style("p.Heading2 => h2"),
    ]
};
var result = mammoth.convertToHtml({path: "path/to/document.docx"}, options);
```

## Writing styles

A style has two parts:
* On the left, before the arrow, is the document element matcher.
* On the right, after the arrow, is the HTML path.

When converting each paragraph,
Mammoth finds the first style where the document element matcher matches the current paragraph.
Mammoth then ensures the HTML path is satisfied.

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

The simplest HTML path is to specify single element.
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
