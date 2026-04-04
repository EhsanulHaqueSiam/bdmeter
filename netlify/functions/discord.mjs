async function fetchNescoData(meter) {
  const siteUrl = process.env.URL || 'https://nesco.netlify.app';
  const res = await fetch(`${siteUrl}/api/nesco?meter=${meter}`);
  return res.json();
}

function formatDiscordEmbed(data, meter) {
  const { customerInfo, rechargeHistory, monthlyUsage } = data;
  const last = rechargeHistory?.[0];
  const latest = monthlyUsage?.[0];

  const balance = customerInfo?.balance
    ? parseFloat(customerInfo.balance.replace(/[^\d.-]/g, ''))
    : latest?.endBalance || 0;

  const fields = [];

  fields.push({
    name: '💰 Balance',
    value: `৳${balance.toFixed(2)}`,
    inline: true,
  });

  if (last) {
    fields.push({
      name: '📱 Last Recharge',
      value: `৳${last.rechargeAmount} (${last.status})`,
      inline: true,
    });
    fields.push({
      name: '📅 Date',
      value: last.date,
      inline: true,
    });
  }

  if (latest) {
    fields.push({
      name: `📊 ${latest.month} ${latest.year}`,
      value: `${latest.usedKwh} kWh | ৳${latest.usedElectricity.toFixed(0)}`,
      inline: true,
    });
    fields.push({
      name: '💵 Recharged',
      value: `৳${latest.totalRecharge.toLocaleString()}`,
      inline: true,
    });
    fields.push({
      name: '📈 Avg Rate',
      value: `৳${(latest.usedElectricity / latest.usedKwh).toFixed(2)}/kWh`,
      inline: true,
    });
  }

  if (monthlyUsage?.length > 1) {
    const summary = monthlyUsage.slice(0, 5).map(
      m => `**${m.month.slice(0,3)} ${m.year}**: ৳${m.totalRecharge.toLocaleString()} | ${m.usedKwh} kWh`
    ).join('\n');
    fields.push({
      name: '📋 Recent Months',
      value: summary,
      inline: false,
    });
  }

  return {
    type: 4,
    data: {
      embeds: [{
        title: `⚡ NESCO Meter: ${meter}`,
        description: customerInfo?.name ? `**${customerInfo.name}**\n${customerInfo?.address || ''}` : `Meter ${meter}`,
        color: 0x3b82f6,
        fields,
        footer: { text: 'NESCO Prepaid Dashboard' },
        timestamp: new Date().toISOString(),
      }],
    },
  };
}

export default async (req) => {
  if (req.method === 'GET') {
    // Discord bot interaction verification or health check
    return Response.json({ status: 'ok', bot: 'NESCO Discord Bot' });
  }

  try {
    const body = await req.json();

    // Handle Discord interactions (slash commands)
    if (body.type === 1) {
      // Ping/Pong verification
      return Response.json({ type: 1 });
    }

    if (body.type === 2) {
      // Slash command
      const meter = body.data?.options?.[0]?.value;
      if (!meter || !/^\d{8,11}$/.test(meter)) {
        return Response.json({
          type: 4,
          data: { content: '❌ Please provide a valid 8-11 digit meter number.' },
        });
      }

      // Acknowledge first, then respond
      // For immediate response:
      const data = await fetchNescoData(meter);
      if (data.error) {
        return Response.json({
          type: 4,
          data: { content: `❌ ${data.error}` },
        });
      }

      return Response.json(formatDiscordEmbed(data, meter));
    }

    return Response.json({ type: 1 });
  } catch (err) {
    console.error('Discord bot error:', err);
    return Response.json({
      type: 4,
      data: { content: '❌ Failed to fetch meter data. Please try again.' },
    });
  }
};

export const config = {
  path: '/api/discord',
};
