import { getStore } from '@netlify/blobs';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = process.env.URL || 'https://bdmeter.netlify.app';

async function fetchData(meter, provider) {
  const url = provider === 'desco'
    ? `${SITE_URL}/api/desco?account=${meter}&meter=${meter}`
    : `${SITE_URL}/api/nesco?meter=${meter}`;
  const res = await fetch(url);
  return res.json();
}

async function getUser(chatId) {
  try {
    const store = getStore('telegram-users');
    return (await store.get(String(chatId), { type: 'json' })) || { meters: [], primary: null, provider: 'nesco' };
  } catch { return { meters: [], primary: null, provider: 'nesco' }; }
}

async function saveUser(chatId, userData) {
  const store = getStore('telegram-users');
  await store.setJSON(String(chatId), userData);
}

function findMeter(user, number) {
  return user.meters.find(m => (typeof m === 'object' ? m.number : m) === number);
}

function getMeterProvider(user, number) {
  const m = findMeter(user, number);
  if (m && typeof m === 'object') return m.provider || user.provider || 'nesco';
  return user.provider || 'nesco';
}

function addMeterToUser(user, number, provider) {
  const exists = user.meters.find(m => (typeof m === 'object' ? m.number : m) === number);
  if (!exists) user.meters.push({ number, provider });
  else if (typeof exists === 'object') exists.provider = provider;
  if (!user.primary) user.primary = number;
}

function meterList(user) {
  return user.meters.map(m => typeof m === 'object' ? m : { number: m, provider: user.provider || 'nesco' });
}

function parseMeter(text) {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length >= 8 && cleaned.length <= 12) return cleaned;
  return null;
}

function formatFull(data, prov) {
  const { customerInfo: c, rechargeHistory = [], monthlyUsage = [], dailyConsumption } = data;
  const last = rechargeHistory[0];
  const latest = monthlyUsage[0];
  const prev = monthlyUsage[1];
  const provLabel = (prov || 'nesco').toUpperCase();

  const balance = c?.balance ? parseFloat(c.balance) : latest?.endBalance || 0;
  const rate = latest && latest.usedKwh > 0 ? (latest.usedElectricity / latest.usedKwh).toFixed(2) : '?';
  const totalRecharged = rechargeHistory.reduce((s, r) => s + r.rechargeAmount, 0);
  const successCount = rechargeHistory.filter(r => r.status === 'Success').length;
  const kwhChange = prev && prev.usedKwh > 0 ? ((latest.usedKwh - prev.usedKwh) / prev.usedKwh * 100).toFixed(0) : null;

  let msg = `⚡ *${provLabel} Prepaid Meter*\n━━━━━━━━━━━━━━━━━━━\n\n`;

  if (c?.name) msg += `👤 *${c.name}*\n`;
  if (c?.address) msg += `📍 ${c.address}\n`;
  if (c?.consumerNo) msg += `📋 Account: \`${c.consumerNo}\`\n`;
  if (c?.meterNo) msg += `🔢 Meter: \`${c.meterNo}\`\n`;
  if (c?.tariff) msg += `📄 ${c.tariff} | Load: ${c.approvedLoad || '?'} kW\n`;
  if (c?.meterType) msg += `⚙️ ${c.meterType} — ${c.meterStatus || 'Active'}\n`;
  if (c?.office) msg += `🏢 ${c.office}${c.feeder ? ' | ' + c.feeder : ''}\n`;

  msg += `\n💰 *Balance: ৳${balance.toFixed(2)}*\n`;
  if (c?.currentMonthConsumption) msg += `📊 This month so far: ৳${c.currentMonthConsumption}\n`;

  if (last) {
    const isAuto = last.status === 'Success';
    msg += `\n📱 *Last Recharge*\n`;
    msg += `├ Amount: *৳${last.rechargeAmount}*\n`;
    msg += `├ Electricity: ৳${last.electricity.toFixed(0)}`;
    if (last.probableKwh > 0) msg += ` (${last.probableKwh} kWh)`;
    msg += `\n`;
    if (last.vat > 0) { msg += `├ VAT: ৳${last.vat.toFixed(0)}`; if (last.demandCharge > 0) msg += ` | Demand: ৳${last.demandCharge}`; if (last.meterRent > 0) msg += ` | Rent: ৳${last.meterRent}`; msg += `\n`; }
    if (last.rebate < 0) msg += `├ Rebate: ৳${Math.abs(last.rebate).toFixed(2)}\n`;
    msg += `├ ${last.medium || 'Online'} | ${last.date}\n`;
    if (prov === 'nesco') {
      msg += `├ Remote: ${isAuto ? '✅ Auto-applied' : '⚠️ Failed — enter PIN manually'}\n`;
      msg += isAuto ? `└ Token: \`${last.tokenNo}\`\n` : `└ 🔑 PIN: \`${last.tokenNo.replace(/\s/g, '')}\`\n`;
    } else {
      msg += `└ Status: ${isAuto ? '✅ Successful' : last.status}\n`;
      if (last.tokenNo) msg += `   Token: \`${last.tokenNo}\`\n`;
    }
  }

  if (latest) {
    msg += `\n📊 *${latest.month} ${latest.year}*\n`;
    if (latest.totalRecharge > 0) msg += `├ Recharged: ৳${latest.totalRecharge.toLocaleString()}\n`;
    msg += `├ Electricity: ৳${latest.usedElectricity.toFixed(0)}\n`;
    msg += `├ Used: *${latest.usedKwh.toFixed(1)} kWh*`;
    if (kwhChange !== null) msg += ` (${kwhChange > 0 ? '↑' : '↓'}${Math.abs(kwhChange)}%)`;
    msg += `\n├ Rate: ৳${rate}/kWh\n`;
    msg += `└ End Balance: ৳${latest.endBalance.toFixed(2)}\n`;
  }

  if (monthlyUsage.length > 1) {
    msg += `\n📈 *Last ${Math.min(monthlyUsage.length, 6)} Months*\n`;
    monthlyUsage.slice(0, 6).forEach((m, i, arr) => {
      const pfx = i === Math.min(arr.length, 6) - 1 ? '└' : '├';
      msg += `${pfx} ${m.month.slice(0, 3)} ${m.year}: ${m.usedKwh.toFixed(0)} kWh | ৳${m.usedElectricity.toFixed(0)}\n`;
    });
  }

  if (dailyConsumption?.length > 0) {
    msg += `\n📅 *Recent Daily*\n`;
    dailyConsumption.slice(-5).forEach((d, i, arr) => {
      const pfx = i === arr.length - 1 ? '└' : '├';
      msg += `${pfx} ${d.date}: ৳${d.consumedTaka.toFixed(0)}\n`;
    });
  }

  msg += `\n📉 *Stats*\n`;
  if (totalRecharged > 0) msg += `├ Total recharged: ৳${totalRecharged.toLocaleString()}\n`;
  if (prov === 'nesco') msg += `├ Remote success: ${successCount}/${rechargeHistory.length} (${rechargeHistory.length > 0 ? (successCount/rechargeHistory.length*100).toFixed(0) : 0}%)\n`;
  msg += `└ Min recharge: ৳${c?.minRecharge || '?'}\n`;

  msg += `\n🌐 [Dashboard](${SITE_URL})`;
  return msg;
}

function formatBalance(data, prov) {
  const c = data.customerInfo;
  const last = data.rechargeHistory?.[0];
  const balance = c?.balance ? parseFloat(c.balance) : 0;
  let msg = `💰 *৳${balance.toFixed(2)}* (${(prov || 'nesco').toUpperCase()})\n`;
  if (c?.balanceTime) msg += `As of ${c.balanceTime}\n`;
  if (c?.currentMonthConsumption) msg += `This month: ৳${c.currentMonthConsumption}\n`;
  if (last) {
    msg += `Last: ৳${last.rechargeAmount} on ${last.date}\n`;
    if (prov === 'nesco') {
      const isAuto = last.status === 'Success';
      msg += isAuto ? '✅ Auto-applied' : `⚠️ Enter PIN: \`${last.tokenNo.replace(/\s/g, '')}\``;
    }
  }
  if (c?.minRecharge) msg += `\nMin recharge: ৳${c.minRecharge}`;
  return msg;
}

function formatToken(data, prov) {
  const last = data.rechargeHistory?.[0];
  if (!last) return '❌ No recharge found.';
  let msg = `🔑 *Last Token*\n\n\`${last.tokenNo.replace(/\s/g, '')}\`\n\n`;
  msg += `৳${last.rechargeAmount} via ${last.medium || 'Online'} | ${last.date}\n`;
  if (prov === 'nesco') {
    msg += last.status === 'Success' ? '✅ Already auto-applied' : '⚠️ Enter this PIN in your meter';
  } else {
    msg += last.status === 'Success' ? '✅ Successful' : `Status: ${last.status}`;
  }
  return msg;
}

async function send(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true }),
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
    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    const user = await getUser(chatId);

    // Help
    if (cmd === '/start' || cmd === '/help') {
      let msg = `⚡ *Prepaid Meter Bot*\nSupports *NESCO* & *DESCO*\n\n`;
      msg += `*Commands:*\n`;
      msg += `/check \`number\` — Full report\n`;
      msg += `/balance \`number\` — Quick balance\n`;
      msg += `/token \`number\` — Last recharge PIN\n`;
      msg += `/provider nesco|desco — Set default\n`;
      msg += `/save \`number\` — Save a meter\n`;
      msg += `/primary \`number\` — Set primary\n`;
      msg += `/meters — List saved\n`;
      msg += `/remove \`number\` — Remove meter\n\n`;
      msg += `Or just send a meter/account number!\n`;
      msg += `Default provider: *${(user.provider || 'nesco').toUpperCase()}*\n`;
      if (user.primary) msg += `Primary meter: \`${user.primary}\``;
      await send(chatId, msg);
      return new Response('ok', { status: 200 });
    }

    // Provider
    if (cmd === '/provider') {
      const prov = arg.toLowerCase();
      if (prov !== 'nesco' && prov !== 'desco') {
        await send(chatId, `❌ Usage: /provider nesco or /provider desco\nCurrent: *${(user.provider || 'nesco').toUpperCase()}*`);
        return new Response('ok', { status: 200 });
      }
      user.provider = prov;
      await saveUser(chatId, user);
      await send(chatId, `✅ Default provider set to *${prov.toUpperCase()}*`);
      return new Response('ok', { status: 200 });
    }

    // Save
    if (cmd === '/save') {
      const meter = parseMeter(arg);
      if (!meter) {
        await send(chatId, '❌ Usage: /save `82044144`\nAccount: 8-9 digits, Meter: 11-12 digits');
        return new Response('ok', { status: 200 });
      }
      const prov = user.provider || 'nesco';
      addMeterToUser(user, meter, prov);
      await saveUser(chatId, user);
      await send(chatId, `✅ Meter \`${meter}\` saved (${prov.toUpperCase()})! ${user.meters.length} meter(s) total.`);
      return new Response('ok', { status: 200 });
    }

    // Primary
    if (cmd === '/primary') {
      const meter = parseMeter(arg) || user.primary;
      if (!meter || !findMeter(user, meter)) {
        await send(chatId, '❌ Save the meter first with /save');
        return new Response('ok', { status: 200 });
      }
      user.primary = meter;
      await saveUser(chatId, user);
      await send(chatId, `⭐ Primary set to \`${meter}\``);
      return new Response('ok', { status: 200 });
    }

    // Meters list
    if (cmd === '/meters' || cmd === '/list') {
      const list = meterList(user);
      if (list.length === 0) {
        await send(chatId, '📋 No saved meters. Send a meter number to start.');
        return new Response('ok', { status: 200 });
      }
      let msg = `📋 *Saved Meters (${list.length})*\n\n`;
      list.forEach((m, i) => {
        msg += `${i + 1}. \`${m.number}\` [${(m.provider || 'nesco').toUpperCase()}]${m.number === user.primary ? ' ⭐' : ''}\n`;
      });
      msg += `\nDefault provider: *${(user.provider || 'nesco').toUpperCase()}*`;
      await send(chatId, msg);
      return new Response('ok', { status: 200 });
    }

    // Remove
    if (cmd === '/remove') {
      const meter = parseMeter(arg);
      if (!meter) {
        await send(chatId, '❌ Usage: /remove `82044144`');
        return new Response('ok', { status: 200 });
      }
      const before = user.meters.length;
      user.meters = user.meters.filter(m => (typeof m === 'object' ? m.number : m) !== meter);
      if (user.meters.length === before) {
        await send(chatId, `❌ Meter \`${meter}\` not found in saved list.`);
        return new Response('ok', { status: 200 });
      }
      if (user.primary === meter) user.primary = meterList(user)[0]?.number || null;
      await saveUser(chatId, user);
      await send(chatId, `🗑️ Meter \`${meter}\` removed.`);
      return new Response('ok', { status: 200 });
    }

    // Balance, Token/PIN, Check
    if (cmd === '/balance' || cmd === '/token' || cmd === '/pin' || cmd === '/check') {
      const meter = parseMeter(arg) || user.primary;
      if (!meter) {
        await send(chatId, '❌ No primary meter. Send a number or /save first.');
        return new Response('ok', { status: 200 });
      }
      const prov = getMeterProvider(user, meter);
      await send(chatId, `⏳ Fetching from ${prov.toUpperCase()}...`);
      const data = await fetchData(meter, prov);
      if (data.error) { await send(chatId, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }
      addMeterToUser(user, meter, prov);
      await saveUser(chatId, user);
      if (cmd === '/balance') await send(chatId, formatBalance(data, prov));
      else if (cmd === '/token' || cmd === '/pin') await send(chatId, formatToken(data, prov));
      else await send(chatId, formatFull(data, prov));
      return new Response('ok', { status: 200 });
    }

    // Bare number
    const meter = parseMeter(text);
    if (meter) {
      const prov = getMeterProvider(user, meter);
      await send(chatId, `⏳ Fetching from ${prov.toUpperCase()}...`);
      const data = await fetchData(meter, prov);
      if (data.error) { await send(chatId, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }
      addMeterToUser(user, meter, prov);
      await saveUser(chatId, user);
      await send(chatId, formatFull(data, prov));
      return new Response('ok', { status: 200 });
    }

    await send(chatId, '❌ Send a meter/account number (8-12 digits), or /help');
  } catch (err) {
    console.error('Telegram error:', err);
  }
  return new Response('ok', { status: 200 });
};

export const config = { path: '/api/telegram' };
