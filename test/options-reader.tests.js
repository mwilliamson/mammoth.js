var assert = require("assert");

var optionsReader = require("../lib/options-reader");
var standardOptions = optionsReader._standardOptions;
var readOptions = optionsReader.readOptions;
var test = require("./test")(module);


test('standard options are used if options is undefined', function() {
    assert.deepEqual(standardOptions, readOptions(undefined));
});

test('standard options are used if options is empty', function() {
    assert.deepEqual(standardOptions, readOptions({}));
});

test('custom style map as string is prepended to standard style map', function() {
    var options = readOptions({
        styleMap: "p.SectionTitle => h2"
    });
    assert.deepEqual("p.SectionTitle => h2", options.styleMap[0]);
    assert.deepEqual(standardOptions.styleMap, options.styleMap.slice(1));
});

test('custom style map as array is prepended to standard style map', function() {
    var options = readOptions({
        styleMap: ["p.SectionTitle => h2"]
    });
    assert.deepEqual("p.SectionTitle => h2", options.styleMap[0]);
    assert.deepEqual(standardOptions.styleMap, options.styleMap.slice(1));
});

test('lines starting with # in custom style map are ignored', function() {
    var options = readOptions({
        styleMap: "# p.SectionTitle => h3\np.SectionTitle => h2"
    });
    assert.deepEqual("p.SectionTitle => h2", options.styleMap[0]);
    assert.deepEqual(standardOptions.styleMap, options.styleMap.slice(1));
});

test('blank lines in custom style map are ignored', function() {
    var options = readOptions({
        styleMap: "\n\n"
    });
    assert.deepEqual(standardOptions.styleMap, options.styleMap);
});

test('default style mappings are ignored if includeDefaultStyleMap is false', function() {
    var options = readOptions({
        styleMap: "p.SectionTitle => h2",
        includeDefaultStyleMap: false
    });
    assert.deepEqual(["p.SectionTitle => h2"], options.styleMap);
});
