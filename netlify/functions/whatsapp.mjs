// WhatsApp Bot via webhook (works with Twilio, WhatsApp Business API, or WATI)
// Set WHATSAPP_VERIFY_TOKEN in Netlify env vars

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'nesco-verify';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function fetchNescoData(meter) {
  const siteUrl = process.env.URL || 'https://nesco.netlify.app';
  const res = await fetch(`${siteUrl}/api/nesco?meter=${meter}`);
  return res.json();
}

function formatWhatsAppMessage(data) {
  const { customerInfo, rechargeHistory, monthlyUsage } = data;
  const last = rechargeHistory?.[0];
  const latest = monthlyUsage?.[0];

  const balance = customerInfo?.balance
    ? parseFloat(customerInfo.balance.replace(/[^\d.-]/g, ''))
    : latest?.endBalance || 0;

  let msg = `⚡ *NESCO Meter Dashboard*\n━━━━━━━━━━━━━━━\n\n`;

  if (customerInfo?.name) msg += `👤 *${customerInfo.name}*\n`;
  if (customerInfo?.consumerNo) msg += `📋 Consumer: ${customerInfo.consumerNo}\n`;

  msg += `\n💰 *Balance: ৳${balance.toFixed(2)}*\n`;

  if (last) {
    msg += `\n📱 *Last Recharge*\n`;
    msg += `   Amount: ৳${last.rechargeAmount}\n`;
    msg += `   Date: ${last.date}\n`;
    msg += `   Via: ${last.medium} (${last.status})\n`;
  }

  if (latest) {
    msg += `\n📊 *${latest.month} ${latest.year}*\n`;
    msg += `   Recharged: ৳${latest.totalRecharge.toLocaleString()}\n`;
    msg += `   Used: ${latest.usedKwh} kWh\n`;
    msg += `   Cost: ৳${latest.usedElectricity.toFixed(0)}\n`;
  }

  if (monthlyUsage?.length > 1) {
    msg += `\n📈 *Recent Months*\n`;
    monthlyUsage.slice(0, 3).forEach(m => {
      msg += `   ${m.month.slice(0,3)} ${m.year}: ৳${m.totalRecharge.toLocaleString()} | ${m.usedKwh} kWh\n`;
    });
  }

  return msg;
}

async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return;

  await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}

export default async (req) => {
  const url = new URL(req.url);

  // WhatsApp webhook verification (GET)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // Handle incoming messages (POST)
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message?.text?.body) return new Response('ok', { status: 200 });

    const from = message.from;
    const text = message.text.body.trim();

    // Check if it's a meter number
    const meter = text.replace(/\D/g, '');
    if (meter.length < 8 || meter.length > 11) {
      await sendWhatsAppMessage(from,
        '⚡ NESCO Meter Bot\n\nSend your 8-11 digit prepaid meter number to get:\n• Balance\n• Last recharge\n• Monthly usage\n\nExample: 82044144'
      );
      return new Response('ok', { status: 200 });
    }

    const data = await fetchNescoData(meter);
    if (data.error) {
      await sendWhatsAppMessage(from, `❌ ${data.error}`);
      return new Response('ok', { status: 200 });
    }

    const formatted = formatWhatsAppMessage(data);
    await sendWhatsAppMessage(from, formatted);

  } catch (err) {
    console.error('WhatsApp bot error:', err);
  }

  return new Response('ok', { status: 200 });
};

export const config = {
  path: '/api/whatsapp',
};
