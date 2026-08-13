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
// 缓存工具
// ============================================
const CACHE_EXPIRE = 5 * 60 * 1000;
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
// 数据抓取（带缓存 + 超时）
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
// 技术指标（完整保留，此处省略以避免超长，但实际使用时必须保留）
// 以下函数：calcMA, calcEMA, calcRSI, calcMACD, calcKDJ, calcBOLL, calcATR,
// calcROC, calcWR, calcOBV, obvTrend, calcVR, calcVolMA, calcCCI, calcADX
// 您原文件中已有，无需修改，此处不再重复。
// ============================================

// ============================================
// 分批止盈止损计算
// ============================================
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

// ============================================
// 综合判定（包含止盈止损返回）
// ============================================
function summarize(closes, highs, lows, opens, volumes, pivots) {
  // ... 此部分与您原文件相同，仅最后加入 tpSl
  // 为避免重复，请使用之前我提供的完整 summarize 函数（含 tpSl）
  // 为节省篇幅，此处略，但您必须确保 summarize 返回 tpSl 字段。
  // 请从之前的回答中复制完整 summarize。
}

// ============================================
// 回测、快速信号、枢轴点、URL工具等（原封不动）
// ============================================
function backtestSignal(...) { /* 原样 */ }
function quickSignal(...) { /* 原样 */ }
function calcPivots(...) { /* 原样 */ }
function pivotSignal(...) { /* 原样 */ }
function getCodeFromURL() { /* 原样 */ }
function goStock(...) { /* 原样 */ }