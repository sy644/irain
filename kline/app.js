// ============================================================
// 实战参谋 · 优化版核心库（合并版 v8）
// 整合 simpleSignal_v7 + 所有 stock.html / index.html 依赖函数
// 优化点：减少遍历次数、缓存中间结果、延迟非关键计算、删除无效代码
// ============================================================

/* ---------- 0. 工具 ---------- */
function getCodeFromURL() {
  const m = location.search.match(/[?&]code=([^&]+)/);
  return m ? decodeURIComponent(m[1]).toLowerCase().trim() : '';
}
function getTypeByCode(code) {
  const n = code.replace(/^[a-z]+/, '');
  if (n.startsWith('000') || n.startsWith('600') || n.startsWith('601') || n.startsWith('603') || n.startsWith('605')) return 'stock';
  if (n.startsWith('300') || n.startsWith('688')) return 'stock';
  if (n.startsWith('002') || n.startsWith('003')) return 'stock';
  if (n.startsWith('51') || n.startsWith('15') || n.startsWith('56') || n.startsWith('58')) return 'etf';
  if (n.startsWith('sh') || n.startsWith('sz') || n.startsWith('bj')) {
    const num = n.slice(2);
    if (num.startsWith('000') || num.startsWith('399') || num.startsWith('899')) return 'index';
  }
  return 'stock';
}
function typeLabel(t) { return t === 'index' ? ' · 指数' : t === 'etf' ? ' · ETF' : ''; }

/* ---------- 1. 数据获取 ---------- */
async function fetchKLine(code, count = 120) {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(code)},day,,,${count},qfq`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    const key = Object.keys(data.data)[0];
    const arr = (data.data[key] && (data.data[key].qfqday || data.data[key].day)) || [];
    return arr.map(row => ({
      date: row[0], open: +row[1], close: +row[2], high: +row[3], low: +row[4], volume: +row[5]
    })).filter(r => r.date && !isNaN(r.open));
  } catch {
    clearTimeout(timeout);
    const url2 = `https://quotes.sina.cn/cn/api/json_v2.php/IFengService.getKLineData?symbol=${code}&scale=240&ma=no&datalen=${count}`;
    const res2 = await fetch(url2, { signal: AbortSignal.timeout(4000) });
    const data2 = await res2.json();
    return (data2 || []).map(row => ({
      date: row.day, open: +row.open, close: +row.close, high: +row.high, low: +row.low, volume: +row.volume || 0
    }));
  }
}

async function fetchBasic(code) {
  try {
    const url = `https://qt.gtimg.cn/q=${code}`;
    const text = await fetch(url, { signal: AbortSignal.timeout(4000) }).then(r => r.text());
    const m = text.match(/v_[a-z0-9]+="(.+)"/);
    if (!m) return null;
    const f = m[1].split('~');
    return {
      name: f[1], price: parseFloat(f[3]) || 0,
      pe: parseFloat(f[39]) || 0, pb: parseFloat(f[46]) || 0,
      totalCap: parseFloat(f[44]) || 0, turnover: parseFloat(f[38]) || 0,
      volRatio: parseFloat(f[49]) || 0, high52w: parseFloat(f[33]) || 0, low52w: parseFloat(f[34]) || 0,
      upperLimit: parseFloat(f[47]) || 0, lowerLimit: parseFloat(f[48]) || 0,
    };
  } catch { return null; }
}

/* ---------- 2. 自选股管理 ---------- */
const STOCKS_KEY = 'stocks_v1';
function loadStocks() {
  try { const raw = localStorage.getItem(STOCKS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveStocks(list) { localStorage.setItem(STOCKS_KEY, JSON.stringify(list)); }
function findName(code) {
  const s = loadStocks().find(x => x.code === code);
  return s ? s.name : code.toUpperCase();
}
function updateName(code, newName) {
  const list = loadStocks();
  const s = list.find(x => x.code === code);
  if (s) { s.name = newName; saveStocks(list); return true; }
  return false;
}

/* ---------- 3. 历史表（精简版） ---------- */
const HISTORY_KEY = 'history_v2';
const HistoryTable = {
  _get() {
    try { const raw = localStorage.getItem(HISTORY_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  },
  _set(data) { localStorage.setItem(HISTORY_KEY, JSON.stringify(data)); },
  getRecent(code, n) {
    const db = this._get();
    const rows = db[code] || [];
    return rows.slice(-n).map(r => ({
      date: r.date, open: r.open, high: r.high, low: r.low, close: r.close, volume: r.volume
    }));
  },
  getLatest(code) {
    const db = this._get();
    const rows = db[code];
    return rows && rows.length ? rows[rows.length - 1] : null;
  },
  appendRows(rows) {
    if (!rows || !rows.length) return;
    const db = this._get();
    const code = rows[0].code;
    if (!db[code]) db[code] = [];
    const existing = new Set(db[code].map(r => r.date));
    for (const r of rows) {
      if (!existing.has(r.date)) db[code].push(r);
    }
    if (db[code].length > 300) db[code] = db[code].slice(-300);
    this._set(db);
  },
  appendLast(row) {
    if (!row || !row.code) return;
    const db = this._get();
    if (!db[row.code]) db[row.code] = [];
    const last = db[row.code].length ? db[row.code][db[row.code].length - 1] : null;
    if (!last || last.date !== row.date) db[row.code].push(row);
    else Object.assign(last, row);
    if (db[row.code].length > 300) db[row.code] = db[row.code].slice(-300);
    this._set(db);
  }
};

/* ---------- 4. 持仓/风控 ---------- */
const PORTFOLIO_KEY = 'portfolio_v1';
function loadPortfolio() {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    if (!raw) return { positions: [], cash: 100000, equity: 100000, peakEquity: 100000 };
    const p = JSON.parse(raw);
    if (!p.positions) p.positions = [];
    if (typeof p.cash !== 'number') p.cash = 100000;
    if (typeof p.equity !== 'number') p.equity = 100000;
    if (typeof p.peakEquity !== 'number') p.peakEquity = p.equity;
    return p;
  } catch { return { positions: [], cash: 100000, equity: 100000, peakEquity: 100000 }; }
}
function savePortfolio(p) { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p)); }

function updateTrailingStop(pos, tpSl) {
  if (!tpSl || !tpSl.trailingStop || !pos) return;
  const ts = tpSl.trailingStop;
  const price = pos.currentPrice || pos.avgCost;
  if (!pos.highWater) pos.highWater = pos.avgCost;
  if (price > pos.highWater) pos.highWater = price;
  if (ts.trigger && price >= ts.trigger && pos.highWater > pos.avgCost) {
    const newStop = pos.highWater - ts.step;
    if (newStop > (pos.stopLoss || 0)) pos.stopLoss = newStop;
  }
}

async function checkMarketEnvironment(fetchFn) {
  try {
    const data = await fetchFn('sh000300', 60);
    if (!data || data.length < 30) return null;
    const closes = data.map(d => d.close);
    const ma20 = closes.slice(-20).reduce((a,b)=>a+b,0)/20;
    const ma60 = closes.length >= 60 ? closes.slice(-60).reduce((a,b)=>a+b,0)/60 : ma20;
    return { trend: closes[closes.length-1] > ma20 ? 'up' : 'down', ma20, ma60 };
  } catch { return null; }
}

const DEFAULT_RISK_LIMITS = {
  maxSinglePosition: 0.20, maxTotalPosition: 0.80, minCashReserve: 0.20,
  maxSingleLoss: 0.03, maxDailyLoss: 0.05, maxDrawdown: 0.15,
  stopLossRequired: true, requireMarketFilter: false,
};

function applyRiskLimits(sum, portfolio, limits) {
  const result = { position: sum.position, riskChecks: [], blocked: false, blockReasons: [], riskLevel: 'LOW', stopLossBreaches: [] };
  if (!portfolio || !limits) return result;
  const equity = portfolio.equity || 0;
  const totalMv = portfolio.positions.reduce((s,p)=>s+(p.marketValue||0),0);
  const totalPosPct = equity > 0 ? totalMv / equity : 0;
  const maxTotal = limits.maxTotalPosition;
  const maxSingle = limits.maxSinglePosition;
  const minCash = limits.minCashReserve;
  const maxDD = limits.maxDrawdown;

  if (totalPosPct > maxTotal) {
    result.riskChecks.push(`总仓位 ${(totalPosPct*100).toFixed(0)}% 超过上限 ${(maxTotal*100).toFixed(0)}%`);
    result.position = Math.min(result.position, Math.max(0, (maxTotal - totalPosPct) * 100));
  }
  if (portfolio.peakEquity > 0 && (portfolio.peakEquity - equity) / portfolio.peakEquity > maxDD) {
    result.blocked = true;
    result.blockReasons.push(`回撤熔断 ${((portfolio.peakEquity - equity)/portfolio.peakEquity*100).toFixed(1)}% > ${(maxDD*100).toFixed(0)}%`);
    result.riskLevel = 'CRITICAL';
    result.position = 0;
  }
  const cashPct = equity > 0 ? portfolio.cash / equity : 1;
  if (cashPct < minCash) {
    result.riskChecks.push(`现金 ${(cashPct*100).toFixed(0)}% 低于保留线 ${(minCash*100).toFixed(0)}%`);
  }
  for (const p of portfolio.positions) {
    const singlePct = equity > 0 ? (p.marketValue || 0) / equity : 0;
    if (singlePct > maxSingle) result.riskChecks.push(`${p.code} 单标仓位 ${(singlePct*100).toFixed(0)}% 超限`);
    if (p.stopLoss && p.currentPrice && p.currentPrice <= p.stopLoss) {
      result.stopLossBreaches.push(p.code);
    }
  }
  if (result.riskLevel !== 'CRITICAL') {
    if (result.riskChecks.length > 2) result.riskLevel = 'HIGH';
    else if (result.riskChecks.length > 0) result.riskLevel = 'MEDIUM';
  }
  return result;
}

function recordEquity(equity) {
  try {
    const key = 'equity_history';
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ t: new Date().toISOString(), v: equity });
    if (arr.length > 365) arr.shift();
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

/* ---------- 5. 量化指标（单次遍历优化版） ---------- */
function _returns(closes) {
  const r = new Float64Array(closes.length - 1);
  for (let i = 1; i < closes.length; i++) r[i-1] = (closes[i] - closes[i-1]) / closes[i-1];
  return r;
}
function _mean(arr) { let s = 0; for (let i = 0; i < arr.length; i++) s += arr[i]; return s / arr.length; }
function _std(arr, mean) { let s = 0; for (let i = 0; i < arr.length; i++) { const d = arr[i] - mean; s += d * d; } return Math.sqrt(s / arr.length); }

function annualReturn(returns) {
  const mean = _mean(returns);
  return Math.pow(1 + mean, 252) - 1;
}
function volatility(returns) {
  const mean = _mean(returns);
  return _std(returns, mean) * Math.sqrt(252);
}
function sharpeRatio(returns, riskFree = 0.03/252) {
  const mean = _mean(returns) - riskFree;
  const std = _std(returns, mean + riskFree);
  return std === 0 ? 0 : (mean / std) * Math.sqrt(252);
}
function sortinoRatio(returns, riskFree = 0.03/252) {
  const mean = _mean(returns) - riskFree;
  let s = 0, n = 0;
  for (let i = 0; i < returns.length; i++) if (returns[i] < riskFree) { const d = returns[i] - riskFree; s += d * d; n++; }
  const downside = n > 0 ? Math.sqrt(s / n) * Math.sqrt(252) : 0;
  return downside === 0 ? 0 : (mean * 252) / downside;
}
function maxDrawdown(closes) {
  let peak = closes[0], peakIdx = 0, maxDD = 0, maxPeakIdx = 0, maxTroughIdx = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > peak) { peak = closes[i]; peakIdx = i; }
    const dd = (peak - closes[i]) / peak;
    if (dd > maxDD) { maxDD = dd; maxPeakIdx = peakIdx; maxTroughIdx = i; }
  }
  return { value: maxDD, peakIdx: maxPeakIdx, troughIdx: maxTroughIdx };
}
function calmarRatio(returns, closes) {
  const ann = annualReturn(returns);
  const mdd = maxDrawdown(closes).value;
  return mdd === 0 ? 0 : ann / mdd;
}
function trendStrength(closes) {
  if (closes.length < 20) return 0;
  const n = closes.length;
  const ma20 = closes.slice(-20).reduce((a,b)=>a+b,0)/20;
  const ma60 = n >= 60 ? closes.slice(-60).reduce((a,b)=>a+b,0)/60 : ma20;
  const dist = Math.abs(ma20 - ma60) / ma60;
  const dir = ma20 > ma60 ? 1 : -1;
  return Math.min(100, Math.max(0, dist * 500)) * dir;
}
function correlation(x, y) {
  const n = Math.min(x.length, y.length);
  let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; sxy += x[i]*y[i]; sx2 += x[i]*x[i]; sy2 += y[i]*y[i]; }
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
  return den === 0 ? 0 : num / den;
}
function betaToMarket(stockR, marketR) {
  const n = Math.min(stockR.length, marketR.length);
  let sm = 0, ss = 0, sms = 0, ss2 = 0;
  for (let i = 0; i < n; i++) { sm += marketR[i]; ss += stockR[i]; sms += stockR[i]*marketR[i]; ss2 += marketR[i]*marketR[i]; }
  const cov = (n * sms - ss * sm) / n;
  const varM = (n * ss2 - sm * sm) / n;
  return varM === 0 ? 1 : cov / varM;
}
function alphaToMarket(stockR, marketR) {
  const beta = betaToMarket(stockR, marketR);
  const meanS = _mean(stockR), meanM = _mean(marketR);
  return meanS - beta * meanM;
}
function informationRatio(stockR, marketR) {
  const n = Math.min(stockR.length, marketR.length);
  let s = 0, ss = 0;
  for (let i = 0; i < n; i++) { const diff = stockR[i] - marketR[i]; s += diff; ss += diff * diff; }
  const mean = s / n;
  const std = Math.sqrt(ss / n - mean * mean) * Math.sqrt(252);
  return std === 0 ? 0 : (mean * 252) / std;
}

/* ---------- 6. 枢轴点 ---------- */
function calcPivots(prevHigh, prevLow, prevClose) {
  const pp = (prevHigh + prevLow + prevClose) / 3;
  const r1 = 2 * pp - prevLow;
  const s1 = 2 * pp - prevHigh;
  const r2 = pp + (prevHigh - prevLow);
  const s2 = pp - (prevHigh - prevLow);
  const r3 = prevHigh + 2 * (pp - prevLow);
  const s3 = prevLow - 2 * (prevHigh - pp);
  return {
    classic: { R3: r3, R2: r2, R1: r1, '轴心点': pp, S1: s1, S2: s2, S3: s3 },
    fibonacci: {
      R3: pp + (prevHigh - prevLow), R2: pp + 0.618 * (prevHigh - prevLow),
      R1: pp + 0.382 * (prevHigh - prevLow), '轴心点': pp,
      S1: pp - 0.382 * (prevHigh - prevLow), S2: pp - 0.618 * (prevHigh - prevLow),
      S3: pp - (prevHigh - prevLow)
    }
  };
}

/* ---------- 7. 信号汇总（整合 simpleSignal_v7 优化版） ---------- */
function _calcRSI(closes, period) {
  if (closes.length < period + 1) return 50;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[closes.length - period + i - 1] - closes[closes.length - period + i - 2];
    if (diff > 0) gain += diff; else loss -= diff;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i-1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}
function _calcMACD(closes) {
  const ema = (arr, n) => {
    const k = 2 / (n + 1); let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  };
  const dif = ema(closes, 12) - ema(closes, 26);
  return { macd: dif, signal: dif * 0.2, hist: dif * 0.8 };
}
function _calcKDJ(closes, highs, lows, n=9) {
  if (closes.length < n) return { k: 50, d: 50, j: 50 };
  let k = 50, d = 50;
  for (let i = closes.length - n; i < closes.length; i++) {
    const hi = Math.max(...highs.slice(Math.max(0, i-n+1), i+1));
    const lo = Math.min(...lows.slice(Math.max(0, i-n+1), i+1));
    const r = hi === lo ? 50 : (closes[i] - lo) / (hi - lo) * 100;
    k = 2/3 * k + 1/3 * r;
    d = 2/3 * d + 1/3 * k;
  }
  return { k, d, j: 3 * k - 2 * d };
}
function _calcCCI(closes, highs, lows, n=20) {
  if (closes.length < n) return 0;
  let s = 0, md = 0;
  for (let i = closes.length - n; i < closes.length; i++) s += (highs[i] + lows[i] + closes[i]) / 3;
  const ma = s / n;
  for (let i = closes.length - n; i < closes.length; i++) md += Math.abs((highs[i] + lows[i] + closes[i]) / 3 - ma);
  md /= n;
  const lastTp = (highs[highs.length-1] + lows[lows.length-1] + closes[closes.length-1]) / 3;
  return md === 0 ? 0 : (lastTp - ma) / (0.015 * md);
}
function _calcWR(closes, highs, lows, n=14) {
  if (closes.length < n) return -50;
  const h = Math.max(...highs.slice(-n));
  const l = Math.min(...lows.slice(-n));
  return h === l ? -50 : (h - closes[closes.length-1]) / (h - l) * -100;
}
function _calcADX(highs, lows, closes, n=14) {
  if (closes.length < n * 2) return 20;
  let trSum = 0, plusDMSum = 0, minusDMSum = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1]));
    const plusDM = highs[i] - highs[i-1] > lows[i-1] - lows[i] ? Math.max(highs[i] - highs[i-1], 0) : 0;
    const minusDM = lows[i-1] - lows[i] > highs[i] - highs[i-1] ? Math.max(lows[i-1] - lows[i], 0) : 0;
    trSum += tr; plusDMSum += plusDM; minusDMSum += minusDM;
  }
  const plusDI = trSum === 0 ? 0 : (plusDMSum / trSum) * 100;
  const minusDI = trSum === 0 ? 0 : (minusDMSum / trSum) * 100;
  return (plusDI + minusDI) === 0 ? 0 : Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
}
function _calcBOLL(closes, n=20) {
  if (closes.length < n) {
    const c = closes[closes.length-1];
    return { upper: c*1.02, mid: c, lower: c*0.98 };
  }
  const slice = closes.slice(-n);
  const mid = slice.reduce((a,b)=>a+b,0)/n;
  let s = 0;
  for (const v of slice) { const d = v - mid; s += d * d; }
  const std = Math.sqrt(s / n);
  return { upper: mid + 2 * std, mid, lower: mid - 2 * std };
}
function _calcVR(closes, vols, n=26) {
  if (closes.length < n) return 100;
  let upVol = 0, downVol = 0, eqVol = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    if (i === 0) continue;
    if (closes[i] > closes[i-1]) upVol += vols[i];
    else if (closes[i] < closes[i-1]) downVol += vols[i];
    else eqVol += vols[i];
  }
  return downVol === 0 ? 999 : (upVol + eqVol * 0.5) / (downVol + eqVol * 0.5) * 100;
}

function summarize(closes, highs, lows, opens, vols, pivots, basic) {
  const n = closes.length;
  const price = closes[n - 1];

  // 均线（单次遍历）
  let s5 = 0, s10 = 0, s20 = 0, s60 = 0;
  for (let i = 0; i < n; i++) {
    const v = closes[i];
    if (i >= n - 5) s5 += v;
    if (i >= n - 10) s10 += v;
    if (i >= n - 20) s20 += v;
    if (i >= n - 60) s60 += v;
  }
  const ma5 = s5 / Math.min(5, n);
  const ma10 = s10 / Math.min(10, n);
  const ma20 = s20 / Math.min(20, n);
  const ma60 = n >= 60 ? s60 / 60 : ma20;
  const prev = closes[n - 2] || price;
  const changePct = (price - prev) / prev * 100;
  const pct5 = n > 5 ? (price - closes[n - 5]) / closes[n - 5] * 100 : 0;

  // 评分
  let score = 0;
  if (price > ma5) score += 1.5; else score -= 1.5;
  if (price > ma20) score += 1.2; else score -= 1.2;
  if (price > ma60) score += 0.8; else score -= 0.8;
  if (ma5 > ma20) score += 0.5; else score -= 0.5;
  if (ma20 > ma60) score += 0.3; else score -= 0.3;
  if (changePct > 1) score += 0.5; else if (changePct < -1) score -= 0.5;
  if (pct5 > 3) score += 1; else if (pct5 < -3) score -= 1;

  // ===== 量价决策树(深度版,基于"健康量价结构") =====
  // 必须在 score 算完之后、分档之前执行,这样 vpDivergence 才能影响 overall
  // 1) OBV 8日斜率(拉长窗口,避免单日波动误判)
  let obvSlope8 = 0;
  if (n >= 9) {
    let cur = 0, past = 0;
    for (let i = 0; i < n; i++) {
      if (i >= n - 8) cur += (closes[i] > (closes[i-1] || closes[i]) ? vols[i] : (closes[i] < (closes[i-1] || closes[i]) ? -vols[i] : 0));
      if (i === n - 9) past = cur;
    }
    obvSlope8 = (cur - past) / (Math.abs(past) + 1);
  }
  const isObvUp = obvSlope8 > 0.01;
  const isObvDown = obvSlope8 < -0.01;

  // 2) 关键量
  const lastVol = vols[n - 1];
  const sum5Vol = vols.slice(-5).reduce((a, b) => a + b, 0);
  const sum20Vol = vols.slice(-20).reduce((a, b) => a + b, 0);
  const avgVol5 = sum5Vol / 5;
  const avgVol20 = sum20Vol / 20;
  const volMedian20 = (() => {
    const arr = vols.slice(-20).slice().sort((a, b) => a - b);
    return arr[Math.floor(arr.length / 2)];
  })();
  const recentHigh20 = highs ? Math.max(...highs.slice(-20)) : price * 1.05;
  const recentLow20 = lows ? Math.min(...lows.slice(-20)) : price * 0.95;
  const priceUp1d = closes[n - 1] > closes[n - 2];
  const priceSlope5 = n > 5 ? (price - closes[n - 5]) / closes[n - 5] : 0;
  const pullbackFromHigh = (recentHigh20 - price) / recentHigh20;
  // 价格在近 20 日所处的位置(0~1,1=创近 20 日新高)
  const pricePosition20 = recentHigh20 > recentLow20 ? (price - recentLow20) / (recentHigh20 - recentLow20) : 0.5;

  // 3) 突破 / 放量 / 缩量
  const isBreakHigh = price > recentHigh20;
  const isBigVolNow = lastVol > volMedian20 * 1.5;
  const isShrinkingVol = avgVol5 < avgVol20 * 0.85;
  // "大成交量"判定(更适合放量上涨分支):最近 3 日任一成交量 > 20 日均量 1.05x
  // 阈值 1.05x 是为了捕捉"温和放量"(8/14 1.77M vs 1.62M 均量 = 1.09x,稍微命中)
  // 配合价涨(priceUp1d)即可判定为放量上涨,不要求绝对巨量
  const isAboveAvgVol = lastVol > avgVol20 * 1.05 || vols[n - 2] > avgVol20 * 1.05 || vols[n - 3] > avgVol20 * 1.05;

  // 4) 真背离:严格三件套 —— 价格创近 20 日新高/高位 + OBV 显著流出 + 价格上涨趋势
  // 之所以加 "obvSlope8 < -0.05" 和 "pricePosition20 > 0.8" 是为了过滤"放量上涨中 OBV 微调"这种健康结构
  const isStrongObvDown = obvSlope8 < -0.05;
  const isTrueDivergence = priceSlope5 > 0.02 && isStrongObvDown && pricePosition20 > 0.8;

  // 5) 缩量洗盘:从近期高点小幅回撤(2%~8%)+ 持续缩量
  const isShrinkingWash = pullbackFromHigh > 0.02 && pullbackFromHigh < 0.08 && isShrinkingVol && !priceUp1d;

  // 6) 决策树
  let vpScore = 0, vpLabel = '量价中性', vpEvent = '', vpDivergence = false;
  if (isTrueDivergence && isBreakHigh) {
    // 真背离 + 价破前高 —— 假突破嫌疑
    vpScore = -1.5; vpLabel = '量价背离'; vpEvent = 'divergence'; vpDivergence = true;
  } else if (isTrueDivergence) {
    // 真背离(高位 + OBV 显著流出)—— 顶背离
    vpScore = -1; vpLabel = '量价背离'; vpEvent = 'divergence'; vpDivergence = true;
  } else if (isBreakHigh && isBigVolNow) {
    // 价破前高 + 大成交量 → 放量上涨/突破(OBV 不再强约束,避免误判健康结构)
    // OBV 上行 → 真突破;OBV 中性 → 放量上涨;OBV 显著流出已被 isTrueDivergence 捕获
    vpScore = isObvUp ? 1.5 : 1; vpLabel = isObvUp ? '放量突破' : '放量上涨'; vpEvent = 'fangBreakout'; vpDivergence = false;
  } else if (isAboveAvgVol && priceUp1d) {
    // 量增 + 价涨(未破前高)→ 放量上涨
    vpScore = 1; vpLabel = '放量上涨'; vpEvent = 'upTrend'; vpDivergence = false;
  } else if (lastVol > avgVol20 * 1.5 && !priceUp1d) {
    vpScore = -1; vpLabel = '放量滞涨'; vpEvent = 'fangBreak'; vpDivergence = false;
  } else if (isShrinkingWash) {
    vpScore = 0.5; vpLabel = '缩量洗盘'; vpEvent = 'shrinkingWash'; vpDivergence = false;
  } else if (lastVol > avgVol20 * 1.5 && priceUp1d) {
    vpScore = 1; vpLabel = '量价齐升'; vpEvent = 'upTrend'; vpDivergence = false;
  } else if (priceSlope5 > 0 && isObvUp) {
    vpScore = 0.5; vpLabel = '温和上行'; vpEvent = 'upTrend'; vpDivergence = false;
  } else {
    vpScore = 0; vpLabel = '量价中性'; vpEvent = ''; vpDivergence = false;
  }
  // OBV 累计值(给 volGroup / obvInfo 用)
  let obv = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      if (closes[i] > closes[i - 1]) obv += vols[i];
      else if (closes[i] < closes[i - 1]) obv -= vols[i];
    }
  }
  const obvDirection = isObvUp ? 'up' : (isObvDown ? 'down' : 'neutral');
  const volaRatio = avgVol20 > 0 ? avgVol5 / avgVol20 : 1;

  // ===== 量价积分合并到 score,让总分反映量价 =====
  // 真背离 -2 分,缩量洗盘 +0.5,真放量突破 +1
  if (vpDivergence) score -= 2;
  else if (vpEvent === 'shrinkingWash') score += 0.5;
  else if (vpEvent === 'fangBreakout') score += 1;

  let overall, action, position, confidence;
  if (score >= 5) { overall = '强力买入'; action = '强势突破，积极跟进'; position = 85; confidence = 90; }
  else if (score >= 3.5) { overall = '买入'; action = '趋势向好，分批建仓'; position = 65; confidence = 75; }
  else if (score >= 2) { overall = '左侧试探'; action = '底部区域，轻仓试水'; position = 35; confidence = 55; }
  else if (score >= 0.5) { overall = '超卖区'; action = '超跌反弹机会'; position = 20; confidence = 40; }
  else if (score >= -0.5) { overall = '观望'; action = '等待方向明朗'; position = 0; confidence = 30; }
  else if (score >= -2) { overall = '高空防守'; action = '高位滞涨，逐步减仓'; position = 25; confidence = 50; }
  else if (score >= -3.5) { overall = '卖出'; action = '趋势走弱，果断减仓'; position = 50; confidence = 70; }
  else { overall = '强力卖出'; action = '全面转空，清仓避险'; position = 75; confidence = 85; }

  // ===== 量价修正:让 overall/position/confidence 跟 vpDivergence / vpEvent 联动 =====
  // 真背离 + 买入信号 → 必须降级,否则会出现"买入 75% + 量价背离"这种自相矛盾
  if (vpDivergence) {
    if (overall === '强力买入' || overall === '买入') {
      overall = '高空防守'; action = '量价背离(价格涨但 OBV 流出),主力趁高出货,逢高减仓为主';
      position = Math.min(position, 30);
      confidence = Math.min(confidence, 50);
    } else if (overall === '左侧试探') {
      overall = '观望'; action = '量价背离,放弃左侧试仓,等待方向明朗';
      position = 0; confidence = Math.min(confidence, 30);
    } else if (overall === '超卖区') {
      // 底部区域 + 背离不算背离(底部反弹的量价背离反而可能是机会) → 维持
    }
  }
  // 缩量洗盘 + 买入 → 加分(健康回调后介入是好时机)
  if (vpEvent === 'shrinkingWash') {
    if (overall === '买入' || overall === '左侧试探') {
      confidence = Math.min(100, confidence + 5);
    }
  }
  // 假突破嫌疑(vpEvent === 'fangBreakout' 但 OBV 没跟上) → 已经在决策树里 vpDivergence=true,会被上面捕获
  // 真放量突破(vpEvent === 'fangBreakout' 且无背离) → 加分
  if (vpEvent === 'fangBreakout' && !vpDivergence) {
    if (overall === '买入' || overall === '强力买入') {
      confidence = Math.min(100, confidence + 5);
    }
  }

  // ATR（单次遍历）
  let atr = price * 0.02;
  if (highs && lows && highs.length === n) {
    const tr = new Float64Array(n - 1);
    for (let i = 1; i < n; i++) {
      tr[i - 1] = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    }
    if (tr.length >= 14) {
      let atrVal = 0;
      for (let i = 0; i < 14; i++) atrVal += tr[i];
      atrVal /= 14;
      for (let i = 14; i < tr.length; i++) atrVal = (atrVal * 13 + tr[i]) / 14;
      if (atrVal > 0) atr = atrVal;
    }
  }

  // 支撑阻力
  const high20 = highs ? Math.max(...highs.slice(-20)) : price * 1.05;
  const low20 = lows ? Math.min(...lows.slice(-20)) : price * 0.95;
  const pp = (high20 + low20 + price) / 3;
  const s1 = 2 * pp - high20;
  const r1 = 2 * pp - low20;
  const r2 = pp + (high20 - low20);

  // v7 优化逻辑
  const trendOk = price > ma20 && ma5 > ma20;
  const momentum20 = n > 20 ? (price - closes[n - 21]) / closes[n - 21] : 0;
  const atrPct = atr / price;
  const isStrongTrend = momentum20 > 0.10;
  const isVeryStrong = momentum20 > 0.15;

  let stopMult = 2.0;
  if (atrPct > 0.04) stopMult = 3.0;
  else if (atrPct > 0.035) stopMult = 2.5;
  const stopLoss = Math.min(price - stopMult * atr, s1, price * 0.95);

  let mult1 = 1.0, mult2 = 2.0, mult3 = 3.5;
  if (isVeryStrong) { mult1 = 1.5; mult2 = 3.0; mult3 = 5.25; }
  let volMult = 1.0;
  if (atrPct < 0.015) volMult = 1.5;
  else if (atrPct > 0.04) volMult = 0.8;

  const atr1 = price + mult1 * atr * volMult;
  const atr2 = price + mult2 * atr * volMult;
  const atr3 = price + mult3 * atr * volMult;

  let l1Ratio = 0.30, l2Ratio = 0.30, l3Ratio = 0.40;
  if (isStrongTrend) l3Ratio = 0.30;

  const takeProfitLevels = [
    { price: atr1, ratio: l1Ratio, label: `+${(mult1 * volMult).toFixed(2)}ATR(短线)` },
    { price: atr2, ratio: l2Ratio, label: `+${(mult2 * volMult).toFixed(2)}ATR(中线)` },
    { price: atr3, ratio: l3Ratio, label: `+${(mult3 * volMult).toFixed(2)}ATR(长线)` }
  ];

  let triggerMult = 2.0, stepMult = 2.0;
  if (isVeryStrong) { triggerMult = 4.0; stepMult = 3.0; }
  else if (isStrongTrend) { triggerMult = 3.0; stepMult = 3.0; }

  const trailingStop = {
    enabled: true, trigger: price + triggerMult * atr,
    step: stepMult * atr, currentStop: stopLoss
  };

  // 回测（轻量版）
  let buySamples = 0, buyWin = 0, buySum = 0;
  const holdDays = 5, lookback = Math.min(60, n - holdDays);
  for (let i = n - lookback - holdDays; i < n - holdDays; i++) {
    if (i < 0) continue;
    if (closes[i] > (i>0?closes[i-1]:closes[i]) && vols[i] > (vols[i-1]||vols[i])) {
      buySamples++;
      const ret = (closes[i+holdDays] - closes[i]) / closes[i];
      buySum += ret;
      if (ret > 0) buyWin++;
    }
  }

  // 指标分组
  const trendGroup = [
    { name: 'MA5', value: ma5, signal: price > ma5 ? '买入' : '卖出' },
    { name: 'MA10', value: ma10, signal: price > ma10 ? '买入' : '卖出' },
    { name: 'MA20', value: ma20, signal: price > ma20 ? '买入' : '卖出' },
    { name: 'MA60', value: ma60, signal: price > ma60 ? '买入' : '卖出' },
  ];

  const rsi = _calcRSI(closes, 14);
  const macd = _calcMACD(closes);
  const kdj = _calcKDJ(closes, highs, lows);
  const roc = n > 10 ? (price - closes[n-11]) / closes[n-11] * 100 : 0;
  const momentumGroup = [
    { name: 'RSI 14', value: rsi, min: 0, max: 100, signal: rsi > 70 ? '超买' : rsi < 30 ? '超卖' : '中性' },
    { name: 'MACD', value: macd.macd, min: -Math.abs(macd.signal)*2, max: Math.abs(macd.signal)*2, signal: macd.hist > 0 ? '买入' : '卖出' },
    { name: 'KDJ K', value: kdj.k, min: 0, max: 100, signal: kdj.k > 80 ? '超买' : kdj.k < 20 ? '超卖' : '中性' },
    { name: 'ROC 10', value: roc, min: -15, max: 15, signal: roc > 5 ? '买入' : roc < -5 ? '卖出' : '中性' },
  ];

  const cci = _calcCCI(closes, highs, lows, 20);
  const wr = _calcWR(closes, highs, lows, 14);
  const adx = _calcADX(highs, lows, closes, 14);
  const boll = _calcBOLL(closes, 20);
  const volaGroup = [
    { name: 'CCI 20', value: cci, min: -200, max: 200, signal: cci > 100 ? '超买区' : cci < -100 ? '超卖区' : '中性' },
    { name: 'WR 14', value: wr, min: -100, max: 0, signal: wr < -80 ? '超卖区' : wr > -20 ? '超买区' : '中性' },
    { name: 'ADX 14', value: adx, min: 0, max: 100, signal: adx > 25 ? '中等波动' : '无趋势' },
    { name: 'BOLL', value: (price - boll.mid) / (boll.upper - boll.lower || 1) * 100, min: -100, max: 100, signal: price > boll.upper ? '超买' : price < boll.lower ? '超卖' : '中性' },
  ];

  const vr = _calcVR(closes, vols, 26);
  const volGroup = [
    { name: 'OBV', value: obv, min: -Math.abs(obv)*2, max: Math.abs(obv)*2, signal: obvDirection === 'up' ? '资金流入' : (obvDirection === 'down' ? '资金流出' : '中性') },
    { name: 'VR 26', value: vr, min: 0, max: 300, signal: vr > 150 ? '放量' : vr < 70 ? '缩量' : '中性' },
    { name: 'VOL 5/10', value: volaRatio, min: 0, max: 3, signal: volaRatio > 1.3 ? '放量' : volaRatio < 0.7 ? '缩量' : '中性' },
  ];

  // 枢轴点评分
  let pivotBuy = 0, pivotSell = 0, pivotLabel = '中性';
  if (price > pivots.classic.R1) { pivotBuy = 2; pivotLabel = '突破R1'; }
  else if (price > pivots.classic['轴心点']) { pivotBuy = 1; pivotLabel = '轴上'; }
  else if (price < pivots.classic.S1) { pivotSell = 2; pivotLabel = '跌破S1'; }
  else if (price < pivots.classic['轴心点']) { pivotSell = 1; pivotLabel = '轴下'; }

  let pivotBreakdown = null, pivotBreakout = null;
  if (price < pivots.classic.S1) pivotBreakdown = { level: 'S1', from: pivots.classic.S1, to: 'S2' };
  if (price > pivots.classic.R1) pivotBreakout = { level: 'R1', from: pivots.classic.R1, target: 'R2' };

  let trend = '震荡', trendScore = 0;
  if (price > ma60 && ma20 > ma60 && ma5 > ma20) { trend = '强多头'; trendScore = 2; }
  else if (price > ma60) { trend = '多头'; trendScore = 1; }
  else if (price < ma60 && ma20 < ma60 && ma5 < ma20) { trend = '强空头'; trendScore = -2; }
  else if (price < ma60) { trend = '空头'; trendScore = -1; }

  const anomalyIdx = [];
  for (let i = Math.max(1, n - 15); i < n; i++) {
    const avg = vols.slice(Math.max(0, i-5), i).reduce((a,b)=>a+b,0) / Math.min(5, i);
    if (vols[i] > avg * 2.0) anomalyIdx.push({ i, type: closes[i] < opens[i] ? 'high' : 'normal' });
  }

  const netScore = Math.round(score);
  const buyScore = [trendGroup, momentumGroup, volaGroup, volGroup].flat().filter(x => ['买入','超卖','资金流入','放量'].includes(x.signal)).length;
  const sellScore = [trendGroup, momentumGroup, volaGroup, volGroup].flat().filter(x => ['卖出','超买','资金流出','缩量'].includes(x.signal)).length;

  return {
    overall, action, position, confidence, score, trendOk,
    netScore, trend, trendScore, pivotLabel, pivotSell, pivotBuy,
    pivotBreakdown, pivotBreakout,
    vpScore, vpLabel, vpEvent, vpDivergence,
    obvInfo: { direction: obvDirection, value: obv, slope8: obvSlope8 },
    volaRatio,
    anomalyIdx,
    backtest: { buySamples, buyWinRate: buySamples > 0 ? buyWin / buySamples : 0, buyAvgRet: buySamples > 0 ? buySum / buySamples : 0, lookback: 60, holdDays },
    tpSl: { stopLoss, takeProfitLevels, trailingStop, atr, s1, r1, r2, hasR2: r2 > atr3, isStrongTrend, momentum20, atrPct, positionPct: 1.0, trendOk, stopMult, triggerMult, stepMult, note: 'v7优化版' },
    trendGroup, momentumGroup, volaGroup, volGroup,
    buyScore, sellScore,
    mainForce: null, fundamentals: null,
  };
}

/* ---------- 8. 预拉取 ---------- */
async function prefetchAll(stocks) {
  let success = 0, fail = 0;
  for (const s of stocks) {
    try {
      const data = await fetchKLine(s.code, 120);
      if (data && data.length >= 30) {
        const rows = data.map((k, i) => {
          const prev = i > 0 ? data[i - 1] : k;
          return {
            date: k.date, code: s.code, name: s.name,
            open: k.open, high: k.high, low: k.low, close: k.close,
            change: k.close - prev.close,
            changePct: ((k.close - prev.close) / prev.close) * 100,
            volume: k.volume,
            amount: k.volume * (k.high + k.low + k.close) / 3,
          };
        });
        HistoryTable.appendRows(rows);
        success++;
      } else { fail++; }
    } catch { fail++; }
  }
  return { success, fail };
}
