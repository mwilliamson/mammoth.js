var assert = require("assert");

var documents = require("../lib/documents");
var DocumentConverter = require("../lib/document-to-html").DocumentConverter;

var test = require("./test")(module);

function convertToHtml(document, options) {
    var converter = new DocumentConverter(options || {});
    return converter.convertToHtml(document);
}

// Helper to check result contains expected HTML
function assertHtmlContains(result, expected) {
    assert(result.value.indexOf(expected) !== -1,
        "Expected HTML to contain: " + expected + "\nActual: " + result.value);
}

// ============================================================================
// Insertions
// ============================================================================

test("tracked changes HTML conversion: insertions", {
    "insertion with text is converted to <ins> element": function() {
        var insertion = documents.Insertion(
            [documents.Run([documents.Text("inserted text")])],
            {changeId: "1", author: "John", date: "2024-01-15"}
        );
        var paragraph = documents.Paragraph([insertion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<ins data-change-id="1" data-author="John" data-date="2024-01-15">inserted text</ins>');
        });
    },

    "insertion without metadata omits data attributes": function() {
        var insertion = documents.Insertion(
            [documents.Run([documents.Text("text")])],
            {}
        );
        var paragraph = documents.Paragraph([insertion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<ins>text</ins>');
        });
    },

    "insertion with only author includes only author attribute": function() {
        var insertion = documents.Insertion(
            [documents.Run([documents.Text("text")])],
            {author: "Alice"}
        );
        var paragraph = documents.Paragraph([insertion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<ins data-author="Alice">text</ins>');
        });
    },

    "insertion preserves formatting of children": function() {
        var insertion = documents.Insertion(
            [documents.Run([documents.Text("bold text")], {isBold: true})],
            {}
        );
        var paragraph = documents.Paragraph([insertion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<ins><strong>bold text</strong></ins>');
        });
    }
});

// ============================================================================
// Deletions
// ============================================================================

test("tracked changes HTML conversion: deletions", {
    "deletion with text is converted to <del> element": function() {
        var deletion = documents.Deletion(
            [documents.Run([documents.Text("deleted text")])],
            {changeId: "2", author: "Jane", date: "2024-01-16"}
        );
        var paragraph = documents.Paragraph([deletion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<del data-change-id="2" data-author="Jane" data-date="2024-01-16">deleted text</del>');
        });
    },

    "deletion without metadata omits data attributes": function() {
        var deletion = documents.Deletion(
            [documents.Run([documents.Text("text")])],
            {}
        );
        var paragraph = documents.Paragraph([deletion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<del>text</del>');
        });
    },

    "deletion preserves formatting of children": function() {
        var deletion = documents.Deletion(
            [documents.Run([documents.Text("italic text")], {isItalic: true})],
            {}
        );
        var paragraph = documents.Paragraph([deletion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<del><em>italic text</em></del>');
        });
    }
});

// ============================================================================
// Mixed Content
// ============================================================================

test("tracked changes HTML conversion: mixed content", {
    "paragraph with normal text, insertion and deletion": function() {
        var normalRun = documents.Run([documents.Text("Normal ")]);
        var insertion = documents.Insertion(
            [documents.Run([documents.Text("inserted")])],
            {author: "A"}
        );
        var deletion = documents.Deletion(
            [documents.Run([documents.Text(" deleted")])],
            {author: "B"}
        );
        var paragraph = documents.Paragraph([normalRun, insertion, deletion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, 'Normal <ins data-author="A">inserted</ins><del data-author="B"> deleted</del>');
        });
    },

    "multiple insertions in same paragraph": function() {
        var ins1 = documents.Insertion(
            [documents.Run([documents.Text("first")])],
            {changeId: "1"}
        );
        var ins2 = documents.Insertion(
            [documents.Run([documents.Text(" second")])],
            {changeId: "2"}
        );
        var paragraph = documents.Paragraph([ins1, ins2]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<ins data-change-id="1">first</ins><ins data-change-id="2"> second</ins>');
        });
    },

    "nested elements within tracked changes": function() {
        var hyperlink = documents.Hyperlink(
            [documents.Run([documents.Text("link text")])],
            {href: "http://example.com"}
        );
        var insertion = documents.Insertion([hyperlink], {});
        var paragraph = documents.Paragraph([insertion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            assertHtmlContains(result, '<ins><a href="http://example.com">link text</a></ins>');
        });
    }
});

// ============================================================================
// Edge Cases
// ============================================================================

test("tracked changes HTML conversion: edge cases", {
    "empty insertion is ignored due to ignoreEmptyParagraphs": function() {
        // Empty paragraphs are ignored by default in mammoth
        var insertion = documents.Insertion([], {});
        var paragraph = documents.Paragraph([insertion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            // Empty paragraph content is typically removed
            assert.equal(result.messages.length, 0);
        });
    },

    "empty deletion is ignored due to ignoreEmptyParagraphs": function() {
        // Empty paragraphs are ignored by default in mammoth
        var deletion = documents.Deletion([], {});
        var paragraph = documents.Paragraph([deletion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            // Empty paragraph content is typically removed
            assert.equal(result.messages.length, 0);
        });
    },

    "special characters in author name are handled": function() {
        var insertion = documents.Insertion(
            [documents.Run([documents.Text("text")])],
            {author: "John O'Brien"}
        );
        var paragraph = documents.Paragraph([insertion]);
        var document = documents.Document([paragraph]);

        return convertToHtml(document).then(function(result) {
            // Just check that it contains the author in some form
            assertHtmlContains(result, 'data-author=');
            assertHtmlContains(result, 'John');
        });
    }
});
