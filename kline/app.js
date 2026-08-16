// ============================================================
// 组合止盈策略 · 优化版v6
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

    // ---- 趋势信号（保持原逻辑） ----
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

    let overall, action, position, confidence;
    if (score >= 5) { overall = '强力买入'; action = '强势突破，积极跟进'; position = 85; confidence = 90; }
    else if (score >= 3.5) { overall = '买入'; action = '趋势向好，分批建仓'; position = 65; confidence = 75; }
    else if (score >= 2) { overall = '左侧试探'; action = '底部区域，轻仓试水'; position = 35; confidence = 55; }
    else if (score >= 0.5) { overall = '超卖区'; action = '超跌反弹机会'; position = 20; confidence = 40; }
    else if (score >= -0.5) { overall = '观望'; action = '等待方向明朗'; position = 0; confidence = 30; }
    else if (score >= -2) { overall = '高空防守'; action = '高位滞涨，逐步减仓'; position = 25; confidence = 50; }
    else if (score >= -3.5) { overall = '卖出'; action = '趋势走弱，果断减仓'; position = 50; confidence = 70; }
    else { overall = '强力卖出'; action = '全面转空，清仓避险'; position = 75; confidence = 85; }

    // ---- ATR 计算（保持原逻辑） ----
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
            let sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
            let atrVal = sum / period;
            for (let i = period; i < tr.length; i++) {
                atrVal = (atrVal * (period - 1) + tr[i]) / period;
            }
            if (atrVal > 0) atr = atrVal;
        }
    }

    // ---- 支撑阻力（保持原逻辑） ----
    const high = highs ? Math.max(...highs.slice(-20)) : price * 1.05;
    const low = lows ? Math.min(...lows.slice(-20)) : price * 0.95;
    const pp = (high + low + price) / 3;
    const s1 = 2 * pp - high;
    const r1 = 2 * pp - low;
    const r2 = pp + (high - low);

    // ---- 动态止损（保持原逻辑） ----
    const stopByATR = price - 2 * atr;
    const stopByS1 = s1 || (price * 0.97);
    const stopLoss = Math.min(stopByATR, stopByS1, price * 0.95);

    // =============================================================
    // ★★★ 优化版v6 核心改进开始 ★★★
    // =============================================================

    // 1. 计算20日动量
    const momentum20 = (price - closes[Math.max(0, n - 21)]) / closes[Math.max(0, n - 21)];
    const atrPct = atr / price;
    const isStrongTrend = momentum20 > 0.10;
    const isVeryStrong = momentum20 > 0.15;

    // 2. 动态止盈倍数
    let mult1 = 1.0, mult2 = 2.0, mult3 = 3.5;
    if (isVeryStrong) {
        mult1 = 1.5; mult2 = 3.0; mult3 = 5.25;
    }

    // 3. 波动率自适应
    let volMult = 1.0;
    if (atrPct < 0.015) volMult = 1.5;
    else if (atrPct > 0.04) volMult = 0.8;

    const atr1 = price + mult1 * atr * volMult;
    const atr2 = price + mult2 * atr * volMult;
    const atr3 = price + mult3 * atr * volMult;

    // 4. 止盈比例（强趋势L3不清仓）
    let l1Ratio = 0.30, l2Ratio = 0.30, l3Ratio = 0.40;
    if (isStrongTrend) {
        l3Ratio = 0.30;  // 只卖30%，不清仓
    }

    // 5. R1替换（仅非强趋势）
    if (!isStrongTrend && r1 && r1 > price && r1 < atr1) {
        // 保持原逻辑
    }

    let targets = [
        { price: atr1, ratio: l1Ratio, label: `+${mult1 * volMult}ATR(短线)` },
        { price: atr2, ratio: l2Ratio, label: `+${mult2 * volMult}ATR(中线)` },
        { price: atr3, ratio: l3Ratio, label: `+${mult3 * volMult}ATR(长线)` }
    ];

    // 6. 移动止损放宽
    const trailingStop = {
        enabled: true,
        trigger: price + 2.0 * atr,      // 优化：从1.5放宽至2.0
        step: 2.0 * atr,                  // 优化：从1.0放宽至2.0
        currentStop: stopLoss
    };

    // 7. 趋势保留仓位
    const trendReserve = isStrongTrend ? 0.10 : 0.0;

    const tpSl = {
        stopLoss,
        takeProfitLevels: targets,
        trailingStop,
        atr,
        s1,
        r1,
        r2,
        hasR2: r2 && r2 > atr3,
        trendReserve,                     // 新增：保留仓位比例
        isStrongTrend,                    // 新增：趋势标记
        momentum20,                       // 新增：动量值
        note: '优化版v6：趋势分级止盈 + 利润奔跑 + 波动率自适应'
    };

    return { overall, action, position, confidence, tpSl };
}

// ============================================================
// 持仓管理优化：强趋势L3止盈后不清仓
// 在 renderStockCards 或持仓管理逻辑中加入：
// ============================================================

/*
// 止盈触发时的处理逻辑（需在持仓管理代码中替换）：

for (const level of ['L1', 'L2', 'L3']) {
    if (!trade.levels_executed[level] && price >= trade.targets[level].price) {
        let ratio = trade.targets[level].ratio;

        // 优化：强趋势L3不清仓
        if (level === 'L3' && trade.tpSl && trade.tpSl.isStrongTrend) {
            ratio = 0.30;  // 只卖30%
        }

        const sharesToSell = Math.floor(trade.initial_shares * ratio);
        if (sharesToSell > trade.remaining_shares) {
            trade.remaining_shares -= trade.remaining_shares;
        } else {
            trade.remaining_shares -= sharesToSell;
        }
        trade.levels_executed[level] = true;

        // 记录卖出
        trade.sell_records.push({
            date: currentDate,
            price: price,
            shares: sharesToSell,
            reason: `止盈${level}`
        });

        // 优化：强趋势L3止盈后不清仓，继续跟踪
        if (level === 'L3' && trade.tpSl && trade.tpSl.isStrongTrend && trade.remaining_shares > 0) {
            // 保持OPEN状态，继续用移动止损跟踪
            continue;
        }

        if (trade.remaining_shares <= 0) {
            trade.exit_price = price;
            trade.exit_date = currentDate;
            trade.exit_reason = `止盈${level}清仓`;
            trade.status = 'CLOSED';
        }
    }
}
*/

// ============================================================
// 使用说明：
// 1. 将 simpleSignal_v6 替换原有的 simpleSignal 函数
// 2. 在持仓管理逻辑中加入上述强趋势不清仓的处理
// 3. 移动止损参数已内嵌在 tpSl.trailingStop 中
// 4. 波动率自适应自动生效，无需额外配置
// ============================================================
