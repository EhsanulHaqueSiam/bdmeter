import { getStore } from '@netlify/blobs';

const SITE_URL = process.env.URL || 'https://bdmeter.netlify.app';

async function fetchData(meter, provider) {
  const url = provider === 'desco'
    ? `${SITE_URL}/api/desco?account=${meter}&meter=${meter}`
    : `${SITE_URL}/api/nesco?meter=${meter}`;
  return (await fetch(url)).json();
}

async function getUser(userId) {
  try {
    const store = getStore('discord-users');
    return (await store.get(String(userId), { type: 'json' })) || { meters: [], primary: null, provider: 'nesco' };
  } catch { return { meters: [], primary: null, provider: 'nesco' }; }
}

async function saveUser(userId, data) {
  const store = getStore('discord-users');
  await store.setJSON(String(userId), data);
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
  const cleaned = String(text || '').replace(/\D/g, '');
  if (cleaned.length >= 8 && cleaned.length <= 12) return cleaned;
  return null;
}

function formatBalance(data, prov) {
  const c = data.customerInfo;
  const last = data.rechargeHistory?.[0];
  const balance = c?.balance ? parseFloat(c.balance) : 0;
  let msg = `💰 **৳${balance.toFixed(2)}** (${(prov || 'nesco').toUpperCase()})\n`;
  if (c?.balanceTime) msg += `As of ${c.balanceTime}\n`;
  if (c?.currentMonthConsumption) msg += `This month: ৳${c.currentMonthConsumption}\n`;
  if (last) {
    msg += `Last: ৳${last.rechargeAmount} on ${last.date}\n`;
    if (prov === 'nesco') {
      msg += last.status === 'Success' ? '✅ Auto-applied' : `⚠️ PIN: \`${last.tokenNo.replace(/\s/g, '')}\``;
    }
  }
  if (c?.minRecharge) msg += `\nMin recharge: ৳${c.minRecharge}`;
  return msg;
}

function formatToken(data, prov) {
  const last = data.rechargeHistory?.[0];
  if (!last) return '❌ No recharge found.';
  let msg = `🔑 **Last Token**\n\n\`${last.tokenNo.replace(/\s/g, '')}\`\n\n`;
  msg += `৳${last.rechargeAmount} via ${last.medium || 'Online'} | ${last.date}\n`;
  if (prov === 'nesco') msg += last.status === 'Success' ? '✅ Auto-applied' : '⚠️ Enter this PIN in your meter';
  else msg += last.status === 'Success' ? '✅ Successful' : `Status: ${last.status}`;
  return msg;
}

function buildEmbed(data, meter, prov) {
  const { customerInfo: c, rechargeHistory = [], monthlyUsage = [], dailyConsumption } = data;
  const last = rechargeHistory[0];
  const latest = monthlyUsage[0];
  const provLabel = (prov || 'nesco').toUpperCase();
  const balance = c?.balance ? parseFloat(c.balance) : latest?.endBalance || 0;
  const rate = latest && latest.usedKwh > 0 ? (latest.usedElectricity / latest.usedKwh).toFixed(2) : '?';
  const totalRecharged = rechargeHistory.reduce((s, r) => s + r.rechargeAmount, 0);
  const successCount = rechargeHistory.filter(r => r.status === 'Success').length;
  const fields = [];

  fields.push({ name: '💰 Balance', value: `**৳${balance.toFixed(2)}**`, inline: true });
  if (c?.tariff) fields.push({ name: '📄 Tariff', value: `${c.tariff} | ${c.approvedLoad || '?'} kW`, inline: true });
  fields.push({ name: '⚙️ Status', value: `${c?.meterType || 'Meter'} — ${c?.meterStatus || 'Active'}`, inline: true });
  if (c?.currentMonthConsumption) fields.push({ name: '📊 Month so far', value: `৳${c.currentMonthConsumption}`, inline: true });

  if (last) {
    const isAuto = last.status === 'Success';
    let val = `**৳${last.rechargeAmount}** ${last.medium ? 'via ' + last.medium : ''}\n`;
    val += `Electricity: ৳${last.electricity.toFixed(0)}`;
    if (last.probableKwh > 0) val += ` (${last.probableKwh} kWh)`;
    if (last.vat > 0) val += `\nVAT: ৳${last.vat.toFixed(0)}`;
    if (last.demandCharge > 0) val += ` | Demand: ৳${last.demandCharge}`;
    if (last.rebate < 0) val += ` | Rebate: ৳${Math.abs(last.rebate).toFixed(2)}`;
    val += `\n${last.date}`;
    fields.push({ name: '📱 Last Recharge', value: val, inline: false });

    if (prov === 'nesco') {
      fields.push({
        name: isAuto ? '✅ Remote Recharge' : '⚠️ Remote Recharge',
        value: isAuto ? 'Auto-applied to meter' : `Failed — enter PIN manually\n\`${last.tokenNo.replace(/\s/g, '')}\``,
        inline: false,
      });
    } else if (last.tokenNo) {
      fields.push({ name: '🔑 Token', value: `\`${last.tokenNo}\`\n${isAuto ? '✅ Successful' : last.status}`, inline: false });
    }
  }

  if (latest) {
    let val = '';
    if (latest.totalRecharge > 0) val += `Recharged: ৳${latest.totalRecharge.toLocaleString()}\n`;
    val += `Electricity: ৳${latest.usedElectricity.toFixed(0)} | **${latest.usedKwh.toFixed(1)} kWh**\nRate: ৳${rate}/kWh`;
    if (latest.endBalance) val += `\nEnd Balance: ৳${latest.endBalance.toFixed(2)}`;
    fields.push({ name: `📊 ${latest.month} ${latest.year}`, value: val, inline: false });
  }

  if (monthlyUsage.length > 1) {
    const summary = monthlyUsage.slice(0, 6).map(m => `**${m.month.slice(0,3)} ${m.year}**: ${m.usedKwh.toFixed(0)} kWh | ৳${m.usedElectricity.toFixed(0)}`).join('\n');
    fields.push({ name: '📈 Monthly', value: summary, inline: false });
  }

  if (dailyConsumption?.length > 0) {
    const daily = dailyConsumption.slice(-5).map(d => `${d.date}: ৳${d.consumedTaka.toFixed(0)}`).join('\n');
    fields.push({ name: '📅 Recent Daily', value: daily, inline: false });
  }

  let statsVal = '';
  if (totalRecharged > 0) statsVal += `Total: ৳${totalRecharged.toLocaleString()}`;
  if (prov === 'nesco' && rechargeHistory.length > 0) statsVal += ` | Remote: ${successCount}/${rechargeHistory.length} (${(successCount/rechargeHistory.length*100).toFixed(0)}%)`;
  if (c?.minRecharge) statsVal += ` | Min: ৳${c.minRecharge}`;
  if (statsVal) fields.push({ name: '📉 Stats', value: statsVal, inline: false });

  const desc = [c?.name ? `**${c.name}**` : '', c?.address || '', c?.consumerNo ? `Account: ${c.consumerNo} | Meter: ${c.meterNo || meter}` : '', c?.office ? `${c.office}${c.feeder ? ' | ' + c.feeder : ''}` : ''].filter(Boolean).join('\n');

  return {
    embeds: [{
      title: `⚡ ${provLabel} Meter: ${meter}`,
      description: desc,
      url: SITE_URL,
      color: prov === 'desco' ? 0xf97316 : 0x3b82f6,
      fields,
      footer: { text: `${provLabel} Prepaid Dashboard` },
      timestamp: new Date().toISOString(),
    }],
  };
}

function respond(content) {
  return Response.json({ type: 4, data: typeof content === 'string' ? { content } : content });
}

// Slash command definitions for registration
const SLASH_COMMANDS = [
  {
    name: 'help',
    description: 'Show available commands and usage guide',
  },
  {
    name: 'check',
    description: 'Full meter report with balance, history, and analytics',
    options: [
      { name: 'meter', type: 3, description: 'Meter or account number (8-12 digits)' },
      { name: 'provider', type: 3, description: 'Electricity provider', choices: [{ name: 'NESCO', value: 'nesco' }, { name: 'DESCO', value: 'desco' }] },
    ],
  },
  {
    name: 'balance',
    description: 'Quick balance check',
    options: [
      { name: 'meter', type: 3, description: 'Meter or account number (8-12 digits)' },
    ],
  },
  {
    name: 'token',
    description: 'Last recharge token/PIN',
    options: [
      { name: 'meter', type: 3, description: 'Meter or account number (8-12 digits)' },
    ],
  },
  {
    name: 'pin',
    description: 'Last recharge PIN (alias for /token)',
    options: [
      { name: 'meter', type: 3, description: 'Meter or account number (8-12 digits)' },
    ],
  },
  {
    name: 'provider',
    description: 'Set your default electricity provider',
    options: [
      { name: 'provider', type: 3, description: 'Provider to set as default', required: true, choices: [{ name: 'NESCO', value: 'nesco' }, { name: 'DESCO', value: 'desco' }] },
    ],
  },
  {
    name: 'save',
    description: 'Save a meter to your profile',
    options: [
      { name: 'meter', type: 3, description: 'Meter or account number (8-12 digits)', required: true },
      { name: 'provider', type: 3, description: 'Provider for this meter', choices: [{ name: 'NESCO', value: 'nesco' }, { name: 'DESCO', value: 'desco' }] },
    ],
  },
  {
    name: 'primary',
    description: 'Set your primary (default) meter',
    options: [
      { name: 'meter', type: 3, description: 'Meter or account number', required: true },
    ],
  },
  {
    name: 'meters',
    description: 'List all saved meters',
  },
  {
    name: 'remove',
    description: 'Remove a saved meter',
    options: [
      { name: 'meter', type: 3, description: 'Meter or account number to remove', required: true },
    ],
  },
];

export default async (req) => {
  const url = new URL(req.url);

  // GET /api/discord — health check
  if (req.method === 'GET') {
    // GET /api/discord?register=true&app_id=XXX&bot_token=XXX — register slash commands
    if (url.searchParams.get('register') === 'true') {
      const appId = url.searchParams.get('app_id');
      const botToken = url.searchParams.get('bot_token');
      if (!appId || !botToken) {
        return Response.json({ error: 'Provide app_id and bot_token query params' }, { status: 400 });
      }
      const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
        method: 'PUT',
        headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(SLASH_COMMANDS),
      });
      const result = await res.json();
      return Response.json({ ok: res.ok, status: res.status, commands: result });
    }
    return Response.json({ status: 'ok', bot: 'BD Meter Bot (NESCO + DESCO)', commands: SLASH_COMMANDS.map(c => c.name) });
  }

  try {
    const body = await req.json();

    // Discord ping verification
    if (body.type === 1) return Response.json({ type: 1 });

    // Slash command interactions
    if (body.type === 2) {
      const userId = body.member?.user?.id || body.user?.id;
      const cmdName = body.data?.name;
      const opts = {};
      (body.data?.options || []).forEach(o => { opts[o.name] = o.value; });
      const user = userId ? await getUser(userId) : { meters: [], primary: null, provider: 'nesco' };

      // Help
      if (cmdName === 'help') {
        let msg = `⚡ **BD Meter Bot**\nSupports **NESCO** & **DESCO**\n\n`;
        msg += `**Commands:**\n`;
        msg += `\`/check [meter]\` — Full meter report\n`;
        msg += `\`/balance [meter]\` — Quick balance\n`;
        msg += `\`/token [meter]\` or \`/pin [meter]\` — Last recharge PIN\n`;
        msg += `\`/provider nesco|desco\` — Set default provider\n`;
        msg += `\`/save meter\` — Save a meter\n`;
        msg += `\`/primary meter\` — Set primary meter\n`;
        msg += `\`/meters\` — List saved meters\n`;
        msg += `\`/remove meter\` — Remove a meter\n\n`;
        msg += `Default provider: **${(user.provider || 'nesco').toUpperCase()}**\n`;
        if (user.primary) msg += `Primary meter: \`${user.primary}\`\n`;
        msg += `\n🌐 ${SITE_URL}`;
        return respond(msg);
      }

      // Provider
      if (cmdName === 'provider') {
        const prov = String(opts.provider || '').toLowerCase();
        if (prov !== 'nesco' && prov !== 'desco') {
          return respond(`❌ Use \`/provider provider:nesco\` or \`desco\`.\nCurrent: **${(user.provider || 'nesco').toUpperCase()}**`);
        }
        user.provider = prov;
        if (userId) await saveUser(userId, user);
        return respond(`✅ Default provider: **${prov.toUpperCase()}**`);
      }

      // Check
      if (cmdName === 'check' || cmdName === 'meter') {
        const meter = parseMeter(opts.meter) || user.primary;
        if (!meter) return respond('❌ Provide a meter number: `/check meter:82044144`');
        const prov = opts.provider?.toLowerCase() || getMeterProvider(user, meter);
        const data = await fetchData(meter, prov);
        if (data.error) return respond(`❌ ${data.error}`);
        if (userId) { addMeter(user, meter, prov); await saveUser(userId, user); }
        return respond(buildEmbed(data, meter, prov));
      }

      // Balance
      if (cmdName === 'balance') {
        const meter = parseMeter(opts.meter) || user.primary;
        if (!meter) return respond('❌ No primary meter. Use `/check` first or provide a meter number.');
        const prov = getMeterProvider(user, meter);
        const data = await fetchData(meter, prov);
        if (data.error) return respond(`❌ ${data.error}`);
        if (userId) { addMeter(user, meter, prov); await saveUser(userId, user); }
        return respond(formatBalance(data, prov));
      }

      // Token / PIN
      if (cmdName === 'token' || cmdName === 'pin') {
        const meter = parseMeter(opts.meter) || user.primary;
        if (!meter) return respond('❌ No primary meter. Use `/check` first or provide a meter number.');
        const prov = getMeterProvider(user, meter);
        const data = await fetchData(meter, prov);
        if (data.error) return respond(`❌ ${data.error}`);
        if (userId) { addMeter(user, meter, prov); await saveUser(userId, user); }
        return respond(formatToken(data, prov));
      }

      // Save
      if (cmdName === 'save') {
        const meter = parseMeter(opts.meter);
        if (!meter) return respond('❌ Invalid meter number. Must be 8-12 digits.\nUsage: `/save meter:82044144`');
        const prov = opts.provider?.toLowerCase() || user.provider || 'nesco';
        addMeter(user, meter, prov);
        if (userId) await saveUser(userId, user);
        return respond(`✅ \`${meter}\` saved (${prov.toUpperCase()})! ${user.meters.length} meter(s) total.`);
      }

      // Primary
      if (cmdName === 'primary') {
        const meter = parseMeter(opts.meter);
        if (!meter) return respond('❌ Invalid meter number.');
        if (!findMeter(user, meter)) return respond('❌ Save it first with `/save`');
        user.primary = meter;
        if (userId) await saveUser(userId, user);
        return respond(`⭐ Primary: \`${meter}\``);
      }

      // Meters list
      if (cmdName === 'meters' || cmdName === 'list') {
        const list = meterList(user);
        if (!list.length) return respond('📋 No saved meters. Use `/check` to look up a meter first.');
        let msg = `📋 **Saved Meters (${list.length})**\n\n`;
        list.forEach((m, i) => {
          msg += `${i + 1}. \`${m.number}\` [${(m.provider || 'nesco').toUpperCase()}]${m.number === user.primary ? ' ⭐' : ''}\n`;
        });
        msg += `\nDefault: **${(user.provider || 'nesco').toUpperCase()}**`;
        return respond(msg);
      }

      // Remove
      if (cmdName === 'remove') {
        const meter = parseMeter(opts.meter);
        if (!meter) return respond('❌ Invalid meter number.');
        const before = user.meters.length;
        user.meters = user.meters.filter(m => (typeof m === 'object' ? m.number : m) !== meter);
        if (user.meters.length === before) return respond(`❌ Meter \`${meter}\` not found in saved list.`);
        if (user.primary === meter) user.primary = meterList(user)[0]?.number || null;
        if (userId) await saveUser(userId, user);
        return respond(`🗑️ \`${meter}\` removed.`);
      }

      return respond('❌ Unknown command. Try `/help` for a list of commands.');
    }

    return Response.json({ type: 1 });
  } catch (err) {
    console.error('Discord error:', err);
    return respond('❌ Something went wrong. Please try again.');
  }
};

export const config = { path: '/api/discord' };
