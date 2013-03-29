var lop = require("lop");
var StringSource = lop.StringSource;

var styles = require("./styles");

exports.read = read;


function read(string) {
    var elementStrings = string.split(/\s+/);
    var elements = elementStrings.map(readElement);
    return styles.elements(elements);
}

function readElement(string) {
    var capture = lop.rules.sequence.capture;
    
    var identifierRule = lop.rules.tokenOfType("identifier");
    var classRule = lop.rules.sequence(
        lop.rules.tokenOfType("dot"),
        capture(identifierRule)
    ).head();
    var freshRule = lop.rules.then(
        lop.rules.optional(lop.rules.sequence(
            lop.rules.tokenOfType("colon"),
            lop.rules.token("identifier", "fresh")
        )),
        function(option) {
            return option.map(function() {
                return true;
            }).valueOrElse(false);
       }
    );
    
    var styleRule = lop.rules.sequence(
        capture(identifierRule),
        capture(lop.rules.zeroOrMore(classRule)),
        capture(freshRule)
    ).map(function(tagName, classNames, fresh) {
        var options = {};
        if (classNames.length > 0) {
            options["class"] = classNames.join(" ");
        }
        if (fresh) {
            options["fresh"] = true;
        }
        return styles.element(tagName, options);
    });
    
    var tokens = tokenise(string);
    var parser = lop.Parser();
    var parseResult = parser.parseTokens(styleRule, tokens);
    if (!parseResult.isSuccess()) {
        throw new Error("Failed to parse: " + describeFailure(parseResult));
    }
    return parseResult.value();
}

function describeFailure(parseResult) {
    return parseResult.errors().map(describeError).join("\n");

    function describeError(error) {
        return error.describe();
    }
}

function tokenise(string) {
    var source = new StringSource(string, "raw string");
    var index = 0;
    var tokens = [];
    
    while (index < string.length) {
        var nextToken = readNextToken(string, index, source);
        if (!nextToken) {
            throw new Error("Could not read token from: " + string.substring(index));
        }
        index += nextToken.value.length;
        tokens.push(nextToken);
    }
    tokens.push(new lop.Token("end", null, source.range(string.length, string.length)));
    return tokens;
}

function readNextToken(string, startIndex, source) {
    for (var i = 0; i < tokenRegexes.length; i++) {
        var regex = tokenRegexes[i].regex;
        regex.lastIndex = startIndex;
        var result = regex.exec(string);
        if (result && result.index === startIndex) {
            var value = result[0];
            return new lop.Token(
                tokenRegexes[i].name,
                value,
                source.range(startIndex, startIndex + value.length)
            );
        }
    }
}

var tokenRegexes = [
    {name: "identifier", regex: /([a-z][a-z0-9\-]*)/g},
    {name: "dot", regex: /\./g},
    {name: "colon", regex: /:/g},
    {name: "whitespace", regex: /\s+/g}
];
