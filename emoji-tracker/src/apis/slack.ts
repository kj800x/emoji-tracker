import { WebClient } from "@slack/web-api";

// Read a token from the environment variables
const token = process.env["SLACK_OAUTH"]!;

// Initialize
const web = new WebClient(token);

export async function fetchEmojis() {
  const emojis = await web.emoji.list();

  return Object.keys(emojis.emoji!);
}

export async function postMessage(channel: string, text: string) {
  console.log({ event: "postMessage", channel, text });

  return await web.chat.postMessage({ channel, text });
}
