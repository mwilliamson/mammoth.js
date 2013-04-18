exports.Result = Result;
exports.warning = warning;


function Result(value, messages) {
    this.value = value;
    this.messages = messages || [];
}

Result.prototype.map = function(func) {
    return new Result(func(this.value), this.messages);
};

Result.prototype.flatMapThen = function(func) {
    var messages = this.messages;
    return func(this.value).then(function(otherResult) {
        return new Result(otherResult.value, messages.concat(otherResult.messages));
    });
};

function warning(message) {
    return {
        type: "warning",
        message: message
    };
}
