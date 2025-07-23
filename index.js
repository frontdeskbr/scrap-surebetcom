import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// Supabase config
const supabaseUrl = 'https://ssrdcsrmifoexueivfls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcmRjc3JtaWZvZXh1ZWl2ZmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MTYzNTgsImV4cCI6MjA2ODM5MjM1OH0.m5Z0FKHB2Pow4zby3dvM-dM4Io9P9tTN4LQVfkCOCsw';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  console.log('▶️ Iniciando navegador...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('▶️ Acessando login...');
    await page.goto('https://www.betburger.com/br/users/sign_in', { waitUntil: 'load' });

    await page.fill('#betburger_user_email', 'contato.frontdesk@gmail.com');
    await page.fill('#betburger_user_password', 'Guaruja@01');
    await page.waitForTimeout(3000); // aguarda o recaptcha automático preencher
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'load', timeout: 60000 });

    console.log('✅ Logado. Indo para a página de arbitragens...');
    await page.goto('https://www.betburger.com/arbs', { waitUntil: 'load' });
    await page.waitForTimeout(5000);

    console.log('🔍 Extraindo arbitragens...');
    const arbs = await page.$$eval('.arbs-table-row', rows =>
      rows.map(row => row.innerText.trim())
    );

    if (arbs.length === 0) {
      console.log('⚠️ Nenhuma arbitragem encontrada.');
    } else {
      const payload = arbs.map(text => ({ raw_text: text }));
      await supabase.from('Arbs').insert(payload, { returning: 'minimal' });
      console.log(`✅ ${payload.length} arbitragens enviadas ao Supabase.`);
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  } finally {
    await browser.close();
  }
})();
