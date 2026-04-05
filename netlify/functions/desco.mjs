import https from 'node:https';
import { getStore } from '@netlify/blobs';
import { checkRateLimit } from './rateLimit.mjs';

// DESCO's SSL cert has an incomplete chain — skip verification for their domain
const agent = new https.Agent({ rejectUnauthorized: false });

const BASE = 'https://prepaid.desco.org.bd/api';
const SMART_BASE = 'https://smartprepaid.desco.org.bd/PrePay/v1';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';
const RECHARGE_HISTORY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RECHARGE_HISTORY_CACHE_LIMIT = 180;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(task, {
  attempts = 3,
  baseDelayMs = 600,
} = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await wait(baseDelayMs * attempt);
      }
    }
  }
  throw lastError || new Error('request failed');
}

function rechargeHistoryCacheKey(accountNo, meterNo) {
  return `recharge-history:${accountNo}:${meterNo}`;
}

async function readRechargeHistoryCache(accountNo, meterNo) {
  try {
    const store = getStore('desco-cache');
    const cached = await store.get(rechargeHistoryCacheKey(accountNo, meterNo), { type: 'json' });
    if (!cached || !Array.isArray(cached.rows)) return null;

    const updatedAt = Number(cached.updatedAt) || 0;
    if (!updatedAt) return null;
    if ((Date.now() - updatedAt) > RECHARGE_HISTORY_CACHE_TTL_MS) return null;

    return {
      updatedAt,
      rows: cached.rows,
    };
  } catch {
    return null;
  }
}

async function writeRechargeHistoryCache(accountNo, meterNo, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  try {
    const store = getStore('desco-cache');
    await store.setJSON(rechargeHistoryCacheKey(accountNo, meterNo), {
      updatedAt: Date.now(),
      rows: rows.slice(0, RECHARGE_HISTORY_CACHE_LIMIT),
    });
  } catch {
    // Cache failures should never fail the request.
  }
}

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

  const { limited } = await checkRateLimit(req);
  if (limited) {
    return Response.json({ error: 'Too many requests. Please try again later.' }, {
      status: 429,
      headers: { 'Access-Control-Allow-Origin': '*', 'Retry-After': '60' },
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

    // Date ranges — DESCO enforces strict max 12 months for both date and month APIs
    const now = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const fmtMonth = (d) => d.toISOString().slice(0, 7);

    // For recharge history: exactly 1 year back from today (dateFrom/dateTo format)
    const rechargeFrom = new Date(now);
    rechargeFrom.setFullYear(rechargeFrom.getFullYear() - 1);
    rechargeFrom.setDate(rechargeFrom.getDate() + 1); // +1 day to stay within 12 months

    // For monthly consumption: DESCO counts both endpoints as months, so 2025-05 → 2026-04 = 12 months
    const monthlyFrom = new Date(now);
    monthlyFrom.setMonth(monthlyFrom.getMonth() - 10);
    monthlyFrom.setDate(1);

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const balanceUrl = `${BASE}/tkdes/customer/getBalance?${bothQs}`;
    const rechargeUrl = `${BASE}/tkdes/customer/getRechargeHistory?${bothQs}&dateFrom=${fmt(rechargeFrom)}&dateTo=${fmt(now)}`;
    const monthlyUrl = `${BASE}/tkdes/customer/getCustomerMonthlyConsumption?${bothQs}&monthFrom=${fmtMonth(monthlyFrom)}&monthTo=${fmtMonth(now)}`;
    const dailyUrl = `${BASE}/tkdes/customer/getCustomerDailyConsumption?${bothQs}&dateFrom=${fmt(twoWeeksAgo)}&dateTo=${fmt(now)}`;
    const locationUrl = `${BASE}/common/getCustomerLocation?accountNo=${acct}`;
    const minRechargeUrl = `${SMART_BASE}/customer/min/recharge?${bothQs}`;

    // Recharge history is the most unstable DESCO endpoint.
    // Treat it as soft-fail and fall back to last-good cache if live fetch fails.
    const rechargeResPromise = withRetry(() => descoFetch(rechargeUrl), {
      attempts: 4,
      baseDelayMs: 900,
    }).catch(() => null);

    // Fetch other data in parallel. Keep optional endpoints non-blocking.
    const [balanceRes, monthlyRes, dailyRes, locationRes, minRechargeRes, rechargeRes] = await Promise.all([
      withRetry(() => descoFetch(balanceUrl), { attempts: 2, baseDelayMs: 400 }),
      withRetry(() => descoFetch(monthlyUrl), { attempts: 2, baseDelayMs: 700 }),
      withRetry(() => descoFetch(dailyUrl), { attempts: 2, baseDelayMs: 600 }).catch(() => ({ data: [] })),
      descoFetch(locationUrl).catch(() => ({ data: null, dueStatus: 'False', customerDue: null })),
      smartFetch(minRechargeUrl).catch(() => ({ data: null })),
      rechargeResPromise,
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

    // Normalize recharge history (live response if available)
    const liveRechargeHistory = Array.isArray(rechargeRes?.data) ? rechargeRes.data.map((r, i) => {
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
    }) : [];

    let rechargeHistory = liveRechargeHistory;
    let rechargeHistorySource = 'live';
    let rechargeHistoryCachedAt = null;

    if (!liveRechargeHistory.length) {
      const cachedHistory = await readRechargeHistoryCache(acct, meter);
      if (cachedHistory?.rows?.length) {
        rechargeHistory = cachedHistory.rows;
        rechargeHistorySource = 'cache';
        rechargeHistoryCachedAt = new Date(cachedHistory.updatedAt).toISOString();
      } else {
        rechargeHistory = [];
        rechargeHistorySource = 'empty';
      }
    } else {
      await writeRechargeHistoryCache(acct, meter, liveRechargeHistory);
    }

    // Compute monthly recharge totals from recharge history
    const monthlyRechargeTotals = {};
    rechargeHistory.forEach((r) => {
      const match = r.date.match(/^(\d{4}-\d{2})/);
      if (match) {
        const key = match[1];
        if (!monthlyRechargeTotals[key]) monthlyRechargeTotals[key] = { total: 0, vat: 0, demand: 0, rent: 0, rebate: 0 };
        monthlyRechargeTotals[key].total += r.rechargeAmount;
        monthlyRechargeTotals[key].vat += r.vat;
        monthlyRechargeTotals[key].demand += r.demandCharge;
        monthlyRechargeTotals[key].rent += r.meterRent;
        monthlyRechargeTotals[key].rebate += r.rebate;
      }
    });

    // Normalize monthly usage — sort by month descending (newest first)
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthlyUsage = (monthlyRes?.data || [])
      .sort((a, b) => (b.month || '').localeCompare(a.month || ''))
      .map((m) => {
        const [year, monthNum] = (m.month || '').split('-');
        const rt = monthlyRechargeTotals[m.month] || {};
        return {
          year: year || '',
          month: monthNames[parseInt(monthNum)] || monthNum || '',
          totalRecharge: rt.total || 0,
          rebate: rt.rebate || 0,
          usedElectricity: m.consumedTaka || 0,
          meterRent: rt.rent || 0,
          demandCharge: rt.demand || 0,
          pfcCharge: 0,
          paidDues: 0,
          vat: rt.vat || 0,
          totalUsage: m.consumedTaka || 0,
          endBalance: 0,
          usedKwh: m.consumedUnit || 0,
          maxDemand: m.maximumDemand || 0,
        };
      });

    // DESCO monthly API doesn't provide month-end balance.
    // Reconstruct a rolling estimate using current balance and monthly net flow.
    // Keep negatives as-is because meters can legitimately go into due/negative states.
    const currentBalanceNum = Number(balanceRes?.data?.balance);
    let rollingBalance = Number.isFinite(currentBalanceNum) ? currentBalanceNum : 0;
    monthlyUsage.forEach((m) => {
      m.endBalance = Number(rollingBalance.toFixed(2));

      const netFlow = (Number(m.totalRecharge) || 0) - (Number(m.totalUsage) || 0);
      rollingBalance = rollingBalance - netFlow;
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
      meta: {
        rechargeHistorySource,
        rechargeHistoryCachedAt,
      },
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
