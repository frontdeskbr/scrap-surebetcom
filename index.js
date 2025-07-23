import { chromium } from 'playwright';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://ssrdcsrmifoexueivfls.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcmRjc3JtaWZvZXh1ZWl2ZmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTYzNTgsImV4cCI6MjA2ODM5MjM1OH0.m5Z0FKHB2Pow4zby3dvM-dM4Io9P9tTN4LQVfkCOCsw';
const TABLE = 'Arbs';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

console.log("▶️ Acessando login...");
await page.goto('https://pt.surebet.com/users/sign_in', { timeout: 60000 });

await page.fill('#user_email', 'desenvolvimento.frontdesk@gmail.com');
await page.fill('#user_password', 'Guaruja@01');

await page.waitForTimeout(800);
await Promise.all([
  page.waitForNavigation(),
  page.click('input[name="commit"]'),
]);

console.log("✅ Login efetuado. Acessando página principal...");
await page.goto('https://pt.surebet.com/surebets');

await page.waitForSelector('.surebet_record', { timeout: 30000 });
const oportunidades = await page.evaluate(() => {
  const oportunidades = [];

  document.querySelectorAll('.surebet_record').forEach((el) => {
    try {
      const lucro = el.querySelector('.profit')?.innerText.trim() || "";
      const tempo = el.querySelector('.age')?.innerText.trim() || "";

      const casas = el.querySelectorAll('.booker');
      const casa1 = casas[0]?.innerText.trim() || "";
      const casa2 = casas[1]?.innerText.trim() || "";

      const esportes = el.querySelectorAll('.event .minor');
      const esporte1 = esportes[0]?.innerText.trim() || "";
      const esporte2 = esportes[1]?.innerText.trim() || "";

      const dataHora = el.querySelector('.time abbr')?.innerText.trim().split('\n') || [];
      const data = dataHora[0]?.trim() || "";
      const hora = dataHora[1]?.trim() || "";

      const eventos = el.querySelectorAll('.event a');
      const evento1 = eventos[0]?.innerText.trim() || "";
      const evento2 = eventos[1]?.innerText.trim() || "";

      const descricoes = el.querySelectorAll('.event .minor');
      const descEv1 = descricoes[0]?.innerText.trim() || "";
      const descEv2 = descricoes[1]?.innerText.trim() || "";

      const mercados = el.querySelectorAll('.coeff abbr');
      const mercado1 = mercados[0]?.innerText.trim() || "";
      const mercado2 = mercados[1]?.innerText.trim() || "";

      const odds = el.querySelectorAll('.value_link');
      const odd1 = odds[0]?.innerText.trim() || "";
      const odd2 = odds[1]?.innerText.trim() || "";

      const linkCasa1 = "https://pt.surebet.com" + (odds[0]?.getAttribute("href") || "");
      const linkCasa2 = "https://pt.surebet.com" + (odds[1]?.getAttribute("href") || "");

      oportunidades.push({
        lucro, tempo, casa1, esporte1, casa2, esporte2,
        data, hora, evento1, descEv1, evento2, descEv2,
        mercado1, odd1, mercado2, odd2, linkCasa1, linkCasa2
      });
    } catch (e) {
      console.warn("❌ Erro ao processar:", e);
    }
  });

  return oportunidades;
});

console.log(`✅ Total extraído: ${oportunidades.length}`);

for (const o of oportunidades) {
  await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_API_KEY,
      'Authorization': `Bearer ${SUPABASE_API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(o)
  })
    .then(res => res.text())
    .then(txt => console.log("✅ Enviado:", o.evento1, o.lucro))
    .catch(err => console.error("❌ Erro ao enviar:", err));
}

await browser.close();
