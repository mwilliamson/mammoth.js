var bluebird = require("bluebird/js/main/promise")();
var _ = require("underscore");

exports.defer = bluebird.defer;
exports.when = bluebird.resolve;
exports.resolve = bluebird.resolve;
exports.all = bluebird.all;
exports.reject = bluebird.reject;
exports.promisify = bluebird.promisify;

exports.nfcall = function(func) {
    var args = Array.prototype.slice.call(arguments, 1);
    var promisedFunc = bluebird.promisify(func);
    return promisedFunc.apply(null, args);
};

bluebird.prototype.fail = bluebird.prototype.caught;
