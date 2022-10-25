const path = require("path");
require('dotenv').config({ path: path.join(__dirname, ".env") })

const AWS = require("aws-sdk");
const { buildRss, buildRssVerbose } = require("./rss");
const { fetchEmojis } = require("./slack");

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

async function getPreviousMetadata(bucket) {
  try {
    const string = await readFromS3(bucket, `${process.env.SLACK_WORKSPACE}-emojis-metadata.json`);
    return JSON.parse(string);
  } catch (err) {
    console.log("Failed to read previous metadata from the bucket")
    console.log(err)
    console.log("Starting over from scratch")
    return {
      emojis: [],
      updated: 0
    }
  }
}

async function main() {
  const now = new Date()

  const Bucket = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: process.env.S3_BUCKET }
  });

  const previousMetadata = await getPreviousMetadata(Bucket);
  const latestEmojis = await fetchEmojis();

  const newEmojis = [];
  for (const emoji of latestEmojis) {
    if (!previousMetadata.emojis.includes(emoji)) {
      newEmojis.push(emoji)
    }
  }

  if (newEmojis.length === 0) {
    console.log("no new emojis, bailing out")
    return 0;
  }

  const rss = buildRss(now, newEmojis, new Date(previousMetadata.updated), Object.keys(latestEmojis).length);
  const rssVerbose = buildRssVerbose(now, newEmojis, new Date(previousMetadata.updated), Object.keys(latestEmojis).length)

  await writeToS3(Bucket, `${process.env.SLACK_WORKSPACE}-emojis-metadata.json`, JSON.stringify({
    emojis: latestEmojis,
    updated: now.getTime()
  }));
  await writeToS3(Bucket, `${process.env.SLACK_WORKSPACE}-emojis-verbose.rss`, rssVerbose);
  await writeToS3(Bucket, `${process.env.SLACK_WORKSPACE}-emojis.rss`, rss);

  return 0;
}

module.exports = {
  handler: main
}
