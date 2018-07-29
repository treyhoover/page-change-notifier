const fs = require("fs");
const {
  URL,
  INTERVAL,
  HTML_PATH,
  SLACK_TOKEN,
  SLACK_CONVERSATION_ID
} = require("dotenv").config().parsed;
const sleep = require("sleep-promise");
const axios = require("axios");
const { RTMClient } = require("@slack/client");
const nodeCleanup = require("node-cleanup");

const slack = new RTMClient(SLACK_TOKEN);
slack.start();

const notifyGeneral = msg =>
  slack.sendMessage(`<!channel>: ${msg}`, SLACK_CONVERSATION_ID);

nodeCleanup((exitCode, signal) => {
  notifyGeneral("Shutting down!").catch(console.error);
});

// Main loop
async function main() {
  await notifyGeneral("Starting up!");

  // Initialize baseline html file if it doesn't exist
  if (!fs.existsSync(HTML_PATH)) {
    console.log("Fetching baseline html");

    const { data: html } = await axios.get(URL);

    fs.writeFileSync(HTML_PATH, html);
  }

  const prevHtml = fs.readFileSync(HTML_PATH, "utf-8");

  try {
    while (true) {
      await sleep(parseInt(INTERVAL, 10));

      console.log("Checking...");

      const { data: html } = await axios.get(URL);

      if (html !== prevHtml) {
        // updating base html
        fs.writeFileSync(HTML_PATH, html);

        const msg = await notifyGeneral(`The page has changed! (${URL})`);

        console.log("Notification sent", msg.ts);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

main();
