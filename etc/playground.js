var mammoth = require("../");

function convert() {
    mammoth.convert({path: "etc/labrys.document.docx"}, {outputFormat: "pen"}).then(function(result) {
        // result.messages.forEach(function(message) {
        //     process.stderr.write(message.message);
        //     process.stderr.write("\n");
        // });

        process.stdout.write(result.value);
    });
}

convert();