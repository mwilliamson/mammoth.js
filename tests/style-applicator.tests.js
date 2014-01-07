var assert = require("assert");

var StyleApplicator = require("../lib/style-applicator").StyleApplicator;
var documents = require("../lib/documents");

var testing = require("./testing");
var test = testing.test;
var testData = testing.testData;


describe("style-applicator", function() {
    test("can process styleless document with single, center-aligned paragraph", function() {
        var testOptions = {
            styleMap: [],
            styleApplicator: {
                alignment: true
            }
        };
        var testDocument = documents.Document([
            documents.Paragraph([
                documents.Run([
                    documents.Text("Test document with centered paragraph.")
                ])
            ], {alignment: 'center'})
        ]);
        var expectedDocument = documents.Document([
            documents.Paragraph([
                documents.Run([
                    documents.Text("Test document with centered paragraph.")
                ])
            ], {styleName: 'centerAligned', alignment: 'center'})
        ]);

        var styleApplicator = new StyleApplicator(testOptions);
        return styleApplicator.processDocumentStyles(testDocument).then(function(result) {
            assert.deepEqual(expectedDocument, result);
        });
    });
});