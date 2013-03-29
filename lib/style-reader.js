var styles = require("./styles");

exports.read = read;


function read(string) {
    return styles.elements(string.split(/\s+/));
}
