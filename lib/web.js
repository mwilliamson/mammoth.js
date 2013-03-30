var http = require("http");
var connect = require("connect");
var url = require("url");
var fs = require("fs");
var q = require("q");
var mammoth = require("./");
var ZipFile = require("zipfile").ZipFile;

function startServer(options) {
    var app = connect()
        .use(connect.bodyParser())
        .use("/static/", connect.static(__dirname + '/../static'))
        .use(handlePage)
        .use(renderTemplate);
    http.createServer(app).listen(options.port);
}


var handlers = {
    "/": handleIndex,
    "/convert": handleConvert
};

function handlePage(request, response, next) {
    var pathname = url.parse(request.url).pathname;
    var handler = handlers[pathname];
    if (handler) {
        handler(request, response, next);
    } else {
        next();
    }
}

function handleIndex(request, response, next) {
    if (url.parse(request.url).pathname !== "/") {
        return next();
    }
    request.template = {
        name: "index.html"
    };
    next();
}

function handleConvert(request, response, next) {
    if (url.parse(request.url).pathname !== "/convert") {
        return next();
    }
    
    var converter = new mammoth.Converter(mammoth.standardOptions);
    var uploadedDocument = request.files.document;
    var documentPath = uploadedDocument.path
    // TODO: remove duplication from index.js
    var zipFile = new ZipFile(documentPath);
    var docxFile = {
        read: function(path) {
            return q.ninvoke(zipFile, "readFile", path, "utf-8")
                .then(function(value) {
                    return value.toString();
                });
        }
    };
    
    converter.convertToHtml(docxFile)
        .then(function(result) {
            request.template = {
                name: "convert.html",
                values: {
                    documentName: uploadedDocument.name,
                    documentHtml: result.html
                }
            };
            next();
        })
        .fin(function() {
            fs.unlink(documentPath);
        });
}

function renderTemplate(request, response, next) {
    if (!request.template) {
        return next();
    }
    var templateName = request.template.name;
    q.nfcall(fs.readFile, "templates/" + templateName, "utf-8")
        .then(function(templateContent) {
            var values = request.template.values || {};
            var content = templateContent;
            for (var key in values) {
                if (Object.prototype.hasOwnProperty.call(values, key)) {
                    content = content.replace("{{" + key + "}}", values[key]);
                }
            }
            response.writeHead(200, {
                "content-type": "text/html; charset=utf-8"
            });
            response.end(content);
        })
        .fail(function(error) {
            console.log(error);
            next(error);
        });
}

if (require.main === module) {
    var argv = require("optimist").argv;
    var port = argv.port ? parseInt(argv.port, 10) : 3000;
    startServer({port: port});
    console.log("Server running on http://localhost:" + port);
}
