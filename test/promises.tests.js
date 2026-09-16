var assert = require("assert");

var promises = require("../lib/promises");
var test = require("./test")(module);

test("forEachSeries", {
    "empty array resolves immediately without calling function": function() {
        return promises.forEachSeries([], function() {
            throw new Error();
        }).then(function(result) {
            assert.deepStrictEqual(result, undefined);
        });
    },

    "function is called on element after the previous element has been processed": function() {
        var log = [];

        return promises.forEachSeries([1, 2, 3], function(element) {
            return new promises.Promise(function(resolve) {
                log.push(["start", element]);
                setTimeout(function() {
                    log.push(["end", element]);
                    resolve();
                }, 0);
            });
        }).then(function(result) {
            assert.deepStrictEqual(result, undefined);
            assert.deepStrictEqual(log, [
                ["start", 1],
                ["end", 1],
                ["start", 2],
                ["end", 2],
                ["start", 3],
                ["end", 3]
            ]);
        });
    },

    "processing stops on sync error": function() {
        var log = [];

        return promises.forEachSeries([1, 2, 3], function(element) {
            return new promises.Promise(function(resolve) {
                log.push(["start", element]);
                if (element === 2) {
                    throw new Error("failure");
                } else {
                    setTimeout(function() {
                        log.push(["end", element]);
                        resolve();
                    }, 0);
                }
            });
        }).then(
            function() {
                assert.fail("Expected rejection");
            },
            function(error) {
                assert.strictEqual(error.message, "failure");
                assert.deepStrictEqual(log, [
                    ["start", 1],
                    ["end", 1],
                    ["start", 2]
                ]);
            }
        );
    },

    "processing stops on async error": function() {
        var log = [];

        return promises.forEachSeries([1, 2, 3], function(element) {
            return new promises.Promise(function(resolve, reject) {
                log.push(["start", element]);
                setTimeout(function() {
                    if (element === 2) {
                        reject(new Error("failure"));
                    } else {
                        log.push(["end", element]);
                        resolve();
                    }
                }, 0);
            });
        }).then(
            function() {
                assert.fail("Expected rejection");
            },
            function(error) {
                assert.strictEqual(error.message, "failure");
                assert.deepStrictEqual(log, [
                    ["start", 1],
                    ["end", 1],
                    ["start", 2]
                ]);
            }
        );
    }
});

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

    "when value is rejected promise then props is rejected promise": function() {
        return promises.props({
            a: promises.resolve(1),
            b: promises.reject(new Error("failure")),
            c: promises.resolve(3)
        }).then(
            function(result) {
                assert.fail("Expected rejection");
            },
            function(error) {
                assert.strictEqual(error.message, "failure");
            }
        );
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
    },

    "also can be used multiple times": function() {
        return promises.props({
            a: promises.resolve(1)
        }).also(function(result) {
            return {
                b: result.a + 1
            };
        }).also(function(result) {
            return {
                c: result.b + 1
            };
        }).then(function(result) {
            assert.deepStrictEqual(result, {
                a: 1,
                b: 2,
                c: 3
            });
        });
    }
});
