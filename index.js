import { chromium } from 'playwright';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function start() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Login
  await page.goto('https://pt.surebet.com/users/sign_in');
  await page.fill('#user_email', process.env.SUREBET_EMAIL);
  await page.fill('#user_password', process.env.SUREBET_PASSWORD);
  await page.click('#sign-in-form-submit-button');
  await page.waitForNavigation();

  // Acessa a lista de surebets
  await page.goto('https://pt.surebet.com/surebets');
  await page.waitForSelector('.surebet');

  // Extrai os dados
  const resultados = await page.evaluate(() => {
    const linhas = [];
    document.querySelectorAll('.surebet').forEach(b => {
      try {
        const lucro = b.querySelector('.-profit')?.innerText.trim() || "";
        const tempo = b.querySelector('.text-muted.small')?.innerText.trim() || "";

        const casas = b.querySelectorAll('.-bookmaker');
        const casa1 = casas[0]?.innerText.trim() || "";
        const casa2 = casas[1]?.innerText.trim() || "";

        const esportes = b.querySelectorAll('.-sport');
        const esporte1 = esportes[0]?.innerText.trim() || "";
        const esporte2 = esportes[1]?.innerText.trim() || "";

        const eventos = b.querySelectorAll('.-name');
        const evento1 = eventos[0]?.innerText.trim() || "";
        const evento2 = eventos[1]?.innerText.trim() || "";

        const descricoes = b.querySelectorAll('.event-details');
        const descEv1 = descricoes[0]?.innerText.trim() || "";
        const descEv2 = descricoes[1]?.innerText.trim() || "";

        const mercados = b.querySelectorAll('.-bet-type');
        const mercado1 = mercados[0]?.innerText.trim() || "";
        const mercado2 = mercados[1]?.innerText.trim() || "";

        const odds = b.querySelectorAll('.-odd');
        const odd1 = odds[0]?.innerText.trim() || "";
        const odd2 = odds[1]?.innerText.trim() || "";

        const links = b.querySelectorAll('.-btn-bet');
        const link1 = links[0]?.href || "";
        const link2 = links[1]?.href || "";

        linhas.push({
          lucro, tempo,
          casa1, esporte1,
          casa2, esporte2,
          evento1, descEv1,
          evento2, descEv2,
          mercado1, odd1,
          mercado2, odd2,
          link1, link2
        });
      } catch (err) {
        console.warn("Erro ao processar linha:", err);
      }
    });
    return linhas;
  });

  console.log(`✅ Total extraído: ${resultados.length}`);

  // Envia pro Supabase
  for (const dado of resultados) {
    await fetch(`${SUPABASE_URL}/rest/v1/Surebet`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify(dado)
    });
  }

  console.log("✅ Enviado ao Supabase com sucesso.");
  await browser.close();
}

start();
