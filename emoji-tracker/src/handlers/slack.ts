import { postMessage } from "../apis/slack";
import {
  getSubscriptions,
  addSubscription,
  removeSubscription,
} from "../service/subscriptions";
import { update } from "../service/update";
import { AppMentionEvent } from "../types";
import { error } from "../util/error";

const HELP_TEXT = `

Mention me in a message like '<@${process.env["SLACK_APP_ID"]}> command'. The valid options for \`command\` are:

* subscribe: add the current channel to the channels getting emoji updates
* unsubscribe: remove the current channel from the channels getting emoji updates
* list: list all the channels currently getting updates
* help: print this help text

`.trim();

export async function processEvent(event: AppMentionEvent) {
  switch (event.type) {
    case "app_mention": {
      const { text, channel, user } = event;

      async function reply(text: string) {
        await postMessage(channel, `<@${user}> ${text}`);
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
        case "test":
          await update(true);
          break;
        case "list":
          const subscriptions = await getSubscriptions();
          if (subscriptions.length === 0) {
            await reply("There are no channels getting emoji updates");
            break;
          }
          await reply(
            `These are the channels currently getting emoji updates:\n${subscriptions
              .map((s) => `* <@${s}>`)
              .join("\n")}`
          );
          break;
        case "subscribe":
          await addSubscription(channel);
          await reply(`Done, <@${channel}> will now get daily emoji updates`);
          break;
        case "unsubscribe":
          await removeSubscription(channel);
          await reply(
            `Done, <@${channel}> will no longer get daily emoji updates`
          );
          break;
        default:
          await reply(
            `Sorry, I didn't recognize that command. Try '<@${process.env["SLACK_APP_ID"]}> help' for usage instructions`
          );
          break;
      }

      return { status: "handled" };
    }
    default: {
      return error(`Unknown Slack event type: ${event.type}`);
    }
  }
}
