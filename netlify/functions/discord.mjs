import { getStore } from '@netlify/blobs';

const SITE_URL = process.env.URL || 'https://nesco-meter.netlify.app';

async function fetchNesco(meter) {
  const res = await fetch(`${SITE_URL}/api/nesco?meter=${meter}`);
  return res.json();
}

async function getUser(userId) {
  try {
    const store = getStore('discord-users');
    return (await store.get(String(userId), { type: 'json' })) || { meters: [], primary: null };
  } catch { return { meters: [], primary: null }; }
}

async function saveUser(userId, userData) {
  const store = getStore('discord-users');
  await store.setJSON(String(userId), userData);
}

function buildEmbed(data, meter) {
  const { customerInfo: c, rechargeHistory, monthlyUsage } = data;
  const last = rechargeHistory?.[0];
  const latest = monthlyUsage?.[0];
  const balance = c?.balance ? parseFloat(c.balance) : latest?.endBalance || 0;
  const rate = latest && latest.usedKwh > 0 ? (latest.usedElectricity / latest.usedKwh).toFixed(2) : '?';
  const totalRecharged = rechargeHistory.reduce((s, r) => s + r.rechargeAmount, 0);
  const successCount = rechargeHistory.filter(r => r.status === 'Success').length;

  const fields = [];

  // Balance
  fields.push({ name: '💰 Balance', value: `**৳${balance.toFixed(2)}**`, inline: true });
  if (c?.tariff) fields.push({ name: '📄 Tariff', value: `${c.tariff} | ${c.approvedLoad || '?'} kW`, inline: true });
  if (c?.meterStatus) fields.push({ name: '⚙️ Status', value: `${c.meterType || 'Meter'} — ${c.meterStatus}`, inline: true });

  // Last recharge
  if (last) {
    const isAuto = last.status === 'Success';
    let rechargeVal = `**৳${last.rechargeAmount}** via ${last.medium}\n`;
    rechargeVal += `Electricity: ৳${last.electricity.toFixed(0)} (${last.probableKwh} kWh)\n`;
    rechargeVal += `VAT: ৳${last.vat.toFixed(0)}`;
    if (last.demandCharge > 0) rechargeVal += ` | Demand: ৳${last.demandCharge}`;
    if (last.meterRent > 0) rechargeVal += ` | Rent: ৳${last.meterRent}`;
    if (last.rebate < 0) rechargeVal += `\nRebate: ৳${Math.abs(last.rebate).toFixed(2)}`;
    rechargeVal += `\n${last.date}`;
    fields.push({ name: '📱 Last Recharge', value: rechargeVal, inline: false });

    fields.push({
      name: isAuto ? '✅ Remote Recharge' : '⚠️ Remote Recharge',
      value: isAuto ? 'Auto-applied to meter' : `Failed — enter PIN manually\n\`${last.tokenNo.replace(/\s/g, '')}\``,
      inline: false,
    });
  }

  // Current month
  if (latest) {
    let usageVal = `Recharged: ৳${latest.totalRecharge.toLocaleString()}\n`;
    usageVal += `Electricity: ৳${latest.usedElectricity.toFixed(0)} | **${latest.usedKwh} kWh**\n`;
    usageVal += `Rate: ৳${rate}/kWh\n`;
    usageVal += `VAT: ৳${latest.vat.toFixed(0)} | Demand: ৳${latest.demandCharge} | Rent: ৳${latest.meterRent}\n`;
    usageVal += `End Balance: ৳${latest.endBalance.toFixed(2)}`;
    fields.push({ name: `📊 ${latest.month} ${latest.year}`, value: usageVal, inline: false });
  }

  // Monthly summary
  if (monthlyUsage?.length > 1) {
    const summary = monthlyUsage.slice(0, 6).map(
      m => `**${m.month.slice(0, 3)} ${m.year}**: ৳${m.totalRecharge.toLocaleString()} | ${m.usedKwh} kWh`
    ).join('\n');
    fields.push({ name: '📈 Monthly History', value: summary, inline: false });
  }

  // Stats
  fields.push({
    name: '📉 Stats',
    value: `Total: ৳${totalRecharged.toLocaleString()} | Remote success: ${successCount}/${rechargeHistory.length} (${(successCount / rechargeHistory.length * 100).toFixed(0)}%) | Min recharge: ৳${c?.minRecharge || '?'}`,
    inline: false,
  });

  const desc = [];
  if (c?.name) desc.push(`**${c.name}**`);
  if (c?.address) desc.push(c.address);
  if (c?.consumerNo) desc.push(`Consumer: ${c.consumerNo} | Meter: ${c.meterNo || meter}`);
  if (c?.office) desc.push(`${c.office} | ${c.feeder || ''}`);

  return {
    embeds: [{
      title: `⚡ NESCO Meter: ${meter}`,
      description: desc.join('\n'),
      url: SITE_URL,
      color: 0x3b82f6,
      fields,
      footer: { text: 'NESCO Prepaid Dashboard' },
      timestamp: new Date().toISOString(),
    }],
  };
}

function respond(content) {
  return Response.json({ type: 4, data: typeof content === 'string' ? { content } : content });
}

export default async (req) => {
  if (req.method === 'GET') {
    return Response.json({ status: 'ok', bot: 'NESCO Discord Bot' });
  }

  try {
    const body = await req.json();

    if (body.type === 1) return Response.json({ type: 1 }); // Ping

    if (body.type === 2) {
      const userId = body.member?.user?.id || body.user?.id;
      const cmdName = body.data?.name;
      const options = {};
      (body.data?.options || []).forEach(o => { options[o.name] = o.value; });

      const user = userId ? await getUser(userId) : { meters: [], primary: null };

      if (cmdName === 'check' || cmdName === 'meter') {
        const meter = String(options.meter || user.primary || '').replace(/\D/g, '');
        if (!meter || meter.length < 8) return respond('❌ Provide a meter number: `/check meter:82044144`');

        const data = await fetchNesco(meter);
        if (data.error) return respond(`❌ ${data.error}`);

        if (userId && !user.meters.includes(meter)) { user.meters.push(meter); if (!user.primary) user.primary = meter; await saveUser(userId, user); }

        return respond(buildEmbed(data, meter));
      }

      if (cmdName === 'balance') {
        const meter = String(options.meter || user.primary || '').replace(/\D/g, '');
        if (!meter) return respond('❌ No primary meter. Use `/check meter:82044144` first.');
        const data = await fetchNesco(meter);
        if (data.error) return respond(`❌ ${data.error}`);
        const bal = data.customerInfo?.balance ? parseFloat(data.customerInfo.balance) : 0;
        const last = data.rechargeHistory?.[0];
        const isAuto = last?.status === 'Success';
        let msg = `💰 **৳${bal.toFixed(2)}**\n`;
        if (last) {
          msg += `Last: ৳${last.rechargeAmount} on ${last.date}\n`;
          msg += isAuto ? '✅ Auto-applied' : `⚠️ Enter PIN: \`${last.tokenNo.replace(/\s/g, '')}\``;
        }
        return respond(msg);
      }

      if (cmdName === 'token') {
        const meter = String(options.meter || user.primary || '').replace(/\D/g, '');
        if (!meter) return respond('❌ No primary meter set.');
        const data = await fetchNesco(meter);
        if (data.error) return respond(`❌ ${data.error}`);
        const last = data.rechargeHistory?.[0];
        if (!last) return respond('❌ No recharge found.');
        const isAuto = last.status === 'Success';
        return respond(`🔑 **Token:** \`${last.tokenNo.replace(/\s/g, '')}\`\n৳${last.rechargeAmount} | ${last.date}\n${isAuto ? '✅ Already auto-applied' : '⚠️ Enter this PIN in your meter'}`);
      }

      if (cmdName === 'save') {
        const meter = String(options.meter || '').replace(/\D/g, '');
        if (!meter || meter.length < 8) return respond('❌ Usage: `/save meter:82044144`');
        if (!user.meters.includes(meter)) user.meters.push(meter);
        if (!user.primary) user.primary = meter;
        if (userId) await saveUser(userId, user);
        return respond(`✅ Meter \`${meter}\` saved! (${user.meters.length} total)`);
      }

      if (cmdName === 'primary') {
        const meter = String(options.meter || '').replace(/\D/g, '');
        if (!user.meters.includes(meter)) return respond('❌ Save the meter first with `/save`');
        user.primary = meter;
        if (userId) await saveUser(userId, user);
        return respond(`⭐ Primary meter set to \`${meter}\``);
      }

      if (cmdName === 'meters') {
        if (user.meters.length === 0) return respond('📋 No saved meters. Use `/check meter:82044144` to start.');
        const list = user.meters.map((m, i) => `${i + 1}. \`${m}\`${m === user.primary ? ' ⭐' : ''}`).join('\n');
        return respond(`📋 **Saved Meters (${user.meters.length})**\n${list}`);
      }

      if (cmdName === 'remove') {
        const meter = String(options.meter || '').replace(/\D/g, '');
        user.meters = user.meters.filter(m => m !== meter);
        if (user.primary === meter) user.primary = user.meters[0] || null;
        if (userId) await saveUser(userId, user);
        return respond(`🗑️ Meter \`${meter}\` removed.`);
      }

      return respond('❌ Unknown command. Try `/check`, `/balance`, `/token`, `/save`, `/meters`, `/remove`, `/primary`');
    }

    return Response.json({ type: 1 });
  } catch (err) {
    console.error('Discord bot error:', err);
    return respond('❌ Something went wrong. Try again.');
  }
};

export const config = { path: '/api/discord' };
