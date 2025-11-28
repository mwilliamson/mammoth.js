var mammoth = require('./lib/index');
var path = require('path');

var docxPath = path.join(__dirname, 'test/test-data/tables.docx');
mammoth.convertToMarkdown({path: docxPath})
    .then(function(result) {
        var markdown = result.value;
        console.log('Generated Markdown:', markdown);
    })
    .catch(function(error) {
        console.error('Error:', error);
    });
