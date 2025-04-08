var _ = require('underscore');
// Replace bluebird with native Promises
// var bluebird = require("bluebird/js/release/promise")();

// Use the built-in Promise
// This avoids the need to check if Promise is available
// since we're requiring Node.js 12+ in package.json
exports.defer = defer;
exports.when = when;
exports.resolve = resolve;
exports.all = all;
exports.props = props;
exports.reject = reject;
exports.promisify = promisify;
exports.mapSeries = mapSeries;
exports.attempt = attempt;
exports.nfcall = nfcall;

function when(value) {
	return wrapPromise(Promise.resolve(value));
}

function resolve(value) {
	return wrapPromise(Promise.resolve(value));
}

function all(values) {
	return wrapPromise(Promise.all(values));
}

function reject(reason) {
	return wrapPromise(Promise.reject(reason));
}

function nfcall(func) {
	var args = Array.prototype.slice.call(arguments, 1);
	var promisedFunc = promisify(func);
	return promisedFunc.apply(null, args);
}

// Since we can't modify Promise.prototype, we'll wrap promises
function wrapPromise(promise) {
	// We need to store the original promise for methods like .done
	var originalPromise = promise;
	var wrapped = promise.then(function (value) {
		// This first .then ensures we have a native promise base
		// before potentially overriding .then
		return value;
	});

	// Override .then to always return a wrapped promise
	wrapped.then = function (onFulfilled, onRejected) {
		// Call the original native .then but wrap its result
		var newPromise = originalPromise.then(onFulfilled, onRejected);
		return wrapPromise(newPromise);
	};

	// Add .fail as an alias for .catch for Q compatibility
	wrapped.fail = function (onRejected) {
		return wrapPromise(originalPromise.catch(onRejected));
	};

	// Add .caught which is a Bluebird alias for .catch
	wrapped.caught = function (onRejected) {
		return wrapPromise(originalPromise.catch(onRejected));
	};

	// Add .done() method which is used in Bluebird to terminate the chain
	// and throw any unhandled errors
	wrapped.done = function () {
		// Use the original promise here to avoid infinite recursion with the overridden .then
		return originalPromise.catch(function (error) {
			// In the next tick, throw the error
			process.nextTick(function () {
				throw error;
			});
		});
	};

	// Add .tap method from Bluebird which runs a function and returns the original value
	wrapped.tap = function (onFulfilled) {
		// Use the overridden .then to keep the chain wrapped
		return wrapped.then(function (value) {
			return Promise.resolve(onFulfilled(value)).then(function () {
				return value;
			});
		});
	};

	// Add .also method which is used to add additional properties to the result
	wrapped.also = function (func) {
		// Use the overridden .then to keep the chain wrapped
		return wrapped.then(function (value) {
			var returnValue = _.extend({}, value, func(value));
			return props(returnValue);
		});
	};

	return wrapped;
}

function defer() {
	var resolve;
	var reject;
	var promise = new Promise(function (resolveArg, rejectArg) {
		resolve = resolveArg;
		reject = rejectArg;
	});

	return {
		resolve: resolve,
		reject: reject,
		promise: wrapPromise(promise)
	};
}

// Implement Bluebird's props method using native Promises
function props(obj) {
	var keys = Object.keys(obj);
	var values = keys.map(function (key) {
		return obj[key];
	});

	return wrapPromise(
		Promise.all(values).then(function (results) {
			var result = {};
			keys.forEach(function (key, index) {
				result[key] = results[index];
			});
			return result;
		})
	);
}

// Implement Bluebird's promisify
function promisify(nodeFunction) {
	return function () {
		var self = this;
		var args = Array.prototype.slice.call(arguments);

		return wrapPromise(
			new Promise(function (resolve, reject) {
				args.push(function (err, result) {
					if (err) {
						reject(err);
					} else {
						resolve(result);
					}
				});

				nodeFunction.apply(self, args);
			})
		);
	};
}

// Implement Bluebird's mapSeries
function mapSeries(items, iterator) {
	if (!items.length) {
		return wrapPromise(Promise.resolve([]));
	}

	var results = [];
	var current = Promise.resolve();

	items.forEach(function (item) {
		current = current
			.then(function () {
				return iterator(item);
			})
			.then(function (result) {
				results.push(result);
			});
	});

	return wrapPromise(
		current.then(function () {
			return results;
		})
	);
}

// Implement Bluebird's attempt
function attempt(fn) {
	try {
		return wrapPromise(Promise.resolve(fn()));
	} catch (error) {
		return wrapPromise(Promise.reject(error));
	}
}
