# Mammoth .docx to HTML converter

Mammoth is designed to convert .docx documents,
such as those created by Microsoft Word,
and convert them to HTML.
Mammoth aims to produce simple and clean HTML by using semantic information in the document,
and ignoring other details.
For instance,
Mammoth converts any paragraph with the style `Heading 1` to `h1` elements,
rather than attempting to exactly copy the styling (font, text size, colour, etc.) of the heading.

There's a large mismatch between the structure used by .docx and the structure of HTML,
meaning that the conversion is unlikely to be perfect for more complicated documents.
Mammoth works best if you only use styles to semantically mark up your document.

The following features are currently supported:

* Headings.

* Lists.

* Customisable mapping from your own docx styles to HTML.
  For instance, you could convert `WarningHeading` to `h1.warning` by providing an appropriate style mapping.
  
* Tables.
  The formatting of the table itself, such as borders, is currently ignored,
  but the formatting of the text is treated the same as in the rest of the document.
  
* Footnotes and endnotes.

* Images.

* Bold, italics, underlines, strikethrough, superscript and subscript.

* Links.

* Line breaks.

* Text boxes. The contents of the text box are treated as a separate paragraph
  that appears after the paragraph containing the text box.

## Web demo

The easiest way to try out mammoth is to use the web demo:

* Clone this repository
* Run `make setup`
* Open `browser-demo/index.html` in a web browser

## Installation

    npm install mammoth
    
## Usage

### CLI

You can convert docx files by passing the path to the docx file and the output file.
For instance:

    mammoth document.docx output.html

If no output file is specified, output is written to stdout instead.

#### Images

By default, images are included inline in the output HTML.
If an output directory is specified by `--output-dir`,
the images are written to separate files instead.
For instance:

    mammoth document.docx --output-dir=output-dir

Existing files will be overwritten if present.

#### Styles

A custom style map can be read from a file using `--style-map`.
For instance:

    mammoth document.docx output.html --style-map=custom-style-map
    
Where `custom-style-map` looks something like:

    p[style-name='Aside Heading'] => div.aside > h2:fresh
    p[style-name='Aside Text'] => div.aside > p:fresh

#### Markdown

Using `--output-format=markdown` will cause Markdown to be generated.
For instance:

    mammoth document.docx --output-format=markdown

Markdown support is still in its early stages,
so you may find some features are unsupported.

### Library

In node.js, mammoth can be required in the usual way:

```javascript
var mammoth = require("mammoth");
```

To generate a standalone JavaScript file for the browser,
use `mammoth.browser.js` (generate using `make setup` if it is not already present).
This uses any loaded module system.
If no module system is found,
`mammoth` is set as a window global.

#### Basic conversion

To convert an existing .docx file to HTML, use `mammoth.convertToHtml`:

```javascript
var mammoth = require("mammoth");

mammoth.convertToHtml({path: "path/to/document.docx"})
    .then(function(result){
        var html = result.value; // The generated HTML
        var messages = result.messages; // Any messages, such as warnings during conversion
    })
    .done();
```

Note that `mammoth.convertToHtml` returns a [promise](http://promises-aplus.github.io/promises-spec/).

You can also extract the raw text of the document by using `mammoth.extractRawText`.
This will ignore all formatting in the document.
Each paragraph is followed by two newlines.

```javascript
mammoth.extractRawText({path: "path/to/document.docx"})
    .then(function(result){
        var text = result.value; // The raw text
        var messages = result.messages;
    })
    .done();
```

#### Custom style map

By default,
Mammoth maps some common .docx styles to HTML elements.
For instance,
a paragraph with the style name `Heading 1` is converted to a `h1` element.
You can pass in a custom map for styles by passing an options object with a `styleMap` property as a second argument to `convertToHtml`.
A description of the syntax for style maps can be found in the section "Writing style maps".
For instance, if paragraphs with the style name `Section Title` should be converted to `h1` elements,
and paragraphs with the style name `Subsection Title` should be converted to `h2` elements:

```javascript
var mammoth = require("mammoth");

var options = {
    styleMap: [
        "p[style-name='Section Title'] => h1:fresh",
        "p[style-name='Subsection Title'] => h2:fresh"
    ]
};
mammoth.convertToHtml({path: "path/to/document.docx"}, options);
```

To more easily support style maps stored in text files,
`styleMap` can also be a string.
Each non-blank line is treated as a separate style mapping:

```javascript
var options = {
    styleMap: "p[style-name='Section Title'] => h1:fresh\n" +
        "p[style-name='Subsection Title'] => h2:fresh"
};
```

User-defined style mappings are used in preference to the default style mappings.
To stop using the default style mappings altogether,
set `options.includeDefaultStyleMap` to `false`:

```javascript
var options = {
    styleMap: [
        "p[style-name='Section Title'] => h1:fresh",
        "p[style-name='Subsection Title'] => h2:fresh"
    ],
    includeDefaultStyleMap: false
};
```

#### Custom image handlers

By default, images are converted to `<img>` elements with the source included inline in the `src` attribute.
This behaviour can be changed by setting the `convertImage` option to an [image converter](#image-converters) .

For instance, the following would replicate the default behaviour:

```javascript
var options = {
    convertImage: mammoth.images.inline(function(element) {
        return element.read("base64").then(function(imageBuffer) {
            return {
                src: "data:" + element.contentType + ";base64," + imageBuffer
            };
        });
    })
};
```

#### Underline

By default, the underlining of any text is ignored since underlining can be confused with links in HTML documents.
This behaviour can be changed by adding a style mapping for `u`.
For instance, suppose that a source document uses underlining for emphasis.
The following will wrap any explicitly underlined source text in `<em>` tags:

```javascript
var mammoth = require("mammoth");

var options = {
    styleMap: [
        "u => em"
    ]
};
mammoth.convertToHtml({path: "path/to/document.docx"}, options);
```

The `convertUnderline` option is deprecated, and will be removed in Mammoth.js 1.0.
The following behaves as the example above:

```javascript
var options = {
    convertUnderline: mammoth.underline.element("em")
};
```

### Strikethrough

By default, strikethrough text is wrapped in `<s>` tags.
This behaviour can be changed by adding a style mapping for `strike`.
For instance, to wrap strikethrough text in `<del>` tags:

```javascript
var mammoth = require("mammoth");

var options = {
    styleMap: [
        "strike => del"
    ]
};
mammoth.convertToHtml({path: "path/to/document.docx"}, options);
```

#### Document transforms

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
        if (element.alignment === "center" && !element.styleId) {
            element.styleId = "Heading2";
        }
    }
    return element;
}

var options = {
    transformDocument: transformElement
};
```

The return value of `transformDocument` is used during HTML generation.
The original document (and any child elements) can be safely modified.

The above can be written more succinctly using the helper `mammoth.transforms.paragraph`:

```javascript

function transformParagraph(element) {
    if (element.alignment === "center" && !element.styleId) {
        element.styleId = "Heading2";
    }
    return element;
}

var options = {
    transformDocument: mammoth.transforms.paragraph(transformParagraph)
};
```

### API

#### `mammoth.convertToHtml(input, options)`

Converts the source document to HTML.

* `input`: an object describing the source document.
  On node.js, the following inputs are supported:
  
    * `{path: path}`, where `path` is the path to the .docx file.
    * `{buffer: buffer}`, where `buffer` is a node.js Buffer containing a .docx file.
    
  In the browser, the following inputs are supported:
  
    * `{arrayBuffer: arrayBuffer}`, where `arrayBuffer` is an array buffer containing a .docx file.
  
* `options` (optional): options for the conversion.
  May have the following properties:
  
  * `styleMap`: controls the mapping of Word styles to HTML.
     If `options.styleMap` is a string,
     each non-blank line is treated as a separate style mapping.
     If `options.styleMap` is an array,
     each element is expected to be a string representing a single style mapping.
     See "Writing style maps" for a reference to the syntax for style maps.

  * `includeDefaultStyleMap`: by default,
     the style map passed in `styleMap` is combined with the default style map.
     To stop using the default style map altogether,
     set `options.includeDefaultStyleMap` to `false`.
  
  * `transformDocument`: if set,
    this function is applied to the document read from the docx file before the conversion to HTML.
    
  * `convertImage`: by default, images are converted to `<img>` elements with the source included inline in the `src` attribute.
    Set this option to an [image converter](#image-converters) to override the default behaviour.
    
  * `convertUnderline`: deprecated in favour of using style mappings to describe how to convert underlined text.
    Set this option to [`mammoth.underline.element(name)`](#underline) to override the default behaviour.
  
  * `ignoreEmptyParagraphs`: by default, empty paragraphs are ignored.
    Set this option to `false` to preserve empty paragraphs in the output.

* Returns a promise containing a result.
  This result has the following properties:

  * `value`: the generated HTML

  * `messages`: any messages, such as errors and warnings, generated during the conversion

#### `mammoth.convertToMarkdown(input, options)`

Converts the source document to Markdown.
This behaves the same as `convertToHtml`,
except that the `value` property of the result contains Markdown rather than HTML.

#### `mammoth.extractRawText(input)`

Extract the raw text of the document.
This will ignore all formatting in the document.
Each paragraph is followed by two newlines.

* `input`: an object describing the source document.
  On node.js, the following inputs are supported:
  
    * `{path: path}`, where `path` is the path to the .docx file.
    * `{buffer: buffer}`, where `buffer` is a node.js Buffer containing a .docx file.
    
  In the browser, the following inputs are supported:
  
    * `{arrayBuffer: arrayBuffer}`, where `arrayBuffer` is an array buffer containing a .docx file.

* Returns a promise containing a result.
  This result has the following properties:

  * `value`: the raw text

  * `messages`: any messages, such as errors and warnings

#### Messages

Each message has the following properties:

* `type`: a string representing the type of the message, such as `"warning"`

* `message`: a string containing the actual message

#### Image converters

An inline image converter can be created by calling `mammoth.images.inline(func)`.
This creates an inline `<img>` element for each image in the original docx.
`func` should be a function that has one argument called `element`.
This argument is the image element being converted,
and has the following properties:

* `read([encoding])`: read the image file with the specified encoding.
  If no encoding is specified, a `Buffer` is returned.
  
* `contentType`: the content type of the image, such as `image/png`.

`func` should return an object (or a promise containing an object) with a `src` property,
which will be used as the `src` attribute on the `<img>` element.

For instance, the following replicates the default image conversion:

```javascript
mammoth.images.inline(function(element) {
    return element.read("base64").then(function(imageBuffer) {
        return {
            src: "data:" + element.contentType + ";base64," + imageBuffer
        };
    });
})
```

#### `mammoth.transforms.paragraph(transformParagraph)`

Returns a function that can be used as the `transformDocument` option.
This will apply the function `transformParagraph` to each paragraph element.
`transformParagraph` should return the new paragraph,
and is allowed to mutate the original paragraph.

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

For instance, suppose one of the specified style mappings is `p[style-name='Heading 1'] => h1`.
If Mammoth encounters a .docx paragraph with the style name `Heading 1`,
the .docx paragraph is converted to a `h1` element with the same text.
If the next .docx paragraph also has the style name `Heading 1`,
then the text of that paragraph will be appended to the *existing* `h1` element,
rather than creating a new `h1` element.

In most cases, you'll probably want to generate a new `h1` element instead.
You can specify this by using the `:fresh` modifier:

`p[style-name='Heading 1'] => h1:fresh`

The two consective `Heading 1` .docx paragraphs will then be converted to two separate `h1` elements.

Reusing elements is useful in generating more complicated HTML structures.
For instance, suppose your .docx contains asides.
Each aside might have a heading and some body text,
which should be contained within a single `div.aside` element.
In this case, style mappings similar to `p[style-name='Aside Heading'] => div.aside > h2:fresh` and
`p[style-name='Aside Text'] => div.aside > p:fresh` might be helpful.

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

To match a paragraph or run with a specific style,
you can reference the style by name.
This is the style name that is displayed in Microsoft Word or LibreOffice.
For instance, to match a paragraph with the style name `Heading 1`:

```
p[style-name='Heading 1']
```

Styles can also be referenced by style ID.
This is the ID used internally in the .docx file.
To match a paragraph or run with a specific style ID,
append a dot followed by the style ID.
For instance, to match a paragraph with the style ID `Heading1`:

```
p.Heading1
```

#### Underline

Match explicitly underlined text:

```
u
```

Note that this matches text that has had underline explicitly applied to it.
It will not match any text that is underlined because of its paragraph or run style.

#### Strikethough

Match explicitly struckthrough text:

```
strike
```

Note that this matches text that has had strikethrough explicitly applied to it.
It will not match any text that is struckthrough because of its paragraph or run style.

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

## Upgrading to later versions

### 0.3.0

If you've defined custom style maps or used a document transform,
you will likely need to change your usage slightly.
Otherwise, you should be able to continue using Mammoth as before.

#### Custom style maps

Prior to 0.3.0, Mammoth matched docx paragraphs using style IDs e.g. `p.Heading1`.
These IDs are used internally in the docx format,
and are distinct from the style name
i.e. the name shown by Microsoft Word or LibreOffice.
Although Mammoth still supports matching styles by ID,
matching styles by name is preferred.
For instance, instead of:

```p.AsideHeading => h1```

prefer:

```p[style-name='Aside Heading'] => h1```

#### Document transforms

Prior to 0.3.0,
Mammoth (misleadingly) assigned the style ID to a property called `styleName`.
The style ID is now assigned to a more appropriate property, `styleId`.
The `styleName` property is now set to the name of the style.
To preserve existing behaviour,
any existing document transforms should be rewritten in one of two ways:

* Set the `styleId` property instead of the `styleName` property

* Set the `styleName` property to the name of the style, rather than the ID

### 0.2.0

The function `mammoth.style()` was renamed to `mammoth.styleMapping()`.

## Acknowledgements

Thanks to the following people for their contributions to Mammoth:

* [Craig Leinoff](https://github.com/Offlein):

  * Document transforms
    
* [John McLear](https://github.com/JohnMcLear):

  * Underline support

* [Chris Price](https://github.com/studiochris): 

  * node.js `Buffer` support
  * UTF8 BOM handling

* [Stoo Goff](https://github.com/stoogoff)

  * Markdown support

* [Andreas Lubbe](https://github.com/alubbe)

  * Internal hyperlink support

* [Jacob Wang](https://github.com/jaceyshome)

  * Supporting styles defined without names
