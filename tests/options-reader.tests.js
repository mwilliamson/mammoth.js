var assert = require("assert");

var style = require("../").style;
var optionsReader = require("../lib/options-reader");
var standardOptions = optionsReader._standardOptions;
var readOptions = optionsReader.readOptions;


describe('readOptions', function() {
    it('standard options are used if options is undefined', function() {
        assert.deepEqual(standardOptions, readOptions(undefined));
    });
    
    it('standard options are used if options is empty', function() {
        assert.deepEqual(standardOptions, readOptions({}));
    });
    
    it('custom style mappings are prepended to standard style mappings', function() {
        var options = readOptions({
            styleMap: "p.SectionTitle => h2"
        });
        assert.deepEqual(style("p.SectionTitle => h2"), options.styleMap[0]);
        assert.deepEqual(standardOptions.styleMap, options.styleMap.slice(1));
    });
    
    it('default style mappings are ignored if includeDefaultStyleMap is false', function() {
        var options = readOptions({
            styleMap: "p.SectionTitle => h2",
            includeDefaultStyleMap: false
        });
        assert.deepEqual([style("p.SectionTitle => h2")], options.styleMap);
    });
});

function last(array) {
    return array[array.length - 1];
}
