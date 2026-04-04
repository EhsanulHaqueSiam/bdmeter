const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function fetchNescoData(meter) {
  const BASE_URL = 'https://customer.nesco.gov.bd';
  const PANEL_URL = `${BASE_URL}/pre/panel`;
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Origin': BASE_URL,
    'Referer': PANEL_URL,
  };

  // We'll call our own nesco function internally via URL
  // But since we're in Netlify, let's just import the logic
  // For simplicity, fetch from our own API
  const siteUrl = process.env.URL || 'https://nesco.netlify.app';
  const res = await fetch(`${siteUrl}/api/nesco?meter=${meter}`);
  return res.json();
}

function formatMessage(data) {
  const { customerInfo, rechargeHistory, monthlyUsage } = data;
  const last = rechargeHistory?.[0];
  const latest = monthlyUsage?.[0];

  let msg = `⚡ *NESCO Meter Dashboard*\n`;
  msg += `━━━━━━━━━━━━━━━━━\n\n`;

  if (customerInfo?.name) {
    msg += `👤 *${customerInfo.name}*\n`;
  }
  if (customerInfo?.consumerNo) {
    msg += `📋 Consumer: \`${customerInfo.consumerNo}\`\n`;
  }
  if (customerInfo?.meterNo) {
    msg += `🔢 Meter: \`${customerInfo.meterNo}\`\n`;
  }
  if (customerInfo?.meterStatus) {
    msg += `✅ Status: ${customerInfo.meterStatus}\n`;
  }

  const balance = customerInfo?.balance
    ? parseFloat(customerInfo.balance.replace(/[^\d.-]/g, ''))
    : latest?.endBalance;

  if (balance !== undefined) {
    msg += `\n💰 *Balance: ৳${parseFloat(balance).toFixed(2)}*\n`;
  }

  if (last) {
    msg += `\n📱 *Last Recharge*\n`;
    msg += `├ Amount: ৳${last.rechargeAmount}\n`;
    msg += `├ Date: ${last.date}\n`;
    msg += `├ Via: ${last.medium}\n`;
    msg += `└ Status: ${last.status}\n`;
  }

  if (latest) {
    msg += `\n📊 *${latest.month} ${latest.year} Usage*\n`;
    msg += `├ Recharged: ৳${latest.totalRecharge.toLocaleString()}\n`;
    msg += `├ Electricity: ৳${latest.usedElectricity.toFixed(0)}\n`;
    msg += `├ Used: ${latest.usedKwh} kWh\n`;
    msg += `└ Balance: ৳${latest.endBalance.toFixed(2)}\n`;
  }

  if (monthlyUsage?.length > 1) {
    msg += `\n📈 *Monthly Summary (Last 3)*\n`;
    monthlyUsage.slice(0, 3).forEach((m) => {
      msg += `• ${m.month.slice(0, 3)} ${m.year}: ৳${m.totalRecharge.toLocaleString()} | ${m.usedKwh} kWh\n`;
    });
  }

  msg += `\n🌐 _View full dashboard online_`;

  return msg;
}

async function sendMessage(chatId, text, parseMode = 'Markdown') {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
}

export default async (req) => {
  if (!BOT_TOKEN) {
    return new Response('Bot not configured', { status: 200 });
  }

  try {
    const body = await req.json();
    const message = body.message || body.edited_message;
    if (!message?.text) return new Response('ok', { status: 200 });

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text === '/start') {
      await sendMessage(chatId,
        `⚡ *NESCO Meter Bot*\n\nSend me your 8-11 digit prepaid meter number and I'll fetch your:\n\n• 💰 Current balance\n• 📱 Last recharge\n• 📊 Monthly usage\n• 📈 Usage history\n\nJust type your meter number!`
      );
      return new Response('ok', { status: 200 });
    }

    if (text === '/help') {
      await sendMessage(chatId,
        `📖 *Help*\n\nJust send your NESCO prepaid meter number (8-11 digits).\n\nExample: \`82044144\`\n\nCommands:\n/start - Welcome message\n/help - This message`
      );
      return new Response('ok', { status: 200 });
    }

    // Check if it's a meter number
    const meter = text.replace(/\D/g, '');
    if (meter.length < 8 || meter.length > 11) {
      await sendMessage(chatId, '❌ Please send a valid 8-11 digit meter number.\n\nExample: `82044144`');
      return new Response('ok', { status: 200 });
    }

    await sendMessage(chatId, '⏳ Fetching data from NESCO... Please wait.');

    const data = await fetchNescoData(meter);
    if (data.error) {
      await sendMessage(chatId, `❌ ${data.error}`);
      return new Response('ok', { status: 200 });
    }

    const formatted = formatMessage(data);
    await sendMessage(chatId, formatted);

  } catch (err) {
    console.error('Telegram bot error:', err);
  }

  return new Response('ok', { status: 200 });
};

export const config = {
  path: '/api/telegram',
};
