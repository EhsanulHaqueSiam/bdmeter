import https from 'node:https';

// DESCO's SSL cert has an incomplete chain — skip verification for their domain
const agent = new https.Agent({ rejectUnauthorized: false });

const BASE = 'https://prepaid.desco.org.bd/api';
const SMART_BASE = 'https://smartprepaid.desco.org.bd/PrePay/v1';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';

function nodeFetch(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'GET',
      agent,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': UA,
        ...extraHeaders,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ code: res.statusCode, error: data.slice(0, 200) }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

async function descoFetch(url) {
  return nodeFetch(url, { 'Referer': 'https://prepaid.desco.org.bd/customer/' });
}

async function smartFetch(url) {
  return nodeFetch(url, { 'Origin': 'https://prepaid.desco.org.bd', 'Referer': 'https://prepaid.desco.org.bd/' });
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
  }

  const url = new URL(req.url);
  const accountNo = url.searchParams.get('account') || '';
  const meterNo = url.searchParams.get('meter') || '';

  if (!accountNo && !meterNo) {
    return Response.json({ error: 'Provide account or meter number.' }, { status: 400 });
  }

  // Build query string — DESCO accepts either or both
  const qs = [
    accountNo ? `accountNo=${accountNo}` : '',
    meterNo ? `meterNo=${meterNo}` : '',
  ].filter(Boolean).join('&');

  try {
    // Step 1: Get customer info (this gives us both accountNo and meterNo)
    const infoRes = await descoFetch(`${BASE}/tkdes/customer/getCustomerInfo?${qs}`);
    if (infoRes.code !== 200 || !infoRes.data) {
      return Response.json({ error: 'Customer not found. Check your account/meter number.' }, { status: 404 });
    }

    const info = infoRes.data;
    const acct = info.accountNo;
    const meter = info.meterNo;
    const bothQs = `accountNo=${acct}&meterNo=${meter}`;

    // Date ranges — DESCO enforces max 12 months
    // Match DESCO's own site: first of current month last year → last day of previous month
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setDate(1); // first of that month
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const fmt = (d) => d.toISOString().slice(0, 10);
    const fmtMonth = (d) => d.toISOString().slice(0, 7);

    // Fetch all data in parallel
    const [balanceRes, rechargeRes, monthlyRes, dailyRes, locationRes, minRechargeRes] = await Promise.all([
      descoFetch(`${BASE}/tkdes/customer/getBalance?${bothQs}`),
      descoFetch(`${BASE}/tkdes/customer/getRechargeHistory?${bothQs}&dateFrom=${fmt(oneYearAgo)}&dateTo=${fmt(now)}`),
      descoFetch(`${BASE}/tkdes/customer/getCustomerMonthlyConsumption?${bothQs}&monthFrom=${fmtMonth(oneYearAgo)}&monthTo=${fmtMonth(now)}`),
      descoFetch(`${BASE}/tkdes/customer/getCustomerDailyConsumption?${bothQs}&dateFrom=${fmt(twoWeeksAgo)}&dateTo=${fmt(now)}`),
      descoFetch(`${BASE}/common/getCustomerLocation?accountNo=${acct}`),
      smartFetch(`${SMART_BASE}/customer/min/recharge?${bothQs}`).catch(() => ({ data: null })),
    ]);

    // Normalize customer info
    const customerInfo = {
      name: info.customerName || '',
      address: info.installationAddress || '',
      mobile: info.contactNo || '',
      office: info.SDName || '',
      feeder: info.feederName || '',
      consumerNo: acct,
      meterNo: meter,
      approvedLoad: String(info.sanctionLoad || ''),
      tariff: info.tariffSolution || '',
      meterType: info.phaseType || '',
      meterStatus: 'Active',
      installDate: info.installationDate?.split(' ')[0] || '',
      minRecharge: minRechargeRes?.data != null ? String(minRechargeRes.data) : '',
      balance: balanceRes?.data?.balance != null ? String(balanceRes.data.balance) : '0',
      balanceTime: balanceRes?.data?.readingTime || '',
      currentMonthConsumption: balanceRes?.data?.currentMonthConsumption || 0,
      zone: locationRes?.data?.zone || '',
      block: locationRes?.data?.block || '',
      route: locationRes?.data?.route || '',
      dueStatus: locationRes?.dueStatus || 'False',
      customerDue: locationRes?.customerDue || null,
    };

    // Normalize recharge history
    const rechargeHistory = (rechargeRes?.data || []).map((r, i) => {
      // Extract demand charge and meter rent from chargeItems array
      let demandCharge = 0;
      let meterRent = 0;
      (r.chargeItems || []).forEach((item) => {
        if (item.chargeItemName?.toLowerCase().includes('demand')) demandCharge += item.chargeAmount || 0;
        else if (item.chargeItemName?.toLowerCase().includes('rent')) meterRent += item.chargeAmount || 0;
      });

      const electricity = r.energyAmount || 0;
      // DESCO doesn't return kWh per recharge — estimate from energy amount and tariff rate
      // Use monthly consumption data rate if available, otherwise use a reasonable default
      const probableKwh = Number.isFinite(Number(r.energyUnit)) && Number(r.energyUnit) > 0
        ? Number(r.energyUnit)
        : 0;

      return {
        serial: String(i + 1),
        seqNo: String(r.seqNo || ''),
        tokenNo: r.tokenNo || '',
        meterRent,
        demandCharge,
        pfcCharge: 0,
        vat: r.VAT || 0,
        paidDues: 0,
        rebate: r.rebate || 0,
        electricity,
        probableKwh,
        rechargeAmount: r.totalAmount || 0,
        medium: r.rechargeOperator || 'Online',
        date: r.rechargeDate || '',
        status: r.orderStatus === 'Successful' ? 'Success' : r.orderStatus || '',
        orderId: r.orderID || '',
        revenue: r.revenue || 0,
      };
    });

    // Normalize monthly usage
    const monthlyUsage = (monthlyRes?.data || []).reverse().map((m) => {
      const [year, monthNum] = (m.month || '').split('-');
      const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return {
        year: year || '',
        month: monthNames[parseInt(monthNum)] || monthNum || '',
        totalRecharge: 0, // DESCO monthly doesn't have recharge totals
        rebate: 0,
        usedElectricity: m.consumedTaka || 0,
        meterRent: 0,
        demandCharge: 0,
        pfcCharge: 0,
        paidDues: 0,
        vat: 0,
        totalUsage: m.consumedTaka || 0,
        endBalance: 0,
        usedKwh: m.consumedUnit || 0,
        maxDemand: m.maximumDemand || 0,
      };
    });

    // Daily consumption
    const dailyConsumption = (dailyRes?.data || []).map((d) => ({
      date: d.date || '',
      consumedTaka: d.consumedTaka || 0,
      consumedUnit: d.consumedUnit || 0,
    }));

    return Response.json({
      provider: 'desco',
      customerInfo,
      rechargeHistory,
      monthlyUsage,
      dailyConsumption,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err) {
    console.error('DESCO error:', err.message);
    return Response.json({ error: `Failed to fetch DESCO data: ${err.message}` }, { status: 502 });
  }
};

export const config = { path: '/api/desco' };
