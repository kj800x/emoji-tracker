export function buildSlackPost(
  __now: Date,
  newEmojis: string[],
  previousUpdateTime: Date,
  totalCount: number
) {
  return `New emojis since ${previousUpdateTime.toLocaleString("en-US", {
    timeZone: "America/New_York",
  })}

${newEmojis.map((emoji) => `\`${emoji}\`: :${emoji}:`).join(" ")}

${totalCount} total emojis`.trim();
}
