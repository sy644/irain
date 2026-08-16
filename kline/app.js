// ============================================================
// 组合止盈策略 · 优化版v6（完整替换版）
// 可直接覆盖原 simpleSignal 函数
// ============================================================
// 核心改进：
// 1. 趋势分级动态止盈（momentum20 + ATR%自适应）
// 2. 强趋势L3不清仓，保留10%趋势仓位
// 3. 移动止损放宽（触发+2.0ATR，跟踪-2.0ATR）
// 4. 波动率自适应（低波动×1.5，高波动×0.8）
// ============================================================

function simpleSignal_v6(closes, highs, lows) {
    if (closes.length < 20) {
        return { overall: '数据不足', action: 'K线不足，无法计算', position: 0, confidence: 0, tpSl: null };
    }
    const n = closes.length;
    const price = closes[n - 1];

    // ---- 趋势均线信号（保留原版计分逻辑） ----
    const ma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const ma60 = closes.length >= 60 ? closes.slice(-60).reduce((a, b) => a + b, 0) / 60 : ma20;
    const prev = closes[n - 2] || closes[n - 1];
    const changePct = (price - prev) / prev * 100;
    const pct5 = (price - closes[n - 5]) / closes[n - 5] * 100;

    let score = 0;
    if (price > ma5) score += 1.5; else score -= 1.5;
    if (price > ma20) score += 1.2; else score -= 1.2;
    if (price > ma60) score += 0.8; else score -= 0.8;
    if (ma5 > ma20) score += 0.5; else score -= 0.5;
    if (ma20 > ma60) score += 0.3; else score -= 0.3;
    if (changePct > 1) score += 0.5; else if (changePct < -1) score -= 0.5;
    if (pct5 > 3) score += 1; else if (pct5 < -3) score -= 1;

    // 信号判定、仓位、置信度（原版规则不变）
    let overall, action, position, confidence;
    if (score >= 5) { overall = '强力买入'; action = '强势突破，积极跟进'; position = 85; confidence = 90; }
    else if (score >= 3.5) { overall = '买入'; action = '趋势向好，分批建仓'; position = 65; confidence = 75; }
    else if (score >= 2) { overall = '左侧试探'; action = '底部区域，轻仓试水'; position = 35; confidence = 55; }
    else if (score >= 0.5) { overall = '超卖区'; action = '超跌反弹机会'; position = 20; confidence = 40; }
    else if (score >= -0.5) { overall = '观望'; action = '等待方向明朗'; position = 0; confidence = 30; }
    else if (score >= -2) { overall = '高空防守'; action = '高位滞涨，逐步减仓'; position = 25; confidence = 50; }
    else if (score >= -3.5) { overall = '卖出'; action = '趋势走弱，果断减仓'; position = 50; confidence = 70; }
    else { overall = '强力卖出'; action = '全面转空，清仓避险'; position = 75; confidence = 85; }

    // ---- ATR真实波幅计算（原版逻辑完整保留） ----
    let atr = price * 0.02;
    if (highs && lows && highs.length === closes.length) {
        const tr = [];
        for (let i = 1; i < closes.length; i++) {
            const hl = highs[i] - lows[i];
            const hc = Math.abs(highs[i] - closes[i - 1]);
            const lc = Math.abs(lows[i] - closes[i - 1]);
            tr.push(Math.max(hl, hc, lc));
        }
        const period = 14;
        if (tr.length >= period) {
            let atrVal = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
            for (let i = period; i < tr.length; i++) {
                atrVal = (atrVal * (period - 1) + tr[i]) / period;
            }
            if (atrVal > 0) atr = atrVal;
        }
    }

    // ---- 短期高低点、枢轴支撑阻力 ----
    const high = highs ? Math.max(...highs.slice(-20)) : price * 1.05;
    const low = lows ? Math.min(...lows.slice(-20)) : price * 0.95;
    const pp = (high + low + price) / 3;
    const s1 = 2 * pp - high;
    const r1 = 2 * pp - low;
    const r2 = pp + (high - low);

    // 基础止损位
    const stopByATR = price - 2 * atr;
    const stopByS1 = s1 || (price * 0.97);
    const stopLoss = Math.min(stopByATR, stopByS1, price * 0.95);

    // =============================================================
    // v6 全新优化逻辑（新增）
    // =============================================================
    // 1. 20日动量判断强弱趋势
    const momentum20 = (price - closes[Math.max(0, n - 21)]) / closes[Math.max(0, n - 21)];
    const atrPct = atr / price;
    const isStrongTrend = momentum20 > 0.10;
    const isVeryStrong = momentum20 > 0.15;

    // 2. 强弱趋势动态止盈倍数
    let mult1 = 1.0, mult2 = 2.0, mult3 = 3.5;
    if (isVeryStrong) {
        mult1 = 1.5; mult2 = 3.0; mult3 = 5.25;
    }

    // 3. 波动率自适应系数
    let volMult = 1.0;
    if (atrPct < 0.015) volMult = 1.5;
    else if (atrPct > 0.04) volMult = 0.8;

    // 4. 三级止盈价格
    const atr1 = price + mult1 * atr * volMult;
    const atr2 = price + mult2 * atr * volMult;
    const atr3 = price + mult3 * atr * volMult;

    // 5. 止盈减仓比例，强趋势第三档仅卖30%，留存底仓
    let l1Ratio = 0.30, l2Ratio = 0.30, l3Ratio = 0.40;
    if (isStrongTrend) {
        l3Ratio = 0.30;
    }

    // 组装止盈档位
    const takeProfitLevels = [
        { price: atr1, ratio: l1Ratio, label: `+${(mult1 * volMult).toFixed(2)}ATR(短线)` },
        { price: atr2, ratio: l2Ratio, label: `+${(mult2 * volMult).toFixed(2)}ATR(中线)` },
        { price: atr3, ratio: l3Ratio, label: `+${(mult3 * volMult).toFixed(2)}ATR(长线)` }
    ];

    // 6. 放宽移动止损触发与跟踪幅度
    const trailingStop = {
        enabled: true,
        trigger: price + 2.0 * atr,
        step: 2.0 * atr,
        currentStop: stopLoss
    };

    // 强趋势预留底仓比例
    const trendReserve = isStrongTrend ? 0.10 : 0.0;

    // 打包止盈止损全套参数
    const tpSl = {
        stopLoss,
        takeProfitLevels,
        trailingStop,
        atr,
        s1,
        r1,
        r2,
        hasR2: r2 && r2 > atr3,
        trendReserve,
        isStrongTrend,
        momentum20,
        note: '优化版v6：趋势分级止盈 + 利润奔跑 + 波动率自适应'
    };

    return { overall, action, position, confidence, tpSl };
}


// ============================================================
// 持仓止盈执行配套逻辑（放到持仓/交易结算代码处）
// ============================================================

/**
 * 止盈档位减仓逻辑，适配强趋势保留底仓
 * @param {Object} trade - 交易对象
 * @param {number} currentPrice - 当前价格
 * @param {string} currentDate - 当前日期
 * @returns {Object} 更新后的 trade 对象
 */
function calcSellShares(trade, currentPrice, currentDate) {
    const { initial_shares, remaining_shares, tpSl, levels_executed = {}, sell_records = [] } = trade;
    const targets = tpSl.takeProfitLevels;
    const levelMap = { L1: 0, L2: 1, L3: 2 };

    for (const levelKey of ['L1', 'L2', 'L3']) {
        const idx = levelMap[levelKey];
        if (levels_executed[levelKey]) continue;
        const target = targets[idx];
        if (currentPrice < target.price) continue;

        // 基础减仓比例
        let sellRatio = target.ratio;
        // L3长线档，强趋势只卖30%，留存10%底仓
        if (levelKey === 'L3' && tpSl.isStrongTrend) {
            sellRatio = 0.30;
        }

        const sellNum = Math.floor(initial_shares * sellRatio);
        const realSell = Math.min(sellNum, remaining_shares);
        if (realSell <= 0) continue;

        // 更新持仓数据
        trade.remaining_shares -= realSell;
        trade.levels_executed[levelKey] = true;
        trade.sell_records.push({
            date: currentDate,
            price: currentPrice,
            shares: realSell,
            reason: `止盈${levelKey}`
        });

        // 非L3或无趋势：清仓则标记平仓
        if (!(levelKey === 'L3' && tpSl.isStrongTrend) && trade.remaining_shares <= 0) {
            trade.exit_price = currentPrice;
            trade.exit_date = currentDate;
            trade.exit_reason = `止盈${levelKey}清仓`;
            trade.status = 'CLOSED';
        }
    }
    return trade;
}


// ============================================================
// 替换操作步骤
// ============================================================
// 1. 在 app.js 找到旧的 simpleSignal() 函数，完整删除旧函数全部代码
// 2. 复制上面整段代码粘贴到原函数位置
// 3. 全局调用处（计算信号、汇总sum的代码）把 simpleSignal() 改成 simpleSignal_v6()
// 4. 找到持仓交易结算逻辑，把 calcSellShares 函数粘贴到持仓模块，止盈判断处调用该方法
//
// 关键改动说明（和原版对比）：
// - 原有均线、ATR、枢轴、信号打分逻辑完全保留，不改动原有判断结果
// - 新增20日动量区分普通趋势/强趋势/极强趋势，动态放大止盈空间
// - 引入ATR波动率系数，震荡窄幅放大止盈、暴涨暴跌压缩止盈区间
// - 移动止损触发线、跟踪回撤从1.5ATR放宽至2ATR，减少过早被扫出场
// - 极强趋势第三止盈位仅卖出30%，强制保留10%底仓吃完整主升浪
// - tpSl 对象新增 trendReserve、isStrongTrend、momentum20 字段，页面面板可展示趋势标记
// - 配套减仓计算函数 calcSellShares，自动适配强趋势不清仓规则
// ============================================================
