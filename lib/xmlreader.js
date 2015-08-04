var promises = require("./promises");
var sax = require("sax");
var _ = require("underscore");

exports.read = read;
exports.Element = Element;

function read(xmlString, namespaceMap) {
    namespaceMap = namespaceMap || {};
    
    var finished = false;
    var parser = sax.parser(true, {xmlns: true, position: false});
    
    var rootElement = {children: []};
    var currentElement = rootElement;
    var stack = [];
    
    var deferred = promises.defer();
    
    parser.onopentag = function(node) {
        var attributes = mapObject(node.attributes, function(attribute) {
            return attribute.value;
        }, mapName);
        
        var element = new Element(mapName(node), attributes);
        currentElement.children.push(element);
        stack.push(currentElement);
        currentElement = element;
    };
    
    function mapName(node) {
        if (node.uri) {
            var mappedPrefix = namespaceMap[node.uri];
            var prefix;
            if (mappedPrefix) {
                prefix = mappedPrefix;
            } else {
                prefix = "{" + node.uri + "}";
            }
            return prefix + ":" + node.local;
        } else {
            return node.local;
        }
    }
    
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
        if (!finished) {
            finished = true;
            deferred.resolve({
                root: rootElement.children[0]
            });
        }
    };
    
    parser.onerror = function(error) {
        if (!finished) {
            finished = true;
            deferred.reject(error);
        }
    };
    
    parser.write(xmlString).close();
    
    return deferred.promise;
}

function mapObject(input, valueFunc, keyFunc) {
    return _.reduce(input, function(result, value, key) {
        var mappedKey = keyFunc.call(null, value, key, input);
        result[mappedKey] = valueFunc.call(null, value, key, input);
        return result;
    }, {});
}

var emptyElement = {
    first: function() {
        return null;
    },
    firstOrEmpty: function() {
        return emptyElement;
    },
    attributes: {}
};

function Element(name, attributes, children) {
    this.type = "element";
    this.name = name;
    this.attributes = attributes || {};
    this.children = children || [];
}

Element.prototype.first = function(name) {
    return _.find(this.children, function(child) {
        return child.name == name;
    });
};

Element.prototype.firstOrEmpty = function(name) {
    return this.first(name) || emptyElement;
};

Element.prototype.getElementsByTagName = function(name) {
    var elements = _.filter(this.children, function(child) {
        return child.name == name;
    });
    return toElementList(elements);
};

Element.prototype.text = function() {
    if (this.children.length === 0) {
        return "";
    } else if (this.children.length !== 1 || this.children[0].type !== "text") {
        throw new Error("Not implemented");
    }
    return this.children[0].value;
};

var elementListPrototype = {
    getElementsByTagName: function(name) {
        return toElementList(_.flatten(this.map(function(element) {
            return element.getElementsByTagName(name);
        }, true)));
    }
};

function toElementList(array) {
    return _.extend(array, elementListPrototype);
}
