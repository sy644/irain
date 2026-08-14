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
// 缓存工具（离线优先：K线24h / 报价 5min / 基本面 1h）
// ============================================
const CACHE_TTL = {
  kline:   24 * 60 * 60 * 1000,   // K线：24小时
  quote:    5 * 60 * 1000,        // 实时报价：5分钟
  basic:   60 * 60 * 1000,        // 基本面：1小时
  signal:  10 * 60 * 1000,        // 信号计算结果：10分钟
};
const CACHE_EXPIRE = CACHE_TTL.kline;
const QUOTE_KEY = (code) => `quote_${code}`;

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
function getCacheWithTTL(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp > ttlMs) return null;
    return item.data;
  } catch { return null; }
}
function getCacheAge(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return Date.now() - JSON.parse(raw).timestamp;
  } catch { return null; }
}

// ---- LRU 缓存清理（新增） ----
function lruCacheClean(maxItems = 200) {
  const keys = Object.keys(localStorage);
  const cacheItems = keys
    .filter(k => k.startsWith('kline_') || k.startsWith('basic_') || k.startsWith('quote_') || k.startsWith('signal_'))
    .map(k => {
      try {
        const raw = localStorage.getItem(k);
        const item = JSON.parse(raw);
        return { key: k, timestamp: item.timestamp || 0 };
      } catch {
        return { key: k, timestamp: 0 };
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp);
  if (cacheItems.length > maxItems) {
    const toRemove = cacheItems.slice(maxItems);
    toRemove.forEach(({ key }) => localStorage.removeItem(key));
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      lruCacheClean(150);
      try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e2) {
        console.warn('缓存写入失败', e2);
      }
    }
  }
}

function clearOldCache() {
  const keys = Object.keys(localStorage);
  const now = Date.now();
  keys.forEach(k => {
    if (k.startsWith('kline_') || k.startsWith('basic_') || k.startsWith('quote_') || k.startsWith('signal_')) {
      try {
        const item = JSON.parse(localStorage.getItem(k));
        if (now - item.timestamp > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(k);
        }
      } catch { localStorage.removeItem(k); }
    }
  });
}

// ---- 缓存统计（新增） ----
function getCacheStats() {
  const keys = Object.keys(localStorage);
  let totalSize = 0, count = 0;
  const types = { kline: 0, basic: 0, quote: 0, signal: 0 };
  keys.forEach(k => {
    if (k.startsWith('kline_')) types.kline++;
    else if (k.startsWith('basic_')) types.basic++;
    else if (k.startsWith('quote_')) types.quote++;
    else if (k.startsWith('signal_')) types.signal++;
    try {
      totalSize += localStorage.getItem(k).length * 2;
      count++;
    } catch {}
  });
  return { totalItems: count, totalSizeKB: Math.round(totalSize / 1024), ...types };
}

// ============================================
// 数据抓取（优化：并发控制 + 重试 + 批量报价）
// ============================================
// ---- 并发限制器 ----
function createConcurrencyLimiter(limit = 5) {
  const queue = [];
  let active = 0;
  const next = () => {
    if (queue.length === 0 || active >= limit) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        active--;
        next();
      });
  };
  return (fn) => {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  };
}
const defaultLimiter = createConcurrencyLimiter(5);

// ---- 带重试的 fetch ----
async function fetchWithRetry(url, options = {}, retries = 3, baseDelay = 300) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    const timeout = 8000 + i * 2000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (err.name === 'AbortError') {
        console.warn(`请求超时 (尝试 ${i+1}/${retries})，${baseDelay * (i+1)}ms 后重试...`);
      } else {
        console.warn(`请求失败 (尝试 ${i+1}/${retries})：${err.message}`);
      }
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * (i + 1)));
      }
    }
  }
  throw lastError;
}

// ---- 增强 fetchKLine ----
async function fetchKLine(code, count = 120) {
  const cacheKey = `kline_${code}_${count}`;
  const fresh = getCacheWithTTL(cacheKey, CACHE_TTL.kline);
  if (fresh) return fresh;

  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(code)},day,,,${count},qfq`;
  try {
    const data = await fetchWithRetry(url, {}, 3);
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
    const stale = getCache(cacheKey);
    if (stale) {
      console.warn(`[离线模式] ${code} 使用 ${Math.round((Date.now() - getCacheAge(cacheKey))/1000/60)} 分钟前的旧数据`);
      return stale;
    }
    throw err;
  }
}

// ---- 增强 fetchBasic ----
async function fetchBasic(code) {
  const cacheKey = `basic_${code}`;
  const fresh = getCacheWithTTL(cacheKey, CACHE_TTL.basic);
  if (fresh) return fresh;

  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(code)},day,,,1,qfq`;
  try {
    const data = await fetchWithRetry(url, {}, 3);
    if (data.code !== 0) throw new Error('API error');
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
  } catch (err) {
    const stale = getCache(cacheKey);
    if (stale) {
      console.warn(`[离线模式] ${code} 基本面使用旧数据`);
      return stale;
    }
    return null;
  }
}

// ---- 批量实时报价（新增） ----
async function fetchQuotesBatch(codes) {
  if (!codes || codes.length === 0) return {};
  const BATCH_SIZE = 50;
  const batches = [];
  for (let i = 0; i < codes.length; i += BATCH_SIZE) {
    batches.push(codes.slice(i, i + BATCH_SIZE));
  }
  const results = {};
  await Promise.all(batches.map(async (batch) => {
    const codeStr = batch.join(',');
    const url = `https://qt.gtimg.cn/q=${codeStr}`;
    try {
      const text = await fetchWithRetry(url, {}, 2, 200);
      const lines = text.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const match = line.match(/v_([a-z]{2}\d{6})="(.+)"/);
        if (!match) continue;
        const code = match[1];
        const fields = match[2].split('~');
        // 腾讯 qt.gtimg.cn/q= 文本接口字段顺序（实测验证，2026-08）：
        // [0]市场编号 [1]名称 [2]代码 [3]当前价 [4..29]盘口/挂单
        // [30]时间戳 [31]当日涨跌额 [32]当日涨跌幅(%)
        // [33]今日最高 [34]今日最低 [36]成交量(手) [37]成交额(万) [38]换手率 [39]PE
        results[code] = {
          name: fields[1] || code,
          price: parseFloat(fields[3]) || 0,
          change: parseFloat(fields[31]) || 0,
          changePercent: parseFloat(fields[32]) || 0,
          volume: parseInt(fields[36]) || 0,
          turnover: (parseFloat(fields[37]) || 0) * 10000,  // 万→元
        };
      }
    } catch (e) {
      console.warn(`批量报价请求失败: ${codeStr}`, e.message);
    }
  }));
  return results;
}

// ---- 改进的预拉取（支持并发、可选拉取项） ----
async function prefetchAll(stocks, options = {}) {
  const {
    fetchKline = true,
    fetchBasic = true,
    klineCount = 120,
    concurrency = 5,
  } = options;

  if (!stocks || !stocks.length) return { success: 0, fail: 0, skipped: 0 };

  let success = 0, fail = 0, skipped = 0;
  const tasks = [];
  const limiter = createConcurrencyLimiter(concurrency);

  for (const s of stocks) {
    const code = s.code;
    const klineAge = getCacheAge(`kline_${code}_${klineCount}`);
    const basicAge = getCacheAge(`basic_${code}`);

    const needKline = fetchKline && (klineAge === null || klineAge > CACHE_TTL.kline);
    const needBasic = fetchBasic && (basicAge === null || basicAge > CACHE_TTL.basic);

    if (!needKline && !needBasic) {
      skipped++;
      continue;
    }

    const task = () => (async () => {
      try {
        if (needKline) await fetchKLine(code, klineCount);
        if (needBasic) await fetchBasic(code);
        success++;
      } catch (e) {
        fail++;
        console.warn(`[预拉取] ${code} 失败:`, e.message);
      }
    })();

    tasks.push(limiter(task));
  }

  await Promise.allSettled(tasks);
  return { success, fail, skipped, total: stocks.length };
}

// ============================================
// 技术指标（不变）
// ============================================
function calcMA(closes, n) {
  const out = new Array(closes.length).fill(null);
  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= n) sum -= closes[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}
function calcEMA(closes, n) {
  const out = new Array(closes.length).fill(null);
  const k = 2 / (n + 1);
  let prev = null;
  for (let i = 0; i < closes.length; i++) {
    if (i < n - 1) continue;
    if (prev === null) {
      let s = 0;
      for (let j = 0; j < n; j++) s += closes[i - j];
      prev = s / n;
    } else {
      prev = closes[i] * k + prev * (1 - k);
    }
    out[i] = prev;
  }
  return out;
}
function calcRSI(closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  let gain = 0, loss = 0;
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (i <= n) {
      if (diff > 0) gain += diff; else loss -= diff;
      if (i === n) {
        const rs = gain / (loss || 1e-9);
        out[i] = 100 - 100 / (1 + rs);
      }
    } else {
      const g = diff > 0 ? diff : 0;
      const l = diff < 0 ? -diff : 0;
      gain = (gain * (n - 1) + g) / n;
      loss = (loss * (n - 1) + l) / n;
      const rs = gain / (loss || 1e-9);
      out[i] = 100 - 100 / (1 + rs);
    }
  }
  return out;
}
function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const dif = closes.map((_, i) => emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null);
  const dea = new Array(closes.length).fill(null);
  let prev = null;
  const k = 2 / (signal + 1);
  for (let i = 0; i < closes.length; i++) {
    if (dif[i] === null) continue;
    if (prev === null) prev = dif[i];
    else prev = dif[i] * k + prev * (1 - k);
    dea[i] = prev;
  }
  const hist = dif.map((d, i) => d !== null && dea[i] !== null ? (d - dea[i]) * 2 : null);
  return { dif, dea, hist };
}
function calcKDJ(highs, lows, closes, n = 9, m1 = 3, m2 = 3) {
  const k = new Array(closes.length).fill(null);
  const d = new Array(closes.length).fill(null);
  const j = new Array(closes.length).fill(null);
  let prevK = 50, prevD = 50;
  for (let i = 0; i < closes.length; i++) {
    if (i < n - 1) continue;
    let h = -Infinity, l = Infinity;
    for (let x = i - n + 1; x <= i; x++) {
      if (highs[x] > h) h = highs[x];
      if (lows[x] < l) l = lows[x];
    }
    const rsv = h === l ? 50 : ((closes[i] - l) / (h - l)) * 100;
    const curK = (prevK * (m1 - 1) + rsv) / m1;
    const curD = (prevD * (m2 - 1) + curK) / m2;
    k[i] = curK; d[i] = curD; j[i] = 3 * curK - 2 * curD;
    prevK = curK; prevD = curD;
  }
  return { k, d, j };
}
function calcBOLL(closes, n = 20, k = 2) {
  const mid = calcMA(closes, n);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    if (i < n - 1) continue;
    let s = 0;
    for (let x = i - n + 1; x <= i; x++) s += (closes[x] - mid[i]) ** 2;
    const sd = Math.sqrt(s / n);
    upper[i] = mid[i] + k * sd;
    lower[i] = mid[i] - k * sd;
  }
  return { mid, upper, lower };
}
function calcATR(highs, lows, closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  const trs = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { trs.push(highs[i] - lows[i]); continue; }
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    trs.push(tr);
  }
  let prev = null;
  for (let i = 0; i < trs.length; i++) {
    if (i < n - 1) continue;
    if (prev === null) {
      let s = 0;
      for (let x = i - n + 1; x <= i; x++) s += trs[x];
      prev = s / n;
    } else {
      prev = (prev * (n - 1) + trs[i]) / n;
    }
    out[i] = prev;
  }
  return out;
}
function calcROC(closes, n = 12) {
  const out = new Array(closes.length).fill(null);
  for (let i = n; i < closes.length; i++) {
    out[i] = ((closes[i] - closes[i - n]) / closes[i - n]) * 100;
  }
  return out;
}
function calcWR(closes, highs, lows, n = 14) {
  const out = new Array(closes.length).fill(null);
  for (let i = n - 1; i < closes.length; i++) {
    let h = -Infinity, l = Infinity;
    for (let x = i - n + 1; x <= i; x++) {
      if (highs[x] > h) h = highs[x];
      if (lows[x] < l) l = lows[x];
    }
    out[i] = h === l ? -50 : ((h - closes[i]) / (h - l)) * -100;
  }
  return out;
}
function calcOBV(closes, volumes) {
  const out = new Array(closes.length).fill(0);
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { out[i] = volumes[i] || 0; continue; }
    if (closes[i] > closes[i - 1]) out[i] = out[i - 1] + (volumes[i] || 0);
    else if (closes[i] < closes[i - 1]) out[i] = out[i - 1] - (volumes[i] || 0);
    else out[i] = out[i - 1];
  }
  return out;
}
function obvTrend(obv, short = 5, long = 20) {
  const last = obv.length - 1;
  const sma = (arr, n) => {
    const s = arr.slice(Math.max(0, arr.length - n)).reduce((a, b) => a + b, 0);
    return s / Math.min(n, arr.length);
  };
  const shortAvg = sma(obv, short);
  const longAvg = sma(obv, long);
  return {
    shortAvg, longAvg,
    direction: shortAvg > longAvg ? 'up' : shortAvg < longAvg ? 'down' : 'flat',
    value: obv[last],
  };
}
function calcVR(closes, volumes, n = 26) {
  const out = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    let upV = 0, downV = 0, sameV = 0;
    for (let x = Math.max(0, i - n + 1); x <= i; x++) {
      if (x === 0) continue;
      if (closes[x] > closes[x - 1]) upV += volumes[x] || 0;
      else if (closes[x] < closes[x - 1]) downV += volumes[x] || 0;
      else sameV += volumes[x] || 0;
    }
    if (downV === 0) { out[i] = upV > 0 ? 999 : 100; continue; }
    out[i] = ((upV + sameV * 0.5) / downV) * 100;
  }
  return out;
}
function calcVolMA(volumes, n = 5) {
  const out = new Array(volumes.length).fill(null);
  let sum = 0;
  for (let i = 0; i < volumes.length; i++) {
    sum += volumes[i];
    if (i >= n) sum -= volumes[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}
function calcCCI(highs, lows, closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  const tp = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
  const ma = calcMA(tp, n);
  for (let i = n - 1; i < closes.length; i++) {
    let s = 0;
    for (let x = i - n + 1; x <= i; x++) s += Math.abs(tp[x] - ma[i]);
    const md = s / n;
    out[i] = md === 0 ? 0 : (tp[i] - ma[i]) / (0.015 * md);
  }
  return out;
}
function calcADX(highs, lows, closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  const trArr = [null], pDM = [null], nDM = [null];
  for (let i = 1; i < closes.length; i++) {
    const up = highs[i] - highs[i - 1];
    const dn = lows[i - 1] - lows[i];
    pDM.push(up > dn && up > 0 ? up : 0);
    nDM.push(dn > up && dn > 0 ? dn : 0);
    trArr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  const smooth = arr => {
    const r = [null];
    let s = 0;
    for (let i = 1; i < arr.length; i++) {
      if (i < n) { s += arr[i]; r.push(null); continue; }
      if (i === n) { s += arr[i]; r.push(s); continue; }
      s = r[i - 1] - r[i - 1] / n + arr[i];
      r.push(s);
    }
    return r;
  };
  const trS = smooth(trArr);
  const pDMS = smooth(pDM);
  const nDMS = smooth(nDM);
  const dx = new Array(closes.length).fill(null);
  for (let i = n; i < closes.length; i++) {
    if (!trS[i]) continue;
    const pDI = 100 * pDMS[i] / trS[i];
    const nDI = 100 * nDMS[i] / trS[i];
    const sum = pDI + nDI;
    dx[i] = sum === 0 ? 0 : 100 * Math.abs(pDI - nDI) / sum;
  }
  let s = 0, cnt = 0;
  for (let i = n; i < closes.length && cnt < n; i++) {
    if (dx[i] != null) { s += dx[i]; cnt++; }
  }
  if (cnt === 0) return out;
  let prev = s / cnt;
  out[n * 2 - 1] = prev;
  for (let i = n * 2; i < closes.length; i++) {
    prev = (prev * (n - 1) + (dx[i] || prev)) / n;
    out[i] = prev;
  }
  return out;
}

const MA_WEIGHT  = { MA5: 2.0, MA10: 1.5, MA20: 1.2, MA60: 1.0 };
const OSC_WEIGHT = { RSI: 1.3, MACD: 1.5, KDJ: 1.0, CCI: 0.8, WR: 0.8, ROC: 0.8, BOLL: 0.8, ADX: 0.5, ATR: 0.5 };

function calcTakeProfitStopLoss(price, pivots, boll, atrVal, ma20, ma60) {
    const DEFAULT_ATR = price * 0.02;
    const atr = atrVal || DEFAULT_ATR;
    let stopLoss;
    if (pivots && pivots.S2) {
        stopLoss = Math.min(price - 2 * atr, pivots.S2);
    } else {
        stopLoss = price * 0.95;
    }
    stopLoss = Math.max(stopLoss, price * 0.90);
    let targets = [];
    if (pivots) {
        targets = [
            { price: pivots.R1, ratio: 0.20, label: 'R1' },
            { price: pivots.R2, ratio: 0.30, label: 'R2' },
            { price: pivots.R3, ratio: 0.30, label: 'R3' }
        ];
    } else {
        targets = [
            { price: price * 1.05, ratio: 0.20, label: '+5%' },
            { price: price * 1.10, ratio: 0.30, label: '+10%' },
            { price: price * 1.15, ratio: 0.30, label: '+15%' }
        ];
    }
    targets = targets.filter(t => t.price > price);
    if (targets.length === 0) {
        targets.push({ price: price * 1.03, ratio: 0.50, label: '保守+3%' });
    }
    let totalRatio = targets.reduce((s, t) => s + t.ratio, 0);
    if (totalRatio > 1) {
        targets = targets.map(t => ({ ...t, ratio: t.ratio / totalRatio }));
    }
    const trailingStop = {
        enabled: true,
        trigger: price * 1.05,
        step: price * 0.02,
        currentStop: stopLoss
    };
    return { stopLoss, takeProfitLevels: targets, trailingStop };
}

function summarize(closes, highs, lows, opens, volumes, pivots) {
  const last = closes.length - 1;
  const rsi = calcRSI(closes, 14);
  const macd = calcMACD(closes);
  const kdj = calcKDJ(highs, lows, closes);
  const ma5 = calcMA(closes, 5);
  const ma10 = calcMA(closes, 10);
  const ma20 = calcMA(closes, 20);
  const ma60 = calcMA(closes, 60);
  const boll = calcBOLL(closes);
  const atr = calcATR(highs, lows, closes);
  const cci = calcCCI(highs, lows, closes);
  const wr = calcWR(closes, highs, lows);
  const roc = calcROC(closes);
  const adx = calcADX(highs, lows, closes);
  const obv = calcOBV(closes, volumes);
  const obvInfo = obvTrend(obv, 5, 20);
  const vr = calcVR(closes, volumes, 26);
  const vol5 = calcVolMA(volumes, 5);
  const vol10 = calcVolMA(volumes, 10);

  const trendGroup = [
    { name: 'MA5',  value: ma5[last],  min: 0, max: 0, weight: MA_WEIGHT.MA5, group: 'trend',
      signal: closes[last] > ma5[last]  ? '买入' : '卖出' },
    { name: 'MA10', value: ma10[last], min: 0, max: 0, weight: MA_WEIGHT.MA10, group: 'trend',
      signal: closes[last] > ma10[last] ? '买入' : '卖出' },
    { name: 'MA20', value: ma20[last], min: 0, max: 0, weight: MA_WEIGHT.MA20, group: 'trend',
      signal: closes[last] > ma20[last] ? '买入' : '卖出' },
    { name: 'MA60', value: ma60[last], min: 0, max: 0, weight: MA_WEIGHT.MA60, group: 'trend',
      signal: closes[last] > ma60[last] ? '买入' : '卖出' },
  ];
  const momentumGroup = [
    { name: 'RSI 14', value: rsi[last], min: 0, max: 100, weight: OSC_WEIGHT.RSI, group: 'momentum',
      signal: rsi[last] > 70 ? '卖出' : rsi[last] < 30 ? '买入' : '中性' },
    { name: 'MACD 柱', value: macd.hist[last], min: -2, max: 2, weight: OSC_WEIGHT.MACD, group: 'momentum',
      signal: (macd.dif[last] > macd.dea[last] && macd.hist[last] > 0) ? '买入' : (macd.dif[last] < macd.dea[last] && macd.hist[last] < 0) ? '卖出' : '中性' },
    { name: 'KDJ K', value: kdj.k[last], min: 0, max: 100, weight: OSC_WEIGHT.KDJ, group: 'momentum',
      signal: kdj.k[last] > 80 ? '卖出' : kdj.k[last] < 20 ? '买入' : '中性' },
    { name: 'ROC 12', value: roc[last], min: -10, max: 10, weight: OSC_WEIGHT.ROC, group: 'momentum',
      signal: roc[last] > 5 ? '买入' : roc[last] < -5 ? '卖出' : '中性' },
  ];
  const volaGroup = [
    { name: 'CCI 14', value: cci[last], min: -200, max: 200, weight: OSC_WEIGHT.CCI, group: 'vola',
      signal: cci[last] > 100 ? '卖出' : cci[last] < -100 ? '买入' : '中性' },
    { name: 'WR 14', value: wr[last], min: -100, max: 0, weight: OSC_WEIGHT.WR, group: 'vola',
      signal: wr[last] > -20 ? '卖出' : wr[last] < -80 ? '买入' : '中性' },
    { name: 'ADX 14', value: adx[last], min: 0, max: 50, weight: OSC_WEIGHT.ADX, group: 'vola',
      signal: adx[last] < 20 ? '无趋势' : adx[last] > 40 ? '中等波动' : '中性' },
  ];
  const bollPos = closes[last] > boll.upper[last] ? '超买' : closes[last] < boll.lower[last] ? '超卖' : '中性';
  volaGroup.push({
    name: 'BOLL', value: closes[last] - boll.mid[last],
    min: -((boll.upper[last] - boll.lower[last]) || 1),
    max: ((boll.upper[last] - boll.lower[last]) || 1),
    weight: OSC_WEIGHT.BOLL, group: 'vola',
    signal: bollPos,
  });
  const volaRatio = vol5[last] && vol10[last] ? (vol5[last] / vol10[last]) : 1;
  const volGroup = [
    { name: 'VOL 5/10', value: volaRatio, min: 0, max: 2, weight: 1.0, group: 'vol',
      signal: volaRatio > 1.3 ? '放量' : volaRatio < 0.7 ? '缩量' : '中性' },
    { name: 'OBV', value: obvInfo.value, min: obvInfo.value - Math.abs(obvInfo.value) * 0.5, max: obvInfo.value + Math.abs(obvInfo.value) * 0.5, weight: 1.5, group: 'vol',
      signal: obvInfo.direction === 'up' ? '资金流入' : obvInfo.direction === 'down' ? '资金流出' : '中性' },
    { name: 'VR 26', value: vr[last] || 0, min: 0, max: 400, weight: 0.8, group: 'vol',
      signal: vr[last] > 250 ? '超买区' : vr[last] < 70 ? '超卖区' : '中性' },
  ];

  let buyScore = 0, sellScore = 0, totalWeight = 0;
  [...trendGroup, ...momentumGroup, ...volaGroup, ...volGroup].forEach(ind => {
    totalWeight += ind.weight;
    if (ind.signal === '买入' || ind.signal === '资金流入') buyScore += ind.weight;
    else if (ind.signal === '卖出' || ind.signal === '资金流出' ||
             ind.signal === '放量' || ind.signal === '超买' || ind.signal === '超买区') sellScore += ind.weight;
  });
  const netScore = buyScore - sellScore;
  const scoreRatio = netScore / totalWeight;

  let trend = '震荡';
  let trendScore = 0;
  const ma60Dir = ma60[last] - ma60[last - 5] || 0;
  const aboveMA60 = closes[last] > ma60[last];
  const aboveMA20 = closes[last] > ma20[last];
  const aboveMA5  = closes[last] > ma5[last];
  if (ma60Dir > 0 && aboveMA60 && aboveMA20 && aboveMA5) { trend = '强多头'; trendScore = 2; }
  else if (ma60Dir > 0 && aboveMA60)                     { trend = '多头';   trendScore = 1; }
  else if (ma60Dir < 0 && !aboveMA60 && !aboveMA20 && !aboveMA5) { trend = '强空头'; trendScore = -2; }
  else if (ma60Dir < 0 && !aboveMA60)                    { trend = '空头';   trendScore = -1; }
  else                                                    { trend = '震荡';   trendScore = 0; }

  const todayVol = volumes[last];
  const avgVol5 = vol5[last] || todayVol;
  const isFangLiang = todayVol > avgVol5 * 1.5;
  const isSuoLiang = todayVol < avgVol5 * 0.7;
  const yestClose = closes[last - 1] || closes[last];
  const belowMA20Now = closes[last] < ma20[last];
  const belowMA60Now = closes[last] < ma60[last];
  const justBelowMA20 = yestClose >= ma20[last - 1] && closes[last] < ma20[last];
  const justBelowMA60 = yestClose >= ma60[last - 1] && closes[last] < ma60[last];
  const aboveMA60Now = closes[last] > ma60[last];
  const aboveMA20Now = closes[last] > ma20[last];
  let vpEvent = 'normal';
  let vpLabel = '正常量价';
  if (isFangLiang && (justBelowMA20 || justBelowMA60 || (belowMA20Now && belowMA60Now))) {
    vpEvent = 'fangBreak';
    vpLabel = justBelowMA20 || justBelowMA60 ? '放量跌破均线' : '放量弱势确认';
  }
  else if (isSuoLiang && (justBelowMA20 || justBelowMA60) && obvInfo.direction === 'down') {
    vpEvent = 'suoBreak';
    vpLabel = '缩量跌破均线';
  }
  else if (isFangLiang && aboveMA60Now && aboveMA20Now && obvInfo.direction === 'up') {
    vpEvent = 'fangBreakout';
    vpLabel = '放量突破上涨';
  }
  else if (isSuoLiang && aboveMA60Now && obvInfo.direction === 'up') {
    vpEvent = 'upTrend';
    vpLabel = '缩量上涨(主力锁仓?)';
  }
  let vpScore = 0;
  if (vpEvent === 'fangBreak') vpScore = -2;
  else if (vpEvent === 'suoBreak') vpScore = -1;
  else if (vpEvent === 'fangBreakout') vpScore = 2;
  else if (vpEvent === 'upTrend') vpScore = 1;

  const price = closes[last];
  let pivotSignal = '中性', pivotBuy = 0, pivotSell = 0, pivotLabel = '';
  let pivotBreakdown = null, pivotBreakout = null;
  if (pivots) {
    const p = pivots.classic;
    if (price >= p.R3)      { pivotSignal = '强阻力'; pivotSell = 2; pivotLabel = '超买区 R3+'; }
    else if (price >= p.R2) { pivotSignal = '阻力区'; pivotSell = 1; pivotLabel = '阻力区 R2~R3'; }
    else if (price >= p.R1) { pivotSignal = '偏空';   pivotSell = 0; pivotLabel = '阻力位 R1~R2'; }
    else if (price >= p['轴心点']) { pivotSignal = '中性'; pivotLabel = '轴心附近'; }
    else if (price >= p.S1) { pivotSignal = '偏多';   pivotBuy = 0; pivotLabel = '轴心~S1'; }
    else if (price >= p.S2) { pivotSignal = '支撑区'; pivotBuy = 1; pivotLabel = '支撑区 S1~S2'; }
    else                    { pivotSignal = '强支撑'; pivotBuy = 2; pivotLabel = '超卖区 S3-'; }
    const prev = closes[last - 1];
    if (prev >= p.S1 && price < p.S1) {
      pivotBreakdown = { level: 'S1', from: p.S1, to: p.S2, distance: p.S1 - price };
    }
    if (prev < p.R1 && price >= p.R1) {
      pivotBreakout = { level: 'R1', from: p.R1, target: p.R2, distance: price - p.R1 };
    }
  }

  let overall = '中性', action = '观望', position = 0, confidence = 0;
  if (scoreRatio > 0.5 && trendScore >= 1) { overall = '强力买入'; action = '介入'; position = 80; }
  else if (scoreRatio > 0.2 && trendScore >= 0) { overall = '买入'; action = '建仓'; position = 50; }
  else if (scoreRatio > 0.2 && trendScore === -1) { overall = '左侧试探'; action = '极轻仓尝试'; position = 20; }
  else if (scoreRatio > 0.2 && trendScore === -2) { overall = '左侧试探'; action = '等待企稳'; position = 10; }
  else if (scoreRatio < -0.5 && trendScore <= -1) { overall = '强力卖出'; action = '清仓离场'; position = 0; }
  else if (scoreRatio < -0.2 && trendScore <= 0) { overall = '卖出'; action = '减仓'; position = 20; }
  else if (scoreRatio < -0.2 && trendScore >= 1) { overall = '高空防守'; action = '减仓防守'; position = 30; }
  else { overall = '中性'; action = '观望'; position = 30; }
  if (pivotBreakdown) {
    if (position > 30) position = 30;
    action = `跌破 ${pivotBreakdown.level},看跌 ${pivotBreakdown.to},减仓防守`;
  }
  if (pivotBreakout) {
    position = Math.max(position, 50);
    action = `突破 ${pivotBreakout.level},上看 ${pivotBreakout.target},顺势加仓`;
  }
  if (vpEvent === 'fangBreak') {
    overall = '卖出';
    action = `放量跌破${justBelowMA60?'MA60':justBelowMA20?'MA20':'均线(弱势确认)'},建议减仓回避,若次日缩量且收复再回补`;
    position = Math.min(position, 20);
  } else if (vpEvent === 'suoBreak') {
    if (position > 30) position = 30;
    action = `缩量跌破${justBelowMA60?'MA60':'MA20'},动能衰竭,左侧试错标的,严格止损`;
  } else if (vpEvent === 'fangBreakout') {
    overall = '强力买入';
    action = `放量突破 MA60 + OBV 上行,高权重看涨,可介入`;
    position = Math.max(position, 70);
  } else if (vpEvent === 'upTrend') {
    if (position < 30) position = 30;
    if (overall === '中性') { overall = '买入'; action = '缩量上涨,主力锁仓可能性大,关注放量确认'; }
  }
  const priceUp = closes[last] > closes[last - 5];
  const obvDown = obvInfo.direction === 'down';
  const vpDivergence = priceUp && obvDown;
  if (vpDivergence && position > 20) {
    position = Math.max(20, Math.min(position, 30));
    if (overall === '买入' || overall === '强力买入') {
      action += ' · ⚠ 量价背离,价格涨但资金流出';
    }
  }
  const backtest = quickBacktest(closes, highs, lows, opens, volumes);
  if (backtest.buySamples >= 20) {
    const wr = backtest.buyWinRate;
    if (wr < 0.40) position = Math.round(position * 0.5);
    else if (wr < 0.50) position = Math.round(position * 0.75);
    else if (wr > 0.60) position = Math.min(100, Math.round(position * 1.1));
  }
  const confScore = Math.abs(scoreRatio) * 70;
  const confVp    = Math.min(Math.abs(vpScore) / 2, 1) * 15;
  const confTrend = Math.min(Math.abs(trendScore) / 2, 1) * 10;
  let confBack = 0;
  if (backtest.buySamples >= 20) {
    const wr = backtest.buyWinRate;
    confBack = wr > 0.55 ? 5 : wr < 0.45 ? -10 : 0;
  }
  const signalConsistency = (buyScore + sellScore > 0)
    ? Math.max(buyScore, sellScore) / (buyScore + sellScore)
    : 0.5;
  const confPenalty = signalConsistency < 0.6 ? -15 : 0;
  confidence = Math.max(0, Math.min(100, Math.round(confScore + confVp + confTrend + confBack + confPenalty)));

  const anomalyIdx = [];
  for (let i = Math.max(5, last - 60); i <= last; i++) {
    const v5 = vol5[i];
    if (!v5) continue;
    if (volumes[i] > v5 * 1.5) anomalyIdx.push({ i, type: 'high' });
  }

  const tpSl = calcTakeProfitStopLoss(
      closes[last],
      pivots ? pivots.classic : null,
      boll,
      atr[last],
      ma20[last],
      ma60[last]
  );

  return {
    overall, action, position, confidence,
    price: closes[last],
    buyScore: +buyScore.toFixed(2), sellScore: +sellScore.toFixed(2),
    netScore: +netScore.toFixed(2), scoreRatio: +scoreRatio.toFixed(3),
    buy: Math.round(buyScore), sell: Math.round(sellScore),
    trend, trendScore,
    mas: trendGroup,
    indicators: [...momentumGroup, ...volaGroup, ...volGroup],
    trendGroup, momentumGroup, volaGroup, volGroup,
    rsi, macd, kdj, ma5, ma10, ma20, ma60, boll, atr,
    obv, obvInfo, vr, vol5, vol10, volaRatio,
    pivotSignal, pivotLabel, pivotBuy, pivotSell,
    pivotBreakdown, pivotBreakout,
    pivots,
    backtest,
    vpEvent, vpLabel, vpScore, vpDivergence,
    isFangLiang, isSuoLiang, todayVol, avgVol5,
    anomalyIdx,
    tpSl,
  };
}

// ============================================
// 历史胜率回测（不变）
// ============================================
function backtestSignal(closes, highs, lows, opens, volumes, lookback = 100, holdDays = 5) {
  const N = closes.length;
  if (N < lookback + holdDays) {
    return { samples: 0, buyWinRate: 0, buyAvgRet: 0, note: '样本不足' };
  }
  let buySamples = 0, buyWins = 0, buySum = 0;
  let sellSamples = 0, sellWins = 0, sellSum = 0;
  const overallStats = {};
  const start = N - lookback;
  for (let i = start; i < N - holdDays; i++) {
    const subClose = closes.slice(0, i + 1);
    const subHigh  = highs.slice(0, i + 1);
    const subLow   = lows.slice(0, i + 1);
    const subOpen  = opens.slice(0, i + 1);
    const subVol   = volumes.slice(0, i + 1);
    if (subClose.length < 60) continue;
    const prev = subClose[subClose.length - 2] || subClose[subClose.length - 1];
    const prevHigh = subHigh[subHigh.length - 2] || subHigh[subHigh.length - 1];
    const prevLow  = subLow[subLow.length - 2]  || subLow[subLow.length - 1];
    const pivots = calcPivots(prevHigh, prevLow, prev);
    const sig = summarize(subClose, subHigh, subLow, subOpen, subVol, pivots);
    const futureRet = (closes[i + holdDays] - closes[i]) / closes[i];
    const overall = sig.overall;
    if (!overallStats[overall]) overallStats[overall] = { count: 0, wins: 0, sum: 0 };
    overallStats[overall].count++;
    overallStats[overall].sum += futureRet;
    if (futureRet > 0) overallStats[overall].wins++;
    if (['买入', '强力买入', '左侧试探'].includes(overall)) {
      buySamples++;
      buySum += futureRet;
      if (futureRet > 0) buyWins++;
    } else if (['卖出', '强力卖出', '高空防守'].includes(overall)) {
      sellSamples++;
      sellSum += futureRet;
      if (futureRet < 0) sellWins++;
    }
  }
  const buyWinRate = buySamples ? buyWins / buySamples : 0;
  const buyAvgRet  = buySamples ? buySum / buySamples : 0;
  const breakdown = Object.entries(overallStats).map(([k, v]) => ({
    overall: k,
    count: v.count,
    winRate: v.wins / v.count,
    avgRet: v.sum / v.count,
  })).sort((a, b) => b.count - a.count);
  return {
    samples: buySamples + sellSamples,
    buySamples, buyWins, buyWinRate, buyAvgRet,
    sellSamples, sellWins,
    lookback, holdDays,
    breakdown,
    winRate: buyWinRate,
    avgReturn: buyAvgRet,
  };
}

function quickBacktest(closes, highs, lows, opens, volumes, lookback = 60, holdDays = 5) {
  const N = closes.length;
  if (N < lookback + holdDays) {
    return { samples: 0, buyWinRate: 0, buyAvgRet: 0, note: '样本不足' };
  }
  let buySamples = 0, buyWins = 0, buySum = 0;
  const start = N - lookback;
  for (let i = start; i < N - holdDays; i++) {
    const subClose = closes.slice(0, i + 1);
    const subHigh  = highs.slice(0, i + 1);
    const subLow   = lows.slice(0, i + 1);
    const subOpen  = opens.slice(0, i + 1);
    const subVol   = volumes.slice(0, i + 1);
    if (subClose.length < 60) continue;
    const sig = quickSignal(subClose, subHigh, subLow, subOpen);
    const futureRet = (closes[i + holdDays] - closes[i]) / closes[i];
    if (sig === '买入') {
      buySamples++;
      buySum += futureRet;
      if (futureRet > 0) buyWins++;
    }
  }
  return {
    samples: buySamples,
    buySamples,
    buyWinRate: buySamples ? buyWins / buySamples : 0,
    buyAvgRet:  buySamples ? buySum / buySamples : 0,
    lookback, holdDays,
  };
}

function quickSignal(closes, highs, lows, opens) {
  const last = closes.length - 1;
  if (last < 60) return '中性';
  const ma5 = calcMA(closes, 5);
  const ma20 = calcMA(closes, 20);
  const ma60 = calcMA(closes, 60);
  const rsi = calcRSI(closes, 14);
  const macd = calcMACD(closes);
  const price = closes[last];
  let buy = 0, sell = 0;
  if (price > ma5[last]) buy += 1.5; else sell += 1.5;
  if (price > ma20[last]) buy += 1.2; else sell += 1.2;
  if (price > ma60[last]) buy += 1.0; else sell += 1.0;
  if (macd.hist[last] > 0 && macd.dif[last] > macd.dea[last]) buy += 1.5;
  else if (macd.hist[last] < 0 && macd.dif[last] < macd.dea[last]) sell += 1.5;
  if (rsi[last] < 30) buy += 1.3;
  else if (rsi[last] > 70) sell += 1.3;
  if (buy - sell >= 2) return '买入';
  if (sell - buy >= 2) return '卖出';
  return '中性';
}

function calcPivots(high, low, close) {
  const pp = (high + low + close) / 3;
  const classic = {
    R3: high + 2 * (pp - low),
    R2: pp + (high - low),
    R1: 2 * pp - low,
    '轴心点': pp,
    S1: 2 * pp - high,
    S2: pp - (high - low),
    S3: low - 2 * (high - pp),
  };
  const fib = {
    R3: pp + (high - low) * 1.000,
    R2: pp + (high - low) * 0.618,
    R1: pp + (high - low) * 0.382,
    '轴心点': pp,
    S1: pp - (high - low) * 0.382,
    S2: pp - (high - low) * 0.618,
    S3: pp - (high - low) * 1.000,
  };
  return { classic, fibonacci: fib };
}

function pivotSignal(price, p) {
  const last = p['轴心点'];
  if (price >= p.R3) return { label: '强阻力', cls: 'sell' };
  if (price >= p.R2) return { label: '阻力区', cls: 'sell' };
  if (price >= p.R1) return { label: '偏空', cls: 'neutral' };
  if (price >= p.S1) return { label: '中性', cls: 'neutral' };
  if (price >= p.S2) return { label: '偏多', cls: 'neutral' };
  if (price >= p.S3) return { label: '支撑区', cls: 'buy' };
  return { label: '强支撑', cls: 'buy' };
}

function getCodeFromURL() {
  const p = new URLSearchParams(location.search);
  return p.get('code') || '';
}
function goStock(code) {
  location.href = `stock.html?code=${encodeURIComponent(code)}`;
}

// ============================================
// 量化指标（不变）
// ============================================
function dailyReturns(closes) {
  const r = [];
  for (let i = 1; i < closes.length; i++) {
    r.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  return r;
}

function volatility(returns, periodsPerYear = 252) {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(periodsPerYear);
}

function annualReturn(returns, periodsPerYear = 252) {
  if (!returns.length) return 0;
  const totalRet = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const years = returns.length / periodsPerYear;
  if (years <= 0) return 0;
  return Math.pow(1 + totalRet, 1 / years) - 1;
}

function sharpeRatio(returns, riskFree = 0.025, periodsPerYear = 252) {
  const annRet = annualReturn(returns, periodsPerYear);
  const vol = volatility(returns, periodsPerYear);
  if (vol === 0) return 0;
  return (annRet - riskFree) / vol;
}

function maxDrawdown(closes) {
  if (closes.length < 2) return { value: 0, peak: 0, trough: 0, peakIdx: 0, troughIdx: 0 };
  let peak = closes[0], peakIdx = 0, maxDD = 0, ddPeak = 0, ddTrough = 0, ddPeakIdx = 0, ddTroughIdx = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > peak) {
      peak = closes[i];
      peakIdx = i;
    }
    const dd = (peak - closes[i]) / peak;
    if (dd > maxDD) {
      maxDD = dd;
      ddPeak = peak;
      ddTrough = closes[i];
      ddPeakIdx = peakIdx;
      ddTroughIdx = i;
    }
  }
  return {
    value: maxDD,
    peak: ddPeak, trough: ddTrough,
    peakIdx: ddPeakIdx, troughIdx: ddTroughIdx,
    recoveryDays: closes.length - 1 - ddTroughIdx,
  };
}

function calmarRatio(returns, closes, periodsPerYear = 252) {
  const ar = annualReturn(returns, periodsPerYear);
  const mdd = maxDrawdown(closes).value;
  if (mdd === 0) return 0;
  return ar / mdd;
}

function winRateAndPayoff(returns) {
  if (!returns.length) return { winRate: 0, payoff: 0, profitFactor: 0, expectancy: 0 };
  const wins = returns.filter(r => r > 0);
  const losses = returns.filter(r => r < 0);
  const winRate = wins.length / returns.length;
  const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
  const payoff = avgLoss === 0 ? 0 : avgWin / avgLoss;
  const profitFactor = avgLoss === 0 ? 0 : (wins.reduce((a, b) => a + b, 0)) / Math.abs(losses.reduce((a, b) => a + b, 0));
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;
  return {
    winRate,
    payoff,
    profitFactor,
    expectancy,
    avgWin,
    avgLoss,
    wins: wins.length,
    losses: losses.length,
  };
}

function advancedBacktest(closes, signals, holdDays = 5) {
  if (!closes.length || !signals.length) {
    return { error: '数据不足' };
  }
  const trades = [];
  for (const s of signals) {
    const entryIdx = s.i;
    const exitIdx = entryIdx + holdDays;
    if (exitIdx >= closes.length) continue;
    const entryPrice = closes[entryIdx];
    const exitPrice = closes[exitIdx];
    const ret = s.sig === 'buy' ? (exitPrice - entryPrice) / entryPrice
              : s.sig === 'sell' ? (entryPrice - exitPrice) / entryPrice
              : 0;
    trades.push({
      i: entryIdx, sig: s.sig, ret, win: ret > 0,
      entryPrice, exitPrice,
      date: s.date, exitDate: s.exitDate,
    });
  }
  if (!trades.length) return { error: '无交易' };
  const tradeReturns = trades.map(t => t.ret);
  const stats = winRateAndPayoff(tradeReturns);
  return {
    trades,
    totalTrades: trades.length,
    totalReturn: tradeReturns.reduce((a, r) => a * (1 + r), 1) - 1,
    avgReturn: tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length,
    ...stats,
  };
}

function multiTimeframeConfirm(dailyCloses, hourlyCloses) {
  if (!dailyCloses || !hourlyCloses) return { confirmed: false, note: '数据不足' };
  if (dailyCloses.length < 60 || hourlyCloses.length < 60) return { confirmed: false, note: '数据不足' };
  const dailyMa20 = dailyCloses.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const dailyMa60 = dailyCloses.slice(-60).reduce((a, b) => a + b, 0) / 60;
  const dailyTrend = dailyCloses[dailyCloses.length - 1] > dailyMa20 && dailyMa20 > dailyMa60;
  const hourlyMa20 = hourlyCloses.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const hourlyMa60 = hourlyCloses.slice(-60).reduce((a, b) => a + b, 0) / 60;
  const hourlyTrend = hourlyCloses[hourlyCloses.length - 1] > hourlyMa20 && hourlyMa20 > hourlyMa60;
  return {
    confirmed: dailyTrend && hourlyTrend,
    dailyTrend, hourlyTrend,
    note: !dailyTrend ? '日线未确认多头' : !hourlyTrend ? '60分钟线未确认多头' : '日线+60分钟双确认多头',
  };
}

function sortinoRatio(returns, riskFree = 0.025, periodsPerYear = 252) {
  if (returns.length < 2) return 0;
  const annRet = annualReturn(returns, periodsPerYear);
  const negReturns = returns.filter(r => r < 0);
  if (negReturns.length === 0) return annRet > riskFree ? 99 : 0;
  const downside = Math.sqrt(negReturns.reduce((s, r) => s + r * r, 0) / returns.length) * Math.sqrt(periodsPerYear);
  if (downside === 0) return 0;
  return (annRet - riskFree) / downside;
}

function betaToMarket(stockReturns, marketReturns) {
  if (stockReturns.length !== marketReturns.length || stockReturns.length < 10) return 0;
  const n = stockReturns.length;
  const meanS = stockReturns.reduce((a, b) => a + b, 0) / n;
  const meanM = marketReturns.reduce((a, b) => a + b, 0) / n;
  let cov = 0, varM = 0;
  for (let i = 0; i < n; i++) {
    cov += (stockReturns[i] - meanS) * (marketReturns[i] - meanM);
    varM += (marketReturns[i] - meanM) ** 2;
  }
  if (varM === 0) return 0;
  return cov / varM;
}

function alphaToMarket(stockReturns, marketReturns, riskFree = 0.025/252) {
  if (stockReturns.length !== marketReturns.length || stockReturns.length < 10) return 0;
  const b = betaToMarket(stockReturns, marketReturns);
  const meanS = stockReturns.reduce((a, x) => a + x, 0) / stockReturns.length;
  const meanM = marketReturns.reduce((a, x) => a + x, 0) / marketReturns.length;
  return (meanS - riskFree) - b * (meanM - riskFree);
}

function informationRatio(stockReturns, marketReturns) {
  if (stockReturns.length !== marketReturns.length || stockReturns.length < 10) return 0;
  const n = stockReturns.length;
  const excess = stockReturns.map((r, i) => r - marketReturns[i]);
  const mean = excess.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return 0;
  const variance = excess.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1);
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return (mean / std) * Math.sqrt(252);
}

function trendStrength(closes, period = 14) {
  if (closes.length < period * 2) return 0;
  const ma = closes.slice(-period).reduce((a, b) => a + b, 0) / period;
  const last = closes[closes.length - 1];
  const deviation = (last - ma) / ma;
  return Math.min(Math.abs(deviation) * 100, 100);
}

function correlation(a, b) {
  if (a.length !== b.length || a.length < 2) return 0;
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const ax = a[i] - ma, bx = b[i] - mb;
    num += ax * bx; da += ax * ax; db += bx * bx;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}

function quantMetrics(closes, returns, marketCloses) {
  if (!returns) returns = dailyReturns(closes);
  const result = {
    annualReturn: annualReturn(returns),
    volatility: volatility(returns),
    sharpe: sharpeRatio(returns),
    sortino: sortinoRatio(returns),
    maxDrawdown: maxDrawdown(closes),
    calmar: calmarRatio(returns, closes),
    trendStrength: trendStrength(closes),
    sampleDays: closes.length,
  };
  if (marketCloses && marketCloses.length > 30) {
    const marketReturns = dailyReturns(marketCloses);
    const len = Math.min(returns.length, marketReturns.length);
    const sR = returns.slice(-len);
    const mR = marketReturns.slice(-len);
    result.beta = betaToMarket(sR, mR);
    result.alpha = alphaToMarket(sR, mR) * 252;
    result.infoRatio = informationRatio(sR, mR);
    result.correlation = correlation(sR, mR);
  }
  return result;
}

// ============================================
// 导出（Node 和 浏览器）
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    summarize, backtestSignal, quickSignal, calcPivots, pivotSignal,
    calcTakeProfitStopLoss,
    calcMA, calcEMA, calcRSI, calcMACD, calcKDJ, calcBOLL, calcATR,
    calcROC, calcWR, calcOBV, obvTrend, calcVR, calcVolMA, calcCCI, calcADX,
    prefetchAll, getCacheAge, CACHE_TTL,
    dailyReturns, volatility, annualReturn, sharpeRatio, maxDrawdown,
    calmarRatio, winRateAndPayoff, advancedBacktest, multiTimeframeConfirm,
    quantMetrics,
    sortinoRatio, betaToMarket, alphaToMarket, informationRatio,
    trendStrength, correlation,
    // 新增
    fetchQuotesBatch, getCacheStats, lruCacheClean,
  };
}
if (typeof window !== 'undefined') {
  window.prefetchAll = prefetchAll;
  window.getCacheAge = getCacheAge;
  window.CACHE_TTL = CACHE_TTL;
  window.quantMetrics = quantMetrics;
  window.sharpeRatio = sharpeRatio;
  window.maxDrawdown = maxDrawdown;
  // 新增暴露
  window.fetchQuotesBatch = fetchQuotesBatch;
  window.getCacheStats = getCacheStats;
  window.lruCacheClean = lruCacheClean;
  // 首页列表需要用：信号计算 + 枢轴点
  window.summarize = summarize;
  window.calcPivots = calcPivots;
  window.quickSignal = quickSignal;
  window.backtestSignal = backtestSignal;
}