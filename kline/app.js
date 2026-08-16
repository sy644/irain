// ============================================================
// 组合止盈策略 · 优化版v7（完整替换版）
// 可直接覆盖原 simpleSignal 函数
// ============================================================
// 核心改进（vs v6）：
// 1. 趋势过滤建仓：要求 price > MA20 且 MA5 > MA20
// 2. 动态建仓门槛：高波动股(ATR%>3.5) score ≥ 3.5 才建仓
// 3. 波动率自适应仓位：低波动100% → 高波动30%
// 4. 分级移动止损：普通+2.0ATR / 强趋势+3.0ATR / 极强+4.0ATR
// 5. 自适应止损倍数：高波动放宽至 2.5~3.0 ATR
// 6. 交易冷却期：平仓后至少5日不建仓，避免频繁交易
// 7. 保留v6：趋势分级止盈 + 强趋势保留底仓 + 波动率自适应
// ============================================================

function simpleSignal_v7(closes, highs, lows) {
    if (closes.length < 20) {
        return { overall: '数据不足', action: 'K线不足，无法计算', position: 0, confidence: 0, tpSl: null, score: -999, trendOk: false };
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

    // =============================================================
    // v7 全新优化逻辑
    // =============================================================

    // 1. 趋势过滤：要求短期趋势向上才允许建仓
    const trendOk = price > ma20 && ma5 > ma20;

    // 2. 20日动量判断强弱趋势
    const momentum20 = (price - closes[Math.max(0, n - 21)]) / closes[Math.max(0, n - 21)];
    const atrPct = atr / price;
    const isStrongTrend = momentum20 > 0.10;
    const isVeryStrong = momentum20 > 0.15;

    // 3. 波动率自适应止损倍数
    let stopMult = 2.0;
    if (atrPct > 0.04) stopMult = 3.0;
    else if (atrPct > 0.035) stopMult = 2.5;

    const stopByATR = price - stopMult * atr;
    const stopByS1 = s1 || (price * 0.97);
    const stopLoss = Math.min(stopByATR, stopByS1, price * 0.95);

    // 4. 强弱趋势动态止盈倍数
    let mult1 = 1.0, mult2 = 2.0, mult3 = 3.5;
    if (isVeryStrong) {
        mult1 = 1.5; mult2 = 3.0; mult3 = 5.25;
    }

    // 5. 波动率自适应系数
    let volMult = 1.0;
    if (atrPct < 0.015) volMult = 1.5;
    else if (atrPct > 0.04) volMult = 0.8;

    // 6. 三级止盈价格
    const atr1 = price + mult1 * atr * volMult;
    const atr2 = price + mult2 * atr * volMult;
    const atr3 = price + mult3 * atr * volMult;

    // 7. 止盈减仓比例，强趋势第三档仅卖30%，留存底仓
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

    // 8. 分级移动止损：极强趋势更宽松
    let triggerMult = 2.0, stepMult = 2.0;
    if (isVeryStrong) {
        triggerMult = 4.0; stepMult = 3.0;
    } else if (isStrongTrend) {
        triggerMult = 3.0; stepMult = 3.0;
    }

    const trailingStop = {
        enabled: true,
        trigger: price + triggerMult * atr,
        step: stepMult * atr,
        currentStop: stopLoss
    };

    // 9. 波动率自适应仓位比例
    let positionPct = 1.0;
    if (atrPct < 0.015) positionPct = 1.0;
    else if (atrPct < 0.035) positionPct = 0.8;
    else if (atrPct < 0.05) positionPct = 0.5;
    else positionPct = 0.3;

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
        atrPct,
        positionPct,
        trendOk,
        stopMult,
        triggerMult,
        stepMult,
        note: '优化版v7：趋势过滤 + 分级移动止损 + 波动率仓位 + 自适应止损'
    };

    return { overall, action, position, confidence, tpSl, score, trendOk };
}


// ============================================================
// 持仓止盈执行配套逻辑（v7 版）
// ============================================================

/**
 * 止盈档位减仓逻辑，适配强趋势保留底仓
 * @param {Object} trade - 交易对象
 * @param {number} currentPrice - 当前价格
 * @param {string} currentDate - 当前日期
 * @returns {Object} 更新后的 trade 对象
 */
function calcSellShares_v7(trade, currentPrice, currentDate) {
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
// v7 建仓判断辅助函数
// ============================================================

/**
 * 判断是否允许建仓（v7 规则）
 * @param {Object} signal - simpleSignal_v7 返回的信号对象
 * @param {number} daysSinceLastExit - 距离上次平仓的天数
 * @param {number} cooldownDays - 冷却期天数（默认5）
 * @returns {boolean}
 */
function canOpenPosition_v7(signal, daysSinceLastExit, cooldownDays = 5) {
    if (!signal || !signal.tpSl) return false;

    // 冷却期检查
    if (daysSinceLastExit < cooldownDays) return false;

    // 趋势过滤
    if (!signal.trendOk) return false;

    // 动态门槛：高波动股要求更高评分
    const atrPct = signal.tpSl.atrPct || 0;
    const minScore = atrPct > 0.035 ? 3.5 : 2.0;

    return signal.score >= minScore;
}


// ============================================================
// 替换操作步骤
// ============================================================
// 1. 在 app.js 找到旧的 simpleSignal() 函数，完整删除
// 2. 粘贴上方 simpleSignal_v7 + calcSellShares_v7 + canOpenPosition_v7
// 3. 全局调用处把 simpleSignal() 改成 simpleSignal_v7()
// 4. 建仓判断处调用 canOpenPosition_v7(signal, daysSinceLastExit, 5)
// 5. 止盈判断处调用 calcSellShares_v7(trade, price, date)
//
// v7 关键改动（vs v6）：
// - 新增 trendOk 趋势过滤：price > MA20 且 MA5 > MA20 才允许建仓
// - 动态建仓门槛：ATR% > 3.5% 时 score 需 ≥ 3.5（过滤左侧试探）
// - 波动率自适应仓位：positionPct 字段，低波动100% / 高波动30%
// - 分级移动止损：极强趋势 trigger+4.0ATR/step-3.0ATR，强趋势+3.0ATR
// - 自适应止损倍数：高波动放宽至 2.5~3.0 ATR
// - 建议加入 5 日交易冷却期，避免平仓后立即追高
// ============================================================
