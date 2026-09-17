var _ = require("underscore");

exports.defer = defer;
exports.Promise = Promise;
exports.resolve = Promise.resolve.bind(Promise);
exports.reject = Promise.reject.bind(Promise);

exports.forEachSeries = function(array, func) {
    var arrayIndex = 0;

    var deferred = defer();

    var next = function() {
        if (arrayIndex < array.length) {
            var element = array[arrayIndex];
            arrayIndex++;
            func(element).then(next, deferred.reject);
        } else {
            deferred.resolve();
        }
    };

    next();

    return deferred.promise;
};

var props = exports.props = function(obj) {
    // We rely on .keys() and .values() returning properties in the same order.
    var keys = Object.keys(obj);
    var values = Object.values(obj);

    var result = Promise.all(values).then(function(resolvedValues) {
        var resolvedObj = {};
        for (var index = 0; index < keys.length; index++) {
            resolvedObj[keys[index]] = resolvedValues[index];
        }
        return resolvedObj;
    });

    return addAlsoToPromise(result);
};

var alsoMethod = function(func) {
    var result = this.then(function(value) {
        var returnValue = _.extend({}, value, func(value));
        return props(returnValue);
    });

    return addAlsoToPromise(result);
};

function addAlsoToPromise(promise) {
    promise.also = alsoMethod;
    return promise;
}

exports.try = function(func) {
    try {
        return Promise.resolve(func());
    } catch (error) {
        return Promise.reject(error);
    }
};

function defer() {
    var resolve;
    var reject;
    var promise = new Promise(function(resolveArg, rejectArg) {
        resolve = resolveArg;
        reject = rejectArg;
    });

    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}

function ExternalPromise(executor) {
    var promise = new Promise(executor);
    promise.__proto__ = ExternalPromise.prototype;
    return promise;
}

ExternalPromise.__proto__ = Promise;
ExternalPromise.prototype.__proto__ = Promise.prototype;

ExternalPromise.prototype.done = function(resolve, reject) {
    return this.then(resolve, reject).catch(function(error) {
        if (isNode()) {
            var stack = error instanceof Error ? error.stack : error;
            process.stderr.write("Fatal " + stack + "\n");
            process.exit(2);
        } else {
            setTimeout(function() {
                throw error;
            }, 0);
        }
    });
};

/**
 * Previous versions of Mammoth used bluebird instead of native promises. While
 * internal usage can be replaced easily enough, external users of the library
 * may have relied on values returned from function calls being a bluebird
 * promise.
 *
 * However, since the return value was only documented as a promise, not as a
 * bluebird promise, and it's relatively straightforward to wrap the return
 * value in a bluebird promise if necessary, changing the API to return a native
 * promise should be relatively safe.
 *
 * The only exception is that the docs previously used `.done()`: therefore,
 * when returning promises from the API to external users, a `done` method is
 * added.
 */
function toExternalPromise(promise) {
    return ExternalPromise.resolve(promise);
}

exports.toExternalPromise = toExternalPromise;

/**
 * Detect whether we're running in node.js. This uses the same logic as in
 * bluebird for consistency with previous versions of Mammoth.
 */
function isNode() {
    if (typeof process === "undefined") {
        return false;
    }

    return {}.toString.call(process).toLowerCase() === "[object process]";
}
