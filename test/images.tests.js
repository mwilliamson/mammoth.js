var assert = require("assert");

var mammoth = require("../");

var test = require("./test")(module);


test('mammoth.images.inline() should be an alias of mammoth.images.imgElement()', function() {
    assert.ok(mammoth.images.inline === mammoth.images.imgElement);
});
