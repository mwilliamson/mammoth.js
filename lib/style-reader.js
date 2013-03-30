var lop = require("lop");
var RegexTokeniser = lop.RegexTokeniser;

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
    var tokeniser = new RegexTokeniser([
        {name: "identifier", regex: /([a-z][a-z0-9\-]*)/},
        {name: "dot", regex: /\./},
        {name: "colon", regex: /:/},
        {name: "whitespace", regex: /\s+/}
    ]);
    return tokeniser.tokenise(string);
}
