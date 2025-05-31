var _ = require("underscore");
var bluebird = require("bluebird/js/release/promise")();

exports.defer = defer;
exports.all = bluebird.all;
exports.props = bluebird.props;
exports.promisify = bluebird.promisify;
exports.mapSeries = bluebird.mapSeries;
exports.attempt = bluebird.attempt;
exports.toExternalPromise = toExternalPromise;

exports.nfcall = function(func) {
    var args = Array.prototype.slice.call(arguments, 1);
    var promisedFunc = bluebird.promisify(func);
    return promisedFunc.apply(null, args);
};

bluebird.prototype.fail = bluebird.prototype.caught;

bluebird.prototype.also = function(func) {
    return this.then(function(value) {
        var returnValue = _.extend({}, value, func(value));
        return bluebird.props(returnValue);
    });
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
    // TODO: stop using bluebird.
    return bluebird.resolve(promise);
}
