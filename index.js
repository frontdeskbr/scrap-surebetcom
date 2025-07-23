import fetch from 'node-fetch';
import { chromium } from 'playwright';
import dotenv from 'dotenv';
dotenv.config();

const URL = 'https://pt.surebet.com/users/sign_in';
const EMAIL = 'contato.frontdesk@gmail.com';
const PASSWORD = 'Acesso@01';
const SUPABASE_URL = 'https://ssrdcsr...supabase.co/rest/v1/arbs';
const SUPABASE_API_KEY = 'ey...'; // Sua chave completa

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(URL);
  await page.fill('#user_email', EMAIL);
  await page.fill('#user_password', PASSWORD);
  await page.click('#sign-in-form-submit-button');
  await page.waitForNavigation();

  // Coleta link da primeira oportunidade visível
  const link = await page.getAttribute('.btn.btn-light.btn-sm.text-nowrap', 'href');
  const finalLink = link.startsWith('http') ? link : `https://pt.surebet.com${link}`;

  await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_API_KEY,
      Authorization: `Bearer ${SUPABASE_API_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify([{ link: finalLink }])
  });

  console.log('✅ Enviado:', finalLink);
  await browser.close();
})();
