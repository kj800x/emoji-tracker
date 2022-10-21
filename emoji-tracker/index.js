const AWS = require("aws-sdk");

const { buildRss } = require("./rss");

const BucketCoolkevS3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: "bucket.coolkev.com" }
});

function writeToS3(S3Client, Key, Body) {
  return new Promise((resolve, reject) => {
    S3Client.upload({ Key, Body, ACL: "public-read" }, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function main() {
  const rss = buildRss(new Date())

  await writeToS3(BucketCoolkevS3, "hubspot-emojis.rss", rss);
}

module.exports = {
  handler: main
}
