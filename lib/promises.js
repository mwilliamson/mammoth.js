var _ = require("underscore");
var bluebird = require("bluebird/js/release/promise")();

exports.defer = defer;
exports.Promise = bluebird.Promise;
exports.resolve = bluebird.resolve;
exports.reject = bluebird.reject;

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

    var result = bluebird.all(values).then(function(resolvedValues) {
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
        return bluebird.resolve(func());
    } catch (error) {
        return bluebird.reject(error);
    }
};

function defer() {
    var resolve;
    var reject;
    var promise = new bluebird.Promise(function(resolveArg, rejectArg) {
        resolve = resolveArg;
        reject = rejectArg;
    });

    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}
