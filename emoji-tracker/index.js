const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const AWS = require("aws-sdk");
const { buildRss, buildRssVerbose } = require("./rss");
const { fetchEmojis } = require("./slack");

function writeToS3(S3Client, Key, Body) {
  return new Promise((resolve, reject) => {
    S3Client.upload({ Key, Body, ACL: "public-read" }, function (err, data) {
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
    S3Client.getObject({ Key }, function (err, data) {
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
    const string = await readFromS3(
      bucket,
      `${process.env.SLACK_WORKSPACE}-emojis-metadata.json`
    );
    return JSON.parse(string);
  } catch (err) {
    console.log("Failed to read previous metadata from the bucket");
    console.log(err);
    console.log("Starting over from scratch");
    return {
      emojis: [],
      updated: 0,
    };
  }
}

async function update() {
  console.log("main function running");

  const now = new Date();

  const Bucket = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: process.env.S3_BUCKET },
  });

  const previousMetadata = await getPreviousMetadata(Bucket);

  console.log(
    `Previous metadata showed ${previousMetadata.emojis.length} emojis and was last updated ${previousMetadata.updated}`
  );

  const latestEmojis = await fetchEmojis();

  console.log(`Latest emoji data shows ${latestEmojis.length} emojis`);

  const newEmojis = [];
  for (const emoji of latestEmojis) {
    if (!previousMetadata.emojis.includes(emoji)) {
      newEmojis.push(emoji);
    }
  }

  console.log(`Found ${newEmojis.length} new emojis`);

  if (newEmojis.length === 0) {
    console.log("no new emojis, bailing out");
    return 0;
  }

  const rss = buildRss(
    now,
    newEmojis,
    new Date(previousMetadata.updated),
    Object.keys(latestEmojis).length
  );
  const rssVerbose = buildRssVerbose(
    now,
    newEmojis,
    new Date(previousMetadata.updated),
    Object.keys(latestEmojis).length
  );

  console.log(`RSS feeds generated`);

  await writeToS3(
    Bucket,
    `${process.env.SLACK_WORKSPACE}-emojis-metadata.json`,
    JSON.stringify({
      emojis: latestEmojis,
      updated: now.getTime(),
    })
  );

  console.log(`Updated metadata uploaded`);

  await writeToS3(
    Bucket,
    `${process.env.SLACK_WORKSPACE}-emojis-verbose.rss`,
    rssVerbose
  );
  await writeToS3(Bucket, `${process.env.SLACK_WORKSPACE}-emojis.rss`, rss);

  console.log(`RSS feeds uploaded`);

  console.log(`All done`);
  return 0;
}

async function main(event) {
  if (event) {
    console.log(JSON.stringify(event));

    // retrieve signature and payload
    const webhookSignature = event.headers.SignatureHeader;
    const webhookPayload = JSON.parse(event.body);

    console.log({ webhookSignature, webhookPayload });

    return 0;
  } else {
    return await update();
  }
}

module.exports = {
  handler: main,
};
