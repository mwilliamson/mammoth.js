var assert = require("assert");

var promises = require("../lib/promises");
var test = require("./test")(module);

test("try", {
    "when function succeeds with non-promise then promise is resolved": function() {
        return promises.try(function() {
            return "success";
        }).then(function(result) {
            assert.strictEqual(result, "success");
        });
    },

    "when function succeeds with promise then promise is resolved": function() {
        return promises.try(function() {
            return promises.resolve("success");
        }).then(function(result) {
            assert.strictEqual(result, "success");
        });
    },

    "when function throws error then promise is rejected": function() {
        return promises.try(function() {
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
        return promises.try(function() {
            return promises.reject(new Error("failure"));
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

test("props", {
    "props({}) resolve to {}": function() {
        return promises.props({}).then(function(result) {
            assert.deepStrictEqual(result, {});
        });
    },

    "when object has promise values then props returns with all values resolved": function() {
        return promises.props({
            a: promises.resolve(1),
            b: promises.resolve(2),
            c: promises.resolve(3)
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

    "props(...).also(...) can be used to add props": function() {
        return promises.props({
            a: promises.resolve(1)
        }).also(function(result) {
            return {
                b: result.a + 1
            };
        }).then(function(result) {
            assert.deepStrictEqual(result, {
                a: 1,
                b: 2
            });
        });
    }
});
