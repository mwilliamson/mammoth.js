exports.read = read;
exports._findPartPaths = findPartPaths;

var documents = require("../documents");
var Result = require("../results").Result;
var zipfile = require("../zipfile");

var readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile;
var createBodyReader = require("./body-reader").createBodyReader;
var DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader;
var relationshipsReader = require("./relationships-reader");
var contentTypesReader = require("./content-types-reader");
var numberingXml = require("./numbering-xml");
var stylesReader = require("./styles-reader");
var notesReader = require("./notes-reader");
var commentsReader = require("./comments-reader");

async function read(docxFile) {
  // Read initial data
  const contentTypes = await readContentTypesFromZipFile(docxFile);
  const partPaths = await findPartPaths(docxFile);

  // Read styles
  const styles = await readStylesFromZipFile(docxFile, partPaths.styles);

  // Read numbering
  const numbering = await readNumberingFromZipFile(
    docxFile,
    partPaths.numbering,
    styles
  );

  // Read notes and comments
  const [footnotes, endnotes, comments] = await Promise.all([
    readXmlFileWithBody(
      partPaths.footnotes,
      { docxFile, contentTypes, partPaths, styles, numbering },
      (bodyReader, xml) => {
        if (xml) {
          return notesReader.createFootnotesReader(bodyReader)(xml);
        }
        return new Result([]);
      }
    ),
    readXmlFileWithBody(
      partPaths.endnotes,
      { docxFile, contentTypes, partPaths, styles, numbering },
      (bodyReader, xml) => {
        if (xml) {
          return notesReader.createEndnotesReader(bodyReader)(xml);
        }
        return new Result([]);
      }
    ),
    readXmlFileWithBody(
      partPaths.comments,
      { docxFile, contentTypes, partPaths, styles, numbering },
      (bodyReader, xml) => {
        if (xml) {
          return commentsReader.createCommentsReader(bodyReader)(xml);
        }
        return new Result([]);
      }
    ),
  ]);

  // Combine footnotes and endnotes
  const notes = footnotes.flatMap((footnotesList) =>
    endnotes.map(
      (endnotesList) => new documents.Notes(footnotesList.concat(endnotesList))
    )
  );

  // Read main document
  return await readXmlFileWithBody(
    partPaths.mainDocument,
    { docxFile, contentTypes, partPaths, styles, numbering, notes, comments },
    (bodyReader, xml) => {
      return notes.flatMap((notesData) => {
        return comments.flatMap((commentsData) => {
          const reader = new DocumentXmlReader({
            bodyReader: bodyReader,
            notes: notesData,
            comments: commentsData,
          });
          return reader.convertXmlToDocument(xml);
        });
      });
    }
  );
}

async function findPartPaths(docxFile) {
  const packageRelationships = await readPackageRelationships(docxFile);

  const mainDocumentPath = findPartPath({
    docxFile,
    relationships: packageRelationships,
    relationshipType:
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
    basePath: "",
    fallbackPath: "word/document.xml",
  });

  if (!docxFile.exists(mainDocumentPath)) {
    throw new Error(
      "Could not find main document part. Are you sure this is a valid .docx file?"
    );
  }

  const documentRelationships = await xmlFileReader({
    filename: relationshipsFilename(mainDocumentPath),
    readElement: relationshipsReader.readRelationships,
    defaultValue: relationshipsReader.defaultValue,
  })(docxFile);

  function findPartRelatedToMainDocument(name) {
    return findPartPath({
      docxFile,
      relationships: documentRelationships,
      relationshipType: `http://schemas.openxmlformats.org/officeDocument/2006/relationships/${name}`,
      basePath: zipfile.splitPath(mainDocumentPath).dirname,
      fallbackPath: `word/${name}.xml`,
    });
  }

  return {
    mainDocument: mainDocumentPath,
    comments: findPartRelatedToMainDocument("comments"),
    endnotes: findPartRelatedToMainDocument("endnotes"),
    footnotes: findPartRelatedToMainDocument("footnotes"),
    numbering: findPartRelatedToMainDocument("numbering"),
    styles: findPartRelatedToMainDocument("styles"),
  };
}

function findPartPaths(docxFile) {
  return readPackageRelationships(docxFile).then(function (
    packageRelationships
  ) {
    var mainDocumentPath = findPartPath({
      docxFile: docxFile,
      relationships: packageRelationships,
      relationshipType:
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
      basePath: "",
      fallbackPath: "word/document.xml",
    });

    if (!docxFile.exists(mainDocumentPath)) {
      throw new Error(
        "Could not find main document part. Are you sure this is a valid .docx file?"
      );
    }

    return xmlFileReader({
      filename: relationshipsFilename(mainDocumentPath),
      readElement: relationshipsReader.readRelationships,
      defaultValue: relationshipsReader.defaultValue,
    })(docxFile).then(function (documentRelationships) {
      function findPartRelatedToMainDocument(name) {
        return findPartPath({
          docxFile: docxFile,
          relationships: documentRelationships,
          relationshipType:
            "http://schemas.openxmlformats.org/officeDocument/2006/relationships/" +
            name,
          basePath: zipfile.splitPath(mainDocumentPath).dirname,
          fallbackPath: "word/" + name + ".xml",
        });
      }

      return {
        mainDocument: mainDocumentPath,
        comments: findPartRelatedToMainDocument("comments"),
        endnotes: findPartRelatedToMainDocument("endnotes"),
        footnotes: findPartRelatedToMainDocument("footnotes"),
        numbering: findPartRelatedToMainDocument("numbering"),
        styles: findPartRelatedToMainDocument("styles"),
      };
    });
  });
}

function findPartPath(options) {
  var docxFile = options.docxFile;
  var relationships = options.relationships;
  var relationshipType = options.relationshipType;
  var basePath = options.basePath;
  var fallbackPath = options.fallbackPath;

  var targets = relationships.findTargetsByType(relationshipType);
  var normalisedTargets = targets.map(function (target) {
    return stripPrefix(zipfile.joinPath(basePath, target), "/");
  });
  var validTargets = normalisedTargets.filter(function (target) {
    return docxFile.exists(target);
  });
  if (validTargets.length === 0) {
    return fallbackPath;
  } else {
    return validTargets[0];
  }
}

function stripPrefix(value, prefix) {
  if (value.substring(0, prefix.length) === prefix) {
    return value.substring(prefix.length);
  } else {
    return value;
  }
}

function xmlFileReader(options) {
  return function (zipFile) {
    return readXmlFromZipFile(zipFile, options.filename).then(function (
      element
    ) {
      return element ? options.readElement(element) : options.defaultValue;
    });
  };
}

function readXmlFileWithBody(filename, options, func) {
  var readRelationshipsFromZipFile = xmlFileReader({
    filename: relationshipsFilename(filename),
    readElement: relationshipsReader.readRelationships,
    defaultValue: relationshipsReader.defaultValue,
  });

  return readRelationshipsFromZipFile(options.docxFile).then(function (
    relationships
  ) {
    var bodyReader = new createBodyReader({
      relationships: relationships,
      contentTypes: options.contentTypes,
      docxFile: options.docxFile,
      numbering: options.numbering,
      styles: options.styles,
      files: options.files,
    });
    return readXmlFromZipFile(options.docxFile, filename).then(function (xml) {
      return func(bodyReader, xml);
    });
  });
}

function relationshipsFilename(filename) {
  var split = zipfile.splitPath(filename);
  return zipfile.joinPath(split.dirname, "_rels", split.basename + ".rels");
}

var readContentTypesFromZipFile = xmlFileReader({
  filename: "[Content_Types].xml",
  readElement: contentTypesReader.readContentTypesFromXml,
  defaultValue: contentTypesReader.defaultContentTypes,
});

function readNumberingFromZipFile(zipFile, path, styles) {
  return xmlFileReader({
    filename: path,
    readElement: function (element) {
      return numberingXml.readNumberingXml(element, { styles: styles });
    },
    defaultValue: numberingXml.defaultNumbering,
  })(zipFile);
}

function readStylesFromZipFile(zipFile, path) {
  return xmlFileReader({
    filename: path,
    readElement: stylesReader.readStylesXml,
    defaultValue: stylesReader.defaultStyles,
  })(zipFile);
}

var readPackageRelationships = xmlFileReader({
  filename: "_rels/.rels",
  readElement: relationshipsReader.readRelationships,
  defaultValue: relationshipsReader.defaultValue,
});
