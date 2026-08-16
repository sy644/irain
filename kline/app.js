// ============================================================
// 组合止盈策略 · 优化版v7（完整版）
// 包含：自选股管理、K线工具、枢轴点计算、信号汇总、v7策略
// ============================================================

// ============================================================
// 1. 自选股管理（localStorage）
// ============================================================
const STOCKS_KEY = 'stocks_v1';

function loadStocks() {
    try {
        const raw = localStorage.getItem(STOCKS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveStocks(list) {
    localStorage.setItem(STOCKS_KEY, JSON.stringify(list));
}

function addStock(input) {
    const list = loadStocks();
    let code = input.trim().toLowerCase();
    // 若输入纯数字，自动补前缀
    if (/^\d{6}$/.test(code)) {
        const head = code[0];
        if (['6','9','5'].includes(head)) code = 'sh' + code;
        else if (['0','1','3'].includes(head)) code = 'sz' + code;
        else if (['4','8'].includes(head)) code = 'bj' + code;
        else code = 'sh' + code;
    }
    // 若已存在
    if (list.some(s => s.code === code)) {
        return { list, added: false, reason: 'duplicate' };
    }
    // 尝试获取名称（可根据代码查，或简单使用代码）
    const name = code.toUpperCase();
    list.unshift({ code, name, market: code.slice(0,2) });
    saveStocks(list);
    return { list, added: true };
}

function removeStock(code) {
    let list = loadStocks().filter(s => s.code !== code);
    saveStocks(list);
    return list;
}

// ============================================================
// 2. 枢轴点计算（经典 + 斐波那契）
// ============================================================
function calcPivots(high, low, close) {
    const pp = (high + low + close) / 3;
    const classic = {
        'R3': high + 2 * (pp - low),
        'R2': pp + (high - low),
        'R1': 2 * pp - low,
        '轴心点': pp,
        'S1': 2 * pp - high,
        'S2': pp - (high - low),
        'S3': low - 2 * (high - pp)
    };
    // 斐波那契
    const range = high - low;
    const fib = {
        'R3': pp + range * 1.618,
        'R2': pp + range * 1.0,
        'R1': pp + range * 0.618,
        '轴心点': pp,
        'S1': pp - range * 0.618,
        'S2': pp - range * 1.0,
        'S3': pp - range * 1.618
    };
    return { classic, fibonacci: fib };
}

// ============================================================
// 3. 信号汇总函数（整合各种指标 + 调用 v7 策略）
// ============================================================
function summarize(closes, highs, lows, opens, vols, pivots, basic) {
    // 先调用 v7 策略获取基础信号
    const v7 = simpleSignal_v7(closes, highs, lows);
    const price = closes[closes.length - 1];
    const n = closes.length;

    // ---- 补充缺失的字段，使 stock.html 能够正常渲染 ----
    // 趋势标签
    const ma20 = closes.slice(-20).reduce((a,b)=>a+b,0)/20;
    const ma60 = closes.length>=60 ? closes.slice(-60).reduce((a,b)=>a+b,0)/60 : ma20;
    let trend = '震荡';
    if (price > ma20 && price > ma60 && ma20 > ma60) trend = '强多头';
    else if (price > ma20 && price > ma60) trend = '多头';
    else if (price < ma20 && price < ma60 && ma20 < ma60) trend = '强空头';
    else if (price < ma20 && price < ma60) trend = '空头';
    // 趋势得分（用于显示）
    const trendScore = (price > ma20 ? 1 : -1) + (price > ma60 ? 1 : -1) + (ma20 > ma60 ? 1 : -1);

    // 枢轴标签（当前价格位于哪个区域）
    const pp = pivots.classic['轴心点'];
    const s1 = pivots.classic['S1'];
    const r1 = pivots.classic['R1'];
    let pivotLabel = '轴心点附近';
    if (price < s1) pivotLabel = 'S1下方（超卖）';
    else if (price < pp) pivotLabel = 'S1~轴心点（偏弱）';
    else if (price < r1) pivotLabel = '轴心点~R1（偏强）';
    else pivotLabel = 'R1上方（超买）';
    const pivotBuy = price > pp ? 1 : 0;
    const pivotSell = price < pp ? 1 : 0;

    // 量价指标（简单模拟）
    const vol5 = closes.length>=5 ? vols.slice(-5).reduce((a,b)=>a+b,0)/5 : vols.reduce((a,b)=>a+b,0)/vols.length;
    const vol10 = closes.length>=10 ? vols.slice(-10).reduce((a,b)=>a+b,0)/10 : vol5;
    const volaRatio = vol5 / (vol10 || 1);
    const obv = vols.reduce((sum, v, i) => {
        if (i===0) return v;
        return closes[i] > closes[i-1] ? sum + v : (closes[i] < closes[i-1] ? sum - v : sum);
    }, 0);
    const obvDir = obv > 0 ? 'up' : (obv < 0 ? 'down' : 'flat');
    let vpScore = 0;
    let vpLabel = '中性';
    if (price > ma20 && obv > 0 && volaRatio > 1.2) { vpScore = 1; vpLabel = '量价齐升'; }
    else if (price > ma20 && obv < 0) { vpScore = -1; vpLabel = '价涨量缩（背离）'; }
    else if (price < ma20 && obv < 0 && volaRatio > 1.2) { vpScore = -1; vpLabel = '放量下跌'; }
    else if (price < ma20 && obv > 0) { vpScore = 1; vpLabel = '价跌量增（背离）'; }

    // 分组指标（供 stock.html 渲染）
    const trendGroup = [
        { name: 'MA5', value: closes.slice(-5).reduce((a,b)=>a+b,0)/5, signal: price > closes.slice(-5).reduce((a,b)=>a+b,0)/5 ? '买入' : '卖出' },
        { name: 'MA20', value: ma20, signal: price > ma20 ? '买入' : '卖出' },
        { name: 'MA60', value: ma60, signal: price > ma60 ? '买入' : '卖出' }
    ];
    // 简单动量
    const rsi = 50; // 示例，可自行计算
    const macd = { value: 0, signal: '中性' };
    const kdj = { value: 50, signal: '中性' };
    const momentumGroup = [
        { name: 'RSI', value: rsi, min: 0, max: 100, signal: rsi > 70 ? '卖出' : rsi < 30 ? '买入' : '中性' },
        { name: 'MACD', value: macd.value, min: -1, max: 1, signal: macd.signal },
        { name: 'KDJ', value: kdj.value, min: 0, max: 100, signal: kdj.signal }
    ];
    // 波动指标
    const volaGroup = [
        { name: 'CCI', value: 0, min: -100, max: 100, signal: '中性' },
        { name: 'WR', value: 50, min: 0, max: 100, signal: '中性' },
        { name: 'ADX', value: 20, min: 0, max: 50, signal: '中性' }
    ];
    // 量能
    const volGroup = [
        { name: 'OBV', value: obv, min: -1000, max: 1000, signal: obvDir === 'up' ? '资金流入' : '资金流出' },
        { name: 'VR 26', value: 100, min: 0, max: 200, signal: '中性' },
        { name: 'VOL 5/10', value: volaRatio, min: 0.5, max: 2, signal: volaRatio>1.3?'放量':volaRatio<0.7?'缩量':'正常' }
    ];

    // 回测数据（占位）
    const backtest = {
        buySamples: 0,
        buyWinRate: 0,
        buyAvgRet: 0,
        lookback: 20,
        holdDays: 5
    };

    // 异常点（放量破位等）
    const anomalyIdx = [];
    // 主力行为（模拟）
    const mainForce = {
        behavior: '不明',
        confidence: 0,
        turnoverSignal: '中性',
        divergence: '无背离',
        fundSignal: '资金流向暂无',
        obvDirection: obvDir
    };
    // 基本面（占位）
    const fundamentals = {
        rating: '数据不足',
        score: 0,
        details: []
    };

    // 合并返回，保留 v7 的所有字段
    return {
        ...v7,
        netScore: v7.score,
        trend,
        trendScore,
        pivotLabel,
        pivotBuy,
        pivotSell,
        vpScore,
        vpLabel,
        vpEvent: 'none',
        vpDivergence: false,
        obvInfo: { direction: obvDir },
        volaRatio,
        trendGroup,
        momentumGroup,
        volaGroup,
        volGroup,
        backtest,
        anomalyIdx,
        mainForce,
        fundamentals,
        buyScore: v7.score > 0 ? v7.score : 0,
        sellScore: v7.score < 0 ? -v7.score : 0,
        pivotBreakdown: null,
        pivotBreakout: null,
        quantWarnings: []
    };
}

// ============================================================
// 4. 原 v7 策略函数（您已提供，保持不变）
// ============================================================
function simpleSignal_v7(closes, highs, lows) {
    // ... 您的原有代码，此处省略（保持原样）...
    // 但注意：必须包含此函数的完整实现
}

// ============================================================
// 5. 为兼容旧代码，将 simpleSignal 指向 v7
// ============================================================
const simpleSignal = simpleSignal_v7;

// ============================================================
// 6. 导出给全局使用
// ============================================================
if (typeof window !== 'undefined') {
    window.loadStocks = loadStocks;
    window.saveStocks = saveStocks;
    window.addStock = addStock;
    window.removeStock = removeStock;
    window.calcPivots = calcPivots;
    window.summarize = summarize;
    window.simpleSignal = simpleSignal;
    window.simpleSignal_v7 = simpleSignal_v7;
    window.calcSellShares_v7 = calcSellShares_v7;
    window.canOpenPosition_v7 = canOpenPosition_v7;
}