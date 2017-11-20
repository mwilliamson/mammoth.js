exports.NumberingReader = NumberingReader;
exports.Numbering = Numbering;
exports.defaultNumbering = new Numbering({});


function Numbering(nums) {
    return {
        findLevel: function(numId, level) {
            var num = nums[numId];
            if (num) {
                return num[level];
            } else {
                return null;
            }
        }
    };
}

function NumberingReader(numStyles) {
    function readNumsRel(root){
        var numsRel = {};
        root.getElementsByTagName("w:num").forEach(function(element) {
            var id = element.attributes["w:numId"];
            var abstractNumId = element.first("w:abstractNumId").attributes["w:val"];
            numsRel[id] = abstractNumId;
        });
        return numsRel;
    }

    function readAbstractNums(root, numsRel) {
        var abstractNums = {};
        root.getElementsByTagName("w:abstractNum").forEach(function(element) {
            var id = element.attributes["w:abstractNumId"];
            var numStyleLink = element.firstOrEmpty("w:numStyleLink").attributes["w:val"];
            if (numStyleLink !== undefined) {
                var numIdLink = numStyles[numStyleLink].numId;
                var abstractNumIdLink = numsRel[numIdLink];
                abstractNums[id] = {abstractNumIdLink: abstractNumIdLink};
            } else {
                abstractNums[id] = readAbstractNum(element);
            }
        });
        Object.keys(abstractNums).forEach(function(k){
            var abstractNumIdLink = abstractNums[k]["abstractNumIdLink"];
            if (abstractNumIdLink !== undefined) {
                abstractNums[k] = abstractNums[abstractNumIdLink];
            }
        });
        return abstractNums;
    }

    function readAbstractNum(element) {
        var levels = {};
        element.getElementsByTagName("w:lvl").forEach(function(levelElement) {
            var levelIndex = levelElement.attributes["w:ilvl"];
            var numFmt = levelElement.first("w:numFmt").attributes["w:val"];
            levels[levelIndex] = {
                isOrdered: numFmt !== "bullet",
                level: levelIndex
            };
        });
        return levels;
    }
    
    function readNums(root, abstractNums) {
        var nums = {};
        root.getElementsByTagName("w:num").forEach(function(element) {
            var id = element.attributes["w:numId"];
            var abstractNumId = element.first("w:abstractNumId").attributes["w:val"];
            nums[id] = abstractNums[abstractNumId];
        });
        return nums;
    }

    return {
        readNumbering: function(root) {
            var numsRel = readNumsRel(root);
            var abstractNums = readAbstractNums(root, numsRel);
            var nums = readNums(root, abstractNums);
            return new Numbering(nums);
        }
    };
}
