var assert = require("assert");

var promises = require("../lib/promises");
var test = require("./test")(module);

test("attempt", {
    "when function succeeds with non-promise then promise is resolved": function() {
        return promises.attempt(function() {
            return "success";
        }).then(function(result) {
            assert.strictEqual(result, "success");
        });
    },

    "when function succeeds with promise then promise is resolved": function() {
        return promises.attempt(function() {
            return Promise.resolve("success");
        }).then(function(result) {
            assert.strictEqual(result, "success");
        });
    },

    "when function throws error then promise is rejected": function() {
        return promises.attempt(function() {
            throw new Error("failure");
        }).then(
            function() {
                assert.fail("Expected rejection");
            },
            function(error) {
                assert.strictEqual(error.message, "failure");
            }
        );
    },

    "when function fails with promise then promise is rejected": function() {
        return promises.attempt(function() {
            return Promise.reject(new Error("failure"));
        }).then(
            function() {
                assert.fail("Expected rejection");
            },
            function(error) {
                assert.strictEqual(error.message, "failure");
            }
        );
    }
});

test("extend", {
    "object is extended by extension resolved by props()": function() {
        return promises.extend({a: 1}, {b: 2, c: Promise.resolve(3)}).then(function(result) {
            assert.deepStrictEqual(result, {a: 1, b: 2, c: 3});
        });
    },

    "when value is rejected promise then result is rejected promise": function() {
        return promises.extend({}, {
            a: Promise.resolve(1),
            b: Promise.reject(new Error("failure")),
            c: Promise.resolve(3)
        }).then(
            function(result) {
                assert.fail("Expected rejection");
            },
            function(error) {
                assert.strictEqual(error.message, "failure");
            }
        );
    }
});

test("props", {
    "props({}) resolve to {}": function() {
        return promises.props({}).then(function(result) {
            assert.deepStrictEqual(result, {});
        });
    },

    "when object has promise values then props returns with all values resolved": function() {
        return promises.props({
            a: Promise.resolve(1),
            b: Promise.resolve(2),
            c: Promise.resolve(3)
        }).then(function(result) {
            assert.deepStrictEqual(result, {
                a: 1,
                b: 2,
                c: 3
            });
        });
    },

    "when object has non-promise values then props returns with same values": function() {
        return promises.props({
            a: 1,
            b: 2,
            c: 3
        }).then(function(result) {
            assert.deepStrictEqual(result, {
                a: 1,
                b: 2,
                c: 3
            });
        });
    },

    "when value is rejected promise then props is rejected promise": function() {
        return promises.props({
            a: Promise.resolve(1),
            b: Promise.reject(new Error("failure")),
            c: Promise.resolve(3)
        }).then(
            function(result) {
                assert.fail("Expected rejection");
            },
            function(error) {
                assert.strictEqual(error.message, "failure");
            }
        );
    }
});
