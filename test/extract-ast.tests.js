const fs = require("fs");
const path = require("path");

const {extractNodeList} = require('../lib/index');

const fixtures = path.join(__dirname, "fixtures");

async function extractAst(input) {
  const extracted = await extractNodeList({
    path: input,
  });
  console.log(JSON.stringify(extracted, null, 2));
}

const items = fs.readdirSync(fixtures);

describe("extractAst", () => {
  for (const item of items) {
    if (item.endsWith(".docx")) {
      it(`extractAst: ${item}`, async () => {
        await extractAst(path.join(fixtures, item));
      });
    }
  }
})
