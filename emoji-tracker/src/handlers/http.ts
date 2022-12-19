import crypto from "crypto";
import { AwsApiGatewayEvent } from "../types";
import { processEvent } from "./slackHandler";
import { update } from "../service/update";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

// aws event
export async function main(event: AwsApiGatewayEvent) {
  if (event && "httpMethod" in event && event.httpMethod === "GET") {
    return { hi: "hows it goin" };
  }

  if (event) {
    console.log(JSON.stringify(event));

    const slackRequestTimestamp = event.headers["X-Slack-Request-Timestamp"]!;
    const slackSignature = event.headers["X-Slack-Signature"]!;

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
      .createHmac("sha256", process.env["SLACK_SIGNING_SECRET"]!)
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
      case "event_callback": {
        const event = webhookPayload.event;

        return await processEvent(event);
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
