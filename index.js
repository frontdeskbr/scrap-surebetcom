import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config();

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("▶️ Acessando pt.surebet.com...");
  await page.goto("https://pt.surebet.com");

  await page.click('a[href="/users/sign_in"]');
  await page.waitForSelector('#user_email');

  await page.fill('#user_email', EMAIL);
  await page.fill('#user_password', PASSWORD);

  await Promise.all([
    page.waitForNavigation({ url: '**/surebets**', timeout: 10000 }),
    page.click('#sign-in-form-submit-button')
  ]);

  const title = await page.title();
  console.log("✅ Login realizado com sucesso:", title);

  await browser.close();
})();
