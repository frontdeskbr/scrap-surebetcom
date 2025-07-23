// index.js

const { chromium } = require('playwright');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ssrdcsrmifoexueivfls.supabase.co/rest/v1/Arbs';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcmRjc3JtaWZvZXh1ZWl2ZmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTYzNTgsImV4cCI6MjA2ODM5MjM1OH0.m5Z0FKHB2Pow4zby3dvM-dM4Io9P9tTN4LQVfkCOCsw';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("▶️ Acessando login...");
  await page.goto('https://www.betburger.com/users/sign_in');

  await page.fill('#betburger_user_email', 'contato.frontdesk@gmail.com');
  await page.fill('#betburger_user_password', 'Guaruja@01');
  await page.click('form#new_session button[type=submit]');

  await page.waitForNavigation();
  console.log("✅ Login feito.");

  console.log("▶️ Acessando página de arbitragens...");
  await page.goto('https://www.betburger.com/arbs');

  await page.waitForSelector('.wrapper.arb.has-2-bets', { timeout: 60000 });
  console.log("✅ Página carregada.");

  const oportunidades = await page.evaluate(() => {
    const linhas = [];

    document.querySelectorAll('.wrapper.arb.has-2-bets').forEach((bloco) => {
      try {
        const lucro = bloco.querySelector('.percent')?.innerText.trim() || "";
        const tempo = bloco.querySelector('.updated-at')?.innerText.trim() || "";
        const esporte = bloco.querySelector('.sport-name')?.innerText.trim() || "";

        const casas = bloco.querySelectorAll('.bookmaker-name.wrapper a');
        const casa1 = casas[0]?.innerText.trim() || "";
        const casa2 = casas[1]?.innerText.trim() || "";

        const datas = bloco.querySelectorAll('.date');
        const data = datas[0]?.innerText.trim() || "";
        const hora = datas[1]?.innerText.trim() || "";

        const eventos = bloco.querySelectorAll('.event-name .name a');
        const evento1 = eventos[0]?.innerText.trim() || "";
        const evento2 = eventos[1]?.innerText.trim() || "";

        const descricoes = bloco.querySelectorAll('.event-name .league');
        const descev1 = descricoes[0]?.innerText.trim() || "";
        const descev2 = descricoes[1]?.innerText.trim() || "";

        const mercados = bloco.querySelectorAll('.market a span');
        const mercado1 = mercados[0]?.innerText.trim() || "";
        const mercado2 = mercados[1]?.innerText.trim() || "";

        const odds = bloco.querySelectorAll('.coefficient-link');
        const odd1 = odds[0]?.innerText.trim() || "";
        const odd2 = odds[1]?.innerText.trim() || "";

        const link1 = odds[0]?.href || "";
        const link2 = odds[1]?.href || "";

        linhas.push({
          lucro, tempo, casa1, esporte1: esporte, casa2, esporte2: esporte,
          data, hora, evento1, descev1, evento2, descev2,
          mercado1, odd1, mercado2, odd2, linkcasa1: link1, linkcasa2: link2
        });
      } catch (e) {
        console.warn("❌ Erro bloco:", e);
      }
    });

    return linhas;
  });

  console.log(`✅ Total extraído: ${oportunidades.length}`);

  for (const dado of oportunidades) {
    try {
      await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(dado)
      });
      console.log("⬆️ Enviado:", dado.evento1);
    } catch (err) {
      console.error("❌ Falha ao enviar:", err);
    }
  }

  await browser.close();
})();
