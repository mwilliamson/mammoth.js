var _ = require("underscore");


exports.Element = Element;
exports.element = function(name, attributes, children) {
    return new Element(name, attributes, children);
};
exports.text = function(value) {
    return {
        type: "text",
        value: value
    };
};


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
        return child.name === name;
    });
};

Element.prototype.firstOrEmpty = function(name) {
    return this.first(name) || emptyElement;
};

Element.prototype.getElementsByTagName = function(name) {
    var elements = _.filter(this.children, function(child) {
        return child.name === name;
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

Element.prototype.serializeToString = function(item) {
    var self = this;
    var children = item ? item.children || [] : this.children;
    var attributes = item ? item.attributes || {} : this.attributes;
    item = item || this;
    var xml = '';

    children.forEach(function(item) {
        xml += self.serializeToString(item);
    });

    var attrs = '';
    Object.entries(attributes).forEach(function(item) {
        attrs += " " + item[0] + '="' + item[1] + '"';
    });
    attrs
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    if (item.type === 'element') {
        return children.length
            ? ["<", item.name, attrs, ">", xml, "</", item.name, ">"].join('')
            : ["<", item.name, attrs, "/>"].join('');
    } else if (item.type === 'text') {
        return item.value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
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
