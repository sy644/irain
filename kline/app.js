<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
<meta name="theme-color" content="#0f172a" />
<title>股票详情</title>
<style>
  :root{
    --bg:#0b1020; --panel:#121933; --panel2:#0f1530; --line:#1f2a4a;
    --text:#e6ecff; --muted:#8a93b6; --accent:#5b8cff; --accent2:#7c5bff;
    --up:#ef4444; --dn:#10b981; --warn:#f59e0b; --good:#22c55e; --bad:#ef4444;
    --r:14px;
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;-webkit-tap-highlight-color:transparent}
  a{color:var(--accent);text-decoration:none}
  .wrap{max-width:980px;margin:0 auto;padding:14px 14px 80px}
  .top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
  .top .back{font-size:13px;color:var(--muted)}
  .top .name{font-size:18px;font-weight:600;display:flex;align-items:center;gap:8px}
  .top .name .code{color:var(--muted);font-weight:400;font-size:13px}
  .top .actions{display:flex;gap:8px}
  .btn{background:var(--panel);border:1px solid var(--line);color:var(--text);padding:8px 12px;border-radius:10px;font-size:13px;cursor:pointer}
  .btn:active{transform:scale(0.98)}
  .btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;color:#fff}
  .btn.ghost{background:transparent}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:14px;margin-bottom:12px}
  .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .hd h3{margin:0;font-size:14px;color:var(--muted);font-weight:500;letter-spacing:0.5px}
  .priceRow{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
  .price{font-size:34px;font-weight:700;letter-spacing:-0.5px}
  .change{font-size:14px}
  .up{color:var(--up)}.dn{color:var(--dn)}.warn{color:var(--warn)}.good{color:var(--good)}.bad{color:var(--bad)}
  .kv{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
  .kv .k{color:var(--muted);font-size:12px}
  .kv .v{font-size:14px;font-weight:600;margin-top:2px}
  .signal{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:linear-gradient(135deg,rgba(91,140,255,.15),rgba(124,91,255,.15));border:1px solid var(--line)}
  .pill{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}
  .pill.up{background:rgba(239,68,68,.15);color:var(--up)}
  .pill.dn{background:rgba(16,185,129,.15);color:var(--dn)}
  .pill.warn{background:rgba(245,158,11,.15);color:var(--warn)}
  .pill.good{background:rgba(34,197,94,.15);color:var(--good)}
  .pill.neutral{background:rgba(138,147,182,.15);color:var(--muted)}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .row3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .meter{position:relative;height:8px;background:#1a2247;border-radius:999px;overflow:hidden}
  .meter > i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px}
  .ind{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:10px;background:var(--panel2);margin-bottom:6px;font-size:13px}
  .ind .n{color:var(--muted);display:flex;align-items:center;gap:6px}
  .ind .v{font-weight:600;font-feature-settings:"tnum"}
  .ind .s{font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(138,147,182,.12);color:var(--muted)}
  .ind .s.buy{background:rgba(239,68,68,.15);color:var(--up)}
  .ind .s.sell{background:rgba(16,185,129,.15);color:var(--dn)}
  .ind .s.good{background:rgba(34,197,94,.15);color:var(--good)}
  .ind .s.bad{background:rgba(239,68,68,.15);color:var(--up)}
  .ind .s.warn{background:rgba(245,158,11,.15);color:var(--warn)}
  .ind .s.neutral{background:rgba(138,147,182,.15);color:var(--muted)}
  .tpRow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .tpBox{background:var(--panel2);border-radius:10px;padding:10px;font-size:12px}
  .tpBox .lbl{color:var(--muted)}
  .tpBox .pv{font-size:16px;font-weight:700;margin-top:4px}
  .tpBox .ratio{font-size:11px;color:var(--muted);margin-top:2px}
  .warns{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.7;margin-top:8px}
  .warns b{color:var(--warn)}
  .chartWrap{position:relative;width:100%;height:280px;background:var(--panel2);border-radius:10px;overflow:hidden}
  canvas{display:block;width:100%;height:100%}
  .chartTools{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
  .chartTools .seg{background:var(--panel2);border:1px solid var(--line);color:var(--text);padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer}
  .chartTools .seg.on{background:var(--accent);border-color:transparent;color:#fff}
  .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:var(--muted);gap:10px;text-align:center}
  .empty svg{opacity:0.5}
  .skel{background:linear-gradient(90deg,#1a2247 0%,#232c52 50%,#1a2247 100%);background-size:200% 100%;animation:sk 1.4s linear infinite;border-radius:6px;height:14px}
  @keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;align-items:flex-end;justify-content:center;z-index:50}
  .modal.show{display:flex}
  .sheet{width:100%;max-width:720px;background:var(--panel);border-top-left-radius:18px;border-top-right-radius:18px;padding:16px;max-height:88vh;overflow:auto}
  .sheet h2{margin:0 0 12px;font-size:16px}
  .field{margin-bottom:10px}
  .field label{display:block;font-size:12px;color:var(--muted);margin-bottom:4px}
  .field input,.field select{width:100%;background:var(--panel2);border:1px solid var(--line);color:var(--text);padding:10px;border-radius:8px;font-size:14px}
  .presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
  .preset-btn{background:var(--panel2);border:1px solid var(--line);color:var(--text);padding:6px 10px;border-radius:999px;font-size:12px;cursor:pointer}
  .footer-row{display:flex;gap:8px;margin-top:14px}
  .footer-row .btn{flex:1}
  .tag{display:inline-block;padding:2px 8px;border-radius:6px;background:rgba(91,140,255,.15);color:var(--accent);font-size:11px;margin-left:6px}
  .posBar{height:6px;background:#1a2247;border-radius:999px;overflow:hidden;margin-top:6px}
  .posBar > i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2))}
  .seg-title{font-size:12px;color:var(--muted);margin:6px 0 4px}
  .fadein{animation:fi .3s ease}
  @keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
</style>
</head>
<body>
<div class="wrap" id="root">
  <div class="empty">
    <div class="skel" style="width:60%"></div>
    <div class="skel" style="width:40%"></div>
    <div class="skel" style="width:80%;height:120px"></div>
  </div>
</div>

<!-- 风控弹层 -->
<div class="modal" id="riskModal">
  <div class="sheet">
    <h2>风控参数 <span class="tag" id="riskScope">单只</span></h2>
    <div class="presets">
      <button class="preset-btn" data-preset="conservative">保守</button>
      <button class="preset-btn" data-preset="balanced">均衡</button>
      <button class="preset-btn" data-preset="aggressive">激进</button>
    </div>
    <div class="field"><label>单笔最大亏损 (%)</label><input type="number" id="rMaxLoss" step="0.5" min="0.5" max="20" /></div>
    <div class="field"><label>单只最大持仓 (%)</label><input type="number" id="rMaxPos" step="1" min="5" max="100" /></div>
    <div class="field"><label>回撤熔断 (%)</label><input type="number" id="rCircuit" step="1" min="5" max="50" /></div>
    <div class="field"><label>ATR 止损倍数</label><input type="number" id="rAtrMult" step="0.1" min="0.5" max="5" /></div>
    <div class="field"><label>移动止盈触发 (ATR)</label><input type="number" id="rTrailTrig" step="0.1" min="0.5" max="5" /></div>
    <div class="field"><label>移动止盈步长 (ATR)</label><input type="number" id="rTrailStep" step="0.1" min="0.1" max="3" /></div>
    <div class="field"><label>应用范围</label>
      <select id="rScope">
        <option value="single">仅当前标的</option>
        <option value="all">全部标的（默认）</option>
      </select>
    </div>
    <div class="footer-row">
      <button class="btn ghost" id="riskReset">重置</button>
      <button class="btn ghost" id="riskCancel">取消</button>
      <button class="btn primary" id="riskSave">保存</button>
    </div>
  </div>
</div>

<script>
"use strict";
/* ================================================================
 * 第一部分：工具、数据、量化、核心信号
 * （保留原代码全部逻辑，修复 vConsole / OBV / pivots 三个 bug）
 * ================================================================ */

// ★ 修复 #1：vConsole 不在生产构建里直接 new，安全降级
var vConsole = null;
try {
  if (window.VConsole) vConsole = new window.VConsole();
} catch (e) { vConsole = null; }
window.addEventListener('error', function (e) { console.error('[err]', e.message); });
window.addEventListener('unhandledrejection', function (e) { console.error('[promise]', e.reason); });

function toast(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1a202c;color:#fff;padding:10px 22px;border-radius:12px;font-size:14px;z-index:999;box-shadow:0 8px 30px rgba(0,0,0,0.2);max-width:90vw;text-align:center;font-weight:500;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function getCodeFromURL() {
  const p = new URLSearchParams(location.search);
  return p.get('code');
}

function findName(code) {
  const list = loadStocks();
  const found = list.find(s => s.code === code);
  return found ? found.name : code.toUpperCase();
}

function updateName(code, newName) {
  const list = loadStocks();
  const found = list.find(s => s.code === code);
  if (found) { found.name = newName; saveStocks(list); return true; }
  return false;
}

function loadStocks() {
  try { return JSON.parse(localStorage.getItem('stocks_v1') || '[]'); } catch { return []; }
}
function saveStocks(list) { localStorage.setItem('stocks_v1', JSON.stringify(list)); }

function getTypeByCode(code) {
  const list = loadStocks();
  const found = list.find(s => s.code === code);
  return found ? found.type : 'stock';
}
function typeLabel(t) { return t === 'index' ? ' · 指数' : t === 'etf' ? ' · ETF' : ''; }

// ----- 持仓管理 -----
function loadPortfolio() {
  try {
    const raw = localStorage.getItem('portfolio_v1');
    if (!raw) return { positions: [], cash: 100000, equity: 100000, peakEquity: 100000 };
    const p = JSON.parse(raw);
    if (!p.positions) p.positions = [];
    if (typeof p.cash !== 'number') p.cash = 100000;
    if (typeof p.equity !== 'number') p.equity = 100000;
    if (typeof p.peakEquity !== 'number') p.peakEquity = p.equity;
    return p;
  } catch { return { positions: [], cash: 100000, equity: 100000, peakEquity: 100000 }; }
}

function savePortfolio(portfolio) { localStorage.setItem('portfolio_v1', JSON.stringify(portfolio)); }

// ★ 修复 #2：被 "/* 简化 */" 的两个函数补全
function updateTrailingStop(pos, tpSl) {
  if (!pos || !tpSl || !tpSl.trailingStop || !tpSl.trailingStop.enabled) return;
  const cur = pos.currentPrice;
  const ts = tpSl.trailingStop;
  if (cur >= ts.trigger && ts.currentStop < cur - ts.step) {
    ts.currentStop = cur - ts.step;
    pos.trailingStop = ts.currentStop;
    pos.trailingStopUpdatedAt = Date.now();
  }
}

function recordEquity(eq) {
  if (typeof eq !== 'number' || !isFinite(eq)) return;
  const pf = loadPortfolio();
  pf.equity = eq;
  if (eq > pf.peakEquity) pf.peakEquity = eq;
  savePortfolio(pf);
}

// ----- 数据获取 -----
async function fetchKLine(code, count = 80) {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(code)},day,,,${count},qfq`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== 0) throw new Error('接口返回错误');
    const key = Object.keys(data.data)[0];
    const arr = (data.data[key] && (data.data[key].qfqday || data.data[key].day)) || [];
    if (!arr.length) throw new Error('无数据');
    return arr.map(row => ({
      date: row[0],
      open: +row[1],
      close: +row[2],
      high: +row[3],
      low: +row[4],
      volume: +row[5],
    })).filter(r => r.date && !isNaN(r.open));
  } catch (err) {
    clearTimeout(timeout);
    try {
      const backupUrl = `https://quotes.sina.cn/cn/api/json_v2.php/IFengService.getKLineData?symbol=${code}&scale=240&ma=no&datalen=${count}`;
      const res2 = await fetch(backupUrl, { signal: AbortSignal.timeout(5000) });
      if (!res2.ok) throw new Error('备用接口失败');
      const data2 = await res2.json();
      if (!data2 || !data2.length) throw new Error('备用数据为空');
      return data2.map(row => ({
        date: row.day,
        open: +row.open,
        close: +row.close,
        high: +row.high,
        low: +row.low,
        volume: +row.volume || 0,
      }));
    } catch (err2) {
      throw new Error(`无法获取 ${code} 的K线数据`);
    }
  }
}
async function fetchBasic(code) { return null; }

// ----- 缓存 -----
const HistoryTable = {
  _cache: {},
  _storageKey: 'kline_cache_v1',
  _saveTimer: null,
  init() {
    try {
      const saved = localStorage.getItem(this._storageKey);
      if (saved) this._cache = JSON.parse(saved);
    } catch (e) {}
  },
  getRecent(code, count) {
    const arr = this._cache[code];
    if (!arr || arr.length === 0) return [];
    return arr.slice(-count);
  },
  saveRecent(code, data) {
    if (!data || data.length < 5) return;
    this._cache[code] = data;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try { localStorage.setItem(this._storageKey, JSON.stringify(this._cache)); }
      catch (e) {
        const keys = Object.keys(this._cache);
        if (keys.length > 30) {
          // 删最老的
          for (let i = 0; i < keys.length - 30; i++) delete this._cache[keys[i]];
        }
      }
    }, 300);
  },
  getLatest(code) {
    const arr = this._cache[code];
    if (!arr || arr.length === 0) return null;
    return arr[arr.length - 1];
  },
  appendLast(row) {
    if (!row || !row.code) return;
    const existing = this._cache[row.code] || [];
    const exists = existing.some(r => r.date === row.date);
    if (exists) {
      const idx = existing.findIndex(r => r.date === row.date);
      existing[idx] = { ...existing[idx], ...row };
    } else {
      existing.push(row);
    }
    existing.sort((a, b) => a.date.localeCompare(b.date));
    this._cache[row.code] = existing;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try { localStorage.setItem(this._storageKey, JSON.stringify(this._cache)); } catch (e) {}
    }, 300);
  }
};
HistoryTable.init();

// ----- 量化指标辅助 -----
function _returns(closes) {
  const r = [];
  for (let i = 1; i < closes.length; i++) r.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  return r;
}
function annualReturn(returns) {
  if (returns.length === 0) return 0;
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  return avg * 252;
}
function volatility(returns) {
  if (returns.length < 2) return 0;
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const sq = returns.reduce((s, r) => s + (r - avg) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(sq) * Math.sqrt(252);
}
function sharpeRatio(returns, rf = 0.03) {
  const ann = annualReturn(returns);
  const vol = volatility(returns);
  return vol > 0 ? (ann - rf) / vol : 0;
}
function sortinoRatio(returns, rf = 0.03) {
  if (returns.length < 2) return 0;
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downside = returns.filter(r => r < 0);
  if (downside.length === 0) return 999;
  const dd = downside.reduce((s, r) => s + (r - avg) ** 2, 0) / downside.length;
  const std = Math.sqrt(dd) * Math.sqrt(252);
  const ann = annualReturn(returns);
  return std > 0 ? (ann - rf) / std : 0;
}
function maxDrawdown(closes) {
  let peak = closes[0], mdd = 0, peakIdx = 0, troughIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] > peak) { peak = closes[i]; peakIdx = i; }
    const dd = (peak - closes[i]) / peak;
    if (dd > mdd) { mdd = dd; troughIdx = i; }
  }
  return { value: mdd, peakIdx, troughIdx };
}
function calmarRatio(returns, closes) {
  const ann = annualReturn(returns);
  const mdd = maxDrawdown(closes).value;
  return mdd > 0 ? ann / mdd : 0;
}
function trendStrength(closes) {
  if (closes.length < 60) return 50;
  const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const ma60 = closes.slice(-60).reduce((a, b) => a + b, 0) / 60;
  const pct = (ma20 - ma60) / ma60 * 100;
  return Math.min(100, Math.max(0, 50 + pct * 1.5));
}
function betaToMarket(stockRet, marketRet) {
  if (stockRet.length !== marketRet.length || stockRet.length < 2) return 1;
  const avgS = stockRet.reduce((a, b) => a + b, 0) / stockRet.length;
  const avgM = marketRet.reduce((a, b) => a + b, 0) / marketRet.length;
  let cov = 0, varM = 0;
  for (let i = 0; i < stockRet.length; i++) {
    cov += (stockRet[i] - avgS) * (marketRet[i] - avgM);
    varM += (marketRet[i] - avgM) ** 2;
  }
  return varM > 0 ? cov / varM : 1;
}
function alphaToMarket(stockRet, marketRet) {
  const beta = betaToMarket(stockRet, marketRet);
  const avgS = stockRet.reduce((a, b) => a + b, 0) / stockRet.length;
  const avgM = marketRet.reduce((a, b) => a + b, 0) / marketRet.length;
  return avgS - beta * avgM;
}
function informationRatio(stockRet, marketRet) {
  const alpha = alphaToMarket(stockRet, marketRet);
  const residuals = [];
  const beta = betaToMarket(stockRet, marketRet);
  const avgM = marketRet.reduce((a, b) => a + b, 0) / marketRet.length;
  for (let i = 0; i < stockRet.length; i++) {
    residuals.push(stockRet[i] - beta * marketRet[i]);
  }
  const avg = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const std = Math.sqrt(residuals.reduce((s, r) => s + (r - avg) ** 2, 0) / (residuals.length - 1));
  return std > 0 ? alpha / std : 0;
}
function correlation(a, b) {
  if (a.length !== b.length || a.length < 2) return 0;
  const avgA = a.reduce((s, v) => s + v, 0) / a.length;
  const avgB = b.reduce((s, v) => s + v, 0) / b.length;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - avgA) * (b[i] - avgB);
    denA += (a[i] - avgA) ** 2;
    denB += (b[i] - avgB) ** 2;
  }
  return (denA * denB) > 0 ? num / Math.sqrt(denA * denB) : 0;
}

// ----- 技术指标 -----
function _calcRSI(closes, period) {
  if (closes.length < period + 1) return 50;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[closes.length - period + i - 1] - closes[closes.length - period + i - 2];
    if (diff > 0) gain += diff; else loss -= diff;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
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
function _calcKDJ(closes, highs, lows, n = 9) {
  if (closes.length < n) return { k: 50, d: 50, j: 50 };
  let k = 50, d = 50;
  for (let i = closes.length - n; i < closes.length; i++) {
    const hi = Math.max(...highs.slice(Math.max(0, i - n + 1), i + 1));
    const lo = Math.min(...lows.slice(Math.max(0, i - n + 1), i + 1));
    const r = hi === lo ? 50 : (closes[i] - lo) / (hi - lo) * 100;
    k = 2 / 3 * k + 1 / 3 * r;
    d = 2 / 3 * d + 1 / 3 * k;
  }
  return { k, d, j: 3 * k - 2 * d };
}
function _calcCCI(closes, highs, lows, n = 20) {
  if (closes.length < n) return 0;
  let s = 0, md = 0;
  for (let i = closes.length - n; i < closes.length; i++) s += (highs[i] + lows[i] + closes[i]) / 3;
  const ma = s / n;
  for (let i = closes.length - n; i < closes.length; i++) md += Math.abs((highs[i] + lows[i] + closes[i]) / 3 - ma);
  md /= n;
  const lastTp = (highs[highs.length - 1] + lows[lows.length - 1] + closes[closes.length - 1]) / 3;
  return md === 0 ? 0 : (lastTp - ma) / (0.015 * md);
}
function _calcWR(closes, highs, lows, n = 14) {
  if (closes.length < n) return -50;
  const h = Math.max(...highs.slice(-n));
  const l = Math.min(...lows.slice(-n));
  return h === l ? -50 : (h - closes[closes.length - 1]) / (h - l) * -100;
}
function _calcADX(highs, lows, closes, n = 14) {
  if (closes.length < n * 2) return 20;
  let trSum = 0, plusDMSum = 0, minusDMSum = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    const plusDM = highs[i] - highs[i - 1] > lows[i - 1] - lows[i] ? Math.max(highs[i] - highs[i - 1], 0) : 0;
    const minusDM = lows[i - 1] - lows[i] > highs[i] - highs[i - 1] ? Math.max(lows[i - 1] - lows[i], 0) : 0;
    trSum += tr; plusDMSum += plusDM; minusDMSum += minusDM;
  }
  const plusDI = trSum === 0 ? 0 : (plusDMSum / trSum) * 100;
  const minusDI = trSum === 0 ? 0 : (minusDMSum / trSum) * 100;
  return (plusDI + minusDI) === 0 ? 0 : Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
}
function _calcBOLL(closes, n = 20) {
  if (closes.length < n) {
    const c = closes[closes.length - 1];
    return { upper: c * 1.02, mid: c, lower: c * 0.98 };
  }
  const slice = closes.slice(-n);
  const mid = slice.reduce((a, b) => a + b, 0) / n;
  let s = 0;
  for (const v of slice) { const d = v - mid; s += d * d; }
  const std = Math.sqrt(s / n);
  return { upper: mid + 2 * std, mid, lower: mid - 2 * std };
}
function _calcVR(closes, vols, n = 26) {
  if (closes.length < n) return 100;
  let upVol = 0, downVol = 0, eqVol = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    if (i === 0) continue;
    if (closes[i] > closes[i - 1]) upVol += vols[i];
    else if (closes[i] < closes[i - 1]) downVol += vols[i];
    else eqVol += vols[i];
  }
  return downVol === 0 ? 999 : (upVol + eqVol * 0.5) / (downVol + eqVol * 0.5) * 100;
}
function calcPivots(high, low, close) {
  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low, r2 = pp + (high - low), r3 = high + 2 * (pp - low);
  const s1 = 2 * pp - high, s2 = pp - (high - low), s3 = low - 2 * (high - pp);
  return {
    classic: { '轴心点': pp, 'R1': r1, 'R2': r2, 'R3': r3, 'S1': s1, 'S2': s2, 'S3': s3 },
    fibonacci: { '轴心点': pp, 'R1': pp + 0.382 * (high - low), 'R2': pp + 0.618 * (high - low), 'R3': pp + 1.0 * (high - low), 'S1': pp - 0.382 * (high - low), 'S2': pp - 0.618 * (high - low), 'S3': pp - 1.0 * (high - low) }
  };
}

/* ================================================================
 * summarize（保留原逻辑，修复 pivots 可能为 null 的崩溃）
 * ================================================================ */
function summarize(closes, highs, lows, opens, vols, pivotsIn, basic) {
  const pivots = pivotsIn || {
    classic: { '轴心点': 0, 'R1': 0, 'R2': 0, 'R3': 0, 'S1': 0, 'S2': 0, 'S3': 0 }
  };
  const n = closes.length;
  if (n < 5) {
    return {
      overall: '观望', action: '数据不足', position: 0, confidence: 10,
      score: 0, netScore: 0,
      trend: '震荡', trendScore: 0, trendStrength: 0, trendWeight: 1,
      bollInfo: { upper: 0, mid: 0, lower: 0, position: 0.5, width: 0, widthChange: 0, isExpanding: false, isContracting: false },
      maInfo: { ma5: 0, ma10: 0, ma20: 0, ma60: 0, alignment: 0, slope5: 0 },
      pivotLabel: '中性', pivotBreakdown: null, pivotBreakout: null,
      vpScore: 0, vpLabel: '量价中性', vpEvent: '', vpDivergence: false,
      obvInfo: { direction: 'neutral', value: 0, slope8: 0 },
      volaRatio: 1, anomalyIdx: [],
      backtest: { buySamples: 0, buyWinRate: 0, buyAvgRet: 0, lookback: 0, holdDays: 0 },
      tpSl: { stopLoss: 0, takeProfitLevels: [], trailingStop: { enabled: false, trigger: 0, step: 0, currentStop: 0 }, atr: 0, s1: 0, r1: 0, r2: 0, hasR2: false, isStrongTrend: false, momentum20: 0, atrPct: 0, stopMult: 2, triggerMult: 2, stepMult: 1.5, note: '数据不足' },
      trendGroup: [], momentumGroup: [], volaGroup: [], volGroup: [],
      buyScore: 0, sellScore: 0,
      mainForce: null, fundamentals: null,
      trendDiagnosis: { direction: '震荡', strength: 0, score: 0, bollPosition: 0.5, maAlignment: 0, adx: 0 }
    };
  }

  const price = closes[n - 1];

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

  const bollPeriod = Math.min(20, n);
  const bollSlice = closes.slice(-bollPeriod);
  const bollMid = bollSlice.reduce((a, b) => a + b, 0) / bollSlice.length;
  let bollStd = 0;
  for (const v of bollSlice) { const d = v - bollMid; bollStd += d * d; }
  bollStd = Math.sqrt(bollStd / bollSlice.length);
  const bollUpper = bollMid + 2 * (bollStd || 0.001);
  const bollLower = bollMid - 2 * (bollStd || 0.001);
  const bollWidth = (bollStd || 0.001) / (bollMid || 0.001);
  const bollPosition = (price - bollLower) / (bollUpper - bollLower || 1);

  let bollWidthChange = 0;
  if (n >= 30) {
    const recentSlice = closes.slice(-5);
    const pastSlice = closes.slice(-10, -5);
    const calcWidth = (arr) => {
      const m = arr.reduce((a, b) => a + b, 0) / arr.length || 1;
      let s = 0;
      for (const v of arr) { const d = v - m; s += d * d; }
      return Math.sqrt(s / arr.length) / m;
    };
    const bwRecent = calcWidth(recentSlice);
    const bwPast = calcWidth(pastSlice);
    bollWidthChange = bwRecent - bwPast;
  }

  const maOrder = (ma5 > ma10) + (ma10 > ma20) + (ma20 > ma60);
  const ma5Slope = n > 10 ? (ma5 - closes[n - 6]) / (closes[n - 6] || 0.001) : 0;

  let trendScore = 0;
  if (price > ma5) trendScore += 1.5; else trendScore -= 1.5;
  if (price > ma20) trendScore += 1.0; else trendScore -= 1.0;
  if (price > ma60) trendScore += 0.8; else trendScore -= 0.8;
  if (maOrder >= 2) trendScore += 1.0; else trendScore -= 1.0;
  if (ma5 > ma20) trendScore += 0.5; else trendScore -= 0.5;
  if (ma20 > ma60) trendScore += 0.5; else trendScore -= 0.5;
  if (bollPosition > 0.8) trendScore += 0.8;
  else if (bollPosition < 0.2) trendScore -= 0.8;
  if (bollWidthChange > 0.001 && price > bollMid) trendScore += 0.6;
  if (bollWidthChange < -0.001 && Math.abs(bollPosition - 0.5) < 0.15) trendScore -= 0.5;
  if (ma5Slope > 0.01) trendScore += 0.6;
  else if (ma5Slope < -0.01) trendScore -= 0.6;

  const recentHigh20 = highs ? Math.max(...highs.slice(-20)) : price * 1.05;
  const recentLow20 = lows ? Math.min(...lows.slice(-20)) : price * 0.95;
  const pricePosition20 = (price - recentLow20) / (recentHigh20 - recentLow20 || 1);
  if (pricePosition20 > 0.7 && price > ma20 * 1.03) trendScore += 0.4;
  if (pricePosition20 < 0.3 && price < ma20 * 0.97) trendScore -= 0.4;
  if (pct5 > 2) trendScore += 0.5;
  else if (pct5 < -2) trendScore -= 0.5;

  let trendDir = '震荡';
  let trendStrength = 0;
  if (trendScore >= 4) { trendDir = '强多头'; trendStrength = 80; }
  else if (trendScore >= 2) { trendDir = '多头'; trendStrength = 60; }
  else if (trendScore >= 0.5) { trendDir = '弱多头'; trendStrength = 40; }
  else if (trendScore >= -0.5) { trendDir = '震荡'; trendStrength = 20; }
  else if (trendScore >= -2) { trendDir = '弱空头'; trendStrength = 30; }
  else if (trendScore >= -4) { trendDir = '空头'; trendStrength = 60; }
  else { trendDir = '强空头'; trendStrength = 80; }

  // OBV
  const obvSeries = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i === 0) { obvSeries[i] = 0; continue; }
    if (closes[i] > closes[i - 1]) obvSeries[i] = obvSeries[i - 1] + vols[i];
    else if (closes[i] < closes[i - 1]) obvSeries[i] = obvSeries[i - 1] - vols[i];
    else obvSeries[i] = obvSeries[i - 1];
  }
  const obvCurrent = obvSeries[n - 1];

  // ★ 修复 #3：OBV 斜率算法（取最近 8 段 OBV 增量均值）
  let obvSlope8 = 0;
  if (n >= 10) {
    const tail = obvSeries.slice(-9);   // 9 个点 = 8 个增量
    let sumDiff = 0;
    for (let i = 1; i < tail.length; i++) sumDiff += (tail[i] - tail[i - 1]);
    const avgDiff = sumDiff / (tail.length - 1);
    const baseScale = Math.max(1, Math.abs(obvCurrent) * 0.01);
    obvSlope8 = avgDiff / baseScale;     // 归一化
  }
  const isObvUp = obvSlope8 > 0.01;
  const isObvDown = obvSlope8 < -0.01;
  const lastVol = vols[n - 1];
  const avgVol5 = vols.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const avgVol20 = vols.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volMedian20 = (() => {
    const arr = vols.slice(-20).slice().sort((a, b) => a - b);
    return arr[Math.floor(arr.length / 2)];
  })();
  const pricePosition20_high = recentHigh20 > recentLow20 ? (price - recentLow20) / (recentHigh20 - recentLow20) : 0.5;
  const priceSlope5 = n > 5 ? (price - closes[n - 5]) / closes[n - 5] : 0;
  const priceUp1d = closes[n - 1] > closes[n - 2];
  const isBreakHigh = price > recentHigh20;
  const isBigVolNow = lastVol > volMedian20 * 1.5;
  const isShrinkingVol = avgVol5 < avgVol20 * 0.85;
  const pullbackFromHigh = (recentHigh20 - price) / recentHigh20;

  let vpScore = 0;
  const vpFactors = [];
  if (isBreakHigh && isBigVolNow) {
    const bonus = obvSlope8 > 0 ? 2.0 : 1.5;
    vpScore += bonus;
    vpFactors.push(`放量突破+${bonus}`);
  }
  if (avgVol5 > avgVol20 * 1.1 && priceUp1d) {
    vpScore += 1.0;
    vpFactors.push('温和放量上涨+1');
  }
  if (pullbackFromHigh > 0.02 && pullbackFromHigh < 0.12 && isShrinkingVol && !priceUp1d) {
    vpScore += 0.8;
    vpFactors.push('缩量洗盘+0.8');
  }
  if (isObvUp && priceSlope5 > 0.01) {
    vpScore += 0.5;
    vpFactors.push('OBV资金流入+0.5');
  }
  if (pricePosition20_high > 0.85 && obvSlope8 < 0) {
    vpScore -= 2.0;
    vpFactors.push('高位背离-2');
  } else if (pricePosition20_high > 0.85 && Math.abs(obvSlope8) < 0.01) {
    vpScore -= 1.0;
    vpFactors.push('疑似背离-1');
  }
  if (lastVol > avgVol20 * 1.5 && !priceUp1d && pricePosition20_high > 0.5) {
    vpScore -= 1.0;
    vpFactors.push('放量滞涨-1');
  }
  if (isObvDown && pricePosition20_high > 0.7) {
    vpScore -= 0.5;
    vpFactors.push('OBV流出高位-0.5');
  }
  if (summarize._marketEnv) {
    const env = summarize._marketEnv;
    if (env.trend === 'down') {
      if (vpScore > 0) { vpScore *= 0.7; vpFactors.push('熊市多头打折0.7'); }
      else if (vpScore < 0) { vpScore *= 1.2; vpFactors.push('熊市空头加重1.2'); }
    } else if (env.trend === 'up') {
      if (vpScore > 0) { vpScore *= 1.1; vpFactors.push('牛市多头放大1.1'); }
    }
  }
  let vpDivergence = false, vpEvent = '', vpLabel = '量价中性';
  if (vpScore >= 1.5) { vpLabel = '放量突破'; vpEvent = 'fangBreakout'; vpDivergence = false; }
  else if (vpScore >= 0.8) { vpLabel = '放量上涨'; vpEvent = 'upTrend'; vpDivergence = false; }
  else if (vpScore >= 0.3) { vpLabel = '温和上行'; vpEvent = 'upTrend'; vpDivergence = false; }
  else if (vpScore >= -0.3) { vpLabel = '量价中性'; vpEvent = ''; vpDivergence = false; }
  else if (vpScore >= -1.0) { vpLabel = '量价滞涨'; vpEvent = 'fangBreak'; vpDivergence = true; }
  else { vpLabel = '量价背离'; vpEvent = 'divergence'; vpDivergence = true; }

  const absTrend = Math.abs(trendScore);
  let trendWeight = 1.0;
  if (absTrend > 5) trendWeight = 1.3;
  else if (absTrend < 1) trendWeight = 0.8;
  let score = trendScore * trendWeight + vpScore * (2 - trendWeight);

  let overall, action, position, confidence;
  if (score >= 6) { overall = '强力买入'; action = '强势突破，积极跟进'; position = 85; confidence = 90; }
  else if (score >= 4) { overall = '买入'; action = '趋势向好，分批建仓'; position = 65; confidence = 75; }
  else if (score >= 2.5) { overall = '左侧试探'; action = '底部区域，轻仓试水'; position = 35; confidence = 55; }
  else if (score >= 1) { overall = '超卖区'; action = '超跌反弹机会'; position = 20; confidence = 40; }
  else if (score >= -0.5) { overall = '观望'; action = '等待方向明朗'; position = 0; confidence = 30; }
  else if (score >= -2.5) { overall = '高空防守'; action = '高位滞涨，逐步减仓'; position = 25; confidence = 50; }
  else if (score >= -4.5) { overall = '卖出'; action = '趋势走弱，果断减仓'; position = 50; confidence = 70; }
  else { overall = '强力卖出'; action = '全面转空，清仓避险'; position = 75; confidence = 85; }

  if (vpDivergence) {
    if (overall === '强力买入' || overall === '买入') {
      overall = '高空防守';
      action = '量价背离(价格高位OBV流出),逢高减仓';
      position = Math.min(position, 30);
      confidence = Math.min(confidence, 50);
    } else if (overall === '左侧试探') {
      overall = '观望';
      action = '量价背离,放弃左侧试仓';
      position = 0;
      confidence = Math.min(confidence, 30);
    }
  }

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
  const s1 = 2 * (highs ? Math.max(...highs.slice(-20)) : price * 1.05) - (lows ? Math.min(...lows.slice(-20)) : price * 0.95);
  const atrPct = atr / price;
  let stopMult = 2.0 + 0.5 * Math.min(1, atrPct / 0.05);
  const stopLoss = Math.min(price - stopMult * atr, s1, bollLower * 0.98, price * 0.95);
  const trendFactor = Math.abs(trendScore) / 10;
  const mult1 = 1.5 + 0.5 * trendFactor;
  const mult2 = 3.0 + 1.0 * trendFactor;
  const mult3 = 5.0 + 1.5 * trendFactor;
  const takeProfitLevels = [
    { price: price + mult1 * atr, ratio: 0.3, label: `+${mult1.toFixed(2)}ATR(短线)` },
    { price: price + mult2 * atr, ratio: 0.3, label: `+${mult2.toFixed(2)}ATR(中线)` },
    { price: price + mult3 * atr, ratio: 0.4, label: `+${mult3.toFixed(2)}ATR(长线)` }
  ];
  const trailingStop = { enabled: true, trigger: price + 2 * atr, step: 1.5 * atr, currentStop: stopLoss };

  const rsi = _calcRSI(closes, 14);
  const macd = _calcMACD(closes);
  const kdj = _calcKDJ(closes, highs, lows);
  const roc = n > 10 ? (price - closes[n - 11]) / closes[n - 11] * 100 : 0;
  const cci = _calcCCI(closes, highs, lows, 20);
  const wr = _calcWR(closes, highs, lows, 14);
  const adx = _calcADX(highs, lows, closes, 14);
  const vr = _calcVR(closes, vols, 26);
  const volaRatio = avgVol20 > 0 ? avgVol5 / avgVol20 : 1;

  const trendGroup = [
    { name: 'MA5', value: ma5, signal: price > ma5 ? '买入' : '卖出' },
    { name: 'MA10', value: ma10, signal: price > ma10 ? '买入' : '卖出' },
    { name: 'MA20', value: ma20, signal: price > ma20 ? '买入' : '卖出' },
    { name: 'MA60', value: ma60, signal: price > ma60 ? '买入' : '卖出' },
  ];
  const momentumGroup = [
    { name: 'RSI 14', value: rsi, min: 0, max: 100, signal: rsi > 70 ? '超买' : rsi < 30 ? '超卖' : '中性' },
    { name: 'MACD', value: macd.macd, min: -Math.abs(macd.signal) * 2, max: Math.abs(macd.signal) * 2, signal: macd.hist > 0 ? '买入' : '卖出' },
    { name: 'KDJ K', value: kdj.k, min: 0, max: 100, signal: kdj.k > 80 ? '超买' : kdj.k < 20 ? '超卖' : '中性' },
    { name: 'ROC 10', value: roc, min: -15, max: 15, signal: roc > 5 ? '买入' : roc < -5 ? '卖出' : '中性' },
  ];
  const volaGroup = [
    { name: 'CCI 20', value: cci, min: -200, max: 200, signal: cci > 100 ? '超买区' : cci < -100 ? '超卖区' : '中性' },
    { name: 'WR 14', value: wr, min: -100, max: 0, signal: wr < -80 ? '超卖区' : wr > -20 ? '超买区' : '中性' },
    { name: 'ADX 14', value: adx, min: 0, max: 100, signal: adx > 25 ? '中等波动' : '无趋势' },
    { name: 'BOLL', value: (price - bollMid) / (bollUpper - bollLower || 1) * 100, min: -100, max: 100, signal: price > bollUpper ? '超买' : price < bollLower ? '超卖' : '中性' },
  ];
  const volGroup = [
    { name: 'OBV', value: obvCurrent, min: -Math.abs(obvCurrent) * 2, max: Math.abs(obvCurrent) * 2, signal: isObvUp ? '资金流入' : (isObvDown ? '资金流出' : '中性') },
    { name: 'VR 26', value: vr, min: 0, max: 300, signal: vr > 150 ? '放量' : vr < 70 ? '缩量' : '中性' },
    { name: 'VOL 5/10', value: volaRatio, min: 0, max: 3, signal: volaRatio > 1.3 ? '放量' : volaRatio < 0.7 ? '缩量' : '中性' },
  ];
  const buyScore = [trendGroup, momentumGroup, volaGroup, volGroup].flat().filter(x => ['买入', '超卖', '资金流入', '放量'].includes(x.signal)).length;
  const sellScore = [trendGroup, momentumGroup, volaGroup, volGroup].flat().filter(x => ['卖出', '超买', '资金流出', '缩量'].includes(x.signal)).length;

  let buySamples = 0, buyWin = 0, buySum = 0;
  const holdDays = 5, lookback = Math.min(60, n - holdDays);
  for (let i = n - lookback - holdDays; i < n - holdDays; i++) {
    if (i < 0) continue;
    if (closes[i] > (i > 0 ? closes[i - 1] : closes[i]) && vols[i] > (vols[i - 1] || vols[i])) {
      buySamples++;
      const ret = (closes[i + holdDays] - closes[i]) / closes[i];
      buySum += ret;
      if (ret > 0) buyWin++;
    }
  }

  const anomalyIdx = [];
  for (let i = Math.max(1, n - 15); i < n; i++) {
    const avg = vols.slice(Math.max(0, i - 5), i).reduce((a, b) => a + b, 0) / Math.min(5, i);
    if (vols[i] > avg * 2.0) anomalyIdx.push({ i, type: closes[i] < opens[i] ? 'high' : 'normal' });
  }

  return {
    overall,
    action,
    position,
    confidence,
    score,
    netScore: Math.round(score),
    trend: trendDir,
    trendScore: trendScore,
    trendStrength: trendStrength,
    trendWeight: trendWeight,
    bollInfo: {
      upper: bollUpper, mid: bollMid, lower: bollLower,
      position: Math.min(1, Math.max(0, bollPosition)),
      width: bollWidth,
      widthChange: bollWidthChange || 0,
      isExpanding: bollWidthChange > 0.001,
      isContracting: bollWidthChange < -0.001
    },
    maInfo: { ma5, ma10, ma20, ma60, alignment: maOrder, slope5: ma5Slope },
    pivotLabel: (price > pivots.classic.R1) ? '突破R1' : (price > pivots.classic['轴心点']) ? '轴上' : (price < pivots.classic.S1) ? '跌破S1' : (price < pivots.classic['轴心点']) ? '轴下' : '中性',
    pivotBreakdown: price < pivots.classic.S1 ? { level: 'S1', from: pivots.classic.S1, to: 'S2' } : null,
    pivotBreakout: price > pivots.classic.R1 ? { level: 'R1', from: pivots.classic.R1, target: 'R2' } : null,
    vpScore, vpLabel, vpEvent, vpDivergence,
    obvInfo: { direction: isObvUp ? 'up' : (isObvDown ? 'down' : 'neutral'), value: obvCurrent, slope8: obvSlope8 },
    volaRatio,
    anomalyIdx,
    backtest: { buySamples, buyWinRate: buySamples > 0 ? buyWin / buySamples : 0, buyAvgRet: buySamples > 0 ? buySum / buySamples : 0, lookback: 60, holdDays },
    tpSl: { stopLoss, takeProfitLevels, trailingStop, atr, s1, r1: pivots.classic.R1, r2: pivots.classic.R2, hasR2: pivots.classic.R2 > takeProfitLevels[2].price, isStrongTrend: Math.abs(trendScore) > 3, momentum20: n > 20 ? (price - closes[n - 21]) / closes[n - 21] : 0, atrPct, stopMult, triggerMult: 2.0, stepMult: 1.5, note: '趋势增强版（布林+均线）' },
    trendGroup, momentumGroup, volaGroup, volGroup,
    buyScore, sellScore,
    mainForce: null,
    fundamentals: null,
    trendDiagnosis: {
      direction: trendDir,
      strength: trendStrength,
      score: trendScore,
      bollPosition: Math.min(1, Math.max(0, bollPosition)),
      maAlignment: maOrder,
      adx: adx || 0
    }
  };
}
summarize._marketEnv = null;

function applyQuantToSignal(sum, qm) {
  if (!qm) return sum;
  const v = qm.strategicVerdict;
  const original = { position: sum.position, confidence: sum.confidence };
  let warnings = [];

  const isStrongBreakout = (sum.vpEvent === 'fangBreakout' && sum.vpScore >= 1);

  if (isStrongBreakout) {
    if (sum.position < 50) sum.position = Math.min(60, sum.position + 20);
    warnings.push(`🚀 放量突破前高，量化限制放宽，仓位提升至 ${sum.position}%`);
  } else if (v.bad) {
    if (sum.position > 30) {
      sum.position = 30;
      let reason = '';
      if (v.sharpe < 0) reason += `夏普${v.sharpe.toFixed(2)}<0 `;
      if (v.mdd > 0.25) reason += `回撤${(v.mdd * 100).toFixed(0)}%>25% `;
      if (v.ir != null && v.ir < -0.5) reason += `IR${v.ir.toFixed(2)}<-0.5 `;
      warnings.push(`📉 量化战略偏弱（${reason.trim() || '综合指标不佳'}），仓位封顶 30%`);
    }
    sum.confidence = Math.min(sum.confidence, 40);
  } else if (v.weak) {
    if (sum.position > 50) { sum.position = 50; warnings.push(`📊 量化战略偏弱，仓位封顶 50%`); }
    sum.confidence = Math.min(sum.confidence, 60);
  } else if (v.good) {
    if (!isStrongBreakout) {
      sum.position = Math.min(100, Math.round(sum.position * 1.2));
      warnings.push(`📈 量化战略优秀（夏普 ${v.sharpe.toFixed(2)} / 卡玛 ${v.calmar.toFixed(2)}），仓位可放大 20%`);
    }
  }

  const signal = sum.overall;
  const conflict = (['买入', '强力买入'].includes(signal) && v.bad) || (['卖出', '强力卖出'].includes(signal) && v.good);
  if (conflict && !isStrongBreakout) {
    sum.confidence = Math.min(sum.confidence, 30);
    warnings.push(`⚠ 短期信号「${signal}」与长期战略${v.bad ? '差' : '好'}冲突，置信度 ≤ 30%`);
  }

  if (v.pf != null && v.pf < 1 && ['买入', '强力买入', '左侧试探'].includes(signal) && !isStrongBreakout) {
    sum.position = Math.min(sum.position, 25);
    warnings.push(`💸 盈利因子 ${v.pf.toFixed(2)} < 1，长期负期望，买入仓位封顶 25%`);
  }

  if (sum.trendStrength > 70 && signal.includes('买入')) {
    sum.position = Math.min(100, sum.position * 1.2);
    sum.confidence = Math.min(100, sum.confidence + 10);
    warnings.push(`📈 强趋势（${sum.trend}）加成，仓位扩大 20%`);
  }
  if (sum.trendStrength < 30 && signal.includes('卖出')) {
    sum.position = Math.min(80, sum.position * 1.2);
    warnings.push(`📉 弱趋势（${sum.trend}）强化空头信号`);
  }
  if (sum.bollInfo && sum.bollInfo.isContracting && Math.abs(sum.bollInfo.position - 0.5) < 0.1) {
    sum.position = Math.min(30, sum.position * 0.5);
    sum.confidence = Math.min(40, sum.confidence);
    warnings.push(`🔄 布林收口且价格在中轨，震荡市减仓至 ${sum.position}%`);
  }

  sum.quantWarnings = warnings;
  sum.quantMetrics = qm;
  sum.quantChanged = sum.position !== original.position || sum.confidence !== original.confidence;
  return sum;
}

/* ================================================================
 * 第二部分：量化诊断 + 完整 render / draw / init
 * ================================================================ */
function computeQuantMetrics(data, sum) {
  if (!data || data.length < 20) return null;
  const closes = data.map(d => d.close);
  const returns = _returns(closes);
  const annRet = annualReturn(returns);
  const vol = volatility(returns);
  const sharpe = sharpeRatio(returns);
  const sortino = sortinoRatio(returns);
  const mdd = maxDrawdown(closes);
  const calmar = calmarRatio(returns, closes);
  const ts = trendStrength(closes);
  let beta = null, alpha = null, ir = null, corr = null;
  if (window.__marketCloses && window.__marketCloses.length > 30) {
    const mR = [];
    for (let i = 1; i < window.__marketCloses.length; i++) mR.push((window.__marketCloses[i] - window.__marketCloses[i - 1]) / window.__marketCloses[i - 1]);
    const len = Math.min(returns.length, mR.length);
    const sR = returns.slice(-len); const mr = mR.slice(-len);
    beta = betaToMarket(sR, mr); alpha = alphaToMarket(sR, mr) * 252; ir = informationRatio(sR, mr); corr = correlation(sR, mr);
  }
  let pf = null;
  if (returns.length > 20) {
    let winSum = 0, winN = 0, lossSum = 0, lossN = 0;
    for (let i = 0; i < returns.length; i++) {
      if (returns[i] > 0) { winSum += returns[i]; winN++; }
      else if (returns[i] < 0) { lossSum += Math.abs(returns[i]); lossN++; }
    }
    const avgWin = winN ? winSum / winN : 0; const avgLoss = lossN ? lossSum / lossN : 0;
    pf = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 99 : 0);
  }
  const strategicVerdict = {
    good: sharpe >= 1 && calmar >= 1 && sortino >= 0.8,
    ok: sharpe >= 0.5 && calmar >= 0.5,
    weak: sharpe < 0.5 && sharpe >= 0,
    bad: sharpe < 0 || mdd.value > 0.25 || (ir != null && ir < -0.5),
    pf, sharpe, sortino, calmar, mdd: mdd.value, vol, annRet, ts, beta, alpha, ir, corr,
  };
  return { annRet, vol, sharpe, sortino, mdd, calmar, pf, ts, beta, alpha, ir, corr, strategicVerdict };
}

function renderQuantMetrics(data, sum) {
  if (!data || data.length < 20) return;
  const closes = data.map(d => d.close);
  const qm = computeQuantMetrics(data, sum);
  if (!qm) return;
  const { annRet, vol, sharpe, mdd, calmar, pf } = qm;
  const set = (id, val, cls) => { const el = document.getElementById(id); if (el) { el.textContent = val; el.className = 'v' + (cls ? ' ' + cls : ''); } };
  const setD = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('q-annRet', (annRet * 100).toFixed(2) + '%', annRet > 0 ? 'good' : 'bad');
  set('q-vol', (vol * 100).toFixed(2) + '%', vol > 0.3 ? 'bad' : vol > 0.2 ? 'warn' : 'good');
  set('q-sharpe', sharpe.toFixed(2), sharpe >= 1 ? 'good' : sharpe >= 0 ? 'warn' : 'bad');
  set('q-mdd', (mdd.value * 100).toFixed(2) + '%', mdd.value > 0.2 ? 'bad' : mdd.value > 0.1 ? 'warn' : 'good');
  set('q-calmar', calmar.toFixed(2), calmar >= 1 ? 'good' : calmar >= 0 ? 'warn' : 'bad');
  set('q-pf', pf == null ? '—' : pf.toFixed(2), pf == null ? '' : pf >= 1.5 ? 'good' : pf >= 1 ? 'warn' : 'bad');
  setD('q-annRet-d', `${data.length} 个交易日`);
  setD('q-vol-d', '年化标准差');
  setD('q-sharpe-d', sharpe >= 1 ? '✓ 优秀' : sharpe >= 0.5 ? '○ 良好' : sharpe >= 0 ? '△ 一般' : '✗ 需改进');
  setD('q-mdd-d', mdd.peakIdx < mdd.troughIdx ? `从 ${data[mdd.peakIdx].date} 起` : '—');
  setD('q-calmar-d', '收益/回撤');
  setD('q-pf-d', pf == null ? '样本不足' : pf >= 1.5 ? '✓ 正期望' : pf >= 1 ? '○ 略正' : '✗ 负期望');

  const returns = [];
  for (let i = 1; i < closes.length; i++) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const sortino = sortinoRatio(returns);
  set('q-sortino', sortino.toFixed(2), sortino >= 1.5 ? 'good' : sortino >= 0.5 ? 'warn' : 'bad');
  setD('q-sortino-d', sortino >= 1.5 ? '✓ 优秀' : sortino >= 0.5 ? '○ 良好' : '△ 一般');

  if (window.__marketCloses) {
    const marketReturns = [];
    for (let i = 1; i < window.__marketCloses.length; i++) marketReturns.push((window.__marketCloses[i] - window.__marketCloses[i - 1]) / window.__marketCloses[i - 1]);
    const len = Math.min(returns.length, marketReturns.length);
    const sR = returns.slice(-len); const mR = marketReturns.slice(-len);
    const beta = betaToMarket(sR, mR); const alpha = alphaToMarket(sR, mR) * 252;
    set('q-beta', beta.toFixed(2) + ' / ' + (alpha * 100).toFixed(1) + '%', Math.abs(beta - 1) < 0.3 ? '' : (beta > 1.3 || beta < 0.7) ? 'warn' : '');
    setD('q-beta-d', `β${beta > 1.3 ? '高波动' : beta < 0.7 ? '独立行情' : '正常'}`);
    const ir = informationRatio(sR, mR);
    set('q-ir', ir.toFixed(2), ir >= 0.5 ? 'good' : ir >= 0 ? 'warn' : 'bad');
    setD('q-ir-d', ir >= 1 ? '✓ 优秀' : ir >= 0.5 ? '○ 良好' : '△ 一般');
  } else {
    set('q-beta', '—', ''); setD('q-beta-d', '需大盘数据');
    set('q-ir', '—', ''); setD('q-ir-d', '需大盘数据');
  }
  const ts = trendStrength(closes);
  set('q-trend', ts.toFixed(0), ts >= 60 ? 'good' : ts >= 30 ? 'warn' : 'bad');
  setD('q-trend-d', ts >= 60 ? '强趋势' : ts >= 30 ? '中等趋势' : '震荡');

  const summary = document.getElementById('quantSummary');
  if (summary) {
    let txt = '';
    if (sharpe >= 1) txt += '<b>夏普 ≥ 1</b>，策略风险调整后收益优秀。';
    else if (sharpe >= 0.5) txt += '<b>夏普 0.5~1</b>，策略表现良好。';
    else if (sharpe >= 0) txt += '<b>夏普 0~0.5</b>，策略勉强正收益，需谨慎。';
    else txt += '<b style="color:var(--up)">夏普 < 0</b>，策略长期负收益，不建议使用。';
    if (mdd.value > 0.2) txt += ' 最大回撤超过 20%，风险较高。';
    else if (mdd.value < 0.1) txt += ' 最大回撤 < 10%，回撤控制优秀。';
    if (pf != null && pf < 1) txt += ' <b style="color:var(--up)">盈利因子 &lt; 1</b>，长期负期望，建议优化策略。';
    summary.innerHTML = '📊 <b>综合评语：</b>' + txt;
  }
}

/* ================================================================
 *  ★ 重写：renderPage / drawChart / initStock / 风控
 * ================================================================ */

// 信号 → 颜色 & 文字
function signalPillClass(overall) {
  if (['强力买入', '买入', '左侧试探', '超卖区'].includes(overall)) return 'up';
  if (['强力卖出', '卖出', '高空防守'].includes(overall)) return 'dn';
  return 'neutral';
}
function fmt(v, d = 2) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toFixed(d);
}
function fmtPct(v, d = 2) {
  if (v == null || isNaN(v)) return '—';
  return (v * 100).toFixed(d) + '%';
}
function fmtPrice(v) {
  if (v == null || isNaN(v)) return '—';
  return Number(v).toFixed(2);
}

function indRow(name, value, signal, extra) {
  let cls = 'neutral';
  if (['买入', '超卖', '资金流入', '放量', '强趋势', '强多头', '多头', '温和上行', '放量突破', '放量上涨', '中等波动'].includes(signal)) cls = 'buy';
  else if (['卖出', '超买', '资金流出', '缩量', '强空头', '空头', '量价背离', '量价滞涨'].includes(signal)) cls = 'sell';
  else if (['超买区', '超卖区', '无趋势'].includes(signal)) cls = 'warn';
  return `<div class="ind"><span class="n">${name}</span><span class="v">${value}</span><span class="s ${cls}">${signal}</span></div>`;
}

function renderPage(data, sum, pivots, currentPrice, change, changePct) {
  const root = document.getElementById('root');
  const code = getCodeFromURL();
  const name = findName(code);
  const type = getTypeByCode(code);
  const changeCls = change >= 0 ? 'up' : 'dn';
  const sign = change >= 0 ? '+' : '';

  // 信号文字
  const sigClass = signalPillClass(sum.overall);
  const overallColor = sigClass === 'up' ? 'var(--up)' : sigClass === 'dn' ? 'var(--dn)' : 'var(--muted)';

  // 量化指标数据
  const qm = computeQuantMetrics(data, sum) || { strategicVerdict: { sharpe: 0, calmar: 0, pf: null, mdd: 0, ir: null, good: false, bad: true, weak: true } };
  const v = qm.strategicVerdict;

  // 量化融合
  applyQuantToSignal(sum, qm);

  // 指标卡
  const trendRows = sum.trendGroup.map(x => indRow(x.name, fmtPrice(x.value), x.signal)).join('');
  const momRows = sum.momentumGroup.map(x => indRow(x.name, fmt(x.value, 2), x.signal)).join('');
  const volaRows = sum.volaGroup.map(x => indRow(x.name, fmt(x.value, 1), x.signal)).join('');
  const volRows = sum.volGroup.map(x => indRow(x.name, fmt(x.value, 1), x.signal)).join('');

  // TP/SL
  const tp = sum.tpSl;
  const tps = tp.takeProfitLevels || [];
  const tpHtml = tps.map(t => `
    <div class="tpBox">
      <div class="lbl">${t.label}</div>
      <div class="pv">${fmtPrice(t.price)}</div>
      <div class="ratio">仓位 ${(t.ratio * 100).toFixed(0)}%</div>
    </div>`).join('');

  // 量价
  const vpLabel = sum.vpLabel || '量价中性';
  const vpClass = sum.vpDivergence ? 'bad' : (sum.vpScore >= 0.8 ? 'good' : (sum.vpScore >= 0.3 ? 'warn' : 'neutral'));

  // 量化告警
  const qwHtml = (sum.quantWarnings || []).map(w => `<div>${w}</div>`).join('');

  // 风险参数
  const riskKey = `risk_v1_${code}`;
  const risk = JSON.parse(localStorage.getItem(riskKey) || '{}');

  root.innerHTML = `
    <div class="top fadein">
      <div class="name">
        <span id="nameText" contenteditable="true">${name}</span>
        <span class="code">${code.toUpperCase()}${typeLabel(type)}</span>
      </div>
      <div class="actions">
        <button class="btn" id="btnRisk">风控</button>
        <button class="btn" id="btnPrefetch">刷新</button>
      </div>
    </div>

    <div class="card fadein">
      <div class="priceRow">
        <div class="price" style="color:${overallColor}">${fmtPrice(currentPrice)}</div>
        <div class="change ${changeCls}">${sign}${fmtPrice(change)} (${sign}${fmt(changePct, 2)}%)</div>
        <div style="margin-left:auto"><span class="pill ${sigClass}">${sum.overall}</span></div>
      </div>
      <div class="kv">
        <div><div class="k">建议仓位</div><div class="v">${sum.position}%</div><div class="posBar"><i style="width:${sum.position}%"></i></div></div>
        <div><div class="k">置信度</div><div class="v">${sum.confidence}%</div><div class="posBar"><i style="width:${sum.confidence}%;background:linear-gradient(90deg,#22c55e,#5b8cff)"></i></div></div>
        <div><div class="k">综合分</div><div class="v">${sum.netScore}</div><div class="k" style="margin-top:4px">趋势强度 ${sum.trendStrength}</div></div>
        <div><div class="k">量价</div><div class="v ${vpClass}">${vpLabel}</div><div class="k" style="margin-top:4px">vp ${sum.vpScore.toFixed(2)}</div></div>
      </div>
      <div style="margin-top:10px;font-size:13px;color:var(--muted)">${sum.action}</div>
      ${qwHtml ? `<div class="warns">${qwHtml}</div>` : ''}
    </div>

    <div class="card fadein">
      <div class="hd"><h3>K线 · 均线 · 布林</h3><div class="chartTools" id="chartTools">
        <button class="seg on" data-overlay="all">全显</button>
        <button class="seg" data-overlay="ma">均线</button>
        <button class="seg" data-overlay="boll">布林</button>
        <button class="seg" data-overlay="none">纯净</button>
      </div></div>
      <div class="chartWrap"><canvas id="chart"></canvas></div>
    </div>

    <div class="card fadein">
      <div class="hd"><h3>止盈 / 止损</h3><span class="pill ${v.bad ? 'warn' : v.good ? 'good' : 'neutral'}">${v.bad ? '战略偏弱' : v.good ? '战略优秀' : '战略一般'}</span></div>
      <div class="tpRow">
        <div class="tpBox"><div class="lbl">止损位</div><div class="pv dn">${fmtPrice(tp.stopLoss)}</div><div class="ratio">ATR ${fmtPrice(tp.atr)} · ${(tp.atrPct * 100).toFixed(2)}%</div></div>
        ${tpHtml}
      </div>
      <div style="margin-top:10px;font-size:12px;color:var(--muted)">
        移动止盈：触发 ${fmtPrice(tp.trailingStop.trigger)}，步长 ${fmtPrice(tp.trailingStop.step)}；支撑 S1 ${fmtPrice(tp.s1)}，阻力 R1 ${fmtPrice(tp.r1)} / R2 ${fmtPrice(tp.r2)}
      </div>
    </div>

    <div class="card fadein">
      <div class="hd"><h3>指标状态</h3><span class="pill neutral">买 ${sum.buyScore} · 卖 ${sum.sellScore}</span></div>
      <div class="row2">
        <div>
          <div class="seg-title">趋势</div>
          ${trendRows || '<div class="k">—</div>'}
        </div>
        <div>
          <div class="seg-title">动量</div>
          ${momRows || '<div class="k">—</div>'}
        </div>
      </div>
      <div class="row2" style="margin-top:8px">
        <div>
          <div class="seg-title">波动</div>
          ${volaRows || '<div class="k">—</div>'}
        </div>
        <div>
          <div class="seg-title">量能</div>
          ${volRows || '<div class="k">—</div>'}
        </div>
      </div>
    </div>

    <div class="card fadein">
      <div class="hd"><h3>量化诊断</h3><span class="pill ${v.good ? 'good' : v.bad ? 'bad' : 'warn'}">${v.good ? '战略好' : v.bad ? '战略差' : v.weak ? '战略弱' : '战略可'}</span></div>
      <div class="row3">
        <div class="tpBox"><div class="lbl">年化收益</div><div id="q-annRet" class="pv">—</div><div class="ratio" id="q-annRet-d"></div></div>
        <div class="tpBox"><div class="lbl">年化波动</div><div id="q-vol" class="pv">—</div><div class="ratio" id="q-vol-d"></div></div>
        <div class="tpBox"><div class="lbl">夏普比率</div><div id="q-sharpe" class="pv">—</div><div class="ratio" id="q-sharpe-d"></div></div>
      </div>
      <div class="row3" style="margin-top:8px">
        <div class="tpBox"><div class="lbl">最大回撤</div><div id="q-mdd" class="pv">—</div><div class="ratio" id="q-mdd-d"></div></div>
        <div class="tpBox"><div class="lbl">卡玛比率</div><div id="q-calmar" class="pv">—</div><div class="ratio" id="q-calmar-d"></div></div>
        <div class="tpBox"><div class="lbl">盈利因子</div><div id="q-pf" class="pv">—</div><div class="ratio" id="q-pf-d"></div></div>
      </div>
      <div class="row3" style="margin-top:8px">
        <div class="tpBox"><div class="lbl">索提诺</div><div id="q-sortino" class="pv">—</div><div class="ratio" id="q-sortino-d"></div></div>
        <div class="tpBox"><div class="lbl">β / α</div><div id="q-beta" class="pv">—</div><div class="ratio" id="q-beta-d"></div></div>
        <div class="tpBox"><div class="lbl">信息比率</div><div id="q-ir" class="pv">—</div><div class="ratio" id="q-ir-d"></div></div>
      </div>
      <div class="row3" style="margin-top:8px">
        <div class="tpBox"><div class="lbl">趋势强度</div><div id="q-trend" class="pv">—</div><div class="ratio" id="q-trend-d"></div></div>
        <div class="tpBox" style="grid-column:span 2"><div class="lbl">策略回测</div><div class="pv" style="font-size:14px">样本 ${sum.backtest.buySamples} · 胜率 ${(sum.backtest.buyWinRate * 100).toFixed(1)}% · 期望 ${(sum.backtest.buyAvgRet * 100).toFixed(2)}%</div><div class="ratio">近 60 日 / 持有 5 日</div></div>
      </div>
      <div class="warns" id="quantSummary" style="margin-top:10px">计算中…</div>
    </div>

    <div class="card fadein" style="text-align:center;color:var(--muted);font-size:12px">
      风险参数：单笔最大亏损 ${risk.maxLoss ?? 2}% · 单只最大持仓 ${risk.maxPos ?? 30}% · 回撤熔断 ${risk.circuit ?? 15}%
    </div>
  `;

  // 绑定名称编辑
  bindNameEditor();
  // 绑定图表工具
  const tools = document.getElementById('chartTools');
  if (tools) {
    tools.addEventListener('click', e => {
      const t = e.target.closest('.seg');
      if (!t) return;
      tools.querySelectorAll('.seg').forEach(s => s.classList.remove('on'));
      t.classList.add('on');
      drawChart(data, code, t.dataset.overlay);
    });
  }
  // 绑定按钮
  const btnR = document.getElementById('btnRisk');
  if (btnR) btnR.onclick = openRiskModal;
  const btnP = document.getElementById('btnPrefetch');
  if (btnP) btnP.onclick = async () => { btnP.disabled = true; btnP.textContent = '刷新中…'; try { await initStock(code, true); toast('已刷新'); } finally { btnP.disabled = false; btnP.textContent = '刷新'; } };
  // 渲染图表
  drawChart(data, code, 'all');
  // 渲染量化
  renderQuantMetrics(data, sum);
}

/* ===== Canvas K 线图（轻量自绘） ===== */
function drawChart(data, code, overlay) {
  const canvas = document.getElementById('chart');
  if (!canvas || !data || data.length === 0) return;
  const wrap = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight || 280;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // 视窗：最近 60 根
  const view = data.slice(-60);
  const n = view.length;
  const closes = view.map(d => d.close);
  const highs = view.map(d => d.high);
  const lows = view.map(d => d.low);
  const opens = view.map(d => d.open);
  const vols = view.map(d => d.volume);

  // MA / BOLL
  const ma = (arr, p) => arr.map((_, i) => {
    if (i < p - 1) return null;
    let s = 0; for (let j = i - p + 1; j <= i; j++) s += arr[j];
    return s / p;
  });
  const ma5 = ma(closes, 5), ma10 = ma(closes, 10), ma20 = ma(closes, 20);
  const boll = (() => {
    const upper = [], lower = [], mid = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < 19) { upper.push(null); lower.push(null); mid.push(null); continue; }
      const s = closes.slice(i - 19, i + 1);
      const m = s.reduce((a, b) => a + b, 0) / 20;
      const sd = Math.sqrt(s.reduce((t, v) => t + (v - m) ** 2, 0) / 20);
      mid.push(m); upper.push(m + 2 * sd); lower.push(m - 2 * sd);
    }
    return { upper, lower, mid };
  })();

  const allHi = Math.max(...highs, ...boll.upper.filter(x => x != null), ...ma20.filter(x => x != null));
  const allLo = Math.min(...lows, ...boll.lower.filter(x => x != null), ...ma20.filter(x => x != null));
  const pad = (allHi - allLo) * 0.05;
  const yMax = allHi + pad, yMin = allLo - pad;

  // 坐标
  const padL = 6, padR = 50, padT = 8, padB = 36;
  const plotW = w - padL - padR;
  const plotH = (h - padT - padB) * 0.72;
  const volH = (h - padT - padB) * 0.22;
  const volTop = padT + plotH + 6;
  const barW = plotW / n;
  const xAt = (i) => padL + i * barW + barW / 2;
  const yAt = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  const yVol = (v) => volTop + (1 - v / Math.max(...vols, 1)) * volH;

  // 网格
  ctx.strokeStyle = 'rgba(138,147,182,0.12)';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(138,147,182,0.5)';
  ctx.font = '10px -apple-system,sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH * i) / 4;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    const val = yMax - (yMax - yMin) * (i / 4);
    ctx.fillText(val.toFixed(2), w - 4, y);
  }

  // 布林带
  if (overlay === 'all' || overlay === 'boll') {
    ctx.strokeStyle = 'rgba(124,91,255,0.35)';
    ctx.setLineDash([3, 3]);
    line(boll.upper); line(boll.lower);
    ctx.strokeStyle = 'rgba(124,91,255,0.6)';
    ctx.setLineDash([]);
    line(boll.mid);
  }
  function line(arr) {
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == null) continue;
      if (!started) { ctx.moveTo(xAt(i), yAt(arr[i])); started = true; }
      else ctx.lineTo(xAt(i), yAt(arr[i]));
    }
    ctx.stroke();
  }

  // K 线
  for (let i = 0; i < n; i++) {
    const x = xAt(i);
    const yH = yAt(highs[i]), yL = yAt(lows[i]);
    const yO = yAt(opens[i]), yC = yAt(closes[i]);
    const up = closes[i] >= opens[i];
    ctx.strokeStyle = up ? '#ef4444' : '#10b981';
    ctx.fillStyle = up ? '#ef4444' : '#10b981';
    ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, yL); ctx.stroke();
    const top = Math.min(yO, yC), bh = Math.max(1, Math.abs(yO - yC));
    ctx.fillRect(x - barW * 0.32, top, barW * 0.64, bh);
  }

  // 均线
  if (overlay === 'all' || overlay === 'ma') {
    const drawMA = (arr, color) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath();
      let s = false;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] == null) continue;
        if (!s) { ctx.moveTo(xAt(i), yAt(arr[i])); s = true; } else ctx.lineTo(xAt(i), yAt(arr[i]));
      }
      ctx.stroke();
    };
    drawMA(ma5, '#fbbf24');
    drawMA(ma10, '#60a5fa');
    drawMA(ma20, '#a78bfa');
  }

  // 量能
  for (let i = 0; i < n; i++) {
    const x = xAt(i);
    const up = closes[i] >= opens[i];
    ctx.fillStyle = up ? 'rgba(239,68,68,0.6)' : 'rgba(16,185,129,0.6)';
    ctx.fillRect(x - barW * 0.3, yVol(vols[i]), barW * 0.6, volTop + volH - yVol(vols[i]));
  }

  // X 轴日期
  ctx.fillStyle = 'rgba(138,147,182,0.6)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const idx = Math.floor((n - 1) * (i / steps));
    ctx.fillText((view[idx].date || '').slice(5), xAt(idx), volTop + volH + 6);
  }
}

/* ===== 名称可编辑 ===== */
function bindNameEditor() {
  const el = document.getElementById('nameText');
  if (!el) return;
  const code = getCodeFromURL();
  el.addEventListener('blur', () => {
    const v = (el.textContent || '').trim();
    if (v && v !== findName(code)) {
      updateName(code, v);
      toast('已保存名称');
    }
  });
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
  });
}

/* ===== 风控弹层 ===== */
const RISK_DEFAULTS = { maxLoss: 2, maxPos: 30, circuit: 15, atrMult: 2.0, trailTrig: 2.0, trailStep: 1.5 };
const RISK_PRESETS = {
  conservative: { maxLoss: 1.5, maxPos: 20, circuit: 10, atrMult: 1.5, trailTrig: 2.5, trailStep: 1.0 },
  balanced:     { maxLoss: 2, maxPos: 30, circuit: 15, atrMult: 2.0, trailTrig: 2.0, trailStep: 1.5 },
  aggressive:   { maxLoss: 3, maxPos: 50, circuit: 25, atrMult: 2.5, trailTrig: 1.5, trailStep: 2.0 }
};
function openRiskModal() {
  const code = getCodeFromURL();
  const key = `risk_v1_${code}`;
  const r = JSON.parse(localStorage.getItem(key) || 'null') || { ...RISK_DEFAULTS };
  document.getElementById('rMaxLoss').value = r.maxLoss;
  document.getElementById('rMaxPos').value = r.maxPos;
  document.getElementById('rCircuit').value = r.circuit;
  document.getElementById('rAtrMult').value = r.atrMult;
  document.getElementById('rTrailTrig').value = r.trailTrig;
  document.getElementById('rTrailStep').value = r.trailStep;
  document.getElementById('riskScope').textContent = `单只 · ${code.toUpperCase()}`;
  document.getElementById('riskModal').classList.add('show');
}
function closeRiskModal() { document.getElementById('riskModal').classList.remove('show'); }

function bindRiskEvents() {
  document.getElementById('riskClose') && (document.getElementById('riskClose').onclick = closeRiskModal);
  document.getElementById('riskCancel') && (document.getElementById('riskCancel').onclick = closeRiskModal);
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
      const p = RISK_PRESETS[btn.dataset.preset];
      if (!p) return;
      document.getElementById('rMaxLoss').value = p.maxLoss;
      document.getElementById('rMaxPos').value = p.maxPos;
      document.getElementById('rCircuit').value = p.circuit;
      document.getElementById('rAtrMult').value = p.atrMult;
      document.getElementById('rTrailTrig').value = p.trailTrig;
      document.getElementById('rTrailStep').value = p.trailStep;
    };
  });
  document.getElementById('riskReset') && (document.getElementById('riskReset').onclick = () => {
    ['rMaxLoss','rMaxPos','rCircuit','rAtrMult','rTrailTrig','rTrailStep'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = RISK_DEFAULTS[id.replace('r','').toLowerCase().replace('loss','Loss').replace('pos','Pos').replace('circuit','Circuit').replace('atrmult','atrMult').replace('trailtrig','trailTrig').replace('trailstep','trailStep')] ?? '';
    });
    // 上面是防呆，简化：
    document.getElementById('rMaxLoss').value = RISK_DEFAULTS.maxLoss;
    document.getElementById('rMaxPos').value = RISK_DEFAULTS.maxPos;
    document.getElementById('rCircuit').value = RISK_DEFAULTS.circuit;
    document.getElementById('rAtrMult').value = RISK_DEFAULTS.atrMult;
    document.getElementById('rTrailTrig').value = RISK_DEFAULTS.trailTrig;
    document.getElementById('rTrailStep').value = RISK_DEFAULTS.trailStep;
  });
  document.getElementById('riskSave') && (document.getElementById('riskSave').onclick = () => {
    const code = getCodeFromURL();
    const r = {
      maxLoss: +document.getElementById('rMaxLoss').value || RISK_DEFAULTS.maxLoss,
      maxPos: +document.getElementById('rMaxPos').value || RISK_DEFAULTS.maxPos,
      circuit: +document.getElementById('rCircuit').value || RISK_DEFAULTS.circuit,
      atrMult: +document.getElementById('rAtrMult').value || RISK_DEFAULTS.atrMult,
      trailTrig: +document.getElementById('rTrailTrig').value || RISK_DEFAULTS.trailTrig,
      trailStep: +document.getElementById('rTrailStep').value || RISK_DEFAULTS.trailStep,
    };
    const scope = document.getElementById('rScope').value;
    if (scope === 'all') {
      const list = loadStocks();
      list.forEach(s => localStorage.setItem(`risk_v1_${s.code}`, JSON.stringify(r)));
    }
    localStorage.setItem(`risk_v1_${code}`, JSON.stringify(r));
    closeRiskModal();
    toast('风控参数已保存');
    const code2 = getCodeFromURL();
    initStock(code2, true);
  });
}

/* ===== initStock：拉数据 → 汇总 → 渲染 ===== */
async function initStock(code, force) {
  try {
    let data = force ? [] : HistoryTable.getRecent(code, 200);
    if (!data || data.length < 30) {
      data = await fetchKLine(code, 200);
      HistoryTable.saveRecent(code, data);
    } else {
      // 后台刷新
      fetchKLine(code, 200).then(fresh => {
        if (fresh && fresh.length) HistoryTable.saveRecent(code, fresh);
      }).catch(() => {});
    }
    if (!data || data.length < 5) throw new Error('数据不足');

    // 顺手拉大盘（上证指数 sh000001）做 beta/IR
    if (!window.__marketCloses) {
      try {
        const m = await fetchKLine('sh000001', 200);
        window.__marketCloses = m.map(d => d.close);
      } catch (e) { window.__marketCloses = null; }
    }

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const opens = data.map(d => d.open);
    const vols = data.map(d => d.volume);

    const last = data[data.length - 1];
    const prev = data[data.length - 2] || last;
    const change = last.close - prev.close;
    const changePct = prev.close ? (change / prev.close) * 100 : 0;

    const last20 = data.slice(-20);
    const pivotHi = Math.max(...last20.map(d => d.high));
    const pivotLo = Math.min(...last20.map(d => d.low));
    const pivots = calcPivots(pivotHi, pivotLo, last.close);

    const sum = summarize(closes, highs, lows, opens, vols, pivots, null);

    // 应用风控封顶
    const risk = JSON.parse(localStorage.getItem(`risk_v1_${code}`) || 'null');
    if (risk && risk.maxPos) {
      sum.position = Math.min(sum.position, risk.maxPos);
      sum.quantWarnings = (sum.quantWarnings || []).concat([`🛡 应用风控：单只最大持仓 ${risk.maxPos}%`]);
    }

    renderPage(data, sum, pivots, last.close, change, changePct);
  } catch (e) {
    document.getElementById('root').innerHTML = `<div class="empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
      <div>${e.message || '加载失败'}</div>
      <a href="index.html">返回列表</a>
    </div>`;
  }
}

/* ===== 启动 ===== */
const code = getCodeFromURL();
if (!code) {
  document.getElementById('root').innerHTML = `<div class="empty">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
    缺少股票代码 · <a href="index.html" style="color:var(--accent);text-decoration:underline">返回添加</a>
  </div>`;
} else {
  initStock(code);
  bindRiskEvents();
}

// 窗口大小变化 → 重绘
let _rzT = null;
window.addEventListener('resize', () => {
  clearTimeout(_rzT);
  _rzT = setTimeout(() => {
    const canvas = document.getElementById('chart');
    if (canvas) {
      const code = getCodeFromURL();
      const data = HistoryTable.getRecent(code, 200);
      const tools = document.getElementById('chartTools');
      const active = tools && tools.querySelector('.seg.on');
      drawChart(data, code, active ? active.dataset.overlay : 'all');
    }
  }, 120);
});

console.log('📊 股票详情页（重写增强版）已启动');
</script>
</body>
</html>
