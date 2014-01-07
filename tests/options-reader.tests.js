var assert = require("assert");

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
});
