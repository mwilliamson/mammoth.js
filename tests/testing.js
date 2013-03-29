var q = require("q");


exports.test = test;

function test(name, func) {
    it(name, function(done) {
        var result = func();
        q.when(result).then(function() {
            done()
        }).done();
    });
}
