import puppeteer from 'puppeteer';
import { DOWNLOAD_PATH } from './shared.js';



const doneScenarios: string[] = []
const errorScenarios: string[] = []


const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: {
    width: 1080,
    height: 1024
  }
});

const page = await browser.newPage();
const client = await page.createCDPSession()
await client.send('Page.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: DOWNLOAD_PATH,
})

// currently there are around 120 pages of results, so lets do 150 just to be sure
const EXPECTED_PAGES = 150;
for (let p = 22; p < EXPECTED_PAGES; p++) {
  console.log(`Processing page ${p} of ${EXPECTED_PAGES}`);
  await page.goto(`https://ccan.de/cgi-bin/ccan/ccan-view.pl?a=&ac=ty-ti-ni-tm-vo&nr=30&sc=vo&so=d&pg=${p}`)
  const rows = await page.$$("table tbody tr:not(:first-child)")



  for (const [index, row] of rows.entries()) {
    try {
      const name = await row.$eval("td:nth-child(2)", el => el.textContent)
      const href = await row.$eval("td:nth-child(3) a", el => el.href);
      const ACCEPTABLE_LINK_REGEX = /\.c4d$|\.zip$/;
      if (ACCEPTABLE_LINK_REGEX.test(href)) {
        console.log(`Downloading ${name} (row ${index + 1})`);
        try {
          await row.click();
          await new Promise((r) => setTimeout(r, 1000));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.log(`Error processing row ${index} (0 indexed)`);
      console.error(e);
    }
  }
}
await browser.close();

