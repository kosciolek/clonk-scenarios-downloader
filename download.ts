import puppeteer from 'puppeteer';
import { DOWNLOAD_PATH } from './shared.js';

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
for (let p = 0; p < EXPECTED_PAGES; p++) {
    console.log(`Processing page ${p} of ${EXPECTED_PAGES}`);
    await page.goto(`https://ccan.de/cgi-bin/ccan/ccan-view.pl?a=&ac=ty-ti-ni-tm-vo&nr=30&sc=vo&so=d&pg=${p}`)
    const links = await page.$$("table tbody tr:not(:first-child) td:nth-child(3) a")
    
      const ACCEPTABLE_LINK_REGEX = /\.c4d$|\.zip$/;

      for (const link of links) {
        const linkData = await link.evaluate(el => ({
            href: el.href,
            innerText: el.innerText
        }));
        
        if (ACCEPTABLE_LINK_REGEX.test(linkData.href)) {
          await link.click();
          console.log(`Downloading ${linkData.innerText}`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
}
await browser.close();

