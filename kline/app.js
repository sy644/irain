// ============================================
// 自选股存储
// ============================================
const STORAGE_KEY = 'stocks_v1';
const DEFAULT_STOCKS = [
  { code: 'sh600519', name: '贵州茅台', market: 'sh' },
  { code: 'sz000001', name: '平安银行', market: 'sz' },
  { code: 'sz300750', name: '宁德时代', market: 'sz' },
  { code: 'sh000001', name: '上证指数', market: 'sh' },
  { code: 'sz399001', name: '深证成指', market: 'sz' },
];

function loadStocks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_STOCKS];
    const list = JSON.parse(raw);
    return list.length ? list : [...DEFAULT_STOCKS];
  } catch { return [...DEFAULT_STOCKS]; }
}
function saveStocks(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function addStock(code) {
  const list = loadStocks();
  let c = code.toLowerCase().trim();
  if (/^\d{6}$/.test(c)) {
    const head = c[0];
    if (c.startsWith('000') || c.startsWith('6') || c.startsWith('9') || c.startsWith('5')) c = 'sh' + c;
    else if (c.startsWith('399') || c.startsWith('1') || c.startsWith('0') || c.startsWith('3')) c = 'sz' + c;
    else if (head === '4' || head === '8') c = 'bj' + c;
    else c = 'sh' + c;
  } else if (!/^([a-z]{2,3})\d{6}$/.test(c)) {
    return { list, added: false, reason: 'invalid' };
  }
  if (list.some(s => s.code === c)) return { list, added: false, reason: 'duplicate' };
  const m = c.startsWith('sh') ? 'sh' : c.startsWith('sz') ? 'sz' : 'bj';
  const num = c.replace(/^[a-z]+/, '');
  const h1 = num[0], h2 = num[1];
  let type = 'stock';
  if (h1 === '5' && (h2 === '0' || h2 === '1' || h2 === '8')) type = 'etf';
  else if (h1 === '1' && h2 === '5') type = 'etf';
  else if (h1 === '1' && (h2 === '6' || h2 === '7')) type = 'lof';
  else if (h1 === '0' && h2 === '0' && m === 'sh') type = 'index';
  else if (h1 === '3' && h2 === '9' && m === 'sz') type = 'index';
  const name = c.toUpperCase();
  list.unshift({ code: c, name, market: m, type });
  saveStocks(list);
  return { list, added: true };
}

const TYPE_LABEL = {
  stock: { label: '股', cls: 'type-stock' },
  etf:   { label: 'ETF', cls: 'type-etf' },
  lof:   { label: 'LOF', cls: 'type-lof' },
  index: { label: '指数', cls: 'type-index' },
};
function typeLabel(t) {
  const m = TYPE_LABEL[t] || TYPE_LABEL.stock;
  return `<span class="type-pill ${m.cls}">${m.label}</span>`;
}
function removeStock(code) {
  const list = loadStocks().filter(s => s.code !== code);
  saveStocks(list);
  return list;
}

// ============================================
// 缓存工具（内存 + localStorage）
// ============================================
const CACHE_EXPIRE = 5 * 60 * 1000; // 5 分钟

function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp > CACHE_EXPIRE) {
      localStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch { return null; }
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

// ============================================
// 数据抓取(腾讯 K 线 API,带缓存+超时)
// ============================================
async function fetchKLine(code, count = 120) {
  const cacheKey = `kline_${code}_${count}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(code)},day,,,${count},qfq`;
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.code !== 0) throw new Error('API error: ' + data.msg);
    const key = Object.keys(data.data)[0];
    const arr = (data.data[key] && (data.data[key].qfqday || data.data[key].day)) || [];
    if (!arr.length) throw new Error('无数据');
    const result = arr.map(row => ({
      date: row[0],
      open: +row[1],
      close: +row[2],
      high: +row[3],
      low: +row[4],
      volume: +row[5],
    })).filter(r => r.date && !isNaN(r.open));
    
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('请求超时，请稍后重试');
    throw err;
  }
}

// 拿基本面数据（带缓存，不阻塞主流程）
async function fetchBasic(code) {
  const cacheKey = `basic_${code}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(code)},day,,,1,qfq`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 0) return null;
    const key = Object.keys(data.data)[0];
    const node = data.data[key];
    const qt = (node && node.qt && node.qt[key]) || [];
    if (!Array.isArray(qt) || qt.length < 10) return null;
    const num = i => (qt[i] !== '' && qt[i] != null) ? +qt[i] : null;
    const result = {
      name: qt[1] || code,
      code: qt[2] || code,
      price: num(3),
      turnover: num(38),
      pe: num(39),
      circCap: num(44),
      totalCap: num(45),
      pb: num(46),
      upperLimit: num(47),
      lowerLimit: num(48),
      volRatio: num(49),
      amplitude: num(56),
      high52w: num(67),
      low52w: num(68),
    };
    setCache(cacheKey, result);
    return result;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ============================================
// 技术指标（全部保留原样）
// 以下所有函数（calcMA, calcRSI, calcMACD, calcKDJ, calcBOLL, calcATR, calcROC, calcWR, calcOBV, obvTrend, calcVR, calcVolMA, calcCCI, calcADX）必须完整保留。
// 为节省篇幅，此处用注释代替，实际使用时请确保粘贴所有原有函数。
// ============================================
// ... 原有技术指标函数（全部保留） ...

// ============================================
// 加权常量
// ============================================
const MA_WEIGHT  = { MA5: 2.0, MA10: 1.5, MA20: 1.2, MA60: 1.0 };
const OSC_WEIGHT = { RSI: 1.3, MACD: 1.5, KDJ: 1.0, CCI: 0.8, WR: 0.8, ROC: 0.8, BOLL: 0.8, ADX: 0.5, ATR: 0.5 };

// ============================================
// 核心汇总函数（含分批止盈止损）—— 保持原样
// ============================================
// 函数 calcTakeProfitStopLoss, summarize, backtestSignal, quickSignal, calcPivots, pivotSignal, getCodeFromURL, goStock 均保留不变。
// 同样，此处省略具体实现，实际使用时请从原文件复制。

// ============================================
// URL helpers
// ============================================
function getCodeFromURL() {
  const p = new URLSearchParams(location.search);
  return p.get('code') || '';
}
function goStock(code) {
  location.href = `stock.html?code=${encodeURIComponent(code)}`;
}