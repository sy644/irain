// ============================================================
// 组合止盈策略 · 优化版v7（完整错误保护版）
// 可直接覆盖原 app.js 全部内容
// ============================================================

// ---------- 核心策略函数（带 try-catch 保护） ----------
function simpleSignal_v7(closes, highs, lows) {
    try {
        // -------- 数据校验 --------
        if (!Array.isArray(closes) || closes.length < 20) {
            return {
                overall: '数据不足',
                action: 'K线不足（至少20根）',
                position: 0,
                confidence: 0,
                tpSl: null,
                score: -999,
                trendOk: false,
                error: 'CLOSES_TOO_SHORT'
            };
        }
        // 若高低价缺失或长度不一致，则用收盘价估算（避免报错）
        if (!highs || !lows || highs.length !== closes.length || lows.length !== closes.length) {
            highs = closes.map(p => p * 1.01);
            lows = closes.map(p => p * 0.99);
        }

        const n = closes.length;
        const price = closes[n - 1];

        // ---- 趋势均线信号 ----
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

        // ---- ATR 计算（安全处理） ----
        let atr = price * 0.02;
        if (highs && lows && highs.length === closes.length && lows.length === closes.length) {
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

        const high = Math.max(...highs.slice(-20));
        const low = Math.min(...lows.slice(-20));
        const pp = (high + low + price) / 3;
        const s1 = 2 * pp - high;
        const r1 = 2 * pp - low;
        const r2 = pp + (high - low);

        // ---- v7 核心逻辑 ----
        const trendOk = price > ma20 && ma5 > ma20;
        const momentum20 = (price - closes[Math.max(0, n - 21)]) / closes[Math.max(0, n - 21)];
        const atrPct = atr / price;
        const isStrongTrend = momentum20 > 0.10;
        const isVeryStrong = momentum20 > 0.15;

        let stopMult = 2.0;
        if (atrPct > 0.04) stopMult = 3.0;
        else if (atrPct > 0.035) stopMult = 2.5;

        const stopByATR = price - stopMult * atr;
        const stopByS1 = s1 || (price * 0.97);
        const stopLoss = Math.min(stopByATR, stopByS1, price * 0.95);

        let mult1 = 1.0, mult2 = 2.0, mult3 = 3.5;
        if (isVeryStrong) {
            mult1 = 1.5; mult2 = 3.0; mult3 = 5.25;
        }

        let volMult = 1.0;
        if (atrPct < 0.015) volMult = 1.5;
        else if (atrPct > 0.04) volMult = 0.8;

        const atr1 = price + mult1 * atr * volMult;
        const atr2 = price + mult2 * atr * volMult;
        const atr3 = price + mult3 * atr * volMult;

        let l1Ratio = 0.30, l2Ratio = 0.30, l3Ratio = 0.40;
        if (isStrongTrend) {
            l3Ratio = 0.30;
        }

        const takeProfitLevels = [
            { price: atr1, ratio: l1Ratio, label: `+${(mult1 * volMult).toFixed(2)}ATR(短线)` },
            { price: atr2, ratio: l2Ratio, label: `+${(mult2 * volMult).toFixed(2)}ATR(中线)` },
            { price: atr3, ratio: l3Ratio, label: `+${(mult3 * volMult).toFixed(2)}ATR(长线)` }
        ];

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

        let positionPct = 1.0;
        if (atrPct < 0.015) positionPct = 1.0;
        else if (atrPct < 0.035) positionPct = 0.8;
        else if (atrPct < 0.05) positionPct = 0.5;
        else positionPct = 0.3;

        const trendReserve = isStrongTrend ? 0.10 : 0.0;

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

    } catch (err) {
        console.error('[simpleSignal_v7] 异常:', err);
        // 返回安全结构，页面不会白屏
        return {
            overall: '计算异常',
            action: '请检查控制台错误信息',
            position: 0,
            confidence: 0,
            tpSl: null,
            score: -999,
            trendOk: false,
            error: err.message
        };
    }
}

// ---------- 止盈执行（同样加保护） ----------
function calcSellShares_v7(trade, currentPrice, currentDate) {
    try {
        if (!trade || !trade.tpSl || !trade.tpSl.takeProfitLevels) {
            console.warn('calcSellShares_v7: 缺少 tpSl 或止盈档位');
            return trade;
        }
        const { initial_shares, remaining_shares, tpSl, levels_executed = {}, sell_records = [] } = trade;
        const targets = tpSl.takeProfitLevels;
        const levelMap = { L1: 0, L2: 1, L3: 2 };

        for (const levelKey of ['L1', 'L2', 'L3']) {
            const idx = levelMap[levelKey];
            if (levels_executed[levelKey]) continue;
            const target = targets[idx];
            if (!target || currentPrice < target.price) continue;

            let sellRatio = target.ratio;
            if (levelKey === 'L3' && tpSl.isStrongTrend) {
                sellRatio = 0.30;
            }

            const sellNum = Math.floor(initial_shares * sellRatio);
            const realSell = Math.min(sellNum, remaining_shares);
            if (realSell <= 0) continue;

            trade.remaining_shares -= realSell;
            trade.levels_executed[levelKey] = true;
            trade.sell_records.push({
                date: currentDate,
                price: currentPrice,
                shares: realSell,
                reason: `止盈${levelKey}`
            });

            if (!(levelKey === 'L3' && tpSl.isStrongTrend) && trade.remaining_shares <= 0) {
                trade.exit_price = currentPrice;
                trade.exit_date = currentDate;
                trade.exit_reason = `止盈${levelKey}清仓`;
                trade.status = 'CLOSED';
            }
        }
        return trade;
    } catch (err) {
        console.error('[calcSellShares_v7] 异常:', err);
        return trade; // 保持原状，避免中断
    }
}

// ---------- 建仓判断（加保护） ----------
function canOpenPosition_v7(signal, daysSinceLastExit, cooldownDays = 5) {
    try {
        if (!signal || !signal.tpSl) return false;
        if (daysSinceLastExit < cooldownDays) return false;
        if (!signal.trendOk) return false;

        const atrPct = signal.tpSl.atrPct || 0;
        const minScore = atrPct > 0.035 ? 3.5 : 2.0;
        return signal.score >= minScore;
    } catch (err) {
        console.error('[canOpenPosition_v7] 异常:', err);
        return false;
    }
}

// ============================================================
// 使用说明（替换后请检查以下调用处）
// ============================================================
// 1. 所有调用 simpleSignal() 的地方改为 simpleSignal_v7()
// 2. 建仓判断：canOpenPosition_v7(signal, daysSinceLastExit, 5)
// 3. 止盈执行：calcSellShares_v7(trade, price, date)
// 4. 详情页渲染前请判断 signal.tpSl 是否存在
// 5. 若仍加载失败，查看控制台具体报错信息
// ============================================================