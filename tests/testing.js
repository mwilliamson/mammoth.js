exports.test = test;

function test(name, func) {
    it(name, function(done) {
        var result = func();
        result.then(function() {
            done()
        }).done();
    });
}
