import * as cheerio from 'cheerio';

const BASE_URL = 'https://customer.nesco.gov.bd';
const PANEL_URL = `${BASE_URL}/pre/panel`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': BASE_URL,
  'Referer': PANEL_URL,
};

function extractCookies(response) {
  const cookies = [];
  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  for (const header of setCookieHeaders) {
    const cookie = header.split(';')[0];
    cookies.push(cookie);
  }
  return cookies.join('; ');
}

async function getSession() {
  const res = await fetch(PANEL_URL, {
    headers: HEADERS,
    redirect: 'manual',
  });

  let cookies = extractCookies(res);
  const html = await res.text();

  // Handle redirect
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');
    if (location) {
      const res2 = await fetch(location.startsWith('http') ? location : `${BASE_URL}${location}`, {
        headers: { ...HEADERS, Cookie: cookies },
        redirect: 'manual',
      });
      const newCookies = extractCookies(res2);
      if (newCookies) cookies = newCookies;
      const html2 = await res2.text();
      const $2 = cheerio.load(html2);
      const token = $2('input[name="_token"]').val() || $2('meta[name="csrf-token"]').attr('content');
      return { token, cookies };
    }
  }

  const $ = cheerio.load(html);
  const token = $('input[name="_token"]').val() || $('meta[name="csrf-token"]').attr('content');
  return { token, cookies };
}

async function fetchPage(custNo, submitType, cookies, token) {
  const submitValues = {
    recharge: 'রিচার্জ হিস্ট্রি',
    monthly: 'মাসিক ব্যবহার',
  };

  const body = new URLSearchParams({
    _token: token,
    cust_no: custNo,
    submit: submitValues[submitType],
  });

  const res = await fetch(PANEL_URL, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies,
    },
    body: body.toString(),
    redirect: 'follow',
  });

  const newCookies = extractCookies(res);
  const html = await res.text();
  const $ = cheerio.load(html);
  const newToken = $('input[name="_token"]').val() || $('meta[name="csrf-token"]').attr('content');

  return { html, $, newToken, cookies: newCookies || cookies };
}

function parseCustomerInfo($) {
  const info = {};
  const labels = [
    ['name', 'গ্রাহকের নাম'],
    ['fatherName', 'পিতা/স্বামীর নাম'],
    ['address', 'ঠিকানা'],
    ['mobile', 'মোবাইল'],
    ['office', 'সংশ্লিষ্ট বিদ্যুৎ অফিস'],
    ['feeder', 'ফিডারের নাম'],
    ['consumerNo', 'কনজ্যুমার নম্বর'],
    ['meterNo', 'মিটার নম্বর'],
    ['approvedLoad', 'অনুমোদিত লোড'],
    ['tariff', 'অনুমোদিত ট্যারিফ'],
    ['meterType', 'মিটারের ধরণ'],
    ['meterStatus', 'মিটার স্ট্যাটাস'],
    ['installDate', 'মিটার স্থাপনের তারিখ'],
    ['minRecharge', 'মিনিমাম রিচার্জের পরিমাণ'],
    ['balance', 'অবশিষ্ট ব্যালেন্স'],
  ];

  labels.forEach(([key, label]) => {
    $('label').each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes(label)) {
        const row = $(el).closest('.form-group, .row, div');
        const valueEl = row.find('span, .col-md-4, .col-md-3').last();
        let value = valueEl.text().trim();
        if (!value) {
          const siblings = row.find('div').not($(el).parent());
          value = siblings.text().trim();
        }
        if (value) info[key] = value;
      }
    });
  });

  // Also try extracting from the broader HTML structure
  const mainContent = $('main').html() || $('body').html();
  const textContent = $('section').first().text();

  // Try extracting balance timestamp
  const timeMatch = textContent?.match(/সময়ঃ\s*([\s\S]*?)\)/);
  if (timeMatch) info.balanceTime = timeMatch[1].trim();

  return info;
}

function parseRechargeHistory($) {
  const rows = [];
  const table = $('table').first();

  table.find('tbody tr, tr').each((i, row) => {
    if (i === 0) return; // skip header
    const cells = [];
    $(row).find('td').each((_, cell) => {
      cells.push($(cell).text().trim().replace(/\s+/g, ' '));
    });
    if (cells.length >= 14) {
      rows.push({
        serial: cells[0],
        seqNo: cells[1],
        tokenNo: cells[2],
        meterRent: parseFloat(cells[3]) || 0,
        demandCharge: parseFloat(cells[4]) || 0,
        pfcCharge: parseFloat(cells[5]) || 0,
        vat: parseFloat(cells[6]) || 0,
        paidDues: parseFloat(cells[7]) || 0,
        rebate: parseFloat(cells[8]) || 0,
        electricity: parseFloat(cells[9]) || 0,
        rechargeAmount: parseFloat(cells[10]) || 0,
        probableKwh: parseFloat(cells[11]) || 0,
        medium: cells[12],
        date: cells[13],
        status: cells[14] || '',
      });
    }
  });

  return rows;
}

function parseMonthlyUsage($) {
  const rows = [];
  const table = $('table').first();

  table.find('tbody tr, tr').each((i, row) => {
    if (i === 0) return; // skip header
    const cells = [];
    $(row).find('td').each((_, cell) => {
      cells.push($(cell).text().trim().replace(/,/g, ''));
    });
    if (cells.length >= 12) {
      rows.push({
        year: cells[0],
        month: cells[1],
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
  // Handle CORS preflight
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

  const url = new URL(req.url);
  const custNo = url.searchParams.get('meter');

  if (!custNo || custNo.length < 8 || custNo.length > 11 || !/^\d+$/.test(custNo)) {
    return Response.json(
      { error: 'Invalid meter number. Must be 8-11 digits.' },
      { status: 400 }
    );
  }

  try {
    // Step 1: Get session
    const session = await getSession();
    if (!session.token) {
      return Response.json({ error: 'Failed to get session from NESCO' }, { status: 502 });
    }

    // Step 2: Fetch recharge history
    const rechargeResult = await fetchPage(custNo, 'recharge', session.cookies, session.token);
    const customerInfo = parseCustomerInfo(rechargeResult.$);
    const rechargeHistory = parseRechargeHistory(rechargeResult.$);

    // Check if we got valid data (look for error messages)
    const pageText = rechargeResult.$.text();
    if (pageText.includes('Page Expired') || pageText.includes('419')) {
      return Response.json({ error: 'Session expired. Please try again.' }, { status: 502 });
    }

    // Step 3: Get new session for monthly usage
    const session2 = await getSession();

    // Step 4: Fetch monthly usage
    const monthlyResult = await fetchPage(custNo, 'monthly', session2.cookies, session2.token);
    const monthlyUsage = parseMonthlyUsage(monthlyResult.$);

    return Response.json({
      customerInfo,
      rechargeHistory,
      monthlyUsage,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    console.error('NESCO fetch error:', err);
    return Response.json(
      { error: 'Failed to fetch data from NESCO. Please try again.' },
      { status: 502 }
    );
  }
};

export const config = {
  path: '/api/nesco',
};
