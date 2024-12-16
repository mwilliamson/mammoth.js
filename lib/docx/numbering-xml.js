var _ = require("underscore");

exports.readNumberingXml = readNumberingXml;
exports.Numbering = Numbering;
exports.defaultNumbering = new Numbering({}, {});

function Numbering(nums, abstractNums, styles) {
  var allLevels = _.flatten(
    _.values(abstractNums).map(function (abstractNum) {
      return _.values(abstractNum.levels);
    })
  );

  var levelsByParagraphStyleId = _.indexBy(
    allLevels.filter(function (level) {
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
        var lvl = abstractNums[num.abstractNumId].levels[level];
        return Object.assign({ numId: numId }, lvl);
      } else {
        var style = styles.findNumberingStyleById(abstractNum.numStyleLink);
        return findLevel(style.numId, level);
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
    findLevelByParagraphStyleId: findLevelByParagraphStyleId,
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
  root.getElementsByTagName("w:abstractNum").forEach(function (element) {
    var id = element.attributes["w:abstractNumId"];
    abstractNums[id] = readAbstractNum(element);
  });
  return abstractNums;
}

function readAbstractNum(element) {
  var levels = {};
  element.getElementsByTagName("w:lvl").forEach(function (levelElement) {
    var levelIndex = levelElement.attributes["w:ilvl"];
    var numFmt = levelElement.firstOrEmpty("w:numFmt").attributes["w:val"];
    var paragraphStyleId =
      levelElement.firstOrEmpty("w:pStyle").attributes["w:val"];

    levels[levelIndex] = {
      isOrdered: numFmt !== "bullet",
      level: levelIndex,
      paragraphStyleId: paragraphStyleId,
    };
  });

  var numStyleLink = element.firstOrEmpty("w:numStyleLink").attributes["w:val"];

  return { levels: levels, numStyleLink: numStyleLink };
}

function readNums(root) {
  var nums = {};
  root.getElementsByTagName("w:num").forEach(function (element) {
    var numId = element.attributes["w:numId"];
    var abstractNumId = element.first("w:abstractNumId").attributes["w:val"];
    nums[numId] = { abstractNumId: abstractNumId };
  });
  return nums;
}
