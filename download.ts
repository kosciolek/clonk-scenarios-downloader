import puppeteer from "puppeteer";
import { DOWNLOAD_PATH } from "./shared.js";

const doneScenarios: string[] = [];
const errorScenarios: string[] = [];

// currently there are around 120 pages of results, so lets do 150 just to be sure
const EXPECTED_PAGES = 150;
let nextPage = 0;

const processRemainingPages = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1080,
      height: 1024,
    },
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: DOWNLOAD_PATH,
  });

  while (nextPage < EXPECTED_PAGES) {
    console.log(`Processing page ${nextPage} of ${EXPECTED_PAGES}`);
    await page.goto(
      `https://ccan.de/cgi-bin/ccan/ccan-view.pl?a=&ac=ty-ti-ni-tm-vo&nr=30&sc=vo&so=d&pg=${nextPage}`
    );
    const rows = await page.$$("table tbody tr:not(:first-child)");

    for (const [index, row] of rows.entries()) {
      const rowTextContent = (await row.evaluate((el) => el.textContent))!;
      if (
        // skip pagination rows
        rowTextContent.includes("Zeige Einträge") ||
        rowTextContent.includes("Spalte hinzufügen")
      ) {
        continue;
      }

      const thisScenarioId = `${nextPage}-${index}`;
      if (
        doneScenarios.includes(thisScenarioId) ||
        errorScenarios.includes(thisScenarioId)
      ) {
        console.log(
          `Skipping ${thisScenarioId} because it was already processed`
        );
        continue;
      }
      try {
        const name = await row.$eval("td:nth-child(2)", (el) => el.textContent);
        const link = await row.$("td:nth-child(3) a");
        const href = await link!.evaluate((el) => el.href);
        const ACCEPTABLE_LINK_REGEX = /\.c4d$|\.zip$/;
        if (ACCEPTABLE_LINK_REGEX.test(href)) {
          console.log(`Downloading ${name} (row ${index + 1})`);
          await link!.click();
          doneScenarios.push(thisScenarioId);
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (e) {
        console.log(`Error processing row ${index} (0 indexed)`);
        console.error(e);
        errorScenarios.push(thisScenarioId);
        // if an error occurs, restart the browser, and loop while skipping done/error rows
        await browser.close();
        return;
      }
    }

    nextPage++;
  }
  await browser.close();
};

while (nextPage < EXPECTED_PAGES) {
  await processRemainingPages();
}
