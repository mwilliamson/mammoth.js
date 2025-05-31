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
