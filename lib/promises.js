function attempt(func) {
    try {
        return Promise.resolve(func());
    } catch (error) {
        return Promise.reject(error);
    }
}

function defer() {
    var deferred = {};

    deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    return deferred;
}

function extend(result, promises) {
    var keys = Object.keys(promises);
    var values = Object.values(promises);
    return Promise.all(values)
        .then(function(resolved) {
            for (var i = 0; i < keys.length; i += 1) {
                result[keys[i]] = resolved[i];
            }
            return result;
        });
}

function forEachSeries(array, func) {
    var resultPromise = Promise.resolve();

    array.forEach(function(value) {
        resultPromise = resultPromise.then(function() {
            return func(value);
        });
    });

    return resultPromise;
}

function props(promises) {
    return extend({}, promises);
}

exports.attempt = attempt;
exports.defer = defer;
exports.extend = extend;
exports.forEachSeries = forEachSeries;
exports.props = props;
