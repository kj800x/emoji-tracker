const { WebClient } = require("@slack/web-api");

// Read a token from the environment variables
const token = process.env.SLACK_OAUTH;

// Initialize
const web = new WebClient(token);

async function fetchEmojis() {
  const emojis = await web.emoji.list();

  return Object.keys(emojis.emoji);
}

async function postMessage(channel, text) {
  return await web.chat.postMessage({ channel, text });
}

module.exports = {
  fetchEmojis,
  postMessage,
};
