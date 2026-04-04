import { getStore } from '@netlify/blobs';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'nesco-verify';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const SITE_URL = process.env.URL || 'https://bdmeter.netlify.app';

async function fetchData(meter, provider) {
  const url = provider === 'desco'
    ? `${SITE_URL}/api/desco?account=${meter}&meter=${meter}`
    : `${SITE_URL}/api/nesco?meter=${meter}`;
  return (await fetch(url)).json();
}

async function getUser(phone) {
  try {
    const store = getStore('whatsapp-users');
    return (await store.get(phone, { type: 'json' })) || { meters: [], primary: null, provider: 'nesco' };
  } catch { return { meters: [], primary: null, provider: 'nesco' }; }
}

async function saveUser(phone, data) {
  const store = getStore('whatsapp-users');
  await store.setJSON(phone, data);
}

function findMeter(user, number) {
  return user.meters.find(m => (typeof m === 'object' ? m.number : m) === number);
}

function getMeterProvider(user, number) {
  const m = findMeter(user, number);
  return (m && typeof m === 'object') ? m.provider || user.provider : user.provider || 'nesco';
}

function addMeter(user, number, provider) {
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
  if (c?.consumerNo) msg += `📋 Account: ${c.consumerNo}\n`;
  if (c?.meterNo) msg += `🔢 Meter: ${c.meterNo}\n`;
  if (c?.tariff) msg += `📄 ${c.tariff} | Load: ${c.approvedLoad || '?'} kW\n`;
  if (c?.meterType) msg += `⚙️ ${c.meterType} — ${c.meterStatus || 'Active'}\n`;
  if (c?.office) msg += `🏢 ${c.office}${c.feeder ? ' | ' + c.feeder : ''}\n`;

  msg += `\n💰 *Balance: ৳${balance.toFixed(2)}*\n`;
  if (c?.currentMonthConsumption) msg += `📊 This month so far: ৳${c.currentMonthConsumption}\n`;

  if (last) {
    const isAuto = last.status === 'Success';
    msg += `\n📱 *Last Recharge*\n`;
    msg += `   Amount: *৳${last.rechargeAmount}*\n`;
    msg += `   Electricity: ৳${last.electricity.toFixed(0)}`;
    if (last.probableKwh > 0) msg += ` (${last.probableKwh} kWh)`;
    msg += `\n`;
    if (last.vat > 0) { msg += `   VAT: ৳${last.vat.toFixed(0)}`; if (last.demandCharge > 0) msg += ` | Demand: ৳${last.demandCharge}`; msg += `\n`; }
    if (last.rebate < 0) msg += `   Rebate: ৳${Math.abs(last.rebate).toFixed(2)}\n`;
    msg += `   ${last.medium || 'Online'} | ${last.date}\n`;
    if (prov === 'nesco') {
      msg += `   Remote: ${isAuto ? '✅ Auto-applied' : '⚠️ Failed — enter PIN manually'}\n`;
      msg += isAuto ? `   Token: ${last.tokenNo}\n` : `   🔑 PIN: ${last.tokenNo.replace(/\s/g, '')}\n`;
    } else {
      msg += `   Status: ${isAuto ? '✅ Successful' : last.status}\n`;
      if (last.tokenNo) msg += `   Token: ${last.tokenNo}\n`;
    }
  }

  if (latest) {
    msg += `\n📊 *${latest.month} ${latest.year}*\n`;
    if (latest.totalRecharge > 0) msg += `   Recharged: ৳${latest.totalRecharge.toLocaleString()}\n`;
    msg += `   Electricity: ৳${latest.usedElectricity.toFixed(0)}\n`;
    msg += `   Used: *${latest.usedKwh.toFixed(1)} kWh*`;
    if (kwhChange !== null) msg += ` (${kwhChange > 0 ? '↑' : '↓'}${Math.abs(kwhChange)}%)`;
    msg += `\n   Rate: ৳${rate}/kWh\n`;
    msg += `   End Balance: ৳${latest.endBalance.toFixed(2)}\n`;
  }

  if (monthlyUsage.length > 1) {
    msg += `\n📈 *Last ${Math.min(monthlyUsage.length, 6)} Months*\n`;
    monthlyUsage.slice(0, 6).forEach(m => {
      msg += `   ${m.month.slice(0, 3)} ${m.year}: ${m.usedKwh.toFixed(0)} kWh | ৳${m.usedElectricity.toFixed(0)}\n`;
    });
  }

  if (dailyConsumption?.length > 0) {
    msg += `\n📅 *Recent Daily*\n`;
    dailyConsumption.slice(-5).forEach(d => { msg += `   ${d.date}: ৳${d.consumedTaka.toFixed(0)}\n`; });
  }

  msg += `\n📉 *Stats*\n`;
  if (totalRecharged > 0) msg += `   Total: ৳${totalRecharged.toLocaleString()}\n`;
  if (prov === 'nesco' && rechargeHistory.length > 0) msg += `   Remote: ${successCount}/${rechargeHistory.length} (${(successCount/rechargeHistory.length*100).toFixed(0)}%)\n`;
  msg += `   Min recharge: ৳${c?.minRecharge || '?'}\n`;
  msg += `\n🌐 ${SITE_URL}`;
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
      msg += last.status === 'Success' ? '✅ Auto-applied' : `⚠️ PIN: ${last.tokenNo.replace(/\s/g, '')}`;
    }
  }
  if (c?.minRecharge) msg += `\nMin recharge: ৳${c.minRecharge}`;
  return msg;
}

function formatToken(data, prov) {
  const last = data.rechargeHistory?.[0];
  if (!last) return '❌ No recharge found.';
  let msg = `🔑 *Last Token*\n\n${last.tokenNo.replace(/\s/g, '')}\n\n`;
  msg += `৳${last.rechargeAmount} via ${last.medium || 'Online'} | ${last.date}\n`;
  if (prov === 'nesco') msg += last.status === 'Success' ? '✅ Auto-applied' : '⚠️ Enter this PIN in your meter';
  else msg += last.status === 'Success' ? '✅ Successful' : `Status: ${last.status}`;
  return msg;
}

async function sendMsg(to, text) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return;
  await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
}

export default async (req) => {
  const url = new URL(req.url);

  // Webhook verification
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message?.text?.body) return new Response('ok', { status: 200 });

    const from = message.from;
    const raw = message.text.body.trim();
    const text = raw.toLowerCase();
    const parts = text.split(/\s+/);
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ').trim();

    const user = await getUser(from);

    // Help
    if (['help', 'hi', 'hello', 'start', 'menu'].includes(cmd)) {
      let msg = `⚡ *Prepaid Meter Bot*\nSupports *NESCO* & *DESCO*\n\n`;
      msg += `*Commands:*\n`;
      msg += `• *check 82044144* — Full report\n`;
      msg += `• *balance* or *balance 82044144* — Quick balance\n`;
      msg += `• *token* or *pin* — Last recharge PIN\n`;
      msg += `• *provider nesco* or *desco* — Set default\n`;
      msg += `• *save 82044144* — Save meter\n`;
      msg += `• *primary 82044144* — Set primary\n`;
      msg += `• *meters* or *list* — List saved\n`;
      msg += `• *remove 82044144* — Remove meter\n\n`;
      msg += `Or just send a number!\n`;
      msg += `Default: *${(user.provider || 'nesco').toUpperCase()}*`;
      if (user.primary) msg += `\nPrimary: ${user.primary}`;
      await sendMsg(from, msg);
      return new Response('ok', { status: 200 });
    }

    // Provider
    if (cmd === 'provider') {
      const prov = arg;
      if (prov !== 'nesco' && prov !== 'desco') {
        await sendMsg(from, `❌ Send: provider nesco or provider desco\nCurrent: ${(user.provider || 'nesco').toUpperCase()}`);
        return new Response('ok', { status: 200 });
      }
      user.provider = prov;
      await saveUser(from, user);
      await sendMsg(from, `✅ Default set to *${prov.toUpperCase()}*`);
      return new Response('ok', { status: 200 });
    }

    // Save
    if (cmd === 'save') {
      const meter = parseMeter(arg);
      if (!meter) {
        await sendMsg(from, '❌ Send: save 82044144\nAccount: 8-9 digits, Meter: 11-12 digits');
        return new Response('ok', { status: 200 });
      }
      const prov = user.provider || 'nesco';
      addMeter(user, meter, prov);
      await saveUser(from, user);
      await sendMsg(from, `✅ ${meter} saved (${prov.toUpperCase()})! ${user.meters.length} total.`);
      return new Response('ok', { status: 200 });
    }

    // Primary
    if (cmd === 'primary') {
      const meter = parseMeter(arg);
      if (!meter) {
        await sendMsg(from, '❌ Send: primary 82044144');
        return new Response('ok', { status: 200 });
      }
      if (!findMeter(user, meter)) {
        await sendMsg(from, '❌ Save it first with: save 82044144');
        return new Response('ok', { status: 200 });
      }
      user.primary = meter;
      await saveUser(from, user);
      await sendMsg(from, `⭐ Primary: ${meter}`);
      return new Response('ok', { status: 200 });
    }

    // Meters list
    if (cmd === 'meters' || cmd === 'list') {
      const list = meterList(user);
      if (!list.length) {
        await sendMsg(from, '📋 No saved meters. Send a meter number to start.');
        return new Response('ok', { status: 200 });
      }
      let msg = `📋 *Saved Meters (${list.length})*\n\n`;
      list.forEach((m, i) => {
        msg += `${i + 1}. ${m.number} [${(m.provider || 'nesco').toUpperCase()}]${m.number === user.primary ? ' ⭐' : ''}\n`;
      });
      msg += `\nDefault: *${(user.provider || 'nesco').toUpperCase()}*`;
      await sendMsg(from, msg);
      return new Response('ok', { status: 200 });
    }

    // Remove
    if (cmd === 'remove') {
      const meter = parseMeter(arg);
      if (!meter) {
        await sendMsg(from, '❌ Send: remove 82044144');
        return new Response('ok', { status: 200 });
      }
      const before = user.meters.length;
      user.meters = user.meters.filter(m => (typeof m === 'object' ? m.number : m) !== meter);
      if (user.meters.length === before) {
        await sendMsg(from, `❌ Meter ${meter} not found in saved list.`);
        return new Response('ok', { status: 200 });
      }
      if (user.primary === meter) user.primary = meterList(user)[0]?.number || null;
      await saveUser(from, user);
      await sendMsg(from, `🗑️ ${meter} removed.`);
      return new Response('ok', { status: 200 });
    }

    // Balance
    if (cmd === 'balance') {
      const meter = parseMeter(arg) || user.primary;
      if (!meter) {
        await sendMsg(from, '❌ No primary meter. Send: balance 82044144');
        return new Response('ok', { status: 200 });
      }
      const prov = getMeterProvider(user, meter);
      await sendMsg(from, `⏳ Fetching from ${prov.toUpperCase()}...`);
      const data = await fetchData(meter, prov);
      if (data.error) { await sendMsg(from, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }
      addMeter(user, meter, prov);
      await saveUser(from, user);
      await sendMsg(from, formatBalance(data, prov));
      return new Response('ok', { status: 200 });
    }

    // Token / PIN
    if (cmd === 'token' || cmd === 'pin') {
      const meter = parseMeter(arg) || user.primary;
      if (!meter) {
        await sendMsg(from, '❌ No primary meter. Send: token 82044144');
        return new Response('ok', { status: 200 });
      }
      const prov = getMeterProvider(user, meter);
      await sendMsg(from, `⏳ Fetching from ${prov.toUpperCase()}...`);
      const data = await fetchData(meter, prov);
      if (data.error) { await sendMsg(from, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }
      addMeter(user, meter, prov);
      await saveUser(from, user);
      await sendMsg(from, formatToken(data, prov));
      return new Response('ok', { status: 200 });
    }

    // Check command or bare number
    let meterNum = cmd === 'check' ? parseMeter(arg) : parseMeter(raw);
    if (cmd === 'check' && !meterNum) meterNum = user.primary;
    if (meterNum) {
      const prov = getMeterProvider(user, meterNum);
      await sendMsg(from, `⏳ Fetching from ${prov.toUpperCase()}...`);
      const data = await fetchData(meterNum, prov);
      if (data.error) { await sendMsg(from, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }
      addMeter(user, meterNum, prov);
      await saveUser(from, user);
      await sendMsg(from, formatFull(data, prov));
      return new Response('ok', { status: 200 });
    }

    await sendMsg(from, '⚡ Send a meter/account number (8-12 digits) or type *help*');
  } catch (err) { console.error('WhatsApp error:', err); }
  return new Response('ok', { status: 200 });
};

export const config = { path: '/api/whatsapp' };
