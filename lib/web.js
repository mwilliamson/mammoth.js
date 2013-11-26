var http = require("http");
var connect = require("connect");
var url = require("url");
var fs = require("fs");
var q = require("q");
var dust = require("dustjs-linkedin");

var mammoth = require("./");


dust.onLoad = function(templateName, callback) {
    fs.readFile("templates/" + templateName, "utf-8", callback)
};


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
    var documentPath = uploadedDocument.path;
    
    converter.convertToHtml({path: documentPath})
        .then(function(result) {
            request.template = {
                name: "convert.html",
                values: {
                    documentName: uploadedDocument.name,
                    documentHtml: result.value,
                    messages: result.messages
                }
            };
            next();
        })
        .fin(function() {
            return q.nfcall(fs.unlink, documentPath);
        })
        .done();
}

function renderTemplate(request, response, next) {
    if (!request.template) {
        return next();
    }
    var templateName = request.template.name;
    
    q.nfcall(dust.render, templateName, request.template.values)
        .then(function(content) {
            response.writeHead(200, {
                "content-type": "text/html; charset=utf-8"
            });
            response.end(content);
        })
        .fail(next);
}

if (require.main === module) {
    var argv = require("optimist").argv;
    var port = argv.port ? parseInt(argv.port, 10) : 3000;
    startServer({port: port});
    console.log("Server running on http://localhost:" + port);
}
