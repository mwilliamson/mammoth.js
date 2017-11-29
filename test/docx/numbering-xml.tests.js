var duck = require("duck");

var NumberingReader = require("../../lib/docx/numbering-xml").NumberingReader;
var readNumberingStylesXml = require("../../lib/docx/styles-reader").readNumberingStylesXml;
var readStylesXml = require("../../lib/docx/styles-reader").readStylesXml;
var XmlElement = require("../../lib/xml").Element;
var test = require("../test")(module);


test('w:num element inherits levels from w:abstractNum', function() {
    var numReader = NumberingReader({});
    var numbering = numReader.readNumbering(
        new XmlElement("w:numbering", {}, [
            new XmlElement("w:abstractNum", {"w:abstractNumId": "42"}, [
                new XmlElement("w:lvl", {"w:ilvl": "0"}, [
                    new XmlElement("w:numFmt", {"w:val": "bullet"})
                ]),
                new XmlElement("w:lvl", {"w:ilvl": "1"}, [
                    new XmlElement("w:numFmt", {"w:val": "decimal"})
                ])
            ]),
            new XmlElement("w:num", {"w:numId": "47"}, [
                new XmlElement("w:abstractNumId", {"w:val": "42"})
            ])
        ])
    );
    duck.assertThat(numbering.findLevel("47", "0"), duck.hasProperties({
        isOrdered: false
    }));
    duck.assertThat(numbering.findLevel("47", "1"), duck.hasProperties({
        isOrdered: true
    }));
});

test('w:abstractNum element inherits levels from styles.xml numbering style', function() {
    var styles =  new XmlElement("w:styles", {}, [
        numberingStyle("CustomBulletList", "57")
    ]);
    var numberingStyles = readNumberingStylesXml(styles);
    var numReader = NumberingReader(numberingStyles);
    var numbering = numReader.readNumbering(
        new XmlElement("w:numbering", {}, [
            new XmlElement("w:abstractNum", {"w:abstractNumId": "42"}, [
                new XmlElement("w:lvl", {"w:ilvl": "0"}, [
                    new XmlElement("w:numFmt", {"w:val": "bullet"})
                ]),
                new XmlElement("w:lvl", {"w:ilvl": "1"}, [
                    new XmlElement("w:numFmt", {"w:val": "decimal"})
                ])
            ]),
            new XmlElement("w:abstractNum", {"w:abstractNumId": "45"}, [
                new XmlElement("w:numStyleLink", {"w:val":"CustomBulletList"})
            ]),
            new XmlElement("w:num", {"w:numId": "51"}, [
                new XmlElement("w:abstractNumId", {"w:val": "45"})
            ]),
            new XmlElement("w:num", {"w:numId": "57"}, [
                new XmlElement("w:abstractNumId", {"w:val": "42"})
            ])
        ])
    );

    duck.assertThat(numbering.findLevel("51", "0"), duck.hasProperties({
        isOrdered: false
    }));
    duck.assertThat(numbering.findLevel("51", "1"), duck.hasProperties({
        isOrdered: true
    }));
});

function numberingStyle(name, numId) {
    return new XmlElement("w:style", 
        {"w:type":"numbering", "w:styleId":name},[
            new XmlElement("w:pPr", {}, [
                new XmlElement("w:numPr", {}, [
                    new XmlElement("w:numId", {"w:val":numId})
                ])
            ])
        ] 
    );
}
