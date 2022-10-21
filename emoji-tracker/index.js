const AWS = require("aws-sdk");

const { buildRss } = require("./rss");

const CoolkevS3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: "coolkev.com" }
});


async function main() {
  const rss = buildRss(new Date())

  await writeToS3(CoolkevS3, "emojis.rss", rss);
}

module.exports = {
  handler: main
}
