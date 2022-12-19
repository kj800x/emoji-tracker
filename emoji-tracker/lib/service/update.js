"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const rss_1 = require("../formatters/rss");
const slack_1 = require("../apis/slack");
const s3_1 = require("../apis/s3");
async function getPreviousMetadata(bucket) {
    try {
        const string = await (0, s3_1.readFromS3)(bucket, `${process.env["SLACK_WORKSPACE"]}-emojis-metadata.json`);
        return JSON.parse(string.toString("utf-8"));
    }
    catch (err) {
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
    const Bucket = new aws_sdk_1.default.S3({
        apiVersion: "2006-03-01",
        params: { Bucket: process.env["S3_BUCKET"] },
    });
    const previousMetadata = await getPreviousMetadata(Bucket);
    console.log(`Previous metadata showed ${previousMetadata.emojis.length} emojis and was last updated ${previousMetadata.updated}`);
    const latestEmojis = await (0, slack_1.fetchEmojis)();
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
    const rss = (0, rss_1.buildRss)(now, newEmojis, new Date(previousMetadata.updated), Object.keys(latestEmojis).length);
    const rssVerbose = (0, rss_1.buildRssVerbose)(now, newEmojis, new Date(previousMetadata.updated), Object.keys(latestEmojis).length);
    console.log(`RSS feeds generated`);
    await (0, s3_1.writeToS3)(Bucket, `${process.env["SLACK_WORKSPACE"]}-emojis-metadata.json`, JSON.stringify({
        emojis: latestEmojis,
        updated: now.getTime(),
    }));
    console.log(`Updated metadata uploaded`);
    await (0, s3_1.writeToS3)(Bucket, `${process.env["SLACK_WORKSPACE"]}-emojis-verbose.rss`, rssVerbose);
    await (0, s3_1.writeToS3)(Bucket, `${process.env["SLACK_WORKSPACE"]}-emojis.rss`, rss);
    console.log(`RSS feeds uploaded`);
    console.log(`All done`);
    return 0;
}
exports.update = update;
