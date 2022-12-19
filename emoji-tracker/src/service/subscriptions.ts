import AWS from "aws-sdk";
import { readFromS3, writeToS3 } from "../apis/s3";

type Subscriptions = string[];

export async function getSubscriptions(): Promise<Subscriptions> {
  const bucket = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: process.env["S3_BUCKET"] },
  });

  try {
    const string = await readFromS3(
      bucket,
      `${process.env["SLACK_WORKSPACE"]}-emojis-subscriptions.json`
    );
    return JSON.parse(string.toString("utf-8"));
  } catch (err) {
    return [];
  }
}

async function writeSubscriptions(subscriptions: Subscriptions) {
  const bucket = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: process.env["S3_BUCKET"] },
  });

  await writeToS3(
    bucket,
    `${process.env["SLACK_WORKSPACE"]}-emojis-subscriptions.json`,
    JSON.stringify(subscriptions)
  );
}

export async function addSubscription(channel: string) {
  const subscriptions = new Set([...(await getSubscriptions()), channel]);
  writeSubscriptions([...subscriptions]);
}
export async function removeSubscription(channel: string) {
  const subscriptions = (await getSubscriptions()).filter((c) => c !== channel);

  writeSubscriptions([...subscriptions]);
}
