const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const template = ({
  now,
  pubDate
}) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
 <title>HubSpot New Emojis</title>
 <description>Kevin Johnson's HubSpot New Emojis RSS feed</description>
 <link>https://hubspot.slack.com/customize/emoji</link>
 <lastBuildDate>${now.toUTCString()}</lastBuildDate>
 <pubDate>${pubDate.toUTCString()}</pubDate>
 <ttl>10</ttl>

 <item>
 <title>
   Test Item
 </title>
 <description>Test Description</description>
 <link>${"https://hubspot.slack.com/customize/emoji"}</link>
 <pubDate>${pubDate.toUTCString()}</pubDate>
</item>

</channel>
</rss>`;

/*

 ${popups
   .map(
     popup => `
 <item>
 <title>
   ${dow} at Davenport: ${popup.name}
 </title>
 <description></description>
 <link>${popup.link || "https://fooda.com/my"}</link>
 <pubDate>${pubDate.toUTCString()}</pubDate>
</item>
 `
   )
   .join("\n")}
*/

const buildRss = (now) => {
  const pubDate = new Date(now);
  pubDate.setMinutes(0);
  pubDate.setHours(6);
  pubDate.setSeconds(0);
  pubDate.setMilliseconds(0);

  return template({ pubDate, now });
};

module.exports = {
  buildRss
};
