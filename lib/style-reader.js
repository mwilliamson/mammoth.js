var lop = require("lop");
var RegexTokeniser = lop.RegexTokeniser;

var documentMatchers = require("./document-matchers");
var htmlPaths = require("./html-paths");

exports.readHtmlPath = readHtmlPath;
exports.readDocumentMatcher = readDocumentMatcher;
exports.readStyle = readStyle;


function readStyle(string) {
    return parseString(styleRule(), string);
}

function styleRule() {
    return lop.rules.sequence(
        lop.rules.sequence.capture(documentMatcherRule()),
        lop.rules.tokenOfType("whitespace"),
        lop.rules.tokenOfType("arrow"),
        lop.rules.tokenOfType("whitespace"),
        lop.rules.sequence.capture(htmlPathRule())
    ).map(function(documentMatcher, htmlPath) {
        return {
            from: documentMatcher,
            to: htmlPath
        };
    });
}

function readDocumentMatcher(string) {
    return parseString(documentMatcherRule(), string);
}

function documentMatcherRule() {
    var sequence = lop.rules.sequence;
    
    var identifierToConstant = function(identifier, constant) {
        return lop.rules.then(
            lop.rules.token("identifier", identifier),
            function() {
                return constant;
            }
        );
    };
    
    var paragraphRule = identifierToConstant("p", documentMatchers.paragraph);
    var runRule = identifierToConstant("r", documentMatchers.run);
    
    var elementTypeRule = lop.rules.firstOf("p or r",
        paragraphRule,
        runRule
    );
    
    
    var listTypeRule = lop.rules.firstOf("list type",
        identifierToConstant("ordered-list", {isOrdered: true}),
        identifierToConstant("unordered-list", {isOrdered: false})
    );
    
    var listRule = sequence(
        lop.rules.tokenOfType("colon"),
        sequence.capture(listTypeRule),
        sequence.cut(),
        lop.rules.tokenOfType("open-paren"),
        sequence.capture(integerRule),
        lop.rules.tokenOfType("close-paren")
    ).map(function(listType, levelNumber) {
        return function(matcher) {
            return matcher.list({
                isOrdered: listType.isOrdered,
                levelIndex: levelNumber - 1
            });
        };
    });
    
    var optionalListRule = lop.rules.then(
        lop.rules.optional(listRule),
        function(option) {
            return option.valueOrElse(function() {
                return function(matcher) {
                    return matcher;
                }
            });
        }
    );
    
    return sequence(
        sequence.capture(elementTypeRule),
        sequence.capture(lop.rules.optional(classRule)),
        sequence.capture(optionalListRule)
    ).map(function(createMatcher, styleName, applyList) {
        return applyList(createMatcher(styleName.valueOrElse()));
    });
}

function readHtmlPath(string) {
    return parseString(htmlPathRule(), string);
}

function htmlPathRule() {
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
    
    var tagNamesRule = lop.rules.oneOrMoreWithSeparator(
        identifierRule,
        lop.rules.tokenOfType("choice")
    );
    
    var styleElementRule = lop.rules.sequence(
        capture(tagNamesRule),
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
    
    return lop.rules.then(
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
}
    
var identifierRule = lop.rules.tokenOfType("identifier");
var integerRule = lop.rules.tokenOfType("integer");
    
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
        {name: "whitespace", regex: /\s+/},
        {name: "arrow", regex: /=>/},
        {name: "open-paren", regex: /\(/},
        {name: "close-paren", regex: /\)/},
        {name: "integer", regex: /([0-9]+)/},
        {name: "choice", regex: /\|/}
    ]);
    return tokeniser.tokenise(string);
}
