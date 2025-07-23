import fetch from 'node-fetch';

import { chromium } from 'playwright';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const URL = 'https://pt.surebet.com/users/sign_in';
const EMAIL = 'contato.frontdesk@gmail.com';
const PASSWORD = 'Acesso@01';
const SUPABASE_URL = 'https://ssrdcsrmifoexueivfls.supabase.co/rest/v1/arbs';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto(URL);
  await page.fill('#user_email', EMAIL);
  await page.fill('#user_password', PASSWORD);
  await page.click('#sign-in-form-submit-button');
  await page.waitForURL('https://pt.surebet.com/surebets');

  // Aguardar tabela carregar
  await page.waitForSelector('tr', { timeout: 20000 });

  const resultados = await page.evaluate(() => {
    const linhas = Array.from(document.querySelectorAll('tr'));
    const dados = [];

    for (const el of linhas) {
      try {
        const lucro = el.querySelector('.-profit')?.innerText.trim() || "";
        const tempo = el.querySelector('.text-muted.small')?.innerText.trim() || "";

        const casas = el.querySelectorAll('.-bookmaker a');
        const casa1 = casas[0]?.innerText.trim() || "";
        const casa2 = casas[1]?.innerText.trim() || "";

        const esportes = el.querySelectorAll('.-bookmaker .minor');
        const esporte1 = esportes[0]?.innerText.trim() || "";
        const esporte2 = esportes[1]?.innerText.trim() || "";

        const datahora = el.querySelector('abbr')?.getAttribute('title')?.trim().split(', ') || ["", ""];
        const data = datahora[0] || "";
        const hora = datahora[1] || "";

        const eventos = el.querySelectorAll('td:nth-child(3)');
        const evento1 = eventos[0]?.querySelectorAll('div')[0]?.innerText.trim() || "";
        const evento2 = eventos[0]?.querySelectorAll('div')[2]?.innerText.trim() || "";

        const descricoes = el.querySelectorAll('td:nth-child(3) .minor');
        const descev1 = descricoes[0]?.innerText.trim() || "";
        const descev2 = descricoes[1]?.innerText.trim() || "";

        const mercados = el.querySelectorAll('td:nth-child(5) .minor');
        const mercado1 = mercados[0]?.innerText.trim() || "";
        const mercado2 = mercados[1]?.innerText.trim() || "";

        const odds = el.querySelectorAll('.value_link');
        const odd1 = odds[0]?.innerText.trim() || "";
        const odd2 = odds[1]?.innerText.trim() || "";

        const linkcasa1 = odds[0]?.getAttribute('href') || "";
        const linkcasa2 = odds[1]?.getAttribute('href') || "";

        if (lucro && odd1 && odd2) {
          dados.push({
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
          });
        }
      } catch (e) {
        console.warn("Erro ao processar linha:", e);
      }
    }

    return dados;
  });

  // Enviar para Supabase
  for (const item of resultados) {
    await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(item)
    }).then(res => res.text())
      .then(console.log)
      .catch(console.error);
  }

  await browser.close();
})();
