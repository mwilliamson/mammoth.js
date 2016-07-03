var assert = require("assert");

var createCommentsReader = require("../../lib/docx/comments-reader").createCommentsReader;
var BodyReader = require("../../lib/docx/body-reader").BodyReader;
var documents = require("../../lib/documents");
var xml = require("../../lib/xml");
var test = require("../test")(module);


var bodyReader = new BodyReader({});

test('ID and body of comment are read', function() {
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


test('when optional attributes of comment are missing then they are read as null', function() {
    var body = [xml.element("w:p")];
    var comments = createCommentsReader(bodyReader)({
        root: xml.element("w:comments", {}, [
            xml.element("w:comment", {"w:id": "1"}, body)
        ])
    });
    assert.equal(comments.value.length, 1);
    var comment = comments.value[0];
    assert.strictEqual(comment.authorName, null);
    assert.strictEqual(comment.authorInitials, null);
});


test('when optional attributes of comment are blank then they are read as null', function() {
    var body = [xml.element("w:p")];
    var comments = createCommentsReader(bodyReader)({
        root: xml.element("w:comments", {}, [
            xml.element("w:comment", {"w:id": "1", "w:author": " ", "w:initials": " "}, body)
        ])
    });
    assert.equal(comments.value.length, 1);
    var comment = comments.value[0];
    assert.strictEqual(comment.authorName, null);
    assert.strictEqual(comment.authorInitials, null);
});


test('when optional attributes of comment are not blank then they are read', function() {
    var body = [xml.element("w:p")];
    var comments = createCommentsReader(bodyReader)({
        root: xml.element("w:comments", {}, [
            xml.element("w:comment", {"w:id": "1", "w:author": "The Piemaker", "w:initials": "TP"}, body)
        ])
    });
    assert.equal(comments.value.length, 1);
    var comment = comments.value[0];
    assert.strictEqual(comment.authorName, "The Piemaker");
    assert.strictEqual(comment.authorInitials, "TP");
});
