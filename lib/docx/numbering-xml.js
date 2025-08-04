var _ = require("underscore");

exports.readNumberingXml = readNumberingXml;
exports.Numbering = Numbering;
exports.defaultNumbering = new Numbering({}, {});

function Numbering(nums, abstractNums, styles) {
    var allLevels = _.flatten(_.values(abstractNums).map(function(abstractNum) {
        return _.values(abstractNum.levels);
    }));

    var levelsByParagraphStyleId = _.indexBy(
        allLevels.filter(function(level) {
            return level.paragraphStyleId != null;
        }),
        "paragraphStyleId"
    );

    function findLevel(numId, level) {
        var num = nums[numId];
        if (num) {
            var abstractNum = abstractNums[num.abstractNumId];
            if (!abstractNum) {
                return null;
            } else if (abstractNum.numStyleLink == null) {
                var baseLevel = abstractNums[num.abstractNumId].levels[level];
                if (baseLevel && num.levelOverrides && num.levelOverrides[level]) {
                    return _.extend({}, baseLevel, num.levelOverrides[level]);
                }
                return baseLevel;
            } else {
                // When there's a numStyleLink, we need to get the level from the linked style
                // but still apply any levelOverrides from the original num
                var style = styles.findNumberingStyleById(abstractNum.numStyleLink);
                var styledLevel = findLevel(style.numId, level);
                if (styledLevel && num.levelOverrides && num.levelOverrides[level]) {
                    return _.extend({}, styledLevel, num.levelOverrides[level]);
                }
                return styledLevel;
            }
        } else {
            return null;
        }
    }

    function findLevelByParagraphStyleId(styleId) {
        return levelsByParagraphStyleId[styleId] || null;
    }

    return {
        findLevel: findLevel,
        findLevelByParagraphStyleId: findLevelByParagraphStyleId
    };
}

function readNumberingXml(root, options) {
    if (!options || !options.styles) {
        throw new Error("styles is missing");
    }

    var abstractNums = readAbstractNums(root);
    var nums = readNums(root, abstractNums);
    return new Numbering(nums, abstractNums, options.styles);
}

function readAbstractNums(root) {
    var abstractNums = {};
    root.getElementsByTagName("w:abstractNum").forEach(function(element) {
        var id = element.attributes["w:abstractNumId"];
        abstractNums[id] = readAbstractNum(element);
    });
    return abstractNums;
}

function readAbstractNum(element) {
    var levels = {};
    element.getElementsByTagName("w:lvl").forEach(function(levelElement) {
        var levelIndex = levelElement.attributes["w:ilvl"];
        var numFmt = levelElement.firstOrEmpty("w:numFmt").attributes["w:val"];
        var paragraphStyleId = levelElement.firstOrEmpty("w:pStyle").attributes["w:val"];

        levels[levelIndex] = {
            isOrdered: numFmt !== "bullet",
            level: levelIndex,
            paragraphStyleId: paragraphStyleId
        };
    });

    var numStyleLink = element.firstOrEmpty("w:numStyleLink").attributes["w:val"];

    return {levels: levels, numStyleLink: numStyleLink};
}

function readNums(root) {
    var nums = {};
    root.getElementsByTagName("w:num").forEach(function(element) {
        var numId = element.attributes["w:numId"];
        var abstractNumId = element.first("w:abstractNumId").attributes["w:val"];
        
        var levelOverrides = {};
        element.getElementsByTagName("w:lvlOverride").forEach(function(overrideElement) {
            var level = overrideElement.attributes["w:ilvl"];
            var startOverrideElement = overrideElement.firstOrEmpty("w:startOverride");
            if (startOverrideElement.attributes["w:val"]) {
                levelOverrides[level] = {
                    startOverride: parseInt(startOverrideElement.attributes["w:val"], 10)
                };
            }
        });
        
        nums[numId] = {
            abstractNumId: abstractNumId,
            levelOverrides: Object.keys(levelOverrides).length > 0 ? levelOverrides : undefined
        };
    });
    return nums;
}
