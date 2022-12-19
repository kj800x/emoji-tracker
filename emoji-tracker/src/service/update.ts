import AWS from "aws-sdk";
import { buildRss, buildRssVerbose } from "../formatters/rss";
import { fetchEmojis } from "../apis/slack";
import { Metadata } from "../types";
import { readFromS3, writeToS3 } from "../apis/s3";

async function getPreviousMetadata(bucket: AWS.S3): Promise<Metadata> {
  try {
    const string = await readFromS3(
      bucket,
      `${process.env["SLACK_WORKSPACE"]}-emojis-metadata.json`
    );
    return JSON.parse(string.toString("utf-8"));
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

export async function update() {
  console.log("main function running");

  const now = new Date();

  const Bucket = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: process.env["S3_BUCKET"] },
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
    `${process.env["SLACK_WORKSPACE"]}-emojis-metadata.json`,
    JSON.stringify({
      emojis: latestEmojis,
      updated: now.getTime(),
    })
  );

  console.log(`Updated metadata uploaded`);

  await writeToS3(
    Bucket,
    `${process.env["SLACK_WORKSPACE"]}-emojis-verbose.rss`,
    rssVerbose
  );
  await writeToS3(Bucket, `${process.env["SLACK_WORKSPACE"]}-emojis.rss`, rss);

  console.log(`RSS feeds uploaded`);

  console.log(`All done`);
  return 0;
}
