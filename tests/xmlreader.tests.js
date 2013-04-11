var assert = require("assert");

var xmlreader = require("../lib/xmlreader");
var test = require("./testing").test;


describe('xmlreader.read', function() {
    test('should read self-closing element', function() {
        return xmlreader.read("<body/>").then(function(result) {
            assert.deepEqual({type: "element", name: "body", attributes: {}, children: []}, result.root);
        });
    })
    
    test('should read empty element with separate closing tag', function() {
        return xmlreader.read("<body></body>").then(function(result) {
            assert.deepEqual({type: "element", name: "body", attributes: {}, children: []}, result.root);
        });
    })
    
    test('should read attributes of tags', function() {
        return xmlreader.read('<body name="bob"/>').then(function(result) {
            assert.deepEqual({name: "bob"}, result.root.attributes);
        });
    })
    
    test('can read text element', function() {
        return xmlreader.read('<body>Hello!</body>').then(function(result) {
            assert.deepEqual({type: "text", value: "Hello!"}, result.root.children[0]);
        });
    })
    
    test('should read element with children', function() {
        return xmlreader.read("<body><a/><b/></body>").then(function(result) {
            var root = result.root;
            assert.equal(2, root.children.length);
            assert.equal("a", root.children[0].name);
            assert.equal("b", root.children[1].name);
        });
    })

    test('unmapped namespaces URIs are included in braces as prefix', function() {
        return xmlreader.read('<w:body xmlns:w="word"/>').then(function(result) {
            assert.deepEqual(result.root.name, "{word}:body");
        });
    })

    test('mapped namespaces URIs are translated using map', function() {
        var namespaceMap = {
            "word": "x"
        };
        
        return xmlreader.read('<w:body xmlns:w="word"/>', namespaceMap).then(function(result) {
            assert.deepEqual(result.root.name, "x:body");
        });
    })

    test('namespace of attributes is mapped to prefix', function() {
        var namespaceMap = {
            "word": "x"
        };
        var xmlString = '<w:body xmlns:w="word" w:val="Hello!"/>';
        return xmlreader.read(xmlString, namespaceMap).then(function(result) {
            assert.deepEqual(result.root.attributes["x:val"], "Hello!");
        });
    })
    
    test('can find first element with name', function() {
        return xmlreader.read('<body><a/><b index="1"/><b index="2"/></body>').then(function(result) {
            var first = result.root.first("b");
            assert.equal("1", first.attributes.index);
        });
    })
    
    test('whitespace between xml declaration and root tag is ignored', function() {
        return xmlreader.read('<?xml version="1.0" ?>\n<body/>').then(function(result) {
            assert.deepEqual("body", result.root.name);
        });
    })
    
    test('error if XML is badly formed', function() {
        return xmlreader.read("<bo").then(function(result) {
            throw new Error("Expected failure");
        }, function(error) {
            assert.ok(error);
            return 1;
        });
    })
});
