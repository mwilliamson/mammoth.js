var assert = require("assert");
var test = require("./testing").test;

var HtmlGenerator = require("../lib/html-generator").HtmlGenerator;
var styles = require("../lib/styles");


describe('HtmlGenerator', function() {
    test('generates empty string when newly created', function() {
        var generator = new HtmlGenerator();
        return assert.equal("", generator.asString());
    });
    
    test('HTML-escapes text', function() {
        var generator = new HtmlGenerator();
        generator.text("<");
        return assert.equal(generator.asString(), "&lt;");
    });
    
    test('asString closes all elements', function() {
        var generator = new HtmlGenerator();
        generator.style(styles.elements(["p", "span"]));
        generator.text("Hello!");
        generator.closeAll();
        return assert.equal(generator.asString(), "<p><span>Hello!</span></p>");
    });
    
    test('elements with no text are not generated', function() {
        var generator = new HtmlGenerator();
        generator.style(styles.elements(["p", "span"]));
        generator.closeAll();
        return assert.equal(generator.asString(), "");
    });
    
    test('generates empty string if text is empty string', function() {
        var generator = new HtmlGenerator();
        generator.style(styles.elements(["p", "span"]));
        generator.text("")
        generator.closeAll();
        return assert.equal(generator.asString(), "");
    });
    
    test('can leave some HTML elements for next style', function() {
        var generator = new HtmlGenerator();
        var listStyle = styles.elements([
            styles.element("ul", {}, {fresh: false}),
            styles.element("li", {}, {fresh: true})
        ])
        generator.style(listStyle);
        generator.text("Apple");
        generator.style(listStyle);
        generator.text("Banana");
        generator.closeAll();
        return assert.equal(generator.asString(), "<ul><li>Apple</li><li>Banana</li></ul>");
    });
    
    test('renders class attribute of elements', function() {
        var generator = new HtmlGenerator();
        generator.style(styles.elements([
            styles.element("p", {"class": "tip"})
        ]));
        generator.text("Hello!");
        generator.closeAll();
        return assert.equal(generator.asString(), '<p class="tip">Hello!</p>');
    });
})
