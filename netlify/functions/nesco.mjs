import * as cheerio from 'cheerio';
import { checkRateLimit } from './rateLimit.mjs';

const BASE_URL = 'https://customer.nesco.gov.bd';
const PANEL_URL = `${BASE_URL}/pre/panel`;
const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0';

function getCookies(response) {
  const cookies = {};
  const sc = response.headers.getSetCookie?.() || [];
  for (const h of sc) {
    const c = h.split(';')[0];
    const eq = c.indexOf('=');
    if (eq > 0) cookies[c.substring(0, eq)] = c.substring(eq + 1);
  }
  if (Object.keys(cookies).length > 0) return cookies;

  // Fallback: raw header regex
  const raw = response.headers.get('set-cookie') || '';
  for (const name of ['XSRF-TOKEN', 'customer_service_portal_session']) {
    const m = raw.match(new RegExp(`${name}=([^;]+)`));
    if (m) cookies[name] = m[1];
  }
  return cookies;
}

function toCookieStr(cookies) {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function fetchNesco(custNo, submitLabel) {
  // GET page for token + cookies
  const getRes = await fetch(PANEL_URL, {
    headers: { 'User-Agent': UA },
  });
  const html = await getRes.text();
  const cookies = getCookies(getRes);

  const $ = cheerio.load(html);
  const token = $('input[name="_token"]').val() || $('meta[name="csrf-token"]').attr('content');
  if (!token) throw new Error('No CSRF token');

  // POST for data
  const postRes = await fetch(PANEL_URL, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': toCookieStr(cookies),
      'Origin': BASE_URL,
      'Referer': PANEL_URL,
    },
    body: new URLSearchParams({
      _token: token,
      cust_no: custNo,
      submit: submitLabel,
    }).toString(),
  });

  const postHtml = await postRes.text();
  if (postHtml.includes('Page Expired')) throw new Error('CSRF expired');
  return cheerio.load(postHtml);
}

function parseCustomerInfo($) {
  const info = {};

  // NESCO puts customer values in disabled <input> elements after label text.
  // Structure: <label>...Bengali label...</label> <div><input disabled value="VALUE"></div>
  // Extract all disabled input values in order - they map to known fields.
  const fieldKeys = [
    'name', 'fatherName', 'address', 'mobile', 'office', 'feeder',
    'consumerNo', 'meterNo', 'approvedLoad', 'tariff', 'meterType',
    'meterStatus', 'installDate', 'minRecharge', 'balance',
  ];

  const section = $('section').first();
  const beforeTable = section.html()?.split('<table')[0] || '';
  const $info = cheerio.load(beforeTable);
  $info('input[disabled]').each((i, el) => {
    const val = $info(el).attr('value')?.trim() || '';
    if (i < fieldKeys.length) {
      info[fieldKeys[i]] = val;
    }
  });

  // Keep a stable customer info shape even when portal omits some values.
  fieldKeys.forEach((key) => {
    if (info[key] == null) info[key] = '';
  });

  // Extract balance timestamp from the label's <span>
  const allText = section.text() || '';
  const timeMatch = allText.match(/সময়ঃ\s*([\s\S]*?)\)/);
  if (timeMatch) info.balanceTime = timeMatch[1].trim();
  if (!info.balanceTime) info.balanceTime = '';

  return info;
}

function parseRechargeHistory($) {
  const rows = [];
  $('table').first().find('tr').each((i, row) => {
    if (i === 0) return;
    const cells = [];
    $(row).find('td').each((_, cell) => {
      cells.push($(cell).text().trim().replace(/\s+/g, ' '));
    });
    if (cells.length >= 14) {
      rows.push({
        serial: cells[0], seqNo: cells[1], tokenNo: cells[2],
        meterRent: parseFloat(cells[3]) || 0,
        demandCharge: parseFloat(cells[4]) || 0,
        pfcCharge: parseFloat(cells[5]) || 0,
        vat: parseFloat(cells[6]) || 0,
        paidDues: parseFloat(cells[7]) || 0,
        rebate: parseFloat(cells[8]) || 0,
        electricity: parseFloat(cells[9]) || 0,
        rechargeAmount: parseFloat(cells[10]) || 0,
        probableKwh: parseFloat(cells[11]) || 0,
        medium: cells[12], date: cells[13], status: cells[14] || '',
      });
    }
  });
  return rows;
}

function parseMonthlyUsage($) {
  const rows = [];
  $('table').first().find('tr').each((i, row) => {
    if (i === 0) return;
    const cells = [];
    $(row).find('td').each((_, cell) => {
      cells.push($(cell).text().trim().replace(/,/g, ''));
    });
    if (cells.length >= 13) {
      rows.push({
        year: cells[0], month: cells[1],
        totalRecharge: parseFloat(cells[2]) || 0,
        rebate: parseFloat(cells[3]) || 0,
        usedElectricity: parseFloat(cells[4]) || 0,
        meterRent: parseFloat(cells[5]) || 0,
        demandCharge: parseFloat(cells[6]) || 0,
        pfcCharge: parseFloat(cells[7]) || 0,
        paidDues: parseFloat(cells[8]) || 0,
        vat: parseFloat(cells[9]) || 0,
        totalUsage: parseFloat(cells[10]) || 0,
        endBalance: parseFloat(cells[11]) || 0,
        usedKwh: parseFloat(cells[12]) || 0,
      });
    }
  });
  return rows;
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
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
  const custNo = url.searchParams.get('meter');

  if (!custNo || !/^\d+$/.test(custNo) || custNo.length < 8 || custNo.length > 11) {
    return Response.json({ error: 'Invalid NESCO number. Use an 8-11 digit prepaid customer or meter number.' }, { status: 400 });
  }

  try {
    const $recharge = await fetchNesco(custNo, 'রিচার্জ হিস্ট্রি');
    const customerInfo = parseCustomerInfo($recharge);
    const rechargeHistory = parseRechargeHistory($recharge);

    const $monthly = await fetchNesco(custNo, 'মাসিক ব্যবহার');
    const monthlyUsage = parseMonthlyUsage($monthly);

    return Response.json({
      provider: 'nesco',
      customerInfo,
      rechargeHistory,
      monthlyUsage,
      previousMonthlyUsage: [],
      dailyConsumption: [],
      descoInsights: null,
      meta: {
        rechargeHistorySource: 'live',
        monthlyUsageSource: 'live',
      },
      fetchedAt: new Date().toISOString(),
    }, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err) {
    console.error('NESCO error:', err.message);
    return Response.json({ error: `Failed: ${err.message}` }, { status: 502 });
  }
};

export const config = {
  path: '/api/nesco',
};
