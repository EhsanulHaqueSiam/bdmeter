import { getStore } from '@netlify/blobs';

const SITE_URL = process.env.URL || 'https://nesco-meter.netlify.app';

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
async function saveUser(userId, data) { const store = getStore('discord-users'); await store.setJSON(String(userId), data); }

function findMeter(user, number) { return user.meters.find(m => (typeof m === 'object' ? m.number : m) === number); }
function getMeterProvider(user, number) { const m = findMeter(user, number); return (m && typeof m === 'object') ? m.provider || user.provider : user.provider || 'nesco'; }
function addMeter(user, number, provider) {
  const exists = user.meters.find(m => (typeof m === 'object' ? m.number : m) === number);
  if (!exists) user.meters.push({ number, provider });
  else if (typeof exists === 'object') exists.provider = provider;
  if (!user.primary) user.primary = number;
}
function meterList(user) { return user.meters.map(m => typeof m === 'object' ? m : { number: m, provider: user.provider || 'nesco' }); }

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

function respond(content) { return Response.json({ type: 4, data: typeof content === 'string' ? { content } : content }); }

export default async (req) => {
  if (req.method === 'GET') return Response.json({ status: 'ok', bot: 'Prepaid Meter Bot (NESCO + DESCO)' });

  try {
    const body = await req.json();
    if (body.type === 1) return Response.json({ type: 1 });

    if (body.type === 2) {
      const userId = body.member?.user?.id || body.user?.id;
      const cmdName = body.data?.name;
      const opts = {};
      (body.data?.options || []).forEach(o => { opts[o.name] = o.value; });
      const user = userId ? await getUser(userId) : { meters: [], primary: null, provider: 'nesco' };

      if (cmdName === 'provider') {
        const prov = String(opts.provider || '').toLowerCase();
        if (prov !== 'nesco' && prov !== 'desco') return respond(`❌ Use \`/provider provider:nesco\` or \`desco\`. Current: **${(user.provider||'nesco').toUpperCase()}**`);
        user.provider = prov;
        if (userId) await saveUser(userId, user);
        return respond(`✅ Default provider: **${prov.toUpperCase()}**`);
      }

      if (cmdName === 'check' || cmdName === 'meter') {
        const meter = String(opts.meter || user.primary || '').replace(/\D/g, '');
        if (!meter || meter.length < 8) return respond('❌ Provide a meter number: `/check meter:82044144`');
        const prov = opts.provider?.toLowerCase() || getMeterProvider(user, meter);
        const data = await fetchData(meter, prov);
        if (data.error) return respond(`❌ ${data.error}`);
        if (userId) { addMeter(user, meter, prov); await saveUser(userId, user); }
        return respond(buildEmbed(data, meter, prov));
      }

      if (cmdName === 'balance') {
        const meter = String(opts.meter || user.primary || '').replace(/\D/g, '');
        if (!meter) return respond('❌ No primary meter. Use `/check` first.');
        const prov = getMeterProvider(user, meter);
        const data = await fetchData(meter, prov);
        if (data.error) return respond(`❌ ${data.error}`);
        const bal = data.customerInfo?.balance ? parseFloat(data.customerInfo.balance) : 0;
        const last = data.rechargeHistory?.[0];
        let msg = `💰 **৳${bal.toFixed(2)}** (${prov.toUpperCase()})\n`;
        if (data.customerInfo?.currentMonthConsumption) msg += `This month: ৳${data.customerInfo.currentMonthConsumption}\n`;
        if (last) {
          msg += `Last: ৳${last.rechargeAmount} on ${last.date}\n`;
          if (prov === 'nesco') msg += last.status === 'Success' ? '✅ Auto-applied' : `⚠️ PIN: \`${last.tokenNo.replace(/\s/g, '')}\``;
        }
        return respond(msg);
      }

      if (cmdName === 'token') {
        const meter = String(opts.meter || user.primary || '').replace(/\D/g, '');
        if (!meter) return respond('❌ No primary meter.');
        const prov = getMeterProvider(user, meter);
        const data = await fetchData(meter, prov);
        if (data.error) return respond(`❌ ${data.error}`);
        const last = data.rechargeHistory?.[0];
        if (!last) return respond('❌ No recharge found.');
        return respond(`🔑 \`${last.tokenNo.replace(/\s/g, '')}\`\n৳${last.rechargeAmount} | ${last.date}\n${last.status === 'Success' ? '✅ Applied' : '⚠️ Enter PIN'}`);
      }

      if (cmdName === 'save') {
        const meter = String(opts.meter || '').replace(/\D/g, '');
        if (!meter || meter.length < 8) return respond('❌ Usage: `/save meter:82044144`');
        addMeter(user, meter, opts.provider?.toLowerCase() || user.provider || 'nesco');
        if (userId) await saveUser(userId, user);
        return respond(`✅ \`${meter}\` saved (${(opts.provider || user.provider || 'nesco').toUpperCase()})`);
      }

      if (cmdName === 'primary') {
        const meter = String(opts.meter || '').replace(/\D/g, '');
        if (!findMeter(user, meter)) return respond('❌ Save it first with `/save`');
        user.primary = meter;
        if (userId) await saveUser(userId, user);
        return respond(`⭐ Primary: \`${meter}\``);
      }

      if (cmdName === 'meters') {
        const list = meterList(user);
        if (!list.length) return respond('📋 No saved meters.');
        return respond(`📋 **Meters (${list.length})**\n${list.map((m,i) => `${i+1}. \`${m.number}\` [${m.provider.toUpperCase()}]${m.number===user.primary?' ⭐':''}`).join('\n')}\nDefault: **${(user.provider||'nesco').toUpperCase()}**`);
      }

      if (cmdName === 'remove') {
        const meter = String(opts.meter || '').replace(/\D/g, '');
        user.meters = user.meters.filter(m => (typeof m === 'object' ? m.number : m) !== meter);
        if (user.primary === meter) user.primary = meterList(user)[0]?.number || null;
        if (userId) await saveUser(userId, user);
        return respond(`🗑️ \`${meter}\` removed.`);
      }

      return respond('❌ Try `/check`, `/balance`, `/token`, `/save`, `/meters`, `/remove`, `/primary`, `/provider`');
    }
    return Response.json({ type: 1 });
  } catch (err) {
    console.error('Discord error:', err);
    return respond('❌ Something went wrong.');
  }
};

export const config = { path: '/api/discord' };
