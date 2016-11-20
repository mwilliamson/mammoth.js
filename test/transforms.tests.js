var assert = require("assert");

var transforms = require("../lib/transforms");
var test = require("./test")(module);


test("getDescendants()", {
    "returns nothing if element has no children property": function() {
        assert.deepEqual(transforms.getDescendants({}), []);
    },
    
    "returns nothing if element has empty children": function() {
        assert.deepEqual(transforms.getDescendants({children: []}), []);
    },
    
    "includes children": function() {
        var element = {
            children: [{name: "child 1"}, {name: "child 2"}]
        }
        assert.deepEqual(
            transforms.getDescendants(element),
            [{name: "child 1"}, {name: "child 2"}]
        );
    },
    
    "includes indirect descendants": function() {
        var grandchild = {name: "grandchild"};
        var child = {name: "child", children: [grandchild]};
        var element = {children: [child]};
        assert.deepEqual(
            transforms.getDescendants(element),
            [grandchild, child]
        );
    }
});


test("getDescendantsOfType()", {
    "filters descendants to type": function() {
        var paragraph = {type: "paragraph"};
        var run = {type: "run"};
        var element = {
            children: [paragraph, run]
        };
        assert.deepEqual(
            transforms.getDescendantsOfType(element, "run"),
            [run]
        );
    }
});
