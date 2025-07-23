const fetch = require('node-fetch');
const { chromium } = require('playwright');
const dotenv = require('dotenv');
dotenv.config();

const URL = 'https://pt.surebet.com/users/sign_in';
const EMAIL = 'contato.frontdesk@gmail.com';
const PASSWORD = 'Acesso@01';
const SUPABASE_URL = 'https://ssrdcsrmifoxeueivfls.supabase.co/rest/v1/arbs';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // sua chave

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto(URL);
  await page.fill('#user_email', EMAIL);
  await page.fill('#user_password', PASSWORD);
  await page.click('#sign-in-form-submit-button');
  await page.waitForNavigation();

  // Aguardar carregar a lista de oportunidades
  await page.goto('https://pt.surebet.com/surebets');
  await page.waitForSelector('.table-surebet__row', { timeout: 20000 });

  const oportunidades = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.table-surebet__row'));
    return rows.map(row => {
      try {
        const lucro = row.querySelector('.profit')?.innerText.trim() || '';
        const tempo = row.querySelector('.time-ago')?.innerText.trim() || '';

        const casas = row.querySelectorAll('.bookmaker-name');
        const casa1 = casas[0]?.innerText.trim() || '';
        const casa2 = casas[1]?.innerText.trim() || '';

        const esportes = row.querySelectorAll('.event-sport');
        const esporte1 = esportes[0]?.innerText.trim() || '';
        const esporte2 = esportes[1]?.innerText.trim() || '';

        const data = row.querySelector('.date')?.innerText.trim() || '';
        const hora = row.querySelector('.time')?.innerText.trim() || '';

        const eventos = row.querySelectorAll('.event-name');
        const evento1 = eventos[0]?.innerText.trim() || '';
        const evento2 = eventos[1]?.innerText.trim() || '';

        const descricoes = row.querySelectorAll('.event-details');
        const descev1 = descricoes[0]?.innerText.trim() || '';
        const descev2 = descricoes[1]?.innerText.trim() || '';

        const mercados = row.querySelectorAll('.bet-name');
        const mercado1 = mercados[0]?.innerText.trim() || '';
        const mercado2 = mercados[1]?.innerText.trim() || '';

        const odds = row.querySelectorAll('.bet-odd');
        const odd1 = odds[0]?.innerText.trim() || '';
        const odd2 = odds[1]?.innerText.trim() || '';

        const links = row.querySelectorAll('.bet-link');
        const linkcasa1 = links[0]?.href || '';
        const linkcasa2 = links[1]?.href || '';

        return {
          lucro,
          tempo,
          casa1,
          esporte1,
          casa2,
          esporte2,
          data,
          hora,
          evento1,
          descev1,
          evento2,
          descev2,
          mercado1,
          odd1,
          mercado2,
          odd2,
          linkcasa1,
          linkcasa2
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  });

  // Enviar para Supabase
  for (const opp of oportunidades) {
    try {
      await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_API_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(opp)
      });
      console.log('✅ Enviado:', opp.evento1, opp.evento2);
    } catch (err) {
      console.error('❌ Erro ao enviar:', err);
    }
  }

  await browser.close();
})();
