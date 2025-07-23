import { chromium } from 'playwright';
import fetch from 'node-fetch';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log("▶️ Acessando Surebet...");
await page.goto("https://pt.surebet.com/surebets");

await page.waitForSelector(".table.table-bordered tbody tr", { timeout: 20000 });

const oportunidades = await page.$$eval(".table.table-bordered tbody tr", linhas => {
  return linhas.slice(0, 2).map(linha => {
    const cols = linha.querySelectorAll("td");
    return {
      lucro: cols[0]?.innerText.trim(),
      tempo: cols[0]?.querySelector("small")?.innerText.trim(),
      casa1: cols[1]?.innerText.split("\n")[0]?.trim(),
      esporte1: cols[1]?.innerText.split("\n")[1]?.trim(),
      casa2: cols[1]?.innerText.split("\n")[2]?.trim(),
      esporte2: cols[1]?.innerText.split("\n")[3]?.trim(),
      data: cols[2]?.innerText.split("\n")[0]?.trim(),
      hora: cols[2]?.innerText.split("\n")[1]?.trim(),
      evento1: cols[2]?.querySelectorAll("a")[0]?.innerText.trim(),
      descEv1: cols[2]?.querySelectorAll("small")[0]?.innerText.trim(),
      evento2: cols[2]?.querySelectorAll("a")[1]?.innerText.trim(),
      descEv2: cols[2]?.querySelectorAll("small")[1]?.innerText.trim(),
      mercado1: cols[3]?.innerText.split("\n")[0]?.trim(),
      odd1: cols[4]?.innerText.trim(),
      mercado2: cols[3]?.innerText.split("\n")[1]?.trim(),
      odd2: cols[5]?.innerText.trim(),
      linkCasa1: cols[2]?.querySelectorAll("a")[0]?.href || "",
      linkCasa2: cols[2]?.querySelectorAll("a")[1]?.href || ""
    };
  });
});

console.log("🎯 Resultados:", oportunidades.length);

// Enviar para Supabase
for (const item of oportunidades) {
  try {
    await fetch("https://ssrdcsrmifoexueivfls.supabase.co/rest/v1/arbs", {
      method: "POST",
      headers: {
        apikey: "SUA_API_KEY",
        Authorization: "Bearer SUA_API_KEY",
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify(item)
    });
    console.log("✅ Enviado:", item.evento1, item.casa1, item.odd1);
  } catch (err) {
    console.error("❌ Falha:", err.message);
  }
}

await browser.close();
