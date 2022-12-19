"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEvent = void 0;
const slack_1 = require("../apis/slack");
const HELP_TEXT = "todo: help text (but this time from TypeScript :ts:)";
async function processEvent(event) {
    switch (event.type) {
        case "app_mention": {
            const { text, channel, user } = event;
            async function reply(text) {
                await (0, slack_1.postMessage)(channel, `<@${user}> ${text}`);
            }
            const cleanedText = text
                .replace(`<@${process.env["SLACK_APP_ID"]}>`, "")
                .split(" ")
                .map((str) => str.trim())
                .filter(Boolean);
            const command = cleanedText[0];
            switch (command) {
                case "help":
                    await reply(HELP_TEXT);
                    break;
                case "subscribe":
                    await reply("subscribe TODO");
                    break;
                case "unsubscribe":
                    await reply("unsubscribe TODO");
                    break;
                default:
                    await reply("Sorry, I didn't recognize that command");
                    break;
            }
            return { status: "handled" };
        }
        default: {
            return {
                error: "Unknown Slack event type",
            };
        }
    }
}
exports.processEvent = processEvent;
