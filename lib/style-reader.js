var lop = require("lop");
var RegexTokeniser = lop.RegexTokeniser;

var documentMatchers = require("./document-matchers");
var htmlPaths = require("./html-paths");

exports.readHtmlPath = readHtmlPath;
exports.readDocumentMatcher = readDocumentMatcher;


function readDocumentMatcher(string) {
    var sequence = lop.rules.sequence;
    
    var paragraphRule = lop.rules.then(
        lop.rules.token("identifier", "p"),
        function() {
            return documentMatchers.paragraph;
        }
    );
    
    var matcherRule = sequence(
        sequence.capture(paragraphRule),
        sequence.capture(lop.rules.optional(classRule))
    ).map(function(createMatcher, styleName) {
        return createMatcher(styleName.valueOrElse());
    });
    
    return parseString(matcherRule, string);
}


function readHtmlPath(string) {
    var capture = lop.rules.sequence.capture;
    var whitespaceRule = lop.rules.tokenOfType("whitespace");
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
    
    var styleElementRule = lop.rules.sequence(
        capture(identifierRule),
        capture(lop.rules.zeroOrMore(classRule)),
        capture(freshRule)
    ).map(function(tagName, classNames, fresh) {
        var attributes = {};
        var options = {};
        if (classNames.length > 0) {
            attributes["class"] = classNames.join(" ");
        }
        if (fresh) {
            options["fresh"] = true;
        }
        return htmlPaths.element(tagName, attributes, options);
    });
    
    var styleRule = lop.rules.then(
        lop.rules.zeroOrMoreWithSeparator(
            styleElementRule,
            lop.rules.sequence(
                whitespaceRule,
                lop.rules.tokenOfType("gt"),
                whitespaceRule
            )
        ),
        htmlPaths.elements
    );
    return parseString(styleRule, string);
}
    
var identifierRule = lop.rules.tokenOfType("identifier");
    
var classRule = lop.rules.sequence(
    lop.rules.tokenOfType("dot"),
    lop.rules.sequence.capture(identifierRule)
).head();

function parseString(rule, string) {
    var tokens = tokenise(string);
    var parser = lop.Parser();
    var parseResult = parser.parseTokens(rule, tokens);
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
        {name: "identifier", regex: /([a-zA-Z][a-zA-Z0-9\-]*)/},
        {name: "dot", regex: /\./},
        {name: "colon", regex: /:/},
        {name: "gt", regex: />/},
        {name: "whitespace", regex: /\s+/}
    ]);
    return tokeniser.tokenise(string);
}
