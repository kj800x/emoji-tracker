"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const crypto_1 = __importDefault(require("crypto"));
const slackHandler_1 = require("./slackHandler");
const update_1 = require("../service/update");
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
// aws event
async function main(event) {
    if (event && "httpMethod" in event && event.httpMethod === "GET") {
        return { hi: "hows it goin" };
    }
    if (event) {
        console.log(JSON.stringify(event));
        const slackRequestTimestamp = event.headers["X-Slack-Request-Timestamp"];
        const slackSignature = event.headers["X-Slack-Signature"];
        // Check for replay attacks
        if (new Date().getTime() - parseInt(slackRequestTimestamp, 10) * 1000 >
            FIVE_MINUTES_IN_MS) {
            console.log("request timestamp is too far in the past");
            return {
                error: "request timestamp is too far in the past",
            };
        }
        const sigBaseString = ["v0", slackRequestTimestamp, event.body].join(":");
        const expected = `v0=${crypto_1.default
            .createHmac("sha256", process.env["SLACK_SIGNING_SECRET"])
            .update(sigBaseString, "utf-8")
            .digest("hex")}`;
        // Validate signature
        console.log(expected, slackSignature);
        if (!crypto_1.default.timingSafeEqual(Buffer.from(expected, "utf-8"), Buffer.from(slackSignature, "utf-8"))) {
            console.log("slack webhook signature validation failed", expected, slackSignature);
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
            case "event_callback": {
                const event = webhookPayload.event;
                return await (0, slackHandler_1.processEvent)(event);
            }
            default: {
                console.log(`unexpected slack webhook message type: ${webhookPayload.type}`);
                return {
                    error: "unexpected slack webhook message type",
                };
            }
        }
    }
    else {
        console.log("doing cron update");
        return await (0, update_1.update)();
    }
}
exports.main = main;
