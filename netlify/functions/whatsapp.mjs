import { getStore } from '@netlify/blobs';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'nesco-verify';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const SITE_URL = process.env.URL || 'https://nesco-meter.netlify.app';

async function fetchNesco(meter) {
  const res = await fetch(`${SITE_URL}/api/nesco?meter=${meter}`);
  return res.json();
}

async function getUser(phone) {
  try {
    const store = getStore('whatsapp-users');
    return (await store.get(phone, { type: 'json' })) || { meters: [], primary: null };
  } catch { return { meters: [], primary: null }; }
}

async function saveUser(phone, userData) {
  const store = getStore('whatsapp-users');
  await store.setJSON(phone, userData);
}

function formatFull(data) {
  const { customerInfo: c, rechargeHistory, monthlyUsage } = data;
  const last = rechargeHistory?.[0];
  const latest = monthlyUsage?.[0];
  const prev = monthlyUsage?.[1];
  const balance = c?.balance ? parseFloat(c.balance) : latest?.endBalance || 0;
  const rate = latest && latest.usedKwh > 0 ? (latest.usedElectricity / latest.usedKwh).toFixed(2) : '?';
  const totalRecharged = rechargeHistory.reduce((s, r) => s + r.rechargeAmount, 0);
  const successCount = rechargeHistory.filter(r => r.status === 'Success').length;
  const kwhChange = prev && prev.usedKwh > 0 ? ((latest.usedKwh - prev.usedKwh) / prev.usedKwh * 100).toFixed(0) : null;

  let msg = `⚡ *NESCO Prepaid Meter*\n━━━━━━━━━━━━━━━━━━━\n\n`;

  if (c?.name) msg += `👤 *${c.name}*\n`;
  if (c?.address) msg += `📍 ${c.address}\n`;
  if (c?.consumerNo) msg += `📋 Consumer: ${c.consumerNo}\n`;
  if (c?.meterNo) msg += `🔢 Meter: ${c.meterNo}\n`;
  if (c?.tariff) msg += `📄 Tariff: ${c.tariff} | Load: ${c.approvedLoad || '?'} kW\n`;
  if (c?.meterType) msg += `⚙️ ${c.meterType} — ${c.meterStatus || 'Active'}\n`;
  if (c?.office) msg += `🏢 ${c.office} | ${c.feeder || ''}\n`;

  msg += `\n💰 *Balance: ৳${balance.toFixed(2)}*\n`;

  if (last) {
    const isAuto = last.status === 'Success';
    msg += `\n📱 *Last Recharge*\n`;
    msg += `   Amount: *৳${last.rechargeAmount}*\n`;
    msg += `   Electricity: ৳${last.electricity.toFixed(0)} (${last.probableKwh} kWh)\n`;
    msg += `   VAT: ৳${last.vat.toFixed(0)}`;
    if (last.demandCharge > 0) msg += ` | Demand: ৳${last.demandCharge}`;
    if (last.meterRent > 0) msg += ` | Rent: ৳${last.meterRent}`;
    msg += `\n`;
    if (last.rebate < 0) msg += `   Rebate: ৳${Math.abs(last.rebate).toFixed(2)}\n`;
    msg += `   Via: ${last.medium} | ${last.date}\n`;
    msg += `   Remote: ${isAuto ? '✅ Auto-applied' : '⚠️ Failed — enter PIN manually'}\n`;
    if (!isAuto) {
      msg += `   🔑 PIN: ${last.tokenNo.replace(/\s/g, '')}\n`;
    } else {
      msg += `   Token: ${last.tokenNo}\n`;
    }
  }

  if (latest) {
    msg += `\n📊 *${latest.month} ${latest.year}*\n`;
    msg += `   Recharged: ৳${latest.totalRecharge.toLocaleString()}\n`;
    msg += `   Electricity: ৳${latest.usedElectricity.toFixed(0)}\n`;
    msg += `   Used: *${latest.usedKwh} kWh*`;
    if (kwhChange !== null) msg += ` (${kwhChange > 0 ? '↑' : '↓'}${Math.abs(kwhChange)}%)`;
    msg += `\n`;
    msg += `   Rate: ৳${rate}/kWh\n`;
    msg += `   VAT: ৳${latest.vat.toFixed(0)} | Demand: ৳${latest.demandCharge}\n`;
    msg += `   End Balance: ৳${latest.endBalance.toFixed(2)}\n`;
  }

  if (monthlyUsage?.length > 1) {
    msg += `\n📈 *Last ${Math.min(monthlyUsage.length, 6)} Months*\n`;
    monthlyUsage.slice(0, 6).forEach(m => {
      msg += `   ${m.month.slice(0, 3)} ${m.year}: ৳${m.totalRecharge.toLocaleString()} | ${m.usedKwh} kWh\n`;
    });
  }

  msg += `\n📉 *Stats*\n`;
  msg += `   Total: ৳${totalRecharged.toLocaleString()}\n`;
  msg += `   Remote success: ${successCount}/${rechargeHistory.length} (${(successCount / rechargeHistory.length * 100).toFixed(0)}%)\n`;
  msg += `   Min recharge: ৳${c?.minRecharge || '?'}\n`;

  msg += `\n🌐 ${SITE_URL}`;
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
    const text = message.text.body.trim().toLowerCase();
    const user = await getUser(from);

    // Commands
    if (text === 'help' || text === 'hi' || text === 'hello' || text === 'start') {
      let msg = `⚡ *NESCO Meter Bot*\n\nSend a meter number (8-11 digits) for full details.\n\n`;
      msg += `*Commands:*\n`;
      msg += `• *check 82044144* — Full report\n`;
      msg += `• *balance* — Quick balance\n`;
      msg += `• *token* — Last recharge PIN\n`;
      msg += `• *save 82044144* — Save meter\n`;
      msg += `• *primary 82044144* — Set primary\n`;
      msg += `• *meters* — List saved\n`;
      msg += `• *remove 82044144* — Remove meter\n`;
      if (user.primary) msg += `\nYour primary: ${user.primary}`;
      await sendMsg(from, msg);
      return new Response('ok', { status: 200 });
    }

    if (text.startsWith('save ')) {
      const meter = text.replace('save', '').replace(/\D/g, '');
      if (meter.length < 8 || meter.length > 11) { await sendMsg(from, '❌ Send: save 82044144'); return new Response('ok', { status: 200 }); }
      if (!user.meters.includes(meter)) user.meters.push(meter);
      if (!user.primary) user.primary = meter;
      await saveUser(from, user);
      await sendMsg(from, `✅ Meter ${meter} saved! (${user.meters.length} total)`);
      return new Response('ok', { status: 200 });
    }

    if (text.startsWith('primary ')) {
      const meter = text.replace('primary', '').replace(/\D/g, '');
      if (!user.meters.includes(meter)) { await sendMsg(from, '❌ Save it first: save ' + meter); return new Response('ok', { status: 200 }); }
      user.primary = meter;
      await saveUser(from, user);
      await sendMsg(from, `⭐ Primary set to ${meter}`);
      return new Response('ok', { status: 200 });
    }

    if (text === 'meters' || text === 'list') {
      if (user.meters.length === 0) { await sendMsg(from, '📋 No saved meters. Send a meter number to start.'); return new Response('ok', { status: 200 }); }
      let msg = `📋 *Saved Meters (${user.meters.length})*\n\n`;
      user.meters.forEach((m, i) => { msg += `${i + 1}. ${m}${m === user.primary ? ' ⭐ primary' : ''}\n`; });
      await sendMsg(from, msg);
      return new Response('ok', { status: 200 });
    }

    if (text.startsWith('remove ')) {
      const meter = text.replace('remove', '').replace(/\D/g, '');
      user.meters = user.meters.filter(m => m !== meter);
      if (user.primary === meter) user.primary = user.meters[0] || null;
      await saveUser(from, user);
      await sendMsg(from, `🗑️ Meter ${meter} removed.`);
      return new Response('ok', { status: 200 });
    }

    if (text === 'balance') {
      const meter = user.primary;
      if (!meter) { await sendMsg(from, '❌ No primary meter. Send a meter number first.'); return new Response('ok', { status: 200 }); }
      const data = await fetchNesco(meter);
      if (data.error) { await sendMsg(from, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }
      const bal = data.customerInfo?.balance ? parseFloat(data.customerInfo.balance) : 0;
      const last = data.rechargeHistory?.[0];
      const isAuto = last?.status === 'Success';
      let msg = `💰 *৳${bal.toFixed(2)}*\n`;
      if (last) {
        msg += `Last: ৳${last.rechargeAmount} on ${last.date}\n`;
        msg += isAuto ? '✅ Auto-applied' : `⚠️ Enter PIN: ${last.tokenNo.replace(/\s/g, '')}`;
      }
      await sendMsg(from, msg);
      return new Response('ok', { status: 200 });
    }

    if (text === 'token' || text === 'pin') {
      const meter = user.primary;
      if (!meter) { await sendMsg(from, '❌ No primary meter set.'); return new Response('ok', { status: 200 }); }
      const data = await fetchNesco(meter);
      if (data.error) { await sendMsg(from, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }
      const last = data.rechargeHistory?.[0];
      if (!last) { await sendMsg(from, '❌ No recharge found.'); return new Response('ok', { status: 200 }); }
      const isAuto = last.status === 'Success';
      let msg = `🔑 *Last Token*\n\n${last.tokenNo.replace(/\s/g, '')}\n\n`;
      msg += `৳${last.rechargeAmount} | ${last.date}\n`;
      msg += isAuto ? '✅ Already auto-applied' : '⚠️ Enter this PIN in your meter';
      await sendMsg(from, msg);
      return new Response('ok', { status: 200 });
    }

    // Check command or bare meter number
    let meter = text.startsWith('check ') ? text.replace('check', '').replace(/\D/g, '') : text.replace(/\D/g, '');
    if (meter.length >= 8 && meter.length <= 11) {
      await sendMsg(from, '⏳ Fetching data from NESCO...');
      const data = await fetchNesco(meter);
      if (data.error) { await sendMsg(from, `❌ ${data.error}`); return new Response('ok', { status: 200 }); }
      if (!user.meters.includes(meter)) { user.meters.push(meter); if (!user.primary) user.primary = meter; await saveUser(from, user); }
      await sendMsg(from, formatFull(data));
      return new Response('ok', { status: 200 });
    }

    await sendMsg(from, '⚡ Send a meter number (8-11 digits) or type *help* for commands.');

  } catch (err) {
    console.error('WhatsApp bot error:', err);
  }

  return new Response('ok', { status: 200 });
};

export const config = { path: '/api/whatsapp' };
