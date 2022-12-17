const template = ({
  now,
  pubDate,
  newEmojis,
  totalCount,
  previousUpdateTime,
}) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
 <title>New ${process.env.SLACK_WORKSPACE} Emojis</title>
 <description>Coolkev's ${
   process.env.SLACK_WORKSPACE
 } "New Emojis" RSS feed</description>
 <link>https://${process.env.SLACK_WORKSPACE}.slack.com/customize/emoji</link>
 <lastBuildDate>${now.toUTCString()}</lastBuildDate>
 <pubDate>${pubDate.toUTCString()}</pubDate>
 <ttl>60</ttl>

  <item>
  <title>
    New emojis since ${previousUpdateTime.toLocaleString("en-US", {
      timeZone: "America/New_York",
    })}
  </title>
  <description>${newEmojis.map((emoji) => `:${emoji}:`).join(" ")}

  ${totalCount} total emojis</description>
  <link>https://${process.env.SLACK_WORKSPACE}.slack.com/customize/emoji</link>
  <pubDate>${pubDate.toUTCString()}</pubDate>
  </item>

</channel>
</rss>`;

const verboseTemplate = ({
  now,
  pubDate,
  newEmojis,
  totalCount,
  previousUpdateTime,
}) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
 <title>New ${process.env.SLACK_WORKSPACE} Emojis</title>
 <description>Coolkev's ${
   process.env.SLACK_WORKSPACE
 } "New Emojis" RSS feed</description>
 <link>https://${process.env.SLACK_WORKSPACE}.slack.com/customize/emoji</link>
 <lastBuildDate>${now.toUTCString()}</lastBuildDate>
 <pubDate>${pubDate.toUTCString()}</pubDate>
 <ttl>60</ttl>

  <item>
  <title>
    New emojis since ${previousUpdateTime.toLocaleString("en-US", {
      timeZone: "America/New_York",
    })}
  </title>
  <description>${newEmojis
    .map((emoji) => `\`${emoji}\`: :${emoji}:`)
    .join("\n")}

  ${totalCount} total emojis</description>
  <link>https://${process.env.SLACK_WORKSPACE}.slack.com/customize/emoji</link>
  <pubDate>${pubDate.toUTCString()}</pubDate>
  </item>

</channel>
</rss>`;

const buildRss = (now, newEmojis, previousUpdateTime, totalCount) => {
  const pubDate = new Date(now);
  // pubDate.setHours(7);
  // pubDate.setMinutes(0);
  pubDate.setSeconds(0);
  pubDate.setMilliseconds(0);

  return template({ pubDate, now, newEmojis, previousUpdateTime, totalCount });
};

const buildRssVerbose = (now, newEmojis, previousUpdateTime, totalCount) => {
  const pubDate = new Date(now);
  // pubDate.setHours(7);
  // pubDate.setMinutes(0);
  pubDate.setSeconds(0);
  pubDate.setMilliseconds(0);

  return verboseTemplate({
    pubDate,
    now,
    newEmojis,
    previousUpdateTime,
    totalCount,
  });
};

module.exports = {
  buildRss,
  buildRssVerbose,
};
