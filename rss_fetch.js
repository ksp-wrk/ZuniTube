const fs = require("fs");
const { execSync } = require("child_process");

async function main() {
  try {
    if (!fs.existsSync("channels.json")) {
      throw new Error("channels.json not found");
    }

    const channels = JSON.parse(
      fs.readFileSync("channels.json", "utf8")
    );

    console.log(`Found ${channels.length} channels`);

    const queries = [];

    for (const channelId of channels) {
      try {
        console.log(`Checking ${channelId}`);

        const rssUrl =
          `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

        const response = await fetch(rssUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const xml = await response.text();

        const videoIds = [
          ...xml.matchAll(
            /<yt:videoId>(.*?)<\/yt:videoId>/g
          )
        ].map(x => x[1]);

        const titles = [
          ...xml.matchAll(
            /<title>(.*?)<\/title>/g
          )
        ]
          .map(x => x[1])
          .slice(1);

        console.log(
          `${videoIds.length} videos found`
        );

        for (let i = 0; i < videoIds.length; i++) {
          const id = videoIds[i];

          let title =
            titles[i] || "YouTube Video";

          title = title
            .replace(/'/g, "''")
            .replace(/\n/g, " ")
            .replace(/\r/g, " ");

          const url =
            `https://www.youtube.com/watch?v=${id}`;

          const thumb =
            `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

          queries.push(
            `INSERT OR IGNORE INTO videos (id,title,url,thumb)
             VALUES ('${id}','${title}','${url}','${thumb}');`
          );
        }
      } catch (err) {
        console.error(
          `Channel failed: ${channelId}`,
          err.message
        );
      }
    }

    if (queries.length === 0) {
      console.log("No videos found");
      return;
    }

    fs.writeFileSync(
      "bulk.sql",
      queries.join("\n")
    );

    console.log(
      `Executing ${queries.length} SQL queries`
    );

    execSync(
      "wrangler d1 execute zunitube-db --remote --file=bulk.sql",
      {
        stdio: "inherit"
      }
    );

    console.log("Done");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
