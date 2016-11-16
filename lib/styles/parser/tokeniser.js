var lop = require("lop");
var RegexTokeniser = lop.RegexTokeniser;

exports.tokenise = tokenise;

var stringPrefix = "'((?:\\\\.|[^'])*)";

function tokenise(string) {
    var tokeniser = new RegexTokeniser([
        {name: "identifier", regex: /([a-zA-Z][a-zA-Z0-9\-]*)/},
        {name: "cssClassName", regex: /(\.(?:[a-zA-Z0-9\-]|\\.)+)/},
        {name: "colon", regex: /:/},
        {name: "gt", regex: />/},
        {name: "whitespace", regex: /\s+/},
        {name: "arrow", regex: /=>/},
        {name: "equals", regex: /=/},
        {name: "open-paren", regex: /\(/},
        {name: "close-paren", regex: /\)/},
        {name: "open-square-bracket", regex: /\[/},
        {name: "close-square-bracket", regex: /\]/},
        {name: "string", regex: new RegExp(stringPrefix + "'")},
        {name: "unterminated-string", regex: new RegExp(stringPrefix)},
        {name: "integer", regex: /([0-9]+)/},
        {name: "choice", regex: /\|/},
        {name: "bang", regex: /(!)/}
    ]);
    return tokeniser.tokenise(string);
}
