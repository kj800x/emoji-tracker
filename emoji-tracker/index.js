const path = require("path");
const crypto = require("crypto");
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

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

async function main(event) {
  if (event && "httpMethod" in event && event.httpMethod === "GET") {
    return { hi: "hows it goin" };
  }

  if (event) {
    console.log(JSON.stringify(event));

    const slackRequestTimestamp = event.headers["X-Slack-Request-Timestamp"];
    const slackSignature = event.headers["X-Slack-Signature"];

    // Check for replay attacks
    if (
      new Date().getTime() - parseInt(slackRequestTimestamp, 10) * 1000 >
      FIVE_MINUTES_IN_MS
    ) {
      console.log("request timestamp is too far in the past");
      return {
        error: "request timestamp is too far in the past",
      };
    }

    const sigBaseString = ["v0", slackRequestTimestamp, event.body].join(":");
    const expected = `v0=${crypto
      .createHmac("sha256", process.env.SLACK_SIGNING_SECRET)
      .update(sigBaseString, "utf-8")
      .digest("hex")}`;

    // Validate signature
    console.log(expected, slackSignature);
    if (
      !crypto.timingSafeEqual(
        Buffer.from(expected, "utf-8"),
        Buffer.from(slackSignature, "utf-8")
      )
    ) {
      console.log(
        "slack webhook signature validation failed",
        expected,
        slackSignature
      );
      return {
        error: "slack webhook signature validation failed",
      };
    }

    // The event is trusted!
    const webhookPayload = JSON.parse(event.body);

    switch (webhookPayload.type) {
      case "url_verification": {
        console.log("replying to url_verification challenge");
        console.log(`Returning: ${webhookPayload.challenge}`);
        return webhookPayload.challenge;
      }
      case "app_mention": {
        console.log("got app_mention");
        return {
          "i am": "excited",
        };
      }
      default: {
        console.log(
          `unexpected slack webhook message type: ${webhookPayload.type}`
        );
        return {
          error: "unexpected slack webhook message type",
        };
      }
    }
  } else {
    console.log("doing cron update");
    return await update();
  }
}

module.exports = {
  handler: main,
};
