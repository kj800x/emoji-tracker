const path = require("path");
require('dotenv').config({ path: path.join(__dirname, ".env") })

const AWS = require("aws-sdk");
const { buildRss } = require("./rss");
const { fetchEmojis } = require("./slack");

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

function readFromS3(S3Client, Key) {
  return new Promise((resolve, reject) => {
    S3Client.getObject({ Key }, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data.Body);
      }
    });
  });
}

async function getPreviousMetadata() {
  try {
    const string = await readFromS3(BucketCoolkevS3, "hubspot-emojis-metadata.json");
    console.log(string);
    return JSON.parse(string);
  } catch (e) {
    console.log(e)
    return {
      emojis: [],
      updated: 0
    }
  }
}

async function main() {
  const now = new Date()

  const previousMetadata = await getPreviousMetadata();
  const latestEmojis = await fetchEmojis();

  const newEmojis = [];
  for (const emoji of latestEmojis) {
    if (!previousMetadata.emojis.includes(e)) {
      newEmojis.push(emoji)
    }
  }

  const rss = buildRss(now, newEmojis, new Date(previousMetadata.updated));

  await writeToS3(BucketCoolkevS3, "hubspot-emojis-metadata.json", JSON.stringify({
    emojis: latestEmojis,
    updated: now.getTime()
  }));
  await writeToS3(BucketCoolkevS3, "hubspot-emojis.rss", rss);
}

module.exports = {
  handler: main
}
