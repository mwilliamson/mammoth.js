var q = require("q");
var sax = require("sax");
var _ = require("underscore");

exports.read = read;
exports.Element = Element;

function read(xmlString) {
    var parser = sax.parser(true, {xmlns: true, position: false});
    
    //~ parser.onerror = function(error) {
        //~ Q.fcall(function () {
            //~ throw new Error("Can't do it");
        //~ });
    //~ };
    
    var rootElement = {children: []};
    var currentElement = rootElement;
    var stack = [];
    
    var deferred = q.defer();
    
    parser.onopentag = function(node) {
        var attributes = mapValues(node.attributes, function(attribute) {
            return attribute.value;
        });
        
        var element = new Element(node.name, attributes);
        currentElement.children.push(element);
        stack.push(currentElement);
        currentElement = element
    };
    
    parser.onclosetag = function(node) {
        currentElement = stack.pop();
    };
    
    parser.ontext = function(text) {
        if (currentElement !== rootElement) {
            currentElement.children.push({
                type: "text",
                value: text
            });
        }
    };
    
    parser.onend = function() {
        deferred.resolve({
            root: rootElement.children[0]
        });
    };
    
    parser.write(xmlString).close();
    
    return deferred.promise;
}

function mapValues(input, mapper, context) {
    return _.reduce(input, function (obj, v, k) {
        obj[k] = mapper.call(context, v, k, input);
        return obj;
    }, {}, context);
}

function Element(name, attributes, children) {
    this.type = "element";
    this.name = name;
    this.attributes = attributes;
    this.children = children || [];
}

Element.prototype.first = function(name) {
    return _.find(this.children, function(child) {
        return child.name == name;
    });
}
