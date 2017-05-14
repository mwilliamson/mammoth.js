var assert = require("assert");

var hamjest = require("hamjest");
var assertThat = hamjest.assertThat;
var contains = hamjest.contains;
var hasProperties = hamjest.hasProperties;

var mammoth = require("../");
var documents = require("../lib/documents");
var promises = require("../lib/promises");

var test = require("./test")(module);


test('mammoth.images.inline() should be an alias of mammoth.images.imgElement()', function() {
    assert.ok(mammoth.images.inline === mammoth.images.imgElement);
});


test('mammoth.images.dataUri() encodes images in base64', function() {
    var imageBuffer = new Buffer("abc");
    var image = new documents.Image({
        readImage: function(encoding) {
            return promises.when(imageBuffer.toString(encoding));
        },
        contentType: "image/jpeg"
    });
    
    return mammoth.images.dataUri(image).then(function(result) {
        assertThat(result, contains(
            hasProperties({tag: hasProperties({attributes: {"src": "data:image/jpeg;base64,YWJj"}})})
        ));
    });
});
