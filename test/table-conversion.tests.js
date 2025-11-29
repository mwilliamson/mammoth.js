var mammoth = require('../lib/index');
var path = require('path');
var assert = require('assert');

describe('table conversion', function() {
    it('should convert simple table to markdown', function() {
        var docxPath = path.join(__dirname, 'test-data/tables.docx');
        return mammoth.convertToMarkdown({path: docxPath})
            .then(function(result) {
                var markdown = result.value;
                assert(markdown.includes('| Top left'));
                assert(markdown.includes('| Bottom left'));
                assert(markdown.includes('| Top right'));
                assert(markdown.includes('| Bottom right'));
                return markdown;
            });
    });
});
