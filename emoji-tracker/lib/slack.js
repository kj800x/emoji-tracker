"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postMessage = exports.fetchEmojis = void 0;
const web_api_1 = require("@slack/web-api");
// Read a token from the environment variables
const token = process.env.SLACK_OAUTH;
// Initialize
const web = new web_api_1.WebClient(token);
async function fetchEmojis() {
    const emojis = await web.emoji.list();
    return Object.keys(emojis.emoji);
}
exports.fetchEmojis = fetchEmojis;
async function postMessage(channel, text) {
    return await web.chat.postMessage({ channel, text });
}
exports.postMessage = postMessage;
