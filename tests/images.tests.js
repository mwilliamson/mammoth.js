var assert = require("assert");

var mammoth = require("../");

var testing = require("./testing");
var test = testing.test;


describe('images', function() {
    test('mammoth.images.inline() should be an alias of mammoth.images.imgElement()', function() {
        assert.ok(mammoth.images.inline === mammoth.images.imgElement);
    });
});
