import crypto from "crypto";
import { AwsApiGatewayEvent, AwsCronEvent, AwsEvent } from "../types";
import { processEvent } from "./slack";
import { update } from "../service/update";
import { error } from "../util/error";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

async function handleCronEvent(__event: AwsCronEvent) {
  await update();
}

async function handleSlackWebhook(event: AwsApiGatewayEvent) {
  const slackRequestTimestamp = event.headers["X-Slack-Request-Timestamp"]!;
  const slackSignature = event.headers["X-Slack-Signature"]!;
  const requestAge =
    new Date().getTime() - parseInt(slackRequestTimestamp, 10) * 1000;

  // Check for replay attacks
  if (requestAge > FIVE_MINUTES_IN_MS) {
    return error("Request timestamp is too far in the past");
  }

  const sigBaseString = ["v0", slackRequestTimestamp, event.body].join(":");
  const expected = `v0=${crypto
    .createHmac("sha256", process.env["SLACK_SIGNING_SECRET"]!)
    .update(sigBaseString, "utf-8")
    .digest("hex")}`;

  // Validate signature
  if (
    !crypto.timingSafeEqual(
      Buffer.from(expected, "utf-8"),
      Buffer.from(slackSignature, "utf-8")
    )
  ) {
    return error("Slack webhook signature validation failed");
  }

  // The event is trusted!
  const webhookPayload = JSON.parse(event.body);

  switch (webhookPayload.type) {
    case "url_verification": {
      return webhookPayload.challenge;
    }
    case "event_callback": {
      const event = webhookPayload.event;

      return await processEvent(event);
    }
    default: {
      return error(
        `Unexpected slack webhookPayload.type: ${webhookPayload.type}`
      );
    }
  }
}

// aws event
export async function main(event: AwsEvent) {
  if ("detail-type" in event) {
    return await handleCronEvent(event);
  }

  const slackRequestTimestamp = event.headers["X-Slack-Request-Timestamp"];
  const slackSignature = event.headers["X-Slack-Signature"];
  const slackRetry = event.headers["X-Slack-Retry-Num"];

  if (slackRetry) {
    // Relax, we're probably still handling it earlier don't rush us and definitely don't call us again
    return { ok: true };
  }

  if (slackRequestTimestamp && slackSignature) {
    return await handleSlackWebhook(event);
  }

  return error("Unrecognized AwsEvent type");
}
