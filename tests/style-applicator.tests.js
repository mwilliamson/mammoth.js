var assert = require("assert");

var documents = require("../lib/documents");

var testing = require("./testing");
var test = testing.test;
var style = require("../lib/style-reader").readStyle;


describe("style-applicator", function() {
    test("can use custom documentTransform to process styleless center-aligned paragraph into h2.centerAlign", function() {
        var testOptions = {
            styleMap: [
                style("p.centerAligned => h2.sectionHeader:fresh")
            ],
            transformDocument: transformDocument
        };
        var testDocument = documents.Document([
            documents.Paragraph([
                documents.Run([
                    documents.Text("Test.")
                ])
            ], {alignment: 'center'})
        ]);
        var expectedDocument = documents.Document([
            documents.Paragraph([
                documents.Run([
                    documents.Text("Test.")
                ])
            ], {styleName: 'centerAligned', alignment: 'center'})
        ]);

        assert.deepEqual(expectedDocument, transformDocument(testDocument));
    });
});

function transformDocument(document) {
    if (document.children) {
        for (var i = 0; i < document.children.length; i++) {
            var element = document.children[i];
            switch (element.type) {
                case 'paragraph':
                    document.children[i] = processParagraphStyles(document.children[i]);
                    break;
            }
        }
    }
    return document;
}
function processParagraphStyles(element) {
    if (!element.styleName) {
        if (element.alignment) {
            element.styleName = element.alignment+"Aligned";
        }
    }
    return element;
}