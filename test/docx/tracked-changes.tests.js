var assert = require("assert");

var documents = require("../../lib/documents");
var xml = require("../../lib/xml");

var createBodyReaderForTests = require("./testing").createBodyReaderForTests;

var test = require("../test")(module);

function readXmlElement(element, options) {
    return createBodyReaderForTests(options).readXmlElement(element);
}

function readXmlElementValue(element, options) {
    var result = readXmlElement(element, options);
    assert.deepEqual(result.messages, []);
    return result.value;
}

// ============================================================================
// Insertions (w:ins)
// ============================================================================

test("tracked changes: insertions", {
    "w:ins children are converted normally when includeTrackedChanges is false (default)": function() {
        var runXml = xml.element("w:r", {}, [
            xml.element("w:t", {}, [xml.text("Hello")])
        ]);
        var insXml = xml.element("w:ins", {
            "w:id": "1",
            "w:author": "John Doe",
            "w:date": "2024-01-15T10:30:00Z"
        }, [runXml]);
        var paragraphXml = xml.element("w:p", {}, [insXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: false});

        // Should contain the run directly, not wrapped in Insertion
        assert.equal(paragraph.children.length, 1);
        assert.equal(paragraph.children[0].type, "run");
        assert.equal(paragraph.children[0].children[0].type, "text");
        assert.equal(paragraph.children[0].children[0].value, "Hello");
    },

    "w:ins is wrapped in Insertion element when includeTrackedChanges is true": function() {
        var runXml = xml.element("w:r", {}, [
            xml.element("w:t", {}, [xml.text("Hello")])
        ]);
        var insXml = xml.element("w:ins", {
            "w:id": "1",
            "w:author": "John Doe",
            "w:date": "2024-01-15T10:30:00Z"
        }, [runXml]);
        var paragraphXml = xml.element("w:p", {}, [insXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: true});

        // Should contain an Insertion element
        assert.equal(paragraph.children.length, 1);
        assert.equal(paragraph.children[0].type, "insertion");
        assert.equal(paragraph.children[0].changeId, "1");
        assert.equal(paragraph.children[0].author, "John Doe");
        assert.equal(paragraph.children[0].date, "2024-01-15T10:30:00Z");

        // Insertion should contain the run
        assert.equal(paragraph.children[0].children.length, 1);
        assert.equal(paragraph.children[0].children[0].type, "run");
    },

    "w:ins without attributes creates Insertion with null metadata": function() {
        var runXml = xml.element("w:r", {}, [
            xml.element("w:t", {}, [xml.text("Hello")])
        ]);
        var insXml = xml.element("w:ins", {}, [runXml]);
        var paragraphXml = xml.element("w:p", {}, [insXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: true});

        assert.equal(paragraph.children[0].type, "insertion");
        assert.equal(paragraph.children[0].changeId, null);
        assert.equal(paragraph.children[0].author, null);
        assert.equal(paragraph.children[0].date, null);
    }
});

// ============================================================================
// Deletions (w:del)
// ============================================================================

test("tracked changes: deletions", {
    "w:del content is ignored when includeTrackedChanges is false (default)": function() {
        var runXml = xml.element("w:r", {}, [
            xml.element("w:delText", {}, [xml.text("Deleted")])
        ]);
        var delXml = xml.element("w:del", {
            "w:id": "2",
            "w:author": "Jane Doe",
            "w:date": "2024-01-15T11:00:00Z"
        }, [runXml]);
        var paragraphXml = xml.element("w:p", {}, [delXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: false});

        // Should be empty - deletions are ignored
        assert.equal(paragraph.children.length, 0);
    },

    "w:del is wrapped in Deletion element when includeTrackedChanges is true": function() {
        var runXml = xml.element("w:r", {}, [
            xml.element("w:delText", {}, [xml.text("Deleted")])
        ]);
        var delXml = xml.element("w:del", {
            "w:id": "2",
            "w:author": "Jane Doe",
            "w:date": "2024-01-15T11:00:00Z"
        }, [runXml]);
        var paragraphXml = xml.element("w:p", {}, [delXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: true});

        // Should contain a Deletion element
        assert.equal(paragraph.children.length, 1);
        assert.equal(paragraph.children[0].type, "deletion");
        assert.equal(paragraph.children[0].changeId, "2");
        assert.equal(paragraph.children[0].author, "Jane Doe");
        assert.equal(paragraph.children[0].date, "2024-01-15T11:00:00Z");

        // Deletion should contain the run with deleted text
        assert.equal(paragraph.children[0].children.length, 1);
        assert.equal(paragraph.children[0].children[0].type, "run");
    },

    "w:delText is read as text within deletions": function() {
        var runXml = xml.element("w:r", {}, [
            xml.element("w:delText", {}, [xml.text("Deleted text")])
        ]);
        var delXml = xml.element("w:del", {}, [runXml]);
        var paragraphXml = xml.element("w:p", {}, [delXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: true});

        var deletion = paragraph.children[0];
        var run = deletion.children[0];
        assert.equal(run.children[0].type, "text");
        assert.equal(run.children[0].value, "Deleted text");
    },

    "w:del without attributes creates Deletion with null metadata": function() {
        var runXml = xml.element("w:r", {}, [
            xml.element("w:delText", {}, [xml.text("Deleted")])
        ]);
        var delXml = xml.element("w:del", {}, [runXml]);
        var paragraphXml = xml.element("w:p", {}, [delXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: true});

        assert.equal(paragraph.children[0].type, "deletion");
        assert.equal(paragraph.children[0].changeId, null);
        assert.equal(paragraph.children[0].author, null);
        assert.equal(paragraph.children[0].date, null);
    }
});

// ============================================================================
// Mixed Content
// ============================================================================

test("tracked changes: mixed content", {
    "paragraph can contain both insertions and deletions": function() {
        var normalRun = xml.element("w:r", {}, [
            xml.element("w:t", {}, [xml.text("Normal ")])
        ]);
        var insertedRun = xml.element("w:r", {}, [
            xml.element("w:t", {}, [xml.text("inserted")])
        ]);
        var insXml = xml.element("w:ins", {"w:author": "Alice"}, [insertedRun]);
        var deletedRun = xml.element("w:r", {}, [
            xml.element("w:delText", {}, [xml.text("deleted")])
        ]);
        var delXml = xml.element("w:del", {"w:author": "Bob"}, [deletedRun]);
        var paragraphXml = xml.element("w:p", {}, [normalRun, insXml, delXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: true});

        assert.equal(paragraph.children.length, 3);
        assert.equal(paragraph.children[0].type, "run");
        assert.equal(paragraph.children[1].type, "insertion");
        assert.equal(paragraph.children[1].author, "Alice");
        assert.equal(paragraph.children[2].type, "deletion");
        assert.equal(paragraph.children[2].author, "Bob");
    },

    "nested insertions within runs are handled": function() {
        var insXml = xml.element("w:ins", {"w:author": "Test"}, [
            xml.element("w:r", {}, [
                xml.element("w:rPr", {}, [
                    xml.element("w:b")
                ]),
                xml.element("w:t", {}, [xml.text("Bold inserted")])
            ])
        ]);
        var paragraphXml = xml.element("w:p", {}, [insXml]);

        var paragraph = readXmlElementValue(paragraphXml, {includeTrackedChanges: true});

        assert.equal(paragraph.children[0].type, "insertion");
        var run = paragraph.children[0].children[0];
        assert.equal(run.isBold, true);
    }
});

// ============================================================================
// Document Types
// ============================================================================

test("documents.Insertion", {
    "creates insertion with all properties": function() {
        var insertion = documents.Insertion(
            [documents.Text("test")],
            {changeId: "1", author: "Test Author", date: "2024-01-01"}
        );

        assert.equal(insertion.type, "insertion");
        assert.equal(insertion.changeId, "1");
        assert.equal(insertion.author, "Test Author");
        assert.equal(insertion.date, "2024-01-01");
        assert.equal(insertion.children.length, 1);
    },

    "creates insertion with default null values": function() {
        var insertion = documents.Insertion([]);

        assert.equal(insertion.type, "insertion");
        assert.equal(insertion.changeId, null);
        assert.equal(insertion.author, null);
        assert.equal(insertion.date, null);
        assert.deepEqual(insertion.children, []);
    }
});

test("documents.Deletion", {
    "creates deletion with all properties": function() {
        var deletion = documents.Deletion(
            [documents.Text("deleted")],
            {changeId: "2", author: "Delete Author", date: "2024-01-02"}
        );

        assert.equal(deletion.type, "deletion");
        assert.equal(deletion.changeId, "2");
        assert.equal(deletion.author, "Delete Author");
        assert.equal(deletion.date, "2024-01-02");
        assert.equal(deletion.children.length, 1);
    },

    "creates deletion with default null values": function() {
        var deletion = documents.Deletion([]);

        assert.equal(deletion.type, "deletion");
        assert.equal(deletion.changeId, null);
        assert.equal(deletion.author, null);
        assert.equal(deletion.date, null);
        assert.deepEqual(deletion.children, []);
    }
});
