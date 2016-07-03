var assert = require("assert");

var createCommentsReader = require("../../lib/docx/comments-reader").createCommentsReader;
var BodyReader = require("../../lib/docx/body-reader").BodyReader;
var documents = require("../../lib/documents");
var xml = require("../../lib/xml");
var test = require("../test")(module);


test('ID and body of comment are read', function() {
    var bodyReader = new BodyReader({});
    var body = [xml.element("w:p")];
    var comments = createCommentsReader(bodyReader)({
        root: xml.element("w:comments", {}, [
            xml.element("w:comment", {"w:id": "1"}, body)
        ])
    });
    assert.equal(comments.value.length, 1);
    assert.deepEqual(comments.value[0].body, [new documents.Paragraph([])]);
    assert.deepEqual(comments.value[0].commentId, "1");
});
