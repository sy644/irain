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
  .top .name{font-size:18px;font-weight:600;display:flex;align-items:center;gap:8px;flex:1;min-width:0}
  .top .name .editable{outline:none;padding:2px 6px;border-radius:6px}
  .top .name .editable:focus{background:rgba(91,140,255,.12)}
  .top .name .code{color:var(--muted);font-weight:400;font-size:13px}
  .top .actions{display:flex;gap:8px}
  .btn{background:var(--panel);border:1px solid var(--line);color:var(--text);padding:8px 12px;border-radius:10px;font-size:13px;cursor:pointer}
  .btn:active{transform:scale(0.98)}
  .btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;color:#fff}
  .btn.ghost{background:transparent}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:14px;margin-bottom:12px}
  .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:8px;flex-wrap:wrap}
  .hd h3{margin:0;font-size:14px;color:var(--muted);font-weight:500;letter-spacing:0.5px}
  .priceRow{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
  .price{font-size:34px;font-weight:700;letter-spacing:-0.5px;font-feature-settings:"tnum"}
  .change{font-size:14px;font-feature-settings:"tnum"}
  .up{color:var(--up)}.dn{color:var(--dn)}.warn{color:var(--warn)}.good{color:var(--good)}.bad{color:var(--bad)}
  .kv{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
  .kv .k{color:var(--muted);font-size:12px}
  .kv .v{font-size:14px;font-weight:600;margin-top:2px;font-feature-settings:"tnum"}
  .signal{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:linear-gradient(135deg,rgba(91,140,255,.15),rgba(124,91,255,.15));border:1px solid var(--line)}
  .pill{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;display:inline-block}
  .pill.up{background:rgba(239,68,68,.15);color:var(--up)}
  .pill.dn{background:rgba(16,185,129,.15);color:var(--dn)}
  .pill.warn{background:rgba(245,158,11,.15);color:var(--warn)}
  .pill.good{background:rgba(34,197,94,.15);color:var(--good)}
  .pill.neutral{background:rgba(138,147,182,.15);color:var(--muted)}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .row3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .meter{position:relative;height:8px;background:#1a2247;border-radius:999px;overflow:hidden}
  .meter > i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px}
  .ind{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:10px;background:var(--panel2);margin-bottom:6px;font-size:13px;gap:6px}
  .ind .n{color:var(--muted);display:flex;align-items:center;gap:6px;flex-shrink:0}
  .ind .v{font-weight:600;font-feature-settings:"tnum";text-align:right;flex:1;overflow:hidden;text-overflow:ellipsis}
  .ind .s{font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(138,147,182,.12);color:var(--muted);flex-shrink:0}
  .ind .s.buy{background:rgba(239,68,68,.15);color:var(--up)}
  .ind .s.sell{background:rgba(16,185,129,.15);color:var(--dn)}
  .ind .s.good{background:rgba(34,197,94,.15);color:var(--good)}
  .ind .s.bad{background:rgba(239,68,68,.15);color:var(--up)}
  .ind .s.warn{background:rgba(245,158,11,.15);color:var(--warn)}
  .ind .s.neutral{background:rgba(138,147,182,.15);color:var(--muted)}
  .tpRow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .tpBox{background:var(--panel2);border-radius:10px;padding:10px;font-size:12px}
  .tpBox .lbl{color:var(--muted);font-size:11px}
  .tpBox .pv{font-size:16px;font-weight:700;margin-top:4px;font-feature-settings:"tnum"}
  .tpBox .ratio{font-size:11px;color:var(--muted);margin-top:2px}
  .warns{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.7;margin-top:8px}
  .warns b{color:var(--warn)}
  .chartWrap{position:relative;width:100%;height:280px;background:var(--panel2);border-radius:10px;overflow:hidden}
  canvas{display:block;width:100%;height:100%}
  .chartTools{display:flex;gap:6px;flex-wrap:wrap}
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
  #errBox{position:fixed;left:8px;right:8px;bottom:8px;background:#3b0d0d;color:#fff;padding:10px 12px;border-radius:8px;font-size:12px;z-index:9999;display:none;white-space:pre-wrap;word-break:break-all;max-height:40vh;overflow:auto}
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
<div id="errBox"></div>

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
    <div class="field"><label>移动止盈步长 (ATR)</label><input type="number" id="rTrailTrig2" step="0.1" min="0.1" max="3" /></div>
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
//<![CDATA[
"use strict";

// 把所有 JS 错误显示在页面上方便调试
function showErr(msg){
  try {
    var eb = document.getElementById('errBox');
    if (eb){ eb.style.display='block'; eb.textContent = String(msg); }
  } catch(e){}
}
window.addEventListener('error', function(e){
  showErr('JS Error: ' + (e.message||'') + ' @ ' + (e.filename||'') + ':' + (e.lineno||0) + ':' + (e.colno||0));
  console.error('[js-err]', e.message, e.filename, e.lineno, e.colno);
});
window.addEventListener('unhandledrejection', function(e){
  showErr('Promise: ' + (e.reason && e.reason.message || e.reason));
  console.error('[promise]', e.reason);
});

/* ================================================================
 * 工具 / 数据 / 量化 / 信号（原版保留 + 修复）
 * ================================================================ */

function toast(msg){
  var el=document.createElement('div');
  el.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1a202c;color:#fff;padding:10px 22px;border-radius:12px;font-size:14px;z-index:999;box-shadow:0 8px 30px rgba(0,0,0,.2);max-width:90vw;text-align:center;font-weight:500';
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(function(){try{el.remove();}catch(e){}},3000);
}

window.__APP__=window.__APP__||{};
var _exports = window.__APP__;
function getCodeFromURL(){
  try {
    var p=new URLSearchParams(location.search);
    var c=p.get('code');
    if (c) return c;
  } catch(e){}
  var m=location.search.match(/[?&]code=([^&]+)/);
  return m?decodeURIComponent(m[1]):null;
}
window.getCodeFromURL = getCodeFromURL;
_exports.getCodeFromURL = getCodeFromURL;

function findName(code){
  var list=loadStocks();
  for (var i=0;i<list.length;i++) if (list[i].code===code) return list[i].name;
  return code?code.toUpperCase():'';
}
function updateName(code, newName){
  var list=loadStocks();
  for (var i=0;i<list.length;i++){
    if (list[i].code===code){ list[i].name=newName; saveStocks(list); return true; }
  }
  return false;
}
function loadStocks(){
  try{ return JSON.parse(localStorage.getItem('stocks_v1')||'[]'); }catch(e){ return []; }
}
function saveStocks(list){ try{ localStorage.setItem('stocks_v1', JSON.stringify(list)); }catch(e){} }
function getTypeByCode(code){
  var list=loadStocks();
  for (var i=0;i<list.length;i++) if (list[i].code===code) return list[i].type;
  return 'stock';
}
function typeLabel(t){ return t==='index'?' · 指数':(t==='etf'?' · ETF':''); }

function loadPortfolio(){
  try{
    var raw=localStorage.getItem('portfolio_v1');
    if (!raw) return { positions:[], cash:100000, equity:100000, peakEquity:100000 };
    var p=JSON.parse(raw);
    if (!p.positions) p.positions=[];
    if (typeof p.cash!=='number') p.cash=100000;
    if (typeof p.equity!=='number') p.equity=100000;
    if (typeof p.peakEquity!=='number') p.peakEquity=p.equity;
    return p;
  }catch(e){ return { positions:[], cash:100000, equity:100000, peakEquity:100000 }; }
}
function savePortfolio(pf){ try{ localStorage.setItem('portfolio_v1', JSON.stringify(pf)); }catch(e){} }
function updateTrailingStop(pos, tpSl){
  if (!pos||!tpSl||!tpSl.trailingStop||!tpSl.trailingStop.enabled) return;
  var cur=pos.currentPrice, ts=tpSl.trailingStop;
  if (cur>=ts.trigger && ts.currentStop < cur-ts.step){
    ts.currentStop = cur - ts.step;
    pos.trailingStop = ts.currentStop;
    pos.trailingStopUpdatedAt = Date.now();
  }
}
function recordEquity(eq){
  if (typeof eq!=='number'||!isFinite(eq)) return;
  var pf=loadPortfolio();
  pf.equity=eq;
  if (eq>pf.peakEquity) pf.peakEquity=eq;
  savePortfolio(pf);
}

async function fetchKLine(code, count){
  if (!count) count=80;
  var url='https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param='+encodeURIComponent(code)+',day,,,'+count+',qfq';
  var controller=new AbortController();
  var timeout=setTimeout(function(){controller.abort();},8000);
  try{
    var res=await fetch(url,{signal:controller.signal});
    clearTimeout(timeout);
    if (!res.ok) throw new Error('HTTP '+res.status);
    var data=await res.json();
    if (data.code!==0) throw new Error('接口返回错误');
    var keys=Object.keys(data.data||{});
    if (!keys.length) throw new Error('无数据');
    var arr=(data.data[keys[0]]&&(data.data[keys[0]].qfqday||data.data[keys[0]].day))||[];
    if (!arr.length) throw new Error('空数据');
    return arr.map(function(row){
      return { date:row[0], open:+row[1], close:+row[2], high:+row[3], low:+row[4], volume:+row[5] };
    }).filter(function(r){return r.date && !isNaN(r.open);});
  }catch(err){
    clearTimeout(timeout);
    try{
      var backupUrl='https://quotes.sina.cn/cn/api/json_v2.php/IFengService.getKLineData?symbol='+code+'&scale=240&ma=no&datalen='+count;
      var res2=await fetch(backupUrl,{signal:AbortSignal.timeout(5000)});
      if (!res2.ok) throw new Error('备用接口失败');
      var data2=await res2.json();
      if (!data2||!data2.length) throw new Error('备用数据为空');
      return data2.map(function(row){
        return { date:row.day, open:+row.open, close:+row.close, high:+row.high, low:+row.low, volume:+row.volume||0 };
      });
    }catch(err2){
      throw new Error('无法获取 '+code+' 的K线数据');
    }
  }
}
async function fetchBasic(code){ return null; }

var HistoryTable={
  _cache:{},
  _storageKey:'kline_cache_v1',
  _saveTimer:null,
  init:function(){
    try{ var s=localStorage.getItem(this._storageKey); if (s) this._cache=JSON.parse(s); }catch(e){}
  },
  getRecent:function(code,count){
    var arr=this._cache[code];
    if (!arr||!arr.length) return [];
    return arr.slice(-count);
  },
  saveRecent:function(code,data){
    if (!data||data.length<5) return;
    this._cache[code]=data;
    var self=this;
    clearTimeout(this._saveTimer);
    this._saveTimer=setTimeout(function(){
      try{ localStorage.setItem(self._storageKey, JSON.stringify(self._cache)); }
      catch(e){
        var ks=Object.keys(self._cache);
        if (ks.length>30){ for (var i=0;i<ks.length-30;i++) delete self._cache[ks[i]]; }
      }
    },300);
  },
  getLatest:function(code){
    var arr=this._cache[code];
    if (!arr||!arr.length) return null;
    return arr[arr.length-1];
  },
  appendLast:function(row){
    if (!row||!row.code) return;
    var ex=this._cache[row.code]||[];
    var idx=-1;
    for (var i=0;i<ex.length;i++) if (ex[i].date===row.date){ idx=i; break; }
    if (idx>=0) ex[idx]=Object.assign({}, ex[idx], row);
    else ex.push(row);
    ex.sort(function(a,b){return a.date<b.date?-1:(a.date>b.date?1:0);});
    this._cache[row.code]=ex;
    var self=this;
    clearTimeout(this._saveTimer);
    this._saveTimer=setTimeout(function(){
      try{ localStorage.setItem(self._storageKey, JSON.stringify(self._cache)); }catch(e){}
    },300);
  }
};
HistoryTable.init();

function _returns(closes){
  var r=[], i;
  for (i=1;i<closes.length;i++) r.push((closes[i]-closes[i-1])/closes[i-1]);
  return r;
}
function annualReturn(returns){
  if (!returns.length) return 0;
  var s=0; for (var i=0;i<returns.length;i++) s+=returns[i];
  return (s/returns.length)*252;
}
function volatility(returns){
  if (returns.length<2) return 0;
  var avg=0; for (var i=0;i<returns.length;i++) avg+=returns[i];
  avg/=returns.length;
  var sq=0; for (var j=0;j<returns.length;j++) sq+=(returns[j]-avg)*(returns[j]-avg);
  return Math.sqrt(sq/(returns.length-1))*Math.sqrt(252);
}
function sharpeRatio(returns, rf){
  if (rf===undefined) rf=0.03;
  var ann=annualReturn(returns), vol=volatility(returns);
  return vol>0 ? (ann-rf)/vol : 0;
}
function sortinoRatio(returns, rf){
  if (rf===undefined) rf=0.03;
  if (returns.length<2) return 0;
  var avg=0; for (var i=0;i<returns.length;i++) avg+=returns[i];
  avg/=returns.length;
  var down=[];
  for (var j=0;j<returns.length;j++) if (returns[j]<0) down.push(returns[j]);
  if (!down.length) return 999;
  var dd=0; for (var k=0;k<down.length;k++) dd+=(down[k]-avg)*(down[k]-avg);
  var std=Math.sqrt(dd/down.length)*Math.sqrt(252);
  var ann=annualReturn(returns);
  return std>0 ? (ann-rf)/std : 0;
}
function maxDrawdown(closes){
  if (!closes.length) return {value:0, peakIdx:0, troughIdx:0};
  var peak=closes[0], mdd=0, peakIdx=0, troughIdx=0;
  for (var i=0;i<closes.length;i++){
    if (closes[i]>peak){ peak=closes[i]; peakIdx=i; }
    var dd=(peak-closes[i])/peak;
    if (dd>mdd){ mdd=dd; troughIdx=i; }
  }
  return {value:mdd, peakIdx:peakIdx, troughIdx:troughIdx};
}
function calmarRatio(returns, closes){
  var ann=annualReturn(returns), mdd=maxDrawdown(closes).value;
  return mdd>0 ? ann/mdd : 0;
}
function trendStrength(closes){
  if (closes.length<60) return 50;
  var ma20=0, ma60=0;
  for (var i=closes.length-20;i<closes.length;i++) ma20+=closes[i];
  for (var j=closes.length-60;j<closes.length;j++) ma60+=closes[j];
  ma20/=20; ma60/=60;
  var pct=(ma20-ma60)/ma60*100;
  return Math.min(100, Math.max(0, 50+pct*1.5));
}
function betaToMarket(sR, mR){
  if (sR.length!==mR.length||sR.length<2) return 1;
  var avgS=0, avgM=0;
  for (var i=0;i<sR.length;i++){ avgS+=sR[i]; avgM+=mR[i]; }
  avgS/=sR.length; avgM/=mR.length;
  var cov=0, varM=0;
  for (var j=0;j<sR.length;j++){
    cov += (sR[j]-avgS)*(mR[j]-avgM);
    varM += (mR[j]-avgM)*(mR[j]-avgM);
  }
  return varM>0 ? cov/varM : 1;
}
function alphaToMarket(sR, mR){
  var b=betaToMarket(sR, mR);
  var avgS=0, avgM=0;
  for (var i=0;i<sR.length;i++){ avgS+=sR[i]; avgM+=mR[i]; }
  avgS/=sR.length; avgM/=mR.length;
  return avgS - b*avgM;
}
function informationRatio(sR, mR){
  var alpha=alphaToMarket(sR, mR);
  var b=betaToMarket(sR, mR);
  var avgM=0; for (var i=0;i<mR.length;i++) avgM+=mR[i];
  avgM/=mR.length;
  var residuals=[];
  for (var j=0;j<sR.length;j++) residuals.push(sR[j]-b*mR[j]);
  var avg=0; for (var k=0;k<residuals.length;k++) avg+=residuals[k];
  avg/=residuals.length;
  var std=0; for (var x=0;x<residuals.length;x++) std+=(residuals[x]-avg)*(residuals[x]-avg);
  std=Math.sqrt(std/(residuals.length-1));
  return std>0 ? alpha/std : 0;
}
function correlation(a, b){
  if (a.length!==b.length||a.length<2) return 0;
  var avgA=0, avgB=0;
  for (var i=0;i<a.length;i++){ avgA+=a[i]; avgB+=b[i]; }
  avgA/=a.length; avgB/=b.length;
  var num=0, denA=0, denB=0;
  for (var j=0;j<a.length;j++){
    num += (a[j]-avgA)*(b[j]-avgB);
    denA += (a[j]-avgA)*(a[j]-avgA);
    denB += (b[j]-avgB)*(b[j]-avgB);
  }
  return (denA*denB)>0 ? num/Math.sqrt(denA*denB) : 0;
}

function _calcRSI(closes, period){
  if (closes.length<period+1) return 50;
  var gain=0, loss=0;
  for (var i=1;i<=period;i++){
    var d=closes[closes.length-period+i-1]-closes[closes.length-period+i-2];
    if (d>0) gain+=d; else loss-=d;
  }
  var avgG=gain/period, avgL=loss/period;
  for (var k=period+1;k<closes.length;k++){
    var diff=closes[k]-closes[k-1];
    avgG=(avgG*(period-1)+(diff>0?diff:0))/period;
    avgL=(avgL*(period-1)+(diff<0?-diff:0))/period;
  }
  if (avgL===0) return 100;
  return 100 - 100/(1+avgG/avgL);
}
function _calcMACD(closes){
  function ema(arr, n){
    var k=2/(n+1), e=arr[0];
    for (var i=1;i<arr.length;i++) e=arr[i]*k+e*(1-k);
    return e;
  }
  var dif=ema(closes,12)-ema(closes,26);
  return { macd:dif, signal:dif*0.2, hist:dif*0.8 };
}
function _calcKDJ(closes, highs, lows, n){
  if (n===undefined) n=9;
  if (closes.length<n) return {k:50, d:50, j:50};
  var k=50, d=50;
  for (var i=closes.length-n;i<closes.length;i++){
    var lo=Math.max(0, i-n+1);
    var hi=highs.slice(lo, i+1), lo2=lows.slice(lo, i+1);
    var H=Math.max.apply(null,hi), L=Math.min.apply(null,lo2);
    var r = H===L ? 50 : (closes[i]-L)/(H-L)*100;
    k = 2/3*k + 1/3*r;
    d = 2/3*d + 1/3*k;
  }
  return { k:k, d:d, j:3*k-2*d };
}
function _calcCCI(closes, highs, lows, n){
  if (n===undefined) n=20;
  if (closes.length<n) return 0;
  var s=0;
  for (var i=closes.length-n;i<closes.length;i++) s+=(highs[i]+lows[i]+closes[i])/3;
  var ma=s/n, md=0;
  for (var k=closes.length-n;k<closes.length;k++) md+=Math.abs((highs[k]+lows[k]+closes[k])/3-ma);
  md/=n;
  var last=(highs[highs.length-1]+lows[lows.length-1]+closes[closes.length-1])/3;
  return md===0 ? 0 : (last-ma)/(0.015*md);
}
function _calcWR(closes, highs, lows, n){
  if (n===undefined) n=14;
  if (closes.length<n) return -50;
  var hs=highs.slice(-n), ls=lows.slice(-n);
  var h=Math.max.apply(null,hs), l=Math.min.apply(null,ls);
  return h===l ? -50 : (h-closes[closes.length-1])/(h-l)*-100;
}
function _calcADX(highs, lows, closes, n){
  if (n===undefined) n=14;
  if (closes.length<n*2) return 20;
  var tr=0, pdm=0, mdm=0;
  for (var i=closes.length-n;i<closes.length;i++){
    var prev=i>0?closes[i-1]:closes[i];
    var trv=Math.max(highs[i]-lows[i], Math.abs(highs[i]-prev), Math.abs(lows[i]-prev));
    var up=highs[i]-highs[i-1], dn=lows[i-1]-lows[i];
    tr+=trv;
    pdm += up>dn && up>0 ? up : 0;
    mdm += dn>up && dn>0 ? dn : 0;
  }
  if (tr===0) return 0;
  var pdi=pdm/tr*100, mdi=mdm/tr*100;
  return (pdi+mdi)===0 ? 0 : Math.abs(pdi-mdi)/(pdi+mdi)*100;
}
function _calcBOLL(closes, n){
  if (n===undefined) n=20;
  if (closes.length<n){ var c=closes[closes.length-1]; return {upper:c*1.02, mid:c, lower:c*0.98}; }
  var s=closes.slice(-n), mid=0;
  for (var i=0;i<s.length;i++) mid+=s[i];
  mid/=n;
  var sd=0; for (var k=0;k<s.length;k++) sd+=(s[k]-mid)*(s[k]-mid);
  sd=Math.sqrt(sd/n);
  return { upper:mid+2*sd, mid:mid, lower:mid-2*sd };
}
function _calcVR(closes, vols, n){
  if (n===undefined) n=26;
  if (closes.length<n) return 100;
  var up=0, dn=0, eq=0;
  for (var i=closes.length-n;i<closes.length;i++){
    if (i===0) continue;
    if (closes[i]>closes[i-1]) up+=vols[i];
    else if (closes[i]<closes[i-1]) dn+=vols[i];
    else eq+=vols[i];
  }
  return dn===0 ? 999 : (up+eq*0.5)/(dn+eq*0.5)*100;
}
function calcPivots(high, low, close){
  var pp=(high+low+close)/3;
  return {
    classic:{
      '轴心点':pp, R1:2*pp-low, R2:pp+(high-low), R3:high+2*(pp-low),
      S1:2*pp-high, S2:pp-(high-low), S3:low-2*(high-pp)
    },
    fibonacci:{
      '轴心点':pp,
      R1:pp+0.382*(high-low), R2:pp+0.618*(high-low), R3:pp+1.0*(high-low),
      S1:pp-0.382*(high-low), S2:pp-0.618*(high-low), S3:pp-1.0*(high-low)
    }
  };
}

/* ================================================================
 * summarize（修复 pivots 可能为 null）
 * ================================================================ */
function summarize(closes, highs, lows, opens, vols, pivotsIn, basic){
  var pivots = pivotsIn || { classic:{ '轴心点':0, R1:0, R2:0, R3:0, S1:0, S2:0, S3:0 } };
  var n=closes.length;
  if (n<5){
    return {
      overall:'观望', action:'数据不足', position:0, confidence:10,
      score:0, netScore:0,
      trend:'震荡', trendScore:0, trendStrength:0, trendWeight:1,
      bollInfo:{upper:0,mid:0,lower:0,position:0.5,width:0,widthChange:0,isExpanding:false,isContracting:false},
      maInfo:{ma5:0,ma10:0,ma20:0,ma60:0,alignment:0,slope5:0},
      pivotLabel:'中性', pivotBreakdown:null, pivotBreakout:null,
      vpScore:0, vpLabel:'量价中性', vpEvent:'', vpDivergence:false,
      obvInfo:{direction:'neutral',value:0,slope8:0},
      volaRatio:1, anomalyIdx:[],
      backtest:{buySamples:0, buyWinRate:0, buyAvgRet:0, lookback:0, holdDays:0},
      tpSl:{ stopLoss:0, takeProfitLevels:[], trailingStop:{enabled:false,trigger:0,step:0,currentStop:0}, atr:0, s1:0, r1:0, r2:0, hasR2:false, isStrongTrend:false, momentum20:0, atrPct:0, stopMult:2, triggerMult:2, stepMult:1.5, note:'数据不足' },
      trendGroup:[], momentumGroup:[], volaGroup:[], volGroup:[],
      buyScore:0, sellScore:0,
      mainForce:null, fundamentals:null,
      trendDiagnosis:{direction:'震荡', strength:0, score:0, bollPosition:0.5, maAlignment:0, adx:0}
    };
  }

  var price=closes[n-1];
  var s5=0, s10=0, s20=0, s60=0;
  for (var i=0;i<n;i++){
    var v=closes[i];
    if (i>=n-5) s5+=v;
    if (i>=n-10) s10+=v;
    if (i>=n-20) s20+=v;
    if (i>=n-60) s60+=v;
  }
  var ma5=s5/Math.min(5,n);
  var ma10=s10/Math.min(10,n);
  var ma20=s20/Math.min(20,n);
  var ma60=n>=60?s60/60:ma20;
  var prev=closes[n-2]||price;
  var pct5=n>5?(price-closes[n-5])/closes[n-5]*100:0;

  var bollPeriod=Math.min(20,n);
  var bollSlice=closes.slice(-bollPeriod);
  var bollMid=0; for (var bi=0;bi<bollSlice.length;bi++) bollMid+=bollSlice[bi];
  bollMid/=bollSlice.length;
  var bollStd=0;
  for (var bs=0;bs<bollSlice.length;bs++){ var d=bollSlice[bs]-bollMid; bollStd+=d*d; }
  bollStd=Math.sqrt(bollStd/bollSlice.length);
  var bollUpper=bollMid+2*(bollStd||0.001);
  var bollLower=bollMid-2*(bollStd||0.001);
  var bollWidth=(bollStd||0.001)/(bollMid||0.001);
  var bollPosition=(price-bollLower)/(bollUpper-bollLower||1);

  var bollWidthChange=0;
  if (n>=30){
    var recent=closes.slice(-5), past=closes.slice(-10,-5);
    function calcW(arr){
      var m=0; for (var z=0;z<arr.length;z++) m+=arr[z];
      m=(m/arr.length)||1;
      var s2=0; for (var y=0;y<arr.length;y++){ var dd=arr[y]-m; s2+=dd*dd; }
      return Math.sqrt(s2/arr.length)/m;
    }
    bollWidthChange=calcW(recent)-calcW(past);
  }

  var maOrder=(ma5>ma10?1:0)+(ma10>ma20?1:0)+(ma20>ma60?1:0);
  var ma5Slope=n>10?(ma5-closes[n-6])/(closes[n-6]||0.001):0;

  var trendScore=0;
  if (price>ma5) trendScore+=1.5; else trendScore-=1.5;
  if (price>ma20) trendScore+=1.0; else trendScore-=1.0;
  if (price>ma60) trendScore+=0.8; else trendScore-=0.8;
  if (maOrder>=2) trendScore+=1.0; else trendScore-=1.0;
  if (ma5>ma20) trendScore+=0.5; else trendScore-=0.5;
  if (ma20>ma60) trendScore+=0.5; else trendScore-=0.5;
  if (bollPosition>0.8) trendScore+=0.8;
  else if (bollPosition<0.2) trendScore-=0.8;
  if (bollWidthChange>0.001 && price>bollMid) trendScore+=0.6;
  if (bollWidthChange<-0.001 && Math.abs(bollPosition-0.5)<0.15) trendScore-=0.5;
  if (ma5Slope>0.01) trendScore+=0.6;
  else if (ma5Slope<-0.01) trendScore-=0.6;

  var hh=highs?Math.max.apply(null, highs.slice(-20)):price*1.05;
  var ll=lows?Math.min.apply(null, lows.slice(-20)):price*0.95;
  var pp20=(price-ll)/(hh-ll||1);
  if (pp20>0.7 && price>ma20*1.03) trendScore+=0.4;
  if (pp20<0.3 && price<ma20*0.97) trendScore-=0.4;
  if (pct5>2) trendScore+=0.5;
  else if (pct5<-2) trendScore-=0.5;

  var trendDir='震荡', trendStrength=0;
  if (trendScore>=4){ trendDir='强多头'; trendStrength=80; }
  else if (trendScore>=2){ trendDir='多头'; trendStrength=60; }
  else if (trendScore>=0.5){ trendDir='弱多头'; trendStrength=40; }
  else if (trendScore>=-0.5){ trendDir='震荡'; trendStrength=20; }
  else if (trendScore>=-2){ trendDir='弱空头'; trendStrength=30; }
  else if (trendScore>=-4){ trendDir='空头'; trendStrength=60; }
  else { trendDir='强空头'; trendStrength=80; }

  // OBV
  var obvSeries=new Array(n);
  obvSeries[0]=0;
  for (var oi=1;oi<n;oi++){
    if (closes[oi]>closes[oi-1]) obvSeries[oi]=obvSeries[oi-1]+vols[oi];
    else if (closes[oi]<closes[oi-1]) obvSeries[oi]=obvSeries[oi-1]-vols[oi];
    else obvSeries[oi]=obvSeries[oi-1];
  }
  var obvCurrent=obvSeries[n-1];

  // ★ 修复：OBV 斜率
  var obvSlope8=0;
  if (n>=10){
    var tail=obvSeries.slice(-9);
    var sumDiff=0;
    for (var td=1;td<tail.length;td++) sumDiff += (tail[td]-tail[td-1]);
    var avgDiff=sumDiff/(tail.length-1);
    var baseScale=Math.max(1, Math.abs(obvCurrent)*0.01);
    obvSlope8 = avgDiff/baseScale;
  }
  var isObvUp = obvSlope8>0.01;
  var isObvDown = obvSlope8<-0.01;
  var lastVol=vols[n-1];
  var avgVol5=0; for (var a5=0;a5<5;a5++) avgVol5+=vols[n-5+a5]; avgVol5/=5;
  var avgVol20=0; for (var a20=0;a20<20;a20++) avgVol20+=vols[n-20+a20]; avgVol20/=20;
  var volArr=vols.slice(-20).slice().sort(function(a,b){return a-b;});
  var volMedian20=volArr[Math.floor(volArr.length/2)];
  var posH=(hh-ll)>0?(price-ll)/(hh-ll):0.5;
  var priceSlope5=n>5?(price-closes[n-5])/closes[n-5]:0;
  var priceUp1d=closes[n-1]>closes[n-2];
  var isBreakHigh=price>hh;
  var isBigVolNow=lastVol>volMedian20*1.5;
  var isShrinkingVol=avgVol5<avgVol20*0.85;
  var pullbackFromHigh=(hh-price)/hh;

  var vpScore=0, vpFactors=[];
  if (isBreakHigh && isBigVolNow){
    var bonus=isObvUp?2.0:1.5;
    vpScore+=bonus; vpFactors.push('放量突破+'+bonus);
  }
  if (avgVol5>avgVol20*1.1 && priceUp1d){ vpScore+=1.0; vpFactors.push('温和放量+1'); }
  if (pullbackFromHigh>0.02 && pullbackFromHigh<0.12 && isShrinkingVol && !priceUp1d){ vpScore+=0.8; vpFactors.push('缩量洗盘+0.8'); }
  if (isObvUp && priceSlope5>0.01){ vpScore+=0.5; vpFactors.push('OBV流入+0.5'); }
  if (posH>0.85 && obvSlope8<0){ vpScore-=2.0; vpFactors.push('高位背离-2'); }
  else if (posH>0.85 && Math.abs(obvSlope8)<0.01){ vpScore-=1.0; vpFactors.push('疑似背离-1'); }
  if (lastVol>avgVol20*1.5 && !priceUp1d && posH>0.5){ vpScore-=1.0; vpFactors.push('放量滞涨-1'); }
  if (isObvDown && posH>0.7){ vpScore-=0.5; vpFactors.push('OBV流出-0.5'); }
  if (summarize._marketEnv){
    var env=summarize._marketEnv;
    if (env.trend==='down'){
      if (vpScore>0){ vpScore*=0.7; vpFactors.push('熊市多头打折'); }
      else if (vpScore<0){ vpScore*=1.2; vpFactors.push('熊市空头加重'); }
    } else if (env.trend==='up'){
      if (vpScore>0){ vpScore*=1.1; vpFactors.push('牛市多头放大'); }
    }
  }
  var vpDivergence=false, vpEvent='', vpLabel='量价中性';
  if (vpScore>=1.5){ vpLabel='放量突破'; vpEvent='fangBreakout'; vpDivergence=false; }
  else if (vpScore>=0.8){ vpLabel='放量上涨'; vpEvent='upTrend'; vpDivergence=false; }
  else if (vpScore>=0.3){ vpLabel='温和上行'; vpEvent='upTrend'; vpDivergence=false; }
  else if (vpScore>=-0.3){ vpLabel='量价中性'; vpEvent=''; vpDivergence=false; }
  else if (vpScore>=-1.0){ vpLabel='量价滞涨'; vpEvent='fangBreak'; vpDivergence=true; }
  else { vpLabel='量价背离'; vpEvent='divergence'; vpDivergence=true; }

  var absTrend=Math.abs(trendScore);
  var trendWeight=1.0;
  if (absTrend>5) trendWeight=1.3;
  else if (absTrend<1) trendWeight=0.8;
  var score=trendScore*trendWeight + vpScore*(2-trendWeight);

  var overall, action, position, confidence;
  if (score>=6){ overall='强力买入'; action='强势突破，积极跟进'; position=85; confidence=90; }
  else if (score>=4){ overall='买入'; action='趋势向好，分批建仓'; position=65; confidence=75; }
  else if (score>=2.5){ overall='左侧试探'; action='底部区域，轻仓试水'; position=35; confidence=55; }
  else if (score>=1){ overall='超卖区'; action='超跌反弹机会'; position=20; confidence=40; }
  else if (score>=-0.5){ overall='观望'; action='等待方向明朗'; position=0; confidence=30; }
  else if (score>=-2.5){ overall='高空防守'; action='高位滞涨，逐步减仓'; position=25; confidence=50; }
  else if (score>=-4.5){ overall='卖出'; action='趋势走弱，果断减仓'; position=50; confidence=70; }
  else { overall='强力卖出'; action='全面转空，清仓避险'; position=75; confidence=85; }

  if (vpDivergence){
    if (overall==='强力买入'||overall==='买入'){
      overall='高空防守'; action='量价背离(高位OBV流出)，逢高减仓';
      position=Math.min(position,30); confidence=Math.min(confidence,50);
    } else if (overall==='左侧试探'){
      overall='观望'; action='量价背离，放弃左侧试仓';
      position=0; confidence=Math.min(confidence,30);
    }
  }

  var atr=price*0.02;
  if (highs && lows && highs.length===n){
    var tr=new Float64Array(n-1);
    for (var ti=1;ti<n;ti++){
      var prevC=closes[ti-1];
      tr[ti-1]=Math.max(highs[ti]-lows[ti], Math.abs(highs[ti]-prevC), Math.abs(lows[ti]-prevC));
    }
    if (tr.length>=14){
      var atrVal=0; for (var ai=0;ai<14;ai++) atrVal+=tr[ai];
      atrVal/=14;
      for (var aj=14;aj<tr.length;aj++) atrVal=(atrVal*13+tr[aj])/14;
      if (atrVal>0) atr=atrVal;
    }
  }
  var s1=2*((highs?Math.max.apply(null,highs.slice(-20)):price*1.05)) - (lows?Math.min.apply(null,lows.slice(-20)):price*0.95);
  var atrPct=atr/price;
  var stopMult=2.0+0.5*Math.min(1, atrPct/0.05);
  var stopLoss=Math.min(price-stopMult*atr, s1, bollLower*0.98, price*0.95);
  var trendFactor=Math.abs(trendScore)/10;
  var m1=1.5+0.5*trendFactor, m2=3.0+1.0*trendFactor, m3=5.0+1.5*trendFactor;
  var tps=[
    {price:price+m1*atr, ratio:0.3, label:'+'+m1.toFixed(2)+'ATR(短线)'},
    {price:price+m2*atr, ratio:0.3, label:'+'+m2.toFixed(2)+'ATR(中线)'},
    {price:price+m3*atr, ratio:0.4, label:'+'+m3.toFixed(2)+'ATR(长线)'}
  ];
  var trailingStop={ enabled:true, trigger:price+2*atr, step:1.5*atr, currentStop:stopLoss };

  var rsi=_calcRSI(closes,14);
  var macd=_calcMACD(closes);
  var kdj=_calcKDJ(closes,highs,lows);
  var roc=n>10?(price-closes[n-11])/closes[n-11]*100:0;
  var cci=_calcCCI(closes,highs,lows,20);
  var wr=_calcWR(closes,highs,lows,14);
  var adx=_calcADX(highs,lows,closes,14);
  var vr=_calcVR(closes,vols,26);
  var volaRatio=avgVol20>0?avgVol5/avgVol20:1;

  var trendGroup=[
    {name:'MA5', value:ma5, signal:price>ma5?'买入':'卖出'},
    {name:'MA10', value:ma10, signal:price>ma10?'买入':'卖出'},
    {name:'MA20', value:ma20, signal:price>ma20?'买入':'卖出'},
    {name:'MA60', value:ma60, signal:price>ma60?'买入':'卖出'}
  ];
  var momentumGroup=[
    {name:'RSI 14', value:rsi, min:0, max:100, signal:rsi>70?'超买':(rsi<30?'超卖':'中性')},
    {name:'MACD', value:macd.macd, min:-Math.abs(macd.signal)*2, max:Math.abs(macd.signal)*2, signal:macd.hist>0?'买入':'卖出'},
    {name:'KDJ K', value:kdj.k, min:0, max:100, signal:kdj.k>80?'超买':(kdj.k<20?'超卖':'中性')},
    {name:'ROC 10', value:roc, min:-15, max:15, signal:roc>5?'买入':(roc<-5?'卖出':'中性')}
  ];
  var volaGroup=[
    {name:'CCI 20', value:cci, min:-200, max:200, signal:cci>100?'超买区':(cci<-100?'超卖区':'中性')},
    {name:'WR 14', value:wr, min:-100, max:0, signal:wr<-80?'超卖区':(wr>-20?'超买区':'中性')},
    {name:'ADX 14', value:adx, min:0, max:100, signal:adx>25?'中等波动':'无趋势'},
    {name:'BOLL', value:(price-bollMid)/(bollUpper-bollLower||1)*100, min:-100, max:100, signal:price>bollUpper?'超买':(price<bollLower?'超卖':'中性')}
  ];
  var volGroup=[
    {name:'OBV', value:obvCurrent, min:-Math.abs(obvCurrent)*2, max:Math.abs(obvCurrent)*2, signal:isObvUp?'资金流入':(isObvDown?'资金流出':'中性')},
    {name:'VR 26', value:vr, min:0, max:300, signal:vr>150?'放量':(vr<70?'缩量':'中性')},
    {name:'VOL 5/20', value:volaRatio, min:0, max:3, signal:volaRatio>1.3?'放量':(volaRatio<0.7?'缩量':'中性')}
  ];
  var allInds=[].concat(trendGroup,momentumGroup,volaGroup,volGroup);
  var buyScore=0, sellScore=0;
  for (var ii=0;ii<allInds.length;ii++){
    var s=allInds[ii].signal;
    if (s==='买入'||s==='超卖'||s==='资金流入'||s==='放量') buyScore++;
    else if (s==='卖出'||s==='超买'||s==='资金流出'||s==='缩量') sellScore++;
  }

  var buySamples=0, buyWin=0, buySum=0;
  var holdDays=5, lookback=Math.min(60, n-holdDays);
  for (var bi=0;bi<allInds.length;bi++){} // 占位防呆
  for (var ri=Math.max(0, n-lookback-holdDays); ri<n-holdDays; ri++){
    if (ri<=0) continue;
    if (closes[ri]>(closes[ri-1]||closes[ri]) && vols[ri]>(vols[ri-1]||vols[ri])){
      buySamples++;
      var ret=(closes[ri+holdDays]-closes[ri])/closes[ri];
      buySum+=ret;
      if (ret>0) buyWin++;
    }
  }

  var anomalyIdx=[];
  for (var ai2=Math.max(1,n-15);ai2<n;ai2++){
    var sumV=0, cnt=0;
    for (var pi=Math.max(0,ai2-5);pi<ai2;pi++){ sumV+=vols[pi]; cnt++; }
    var avg=cnt?sumV/cnt:1;
    if (vols[ai2]>avg*2.0) anomalyIdx.push({i:ai2, type:closes[ai2]<opens[ai2]?'high':'normal'});
  }

  return {
    overall:overall, action:action, position:position, confidence:confidence,
    score:score, netScore:Math.round(score),
    trend:trendDir, trendScore:trendScore, trendStrength:trendStrength, trendWeight:trendWeight,
    bollInfo:{
      upper:bollUpper, mid:bollMid, lower:bollLower,
      position:Math.min(1,Math.max(0,bollPosition)),
      width:bollWidth, widthChange:bollWidthChange||0,
      isExpanding:bollWidthChange>0.001, isContracting:bollWidthChange<-0.001
    },
    maInfo:{ma5:ma5, ma10:ma10, ma20:ma20, ma60:ma60, alignment:maOrder, slope5:ma5Slope},
    pivotLabel: price>pivots.classic.R1?'突破R1':(price>pivots.classic['轴心点']?'轴上':(price<pivots.classic.S1?'跌破S1':(price<pivots.classic['轴心点']?'轴下':'中性'))),
    pivotBreakdown: price<pivots.classic.S1?{level:'S1', from:pivots.classic.S1, to:'S2'}:null,
    pivotBreakout: price>pivots.classic.R1?{level:'R1', from:pivots.classic.R1, target:'R2'}:null,
    vpScore:vpScore, vpLabel:vpLabel, vpEvent:vpEvent, vpDivergence:vpDivergence,
    obvInfo:{direction:isObvUp?'up':(isObvDown?'down':'neutral'), value:obvCurrent, slope8:obvSlope8},
    volaRatio:volaRatio, anomalyIdx:anomalyIdx,
    backtest:{buySamples:buySamples, buyWinRate:buySamples?buyWin/buySamples:0, buyAvgRet:buySamples?buySum/buySamples:0, lookback:60, holdDays:holdDays},
    tpSl:{
      stopLoss:stopLoss, takeProfitLevels:tps, trailingStop:trailingStop,
      atr:atr, s1:s1, r1:pivots.classic.R1, r2:pivots.classic.R2,
      hasR2:pivots.classic.R2>tps[2].price,
      isStrongTrend:Math.abs(trendScore)>3,
      momentum20:n>20?(price-closes[n-21])/closes[n-21]:0,
      atrPct:atrPct, stopMult:stopMult, triggerMult:2.0, stepMult:1.5,
      note:'趋势增强版（布林+均线）'
    },
    trendGroup:trendGroup, momentumGroup:momentumGroup, volaGroup:volaGroup, volGroup:volGroup,
    buyScore:buyScore, sellScore:sellScore,
    mainForce:null, fundamentals:null,
    trendDiagnosis:{
      direction:trendDir, strength:trendStrength, score:trendScore,
      bollPosition:Math.min(1,Math.max(0,bollPosition)),
      maAlignment:maOrder, adx:adx||0
    }
  };
}
summarize._marketEnv=null;

function applyQuantToSignal(sum, qm){
  if (!qm) return sum;
  var v=qm.strategicVerdict;
  var orig={position:sum.position, confidence:sum.confidence};
  var w=[];
  var isBO = (sum.vpEvent==='fangBreakout' && sum.vpScore>=1);
  if (isBO){
    if (sum.position<50) sum.position=Math.min(60, sum.position+20);
    w.push('放量突破前高，仓位提升至 '+sum.position+'%');
  } else if (v.bad){
    if (sum.position>30){
      sum.position=30;
      var reason='';
      if (v.sharpe<0) reason+='夏普'+v.sharpe.toFixed(2)+'<0 ';
      if (v.mdd>0.25) reason+='回撤'+(v.mdd*100).toFixed(0)+'%>25% ';
      if (v.ir!=null && v.ir<-0.5) reason+='IR'+v.ir.toFixed(2)+'<-0.5 ';
      w.push('量化战略偏弱（'+reason.trim()||'综合指标不佳'+'），仓位封顶 30%');
    }
    sum.confidence=Math.min(sum.confidence,40);
  } else if (v.weak){
    if (sum.position>50){ sum.position=50; w.push('战略偏弱，仓位封顶 50%'); }
    sum.confidence=Math.min(sum.confidence,60);
  } else if (v.good){
    if (!isBO){
      sum.position=Math.min(100, Math.round(sum.position*1.2));
      w.push('战略优秀（夏普 '+v.sharpe.toFixed(2)+' / 卡玛 '+v.calmar.toFixed(2)+'），仓位放大 20%');
    }
  }
  var sig=sum.overall;
  var conflict = (['买入','强力买入'].indexOf(sig)>=0 && v.bad) || (['卖出','强力卖出'].indexOf(sig)>=0 && v.good);
  if (conflict && !isBO){
    sum.confidence=Math.min(sum.confidence,30);
    w.push('短期信号「'+sig+'」与长期战略'+(v.bad?'差':'好')+'冲突，置信度 ≤ 30%');
  }
  if (v.pf!=null && v.pf<1 && ['买入','强力买入','左侧试探'].indexOf(sig)>=0 && !isBO){
    sum.position=Math.min(sum.position,25);
    w.push('盈利因子 '+v.pf.toFixed(2)+' < 1，买入仓位封顶 25%');
  }
  if (sum.trendStrength>70 && sig.indexOf('买入')>=0){
    sum.position=Math.min(100, sum.position*1.2);
    sum.confidence=Math.min(100, sum.confidence+10);
    w.push('强趋势（'+sum.trend+'）加成，仓位+20%');
  }
  if (sum.trendStrength<30 && sig.indexOf('卖出')>=0){
    sum.position=Math.min(80, sum.position*1.2);
    w.push('弱趋势（'+sum.trend+'）强化空头');
  }
  if (sum.bollInfo && sum.bollInfo.isContracting && Math.abs(sum.bollInfo.position-0.5)<0.1){
    sum.position=Math.min(30, sum.position*0.5);
    sum.confidence=Math.min(40, sum.confidence);
    w.push('布林收口中轨，震荡市减仓至 '+sum.position+'%');
  }
  sum.quantWarnings=w;
  sum.quantMetrics=qm;
  sum.quantChanged = sum.position!==orig.position || sum.confidence!==orig.confidence;
  return sum;
}

/* ================================================================
 * 量化诊断
 * ================================================================ */
function computeQuantMetrics(data, sum){
  if (!data||data.length<20) return null;
  var closes=data.map(function(d){return d.close;});
  var returns=_returns(closes);
  var annRet=annualReturn(returns);
  var vol=volatility(returns);
  var sharpe=sharpeRatio(returns);
  var sortino=sortinoRatio(returns);
  var mdd=maxDrawdown(closes);
  var calmar=calmarRatio(returns,closes);
  var ts=trendStrength(closes);
  var beta=null, alpha=null, ir=null, corr=null;
  if (window.__marketCloses && window.__marketCloses.length>30){
    var mR=[];
    for (var mi=1;mi<window.__marketCloses.length;mi++) mR.push((window.__marketCloses[mi]-window.__marketCloses[mi-1])/window.__marketCloses[mi-1]);
    var len=Math.min(returns.length, mR.length);
    var sR=returns.slice(-len), mr=mR.slice(-len);
    beta=betaToMarket(sR,mr); alpha=alphaToMarket(sR,mr)*252; ir=informationRatio(sR,mr); corr=correlation(sR,mr);
  }
  var pf=null;
  if (returns.length>20){
    var wS=0, wN=0, lS=0, lN=0;
    for (var pi=0;pi<returns.length;pi++){
      if (returns[pi]>0){ wS+=returns[pi]; wN++; }
      else if (returns[pi]<0){ lS+=Math.abs(returns[pi]); lN++; }
    }
    var avgW=wN?wS/wN:0, avgL=lN?lS/lN:0;
    pf = avgL>0 ? avgW/avgL : (avgW>0?99:0);
  }
  var sv={
    good: sharpe>=1 && calmar>=1 && sortino>=0.8,
    ok:   sharpe>=0.5 && calmar>=0.5,
    weak: sharpe<0.5 && sharpe>=0,
    bad:  sharpe<0 || mdd.value>0.25 || (ir!=null && ir<-0.5),
    pf:pf, sharpe:sharpe, sortino:sortino, calmar:calmar, mdd:mdd.value, vol:vol,
    annRet:annRet, ts:ts, beta:beta, alpha:alpha, ir:ir, corr:corr
  };
  return { annRet:annRet, vol:vol, sharpe:sharpe, sortino:sortino, mdd:mdd, calmar:calmar, pf:pf, ts:ts, beta:beta, alpha:alpha, ir:ir, corr:corr, strategicVerdict:sv };
}

function renderQuantMetrics(data, sum){
  if (!data||data.length<20) return;
  var closes=data.map(function(d){return d.close;});
  var qm=computeQuantMetrics(data,sum);
  if (!qm) return;
  var annRet=qm.annRet, vol=qm.vol, sharpe=qm.sharpe, mdd=qm.mdd, calmar=qm.calmar, pf=qm.pf, sortino=qm.sortino;
  function set(id,val,cls){
    var el=document.getElementById(id);
    if (el){ el.textContent=val; el.className='pv'+(cls?' '+cls:''); }
  }
  function setD(id,val){ var el=document.getElementById(id); if (el) el.textContent=val; }
  set('q-annRet', (annRet*100).toFixed(2)+'%', annRet>0?'good':'bad');
  set('q-vol', (vol*100).toFixed(2)+'%', vol>0.3?'bad':(vol>0.2?'warn':'good'));
  set('q-sharpe', sharpe.toFixed(2), sharpe>=1?'good':(sharpe>=0?'warn':'bad'));
  set('q-mdd', (mdd.value*100).toFixed(2)+'%', mdd.value>0.2?'bad':(mdd.value>0.1?'warn':'good'));
  set('q-calmar', calmar.toFixed(2), calmar>=1?'good':(calmar>=0?'warn':'bad'));
  set('q-pf', pf==null?'—':pf.toFixed(2), pf==null?'':pf>=1.5?'good':(pf>=1?'warn':'bad'));
  setD('q-annRet-d', data.length+' 个交易日');
  setD('q-vol-d', '年化标准差');
  setD('q-sharpe-d', sharpe>=1?'✓ 优秀':(sharpe>=0.5?'○ 良好':(sharpe>=0?'△ 一般':'✗ 需改进')));
  setD('q-mdd-d', mdd.peakIdx<mdd.troughIdx?('从 '+data[mdd.peakIdx].date+' 起'):'—');
  setD('q-calmar-d', '收益/回撤');
  setD('q-pf-d', pf==null?'样本不足':(pf>=1.5?'✓ 正期望':(pf>=1?'○ 略正':'✗ 负期望')));
  set('q-sortino', sortino.toFixed(2), sortino>=1.5?'good':(sortino>=0.5?'warn':'bad'));
  setD('q-sortino-d', sortino>=1.5?'✓ 优秀':(sortino>=0.5?'○ 良好':'△ 一般'));
  if (window.__marketCloses){
    var mR=[];
    for (var mi=1;mi<window.__marketCloses.length;mi++) mR.push((window.__marketCloses[mi]-window.__marketCloses[mi-1])/window.__marketCloses[mi-1]);
    var returns=[];
    for (var ri=1;ri<closes.length;ri++) returns.push((closes[ri]-closes[ri-1])/closes[ri-1]);
    var len=Math.min(returns.length, mR.length);
    var sR=returns.slice(-len), mr=mR.slice(-len);
    var beta=betaToMarket(sR,mr), alpha=alphaToMarket(sR,mr)*252;
    set('q-beta', beta.toFixed(2)+' / '+(alpha*100).toFixed(1)+'%', Math.abs(beta-1)<0.3?'':((beta>1.3||beta<0.7)?'warn':''));
    setD('q-beta-d', 'β'+(beta>1.3?'高波动':(beta<0.7?'独立行情':'正常')));
    var ir=informationRatio(sR,mr);
    set('q-ir', ir.toFixed(2), ir>=0.5?'good':(ir>=0?'warn':'bad'));
    setD('q-ir-d', ir>=1?'✓ 优秀':(ir>=0.5?'○ 良好':'△ 一般'));
  } else {
    set('q-beta','—',''); setD('q-beta-d','需大盘数据');
    set('q-ir','—',''); setD('q-ir-d','需大盘数据');
  }
  var ts=trendStrength(closes);
  set('q-trend', ts.toFixed(0), ts>=60?'good':(ts>=30?'warn':'bad'));
  setD('q-trend-d', ts>=60?'强趋势':(ts>=30?'中等趋势':'震荡'));
  var summary=document.getElementById('quantSummary');
  if (summary){
    var txt='';
    if (sharpe>=1) txt+='<b>夏普 ≥ 1</b>，策略风险调整后收益优秀。';
    else if (sharpe>=0.5) txt+='<b>夏普 0.5~1</b>，策略表现良好。';
    else if (sharpe>=0) txt+='<b>夏普 0~0.5</b>，策略勉强正收益，需谨慎。';
    else txt+='<b style="color:var(--up)">夏普 < 0</b>，策略长期负收益，不建议使用。';
    if (mdd.value>0.2) txt+=' 最大回撤超过 20%，风险较高。';
    else if (mdd.value<0.1) txt+=' 最大回撤 < 10%，回撤控制优秀。';
    if (pf!=null && pf<1) txt+=' <b style="color:var(--up)">盈利因子 &lt; 1</b>，长期负期望，建议优化策略。';
    summary.innerHTML='📊 <b>综合评语：</b>'+txt;
  }
}

/* ================================================================
 * 渲染（用 DOM 构造，不依赖 innerHTML 模板）
 * ================================================================ */
function el(tag, attrs, children){
  var e=document.createElement(tag);
  if (attrs){
    for (var k in attrs){
      if (k==='class') e.className=attrs[k];
      else if (k==='style') e.style.cssText=attrs[k];
      else if (k==='text') e.textContent=attrs[k];
      else if (k==='html') e.innerHTML=attrs[k];
      else if (k==='onclick') e.onclick=attrs[k];
      else if (k.indexOf('data-')===0) e.setAttribute(k, attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
  }
  if (children){
    if (children instanceof Array){
      for (var i=0;i<children.length;i++){
        if (children[i]) e.appendChild(typeof children[i]==='string'?document.createTextNode(children[i]):children[i]);
      }
    } else if (typeof children==='string'){
      e.appendChild(document.createTextNode(children));
    } else e.appendChild(children);
  }
  return e;
}

function signalPillClass(overall){
  if (overall==='强力买入'||overall==='买入'||overall==='左侧试探'||overall==='超卖区') return 'up';
  if (overall==='强力卖出'||overall==='卖出'||overall==='高空防守') return 'dn';
  return 'neutral';
}
function fmt(v,d){
  if (d===undefined) d=2;
  if (v==null||isNaN(v)) return '—';
  return Number(v).toFixed(d);
}
function fmtPct(v,d){
  if (d===undefined) d=2;
  if (v==null||isNaN(v)) return '—';
  return (v*100).toFixed(d)+'%';
}
function fmtPrice(v){
  if (v==null||isNaN(v)) return '—';
  return Number(v).toFixed(2);
}

function makeIndRow(name, value, signal){
  var cls='neutral';
  var buySigs=['买入','超卖','资金流入','放量','强趋势','强多头','多头','温和上行','放量突破','放量上涨','中等波动'];
  var sellSigs=['卖出','超买','资金流出','缩量','强空头','空头','量价背离','量价滞涨'];
  var warnSigs=['超买区','超卖区','无趋势'];
  if (buySigs.indexOf(signal)>=0) cls='buy';
  else if (sellSigs.indexOf(signal)>=0) cls='sell';
  else if (warnSigs.indexOf(signal)>=0) cls='warn';
  return el('div',{class:'ind'},[
    el('span',{class:'n',text:name}),
    el('span',{class:'v',text:value}),
    el('span',{class:'s '+cls,text:signal})
  ]);
}

function renderPage(data, sum, pivots, currentPrice, change, changePct){
  var code=getCodeFromURL();
  var name=findName(code);
  var type=getTypeByCode(code);
  var changeCls=change>=0?'up':'dn';
  var sign=change>=0?'+':'';
  var sigClass=signalPillClass(sum.overall);
  var overallColor = sigClass==='up'?'var(--up)':(sigClass==='dn'?'var(--dn)':'var(--muted)');

  var qm=computeQuantMetrics(data,sum) || { strategicVerdict:{sharpe:0,calmar:0,pf:null,mdd:0,ir:null,good:false,bad:true,weak:true} };
  applyQuantToSignal(sum, qm);
  var v=qm.strategicVerdict;

  var root=document.getElementById('root');
  root.innerHTML='';

  // top
  var top=el('div',{class:'top fadein'},[
    el('div',{class:'name'},[
      el('span',{id:'nameText',class:'editable',contenteditable:'true',text:name}),
      el('span',{class:'code',text:code.toUpperCase()+typeLabel(type)})
    ]),
    el('div',{class:'actions'},[
      el('button',{class:'btn',id:'btnRisk',text:'风控'}),
      el('button',{class:'btn',id:'btnRefresh',text:'刷新'})
    ])
  ]);
  root.appendChild(top);

  // 主信号卡
  var qw=sum.quantWarnings || [];
  var qwDiv=null;
  if (qw.length){
    qwDiv=el('div',{class:'warns'});
    for (var qi=0;qi<qw.length;qi++) qwDiv.appendChild(el('div',{text:qw[qi]}));
  }
  var main=el('div',{class:'card fadein'},[
    el('div',{class:'priceRow'},[
      el('div',{class:'price',style:'color:'+overallColor,text:fmtPrice(currentPrice)}),
      el('div',{class:'change '+changeCls,text:sign+fmtPrice(change)+' ('+sign+fmt(changePct,2)+'%)'}),
      el('div',{style:'margin-left:auto'},[el('span',{class:'pill '+sigClass,text:sum.overall})])
    ]),
    el('div',{class:'kv'},[
      kvCell('建议仓位', sum.position+'%', sum.position),
      kvCell('置信度', sum.confidence+'%', sum.confidence, 'linear-gradient(90deg,#22c55e,#5b8cff)'),
      kvCell('综合分', String(sum.netScore), null, null, '趋势强度 '+sum.trendStrength),
      kvCell('量价', sum.vpLabel, sum.vpScore>=0.8?'good':(sum.vpDivergence?'bad':(sum.vpScore>=0.3?'warn':'neutral')), null, 'vp '+sum.vpScore.toFixed(2))
    ]),
    el('div',{style:'margin-top:10px;font-size:13px;color:var(--muted)',text:sum.action})
  ]);
  if (qwDiv) main.appendChild(qwDiv);
  root.appendChild(main);

  // 图表
  var chartCard=el('div',{class:'card fadein'},[
    el('div',{class:'hd'},[
      el('h3',{text:'K线 · 均线 · 布林'}),
      (function(){
        var tools=el('div',{class:'chartTools',id:'chartTools'});
        var segs=[['all','全显',true],['ma','均线',false],['boll','布林',false],['none','纯净',false]];
        for (var si=0;si<segs.length;si++){
          (function(s){
            var b=el('button',{class:'seg'+(s[2]?' on':''),'data-overlay':s[0],text:s[1]});
            b.onclick=function(){
              var kids=tools.children;
              for (var k=0;k<kids.length;k++) kids[k].classList.remove('on');
              b.classList.add('on');
              drawChart(data, code, s[0]);
            };
            tools.appendChild(b);
          })(segs[si]);
        }
        return tools;
      })()
    ]),
    el('div',{class:'chartWrap'},[el('canvas',{id:'chart'})])
  ]);
  root.appendChild(chartCard);

  // TP / SL
  var tp=sum.tpSl;
  var tps=tp.takeProfitLevels||[];
  var tpRow=el('div',{class:'tpRow'},[
    el('div',{class:'tpBox'},[
      el('div',{class:'lbl',text:'止损位'}),
      el('div',{class:'pv dn',text:fmtPrice(tp.stopLoss)}),
      el('div',{class:'ratio',text:'ATR '+fmtPrice(tp.atr)+' · '+(tp.atrPct*100).toFixed(2)+'%'})
    ])
  ]);
  for (var ti=0;ti<tps.length;ti++){
    tpRow.appendChild(el('div',{class:'tpBox'},[
      el('div',{class:'lbl',text:tps[ti].label}),
      el('div',{class:'pv',text:fmtPrice(tps[ti].price)}),
      el('div',{class:'ratio',text:'仓位 '+Math.round(tps[ti].ratio*100)+'%'})
    ]));
  }
  var tpslCard=el('div',{class:'card fadein'},[
    el('div',{class:'hd'},[
      el('h3',{text:'止盈 / 止损'}),
      el('span',{class:'pill '+(v.bad?'warn':(v.good?'good':'neutral')),text:v.bad?'战略偏弱':(v.good?'战略优秀':'战略一般')})
    ]),
    tpRow,
    el('div',{style:'margin-top:10px;font-size:12px;color:var(--muted)',text:'移动止盈：触发 '+fmtPrice(tp.trailingStop.trigger)+'，步长 '+fmtPrice(tp.trailingStop.step)+'；支撑 S1 '+fmtPrice(tp.s1)+'，阻力 R1 '+fmtPrice(tp.r1)+' / R2 '+fmtPrice(tp.r2)})
  ]);
  root.appendChild(tpslCard);

  // 指标状态
  function indGroup(title, arr){
    var box=el('div',{},[el('div',{class:'seg-title',text:title})]);
    if (!arr||!arr.length){ box.appendChild(el('div',{class:'k',text:'—'})); return box; }
    for (var i=0;i<arr.length;i++) box.appendChild(makeIndRow(arr[i].name, fmt(arr[i].value,2), arr[i].signal));
    return box;
  }
  var indCard=el('div',{class:'card fadein'},[
    el('div',{class:'hd'},[
      el('h3',{text:'指标状态'}),
      el('span',{class:'pill neutral',text:'买 '+sum.buyScore+' · 卖 '+sum.sellScore})
    ]),
    el('div',{class:'row2'},[ indGroup('趋势', sum.trendGroup), indGroup('动量', sum.momentumGroup) ]),
    el('div',{class:'row2',style:'margin-top:8px'},[ indGroup('波动', sum.volaGroup), indGroup('量能', sum.volGroup) ])
  ]);
  root.appendChild(indCard);

  // 量化诊断
  var qvClass=v.good?'good':(v.bad?'bad':'warn');
  var qvText=v.good?'战略好':(v.bad?'战略差':(v.weak?'战略弱':'战略可'));
  var quantCard=el('div',{class:'card fadein'},[
    el('div',{class:'hd'},[
      el('h3',{text:'量化诊断'}),
      el('span',{class:'pill '+qvClass,text:qvText})
    ]),
    el('div',{class:'row3'},[
      qCell('q-annRet','年化收益','q-annRet-d'),
      qCell('q-vol','年化波动','q-vol-d'),
      qCell('q-sharpe','夏普比率','q-sharpe-d')
    ]),
    el('div',{class:'row3',style:'margin-top:8px'},[
      qCell('q-mdd','最大回撤','q-mdd-d'),
      qCell('q-calmar','卡玛比率','q-calmar-d'),
      qCell('q-pf','盈利因子','q-pf-d')
    ]),
    el('div',{class:'row3',style:'margin-top:8px'},[
      qCell('q-sortino','索提诺','q-sortino-d'),
      qCell('q-beta','β / α','q-beta-d'),
      qCell('q-ir','信息比率','q-ir-d')
    ]),
    el('div',{class:'row3',style:'margin-top:8px'},[
      qCell('q-trend','趋势强度','q-trend-d'),
      el('div',{class:'tpBox',style:'grid-column:span 2'},[
        el('div',{class:'lbl',text:'策略回测'}),
        el('div',{class:'pv',style:'font-size:14px',text:'样本 '+sum.backtest.buySamples+' · 胜率 '+(sum.backtest.buyWinRate*100).toFixed(1)+'% · 期望 '+(sum.backtest.buyAvgRet*100).toFixed(2)+'%'}),
        el('div',{class:'ratio',text:'近 60 日 / 持有 5 日'})
      ])
    ]),
    el('div',{class:'warns',id:'quantSummary',style:'margin-top:10px',text:'计算中…'})
  ]);
  root.appendChild(quantCard);

  // 风控参数
  var riskKey='risk_v1_'+code;
  var risk=JSON.parse(localStorage.getItem(riskKey)||'{}');
  var riskCard=el('div',{class:'card fadein',style:'text-align:center;color:var(--muted);font-size:12px',text:'风险参数：单笔最大亏损 '+(risk.maxLoss||2)+'% · 单只最大持仓 '+(risk.maxPos||30)+'% · 回撤熔断 '+(risk.circuit||15)+'%'});
  root.appendChild(riskCard);

  bindNameEditor();
  drawChart(data, code, 'all');
  renderQuantMetrics(data, sum);

  document.getElementById('btnRisk').onclick=openRiskModal;
  document.getElementById('btnRefresh').onclick=function(){
    var btn=this; btn.disabled=true; btn.textContent='刷新中…';
    initStock(code, true).then(function(){ toast('已刷新'); btn.disabled=false; btn.textContent='刷新'; }).catch(function(e){ toast('失败: '+e.message); btn.disabled=false; btn.textContent='刷新'; });
  };
}
function kvCell(k,v,bar,barGrad,extra){
  var cell=el('div',{},[
    el('div',{class:'k',text:k}),
    el('div',{class:'v',text:String(v)})
  ]);
  if (bar!=null){
    var i=el('i',{style:'width:'+bar+'%;'+(barGrad?'background:'+barGrad:'')});
    cell.appendChild(el('div',{class:'posBar'},[i]));
  }
  if (extra) cell.appendChild(el('div',{class:'k',style:'margin-top:4px',text:extra}));
  return cell;
}
function qCell(id,label,dId){
  return el('div',{class:'tpBox'},[
    el('div',{class:'lbl',text:label}),
    el('div',{id:id,class:'pv',text:'—'}),
    el('div',{class:'ratio',id:dId})
  ]);
}

/* ===== Canvas K 线图 ===== */
function drawChart(data, code, overlay){
  var canvas=document.getElementById('chart');
  if (!canvas||!data||!data.length) return;
  var wrap=canvas.parentElement;
  var dpr=window.devicePixelRatio||1;
  var w=wrap.clientWidth, h=wrap.clientHeight||280;
  canvas.width=w*dpr; canvas.height=h*dpr;
  canvas.style.width=w+'px'; canvas.style.height=h+'px';
  var ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);

  var view=data.slice(-60);
  var n=view.length;
  if (n<2) return;
  var closes=view.map(function(d){return d.close;});
  var highs=view.map(function(d){return d.high;});
  var lows=view.map(function(d){return d.low;});
  var opens=view.map(function(d){return d.open;});
  var vols=view.map(function(d){return d.volume;});

  function MA(arr, p){
    var out=[];
    for (var i=0;i<arr.length;i++){
      if (i<p-1){ out.push(null); continue; }
      var s=0; for (var j=i-p+1;j<=i;j++) s+=arr[j];
      out.push(s/p);
    }
    return out;
  }
  var ma5=MA(closes,5), ma10=MA(closes,10), ma20=MA(closes,20);
  var bollU=[], bollL=[], bollM=[];
  for (var bi=0;bi<closes.length;bi++){
    if (bi<19){ bollU.push(null); bollL.push(null); bollM.push(null); continue; }
    var s=closes.slice(bi-19, bi+1);
    var m=0; for (var bj=0;bj<s.length;bj++) m+=s[bj];
    m/=20;
    var sd=0; for (var bk=0;bk<s.length;bk++) sd+=(s[bk]-m)*(s[bk]-m);
    sd=Math.sqrt(sd/20);
    bollM.push(m); bollU.push(m+2*sd); bollL.push(m-2*sd);
  }

  var allHi=-Infinity, allLo=Infinity;
  for (var hi=0;hi<highs.length;hi++) if (highs[hi]>allHi) allHi=highs[hi];
  for (var li=0;li<lows.length;li++) if (lows[li]<allLo) allLo=lows[li];
  for (var bhi=0;bhi<bollU.length;bhi++) if (bollU[bhi]!=null && bollU[bhi]>allHi) allHi=bollU[bhi];
  for (var bli=0;bli<bollL.length;bli++) if (bollL[bli]!=null && bollL[bli]<allLo) allLo=bollL[bli];
  for (var mi2=0;mi2<ma20.length;mi2++) if (ma20[mi2]!=null){ if (ma20[mi2]>allHi) allHi=ma20[mi2]; if (ma20[mi2]<allLo) allLo=ma20[mi2]; }
  var pad=(allHi-allLo)*0.05;
  var yMax=allHi+pad, yMin=allLo-pad;
  if (yMax===yMin){ yMax+=1; yMin-=1; }

  var padL=6, padR=50, padT=8, padB=36;
  var plotW=w-padL-padR;
  var plotH=(h-padT-padB)*0.72;
  var volH=(h-padT-padB)*0.22;
  var volTop=padT+plotH+6;
  var barW=plotW/n;
  function xAt(i){ return padL + i*barW + barW/2; }
  function yAt(v){ return padT + (1-(v-yMin)/(yMax-yMin))*plotH; }
  var maxVol=1;
  for (var vi=0;vi<vols.length;vi++) if (vols[vi]>maxVol) maxVol=vols[vi];
  function yVol(v){ return volTop + (1-v/maxVol)*volH; }

  ctx.strokeStyle='rgba(138,147,182,0.12)';
  ctx.lineWidth=1;
  ctx.fillStyle='rgba(138,147,182,0.5)';
  ctx.font='10px -apple-system,sans-serif';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  for (var g=0;g<=4;g++){
    var y=padT+(plotH*g)/4;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+plotW,y); ctx.stroke();
    var val=yMax-(yMax-yMin)*(g/4);
    ctx.fillText(val.toFixed(2), w-4, y);
  }

  function drawLine(arr, color, dash){
    ctx.strokeStyle=color;
    if (dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
    ctx.lineWidth=1.2;
    ctx.beginPath();
    var started=false;
    for (var li=0;li<arr.length;li++){
      if (arr[li]==null) continue;
      if (!started){ ctx.moveTo(xAt(li), yAt(arr[li])); started=true; }
      else ctx.lineTo(xAt(li), yAt(arr[li]));
    }
    ctx.stroke();
  }
  if (overlay==='all' || overlay==='boll'){
    drawLine(bollU, 'rgba(124,91,255,0.35)', [3,3]);
    drawLine(bollL, 'rgba(124,91,255,0.35)', [3,3]);
    drawLine(bollM, 'rgba(124,91,255,0.6)', null);
  }

  for (var ki=0;ki<n;ki++){
    var x=xAt(ki);
    var yH=yAt(highs[ki]), yL=yAt(lows[ki]);
    var yO=yAt(opens[ki]), yC=yAt(closes[ki]);
    var up=closes[ki]>=opens[ki];
    ctx.strokeStyle = up ? '#ef4444' : '#10b981';
    ctx.fillStyle   = up ? '#ef4444' : '#10b981';
    ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, yL); ctx.stroke();
    var top=Math.min(yO,yC), bh=Math.max(1, Math.abs(yO-yC));
    ctx.fillRect(x-barW*0.32, top, barW*0.64, bh);
  }

  if (overlay==='all' || overlay==='ma'){
    drawLine(ma5, '#fbbf24', null);
    drawLine(ma10, '#60a5fa', null);
    drawLine(ma20, '#a78bfa', null);
  }

  for (var vj=0;vj<n;vj++){
    var x=xAt(vj);
    var up=closes[vj]>=opens[vj];
    ctx.fillStyle = up ? 'rgba(239,68,68,0.6)' : 'rgba(16,185,129,0.6)';
    var yv=yVol(vols[vj]);
    ctx.fillRect(x-barW*0.3, yv, barW*0.6, volTop+volH-yv);
  }

  ctx.fillStyle='rgba(138,147,182,0.6)';
  ctx.textAlign='center'; ctx.textBaseline='top';
  for (var si=0;si<=4;si++){
    var idx=Math.floor((n-1)*(si/4));
    ctx.fillText((view[idx].date||'').slice(5), xAt(idx), volTop+volH+6);
  }
}

function bindNameEditor(){
  var e=document.getElementById('nameText');
  if (!e) return;
  var code=getCodeFromURL();
  e.addEventListener('blur', function(){
    var v=(e.textContent||'').trim();
    if (v && v!==findName(code)){ updateName(code, v); toast('已保存名称'); }
  });
  e.addEventListener('keydown', function(ev){
    if (ev.key==='Enter'){ ev.preventDefault(); e.blur(); }
  });
}

/* ===== 风控弹层 ===== */
var RISK_DEFAULTS={ maxLoss:2, maxPos:30, circuit:15, atrMult:2.0, trailTrig:2.0, trailStep:1.5 };
var RISK_PRESETS={
  conservative:{ maxLoss:1.5, maxPos:20, circuit:10, atrMult:1.5, trailTrig:2.5, trailStep:1.0 },
  balanced:    { maxLoss:2,   maxPos:30, circuit:15, atrMult:2.0, trailTrig:2.0, trailStep:1.5 },
  aggressive:  { maxLoss:3,   maxPos:50, circuit:25, atrMult:2.5, trailTrig:1.5, trailStep:2.0 }
};
function openRiskModal(){
  var code=getCodeFromURL();
  var r=JSON.parse(localStorage.getItem('risk_v1_'+code)||'null') || Object.assign({}, RISK_DEFAULTS);
  document.getElementById('rMaxLoss').value=r.maxLoss;
  document.getElementById('rMaxPos').value=r.maxPos;
  document.getElementById('rCircuit').value=r.circuit;
  document.getElementById('rAtrMult').value=r.atrMult;
  document.getElementById('rTrailTrig').value=r.trailTrig;
  document.getElementById('rTrailTrig2').value=r.trailStep;
  document.getElementById('riskScope').textContent='单只 · '+(code||'').toUpperCase();
  document.getElementById('riskModal').classList.add('show');
}
function closeRiskModal(){ document.getElementById('riskModal').classList.remove('show'); }

function bindRiskEvents(){
  var c=document.getElementById('riskClose');
  if (c) c.onclick=closeRiskModal;
  var cc=document.getElementById('riskCancel');
  if (cc) cc.onclick=closeRiskModal;
  var presetBtns=document.querySelectorAll('.preset-btn');
  for (var i=0;i<presetBtns.length;i++){
    (function(btn){
      btn.onclick=function(){
        var p=RISK_PRESETS[btn.dataset.preset];
        if (!p) return;
        document.getElementById('rMaxLoss').value=p.maxLoss;
        document.getElementById('rMaxPos').value=p.maxPos;
        document.getElementById('rCircuit').value=p.circuit;
        document.getElementById('rAtrMult').value=p.atrMult;
        document.getElementById('rTrailTrig').value=p.trailTrig;
        document.getElementById('rTrailTrig2').value=p.trailStep;
      };
    })(presetBtns[i]);
  }
  var rr=document.getElementById('riskReset');
  if (rr) rr.onclick=function(){
    document.getElementById('rMaxLoss').value=RISK_DEFAULTS.maxLoss;
    document.getElementById('rMaxPos').value=RISK_DEFAULTS.maxPos;
    document.getElementById('rCircuit').value=RISK_DEFAULTS.circuit;
    document.getElementById('rAtrMult').value=RISK_DEFAULTS.atrMult;
    document.getElementById('rTrailTrig').value=RISK_DEFAULTS.trailTrig;
    document.getElementById('rTrailTrig2').value=RISK_DEFAULTS.trailStep;
  };
  var rs=document.getElementById('riskSave');
  if (rs) rs.onclick=function(){
    var code=getCodeFromURL();
    var r={
      maxLoss: +document.getElementById('rMaxLoss').value || RISK_DEFAULTS.maxLoss,
      maxPos:  +document.getElementById('rMaxPos').value  || RISK_DEFAULTS.maxPos,
      circuit: +document.getElementById('rCircuit').value || RISK_DEFAULTS.circuit,
      atrMult: +document.getElementById('rAtrMult').value || RISK_DEFAULTS.atrMult,
      trailTrig:+document.getElementById('rTrailTrig').value|| RISK_DEFAULTS.trailTrig,
      trailStep:+document.getElementById('rTrailTrig2').value|| RISK_DEFAULTS.trailStep
    };
    var scope=document.getElementById('rScope').value;
    if (scope==='all'){
      var list=loadStocks();
      for (var i=0;i<list.length;i++) localStorage.setItem('risk_v1_'+list[i].code, JSON.stringify(r));
    }
    localStorage.setItem('risk_v1_'+code, JSON.stringify(r));
    closeRiskModal();
    toast('风控参数已保存');
    initStock(code, true);
  };
}

/* ===== initStock ===== */
async function initStock(code, force){
  try {
    var data = force ? [] : HistoryTable.getRecent(code, 200);
    if (!data || data.length<30){
      data = await fetchKLine(code, 200);
      HistoryTable.saveRecent(code, data);
    } else {
      fetchKLine(code, 200).then(function(fresh){
        if (fresh && fresh.length) HistoryTable.saveRecent(code, fresh);
      }).catch(function(){});
    }
    if (!data || data.length<5) throw new Error('数据不足');

    if (!window.__marketCloses){
      try {
        var m = await fetchKLine('sh000001', 200);
        window.__marketCloses = m.map(function(d){return d.close;});
      } catch(e){ window.__marketCloses = null; }
    }

    var closes = data.map(function(d){return d.close;});
    var highs  = data.map(function(d){return d.high;});
    var lows   = data.map(function(d){return d.low;});
    var opens  = data.map(function(d){return d.open;});
    var vols   = data.map(function(d){return d.volume;});

    var last=data[data.length-1];
    var prev=data[data.length-2]||last;
    var change=last.close-prev.close;
    var changePct=prev.close?(change/prev.close)*100:0;

    var last20=data.slice(-20);
    var pH=-Infinity, pL=Infinity;
    for (var i=0;i<last20.length;i++){
      if (last20[i].high>pH) pH=last20[i].high;
      if (last20[i].low<pL) pL=last20[i].low;
    }
    var pivots=calcPivots(pH,pL,last.close);

    var sum=summarize(closes, highs, lows, opens, vols, pivots, null);

    var risk=JSON.parse(localStorage.getItem('risk_v1_'+code)||'null');
    if (risk && risk.maxPos){
      sum.position = Math.min(sum.position, risk.maxPos);
      sum.quantWarnings = (sum.quantWarnings||[]).concat(['🛡 应用风控：单只最大持仓 '+risk.maxPos+'%']);
    }

    renderPage(data, sum, pivots, last.close, change, changePct);
  } catch(e){
    showErr('initStock: '+(e.message||e));
    document.getElementById('root').innerHTML='';
    var empty=el('div',{class:'empty'},[
      el('div',{html:'<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>'}),
      el('div',{text:e.message||'加载失败'}),
      el('a',{href:'index.html',text:'返回列表'})
    ]);
    document.getElementById('root').appendChild(empty);
  }
}

/* ===== 启动 ===== */
var code=getCodeFromURL();
if (!code){
  var empty2=el('div',{class:'empty'},[
    el('div',{html:'<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>'}),
    el('div',{text:'缺少股票代码'}),
    el('a',{href:'index.html',text:'返回添加'})
  ]);
  document.getElementById('root').innerHTML='';
  document.getElementById('root').appendChild(empty2);
} else {
  initStock(code);
  bindRiskEvents();
}

var _rzT=null;
window.addEventListener('resize', function(){
  clearTimeout(_rzT);
  _rzT=setTimeout(function(){
    var canvas=document.getElementById('chart');
    if (canvas){
      var c2=getCodeFromURL();
      var d=HistoryTable.getRecent(c2, 200);
      var tools=document.getElementById('chartTools');
      var active=tools && tools.querySelector('.seg.on');
      drawChart(d, c2, active?active.dataset.overlay:'all');
    }
  }, 120);
});

console.log('📊 股票详情页（v2 重写）已启动 · code='+code);
//]]>

// 把所有关键函数挂到 window，确保任何执行上下文都能访问
['fetchKLine','fetchBasic','HistoryTable','summarize','applyQuantToSignal',
 'computeQuantMetrics','renderQuantMetrics','renderPage','drawChart',
 'bindNameEditor','openRiskModal','closeRiskModal','bindRiskEvents',
 'initStock','toast','findName','updateName','loadStocks','saveStocks',
 'loadPortfolio','savePortfolio','getTypeByCode','typeLabel',
 'calcPivots','maxDrawdown','volatility','sharpeRatio','sortinoRatio',
 'correlation','betaToMarket','alphaToMarket','informationRatio',
 'annualReturn','trendStrength','calmarRatio','_returns',
 '_calcRSI','_calcMACD','_calcKDJ','_calcCCI','_calcWR','_calcADX','_calcBOLL','_calcVR'
].forEach(function(n){
  try { if (typeof window[n]==='undefined' && typeof eval(n)!=='undefined') window[n]=eval(n); } catch(e){}
});
console.log('✓ 关键函数已暴露到 window');

</script>
</body>
</html>
closes = data.map(d => d.close);
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
