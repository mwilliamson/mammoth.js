var _ = require("underscore");

exports.defer = function() {
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
};

exports.props = function(obj) {
    var keys = Object.keys(obj);
    var promises = keys.map(function(key){
        return obj[key];
    });

    return Promise.all(promises).then(function(results) {
        return results.reduce(function(acc, result, index) {
            acc[keys[index]] = result;
            return acc;
        }, {});
    });
};

exports.promisify = function(nodeStyleFunction) {
    return function() {
        var args = Array.prototype.slice.call(arguments);
        return new Promise(function(resolve, reject) {
            args.push(function(error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
            nodeStyleFunction.apply(this, args);
        });
    };
};

exports.mapSeries = function(arr, iterator) {
    var results = [];
    var promise = Promise.resolve();

    arr.forEach(function(item, index) {
        promise = promise.then(function() {
            return iterator(item, index);
        }).then(function(result) {
            results.push(result);
        });
    });

    return promise.then(function() {
        return results;
    });
};

exports.attempt = function(fn) {
    return new Promise(function(resolve, reject) {
        try {
            // Resolve with the return value of the function
            resolve(fn());
        } catch (error) {
            // If an error is thrown, reject the promise
            reject(error);
        }
    });
};

exports.nfcall = function(func) {
    var args = Array.prototype.slice.call(arguments, 1);
    var promisedFunc = exports.promisify(func);
    return promisedFunc.apply(null, args);
};

// eslint-disable-next-line no-extend-native
Promise.prototype.also = function(func) {
    return this.then(function(value) {
        var returnValue = _.extend({}, value, func(value));
        return exports.props(returnValue);
    });
};

// eslint-disable-next-line no-extend-native
Promise.prototype.tap = function(fn) {
    return this.then(function(value){
        var result = fn(value);
        // If the result is a promise, wait for it before proceeding
        return result instanceof Promise ? result.then(function(){
            return value;
        }) : value;
    });
};

// eslint-disable-next-line no-extend-native
Promise.prototype.done = function(onFulfilled, onRejected) {
    this.then(onFulfilled, onRejected)
        .catch(function(error) {
            // eslint-disable-next-line no-undef
            setTimeout(function() {
                throw error;
            }, 0);
        });
};
