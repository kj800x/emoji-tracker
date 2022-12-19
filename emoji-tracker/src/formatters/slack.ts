export function buildSlackPost(
  __now: Date,
  newEmojis: string[],
  previousUpdateTime: Date,
  totalCount: number
) {
  return `New emojis since ${previousUpdateTime.toLocaleString("en-US", {
    timeZone: "America/New_York",
  })} US Eastern

${newEmojis.map((emoji) => `:${emoji}: \`${emoji}\``).join("\n")}

${totalCount} total emojis`.trim();
}
