import { getStore } from '@netlify/blobs';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = process.env.URL || 'https://nesco-meter.netlify.app';

async function fetchNesco(meter) {
  const res = await fetch(`${SITE_URL}/api/nesco?meter=${meter}`);
  return res.json();
}

// --- Storage ---
async function getUser(chatId) {
  try {
    const store = getStore('telegram-users');
    const data = await store.get(String(chatId), { type: 'json' });
    return data || { meters: [], primary: null };
  } catch { return { meters: [], primary: null }; }
}

async function saveUser(chatId, userData) {
  const store = getStore('telegram-users');
  await store.setJSON(String(chatId), userData);
}

// --- Formatting ---
function formatFull(data) {
  const { customerInfo: c, rechargeHistory, monthlyUsage } = data;
  const last = rechargeHistory?.[0];
  const latest = monthlyUsage?.[0];
  const prev = monthlyUsage?.[1];

  const balance = c?.balance ? parseFloat(c.balance) : latest?.endBalance || 0;
  const rate = latest && latest.usedKwh > 0 ? (latest.usedElectricity / latest.usedKwh).toFixed(2) : '?';
  const totalRecharged = rechargeHistory.reduce((s, r) => s + r.rechargeAmount, 0);
  const successCount = rechargeHistory.filter(r => r.status === 'Success').length;
  const kwhChange = prev && prev.usedKwh > 0
    ? ((latest.usedKwh - prev.usedKwh) / prev.usedKwh * 100).toFixed(0)
    : null;

  let msg = `⚡ *NESCO Prepaid Meter*\n━━━━━━━━━━━━━━━━━━━\n\n`;

  // Customer info
  if (c?.name) msg += `👤 *${c.name}*\n`;
  if (c?.address) msg += `📍 ${c.address}\n`;
  if (c?.consumerNo) msg += `📋 Consumer: \`${c.consumerNo}\`\n`;
  if (c?.meterNo) msg += `🔢 Meter: \`${c.meterNo}\`\n`;
  if (c?.tariff) msg += `📄 Tariff: ${c.tariff} | Load: ${c.approvedLoad || '?'} kW\n`;
  if (c?.meterType) msg += `⚙️ ${c.meterType} — ${c.meterStatus || 'Active'}\n`;
  if (c?.office) msg += `🏢 ${c.office} | ${c.feeder || ''}\n`;

  msg += `\n💰 *Balance: ৳${balance.toFixed(2)}*\n`;

  // Last recharge with full details
  if (last) {
    const isAuto = last.status === 'Success';
    msg += `\n📱 *Last Recharge*\n`;
    msg += `├ Amount: *৳${last.rechargeAmount}*\n`;
    msg += `├ Electricity: ৳${last.electricity.toFixed(0)} (${last.probableKwh} kWh)\n`;
    msg += `├ VAT: ৳${last.vat.toFixed(0)}`;
    if (last.demandCharge > 0) msg += ` | Demand: ৳${last.demandCharge}`;
    if (last.meterRent > 0) msg += ` | Rent: ৳${last.meterRent}`;
    msg += `\n`;
    if (last.rebate < 0) msg += `├ Rebate: ৳${Math.abs(last.rebate).toFixed(2)}\n`;
    msg += `├ Via: ${last.medium} | ${last.date}\n`;
    msg += `├ Remote: ${isAuto ? '✅ Auto-applied' : '⚠️ Failed — enter PIN manually'}\n`;
    if (!isAuto) {
      msg += `└ 🔑 PIN: \`${last.tokenNo.replace(/\s/g, '')}\`\n`;
    } else {
      msg += `└ Token: \`${last.tokenNo}\`\n`;
    }
  }

  // Current month usage
  if (latest) {
    msg += `\n📊 *${latest.month} ${latest.year}*\n`;
    msg += `├ Recharged: ৳${latest.totalRecharge.toLocaleString()}\n`;
    msg += `├ Electricity: ৳${latest.usedElectricity.toFixed(0)}\n`;
    msg += `├ Used: *${latest.usedKwh} kWh*`;
    if (kwhChange !== null) msg += ` (${kwhChange > 0 ? '↑' : '↓'}${Math.abs(kwhChange)}%)`;
    msg += `\n`;
    msg += `├ Rate: ৳${rate}/kWh\n`;
    msg += `├ VAT: ৳${latest.vat.toFixed(0)} | Demand: ৳${latest.demandCharge}\n`;
    msg += `└ End Balance: ৳${latest.endBalance.toFixed(2)}\n`;
  }

  // Monthly summary
  if (monthlyUsage?.length > 1) {
    msg += `\n📈 *Last ${Math.min(monthlyUsage.length, 6)} Months*\n`;
    monthlyUsage.slice(0, 6).forEach((m, i) => {
      const prefix = i === monthlyUsage.slice(0, 6).length - 1 ? '└' : '├';
      msg += `${prefix} ${m.month.slice(0, 3)} ${m.year}: ৳${m.totalRecharge.toLocaleString()} | ${m.usedKwh} kWh\n`;
    });
  }

  // Stats
  msg += `\n📉 *Stats*\n`;
  msg += `├ Total recharged: ৳${totalRecharged.toLocaleString()}\n`;
  msg += `├ Remote success: ${successCount}/${rechargeHistory.length} (${(successCount/rechargeHistory.length*100).toFixed(0)}%)\n`;
  msg += `└ Min recharge: ৳${c?.minRecharge || '?'}\n`;

  msg += `\n🌐 [View Dashboard](${SITE_URL})`;

  return msg;
}

function formatBalance(data) {
  const c = data.customerInfo;
  const last = data.rechargeHistory?.[0];
  const balance = c?.balance ? parseFloat(c.balance) : 0;
  const isAuto = last?.status === 'Success';

  let msg = `💰 *৳${balance.toFixed(2)}*\n`;
  if (last) {
    msg += `Last: ৳${last.rechargeAmount} on ${last.date}\n`;
    msg += `Remote: ${isAuto ? '✅ Auto-applied' : '⚠️ Enter PIN'}`;
    if (!isAuto) msg += `\n🔑 \`${last.tokenNo.replace(/\s/g, '')}\``;
  }
  return msg;
}

function formatToken(data) {
  const last = data.rechargeHistory?.[0];
  if (!last) return '❌ No recharge found.';
  const isAuto = last.status === 'Success';
  let msg = `🔑 *Last Token*\n\n`;
  msg += `\`${last.tokenNo.replace(/\s/g, '')}\`\n\n`;
  msg += `Amount: ৳${last.rechargeAmount} | ${last.date}\n`;
  msg += isAuto ? '✅ Already auto-applied to meter' : '⚠️ Not auto-applied — enter this PIN in your meter';
  return msg;
}

async function send(chatId, text, extra = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true, ...extra }),
  });
}

export default async (req) => {
  if (!BOT_TOKEN) return new Response('Bot not configured', { status: 200 });

  try {
    const body = await req.json();
    const message = body.message || body.edited_message;
    if (!message?.text) return new Response('ok', { status: 200 });

    const chatId = message.chat.id;
    const text = message.text.trim();
    const cmd = text.split(' ')[0].toLowerCase();
    const arg = text.split(' ').slice(1).join(' ').trim();

    const user = await getUser(chatId);

    // --- Commands ---
    if (cmd === '/start') {
      let msg = `⚡ *NESCO Meter Bot*\n\nSend a meter number (8-11 digits) to get full details.\n\n`;
      msg += `*Commands:*\n`;
      msg += `/check \`meter\` — Full meter report\n`;
      msg += `/balance — Quick balance check\n`;
      msg += `/token — Last recharge token/PIN\n`;
      msg += `/save \`meter\` — Save a meter\n`;
      msg += `/primary \`meter\` — Set primary meter\n`;
      msg += `/meters — List saved meters\n`;
      msg += `/remove \`meter\` — Remove saved meter\n`;
      msg += `/help — Show this help\n`;
      if (user.primary) msg += `\nYour primary meter: \`${user.primary}\`\nJust type /balance or /token for quick checks!`;
      await send(chatId, msg);
      return new Response('ok', { status: 200 });
    }

    if (cmd === '/help') {
      return await handleCommand(chatId, '/start', '', user);
    }

    if (cmd === '/save') {
      const meter = arg.replace(/\D/g, '');
      if (meter.length < 8 || meter.length > 11) {
        await send(chatId, '❌ Usage: /save `82044144`');
        return new Response('ok', { status: 200 });
      }
      if (!user.meters.includes(meter)) user.meters.push(meter);
      if (!user.primary) user.primary = meter;
      await saveUser(chatId, user);
      await send(chatId, `✅ Meter \`${meter}\` saved!${user.primary === meter ? ' (primary)' : ''}\n\nYou have ${user.meters.length} saved meter(s).`);
      return new Response('ok', { status: 200 });
    }

    if (cmd === '/primary') {
      const meter = arg.replace(/\D/g, '') || user.primary;
      if (!meter || !user.meters.includes(meter)) {
        await send(chatId, '❌ Save the meter first with /save `meter`');
        return new Response('ok', { status: 200 });
      }
      user.primary = meter;
      await saveUser(chatId, user);
      await send(chatId, `⭐ Primary meter set to \`${meter}\``);
      return new Response('ok', { status: 200 });
    }

    if (cmd === '/meters') {
      if (user.meters.length === 0) {
        await send(chatId, '📋 No saved meters.\n\nSend a meter number or use /save `meter`');
        return new Response('ok', { status: 200 });
      }
      let msg = `📋 *Saved Meters (${user.meters.length})*\n\n`;
      user.meters.forEach((m, i) => {
        msg += `${i + 1}. \`${m}\`${m === user.primary ? ' ⭐ primary' : ''}\n`;
      });
      msg += `\nTap any meter number to check it, or use /primary \`meter\` to change primary.`;
      await send(chatId, msg);
      return new Response('ok', { status: 200 });
    }

    if (cmd === '/remove') {
      const meter = arg.replace(/\D/g, '');
      user.meters = user.meters.filter(m => m !== meter);
      if (user.primary === meter) user.primary = user.meters[0] || null;
      await saveUser(chatId, user);
      await send(chatId, `🗑️ Meter \`${meter}\` removed.`);
      return new Response('ok', { status: 200 });
    }

    // Quick commands that use primary meter
    if (cmd === '/balance' || cmd === '/token' || cmd === '/check') {
      const meter = arg.replace(/\D/g, '') || user.primary;
      if (!meter) {
        await send(chatId, '❌ No primary meter set. Send a meter number or use /save first.');
        return new Response('ok', { status: 200 });
      }
      await send(chatId, '⏳ Fetching...');
      const data = await fetchNesco(meter);
      if (data.error) { await send(chatId, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }

      // Auto-save on first check
      if (!user.meters.includes(meter)) { user.meters.push(meter); if (!user.primary) user.primary = meter; await saveUser(chatId, user); }

      if (cmd === '/balance') await send(chatId, formatBalance(data));
      else if (cmd === '/token') await send(chatId, formatToken(data));
      else await send(chatId, formatFull(data));
      return new Response('ok', { status: 200 });
    }

    // Bare meter number
    const meter = text.replace(/\D/g, '');
    if (meter.length >= 8 && meter.length <= 11) {
      await send(chatId, '⏳ Fetching data from NESCO...');
      const data = await fetchNesco(meter);
      if (data.error) { await send(chatId, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }

      // Auto-save
      if (!user.meters.includes(meter)) { user.meters.push(meter); if (!user.primary) user.primary = meter; await saveUser(chatId, user); }

      await send(chatId, formatFull(data));
      return new Response('ok', { status: 200 });
    }

    await send(chatId, '❌ Send a valid 8-11 digit meter number, or type /help for commands.');

  } catch (err) {
    console.error('Telegram bot error:', err);
  }

  return new Response('ok', { status: 200 });
};

export const config = { path: '/api/telegram' };
