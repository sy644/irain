// ============================================================
// 组合止盈策略 · 优化版v7 数据加载容错增强版
// 修复：数组越界、空highs/lows、长度不足、计算崩溃、字段空值报错
// ============================================================
function simpleSignal_v7(closes, highs, lows) {
    try {
        // 第一层：基础数组空值校验
        if (!Array.isArray(closes) || closes.length === 0) {
            return { 
                overall: '数据异常', 
                action: '收盘价数组为空，加载失败', 
                position: 0, 
                confidence: 0, 
                tpSl: null, 
                score: -999, 
                trendOk: false 
            };
        }
        // K线最小长度校验，不足20直接返回
        if (closes.length < 20) {
            return { 
                overall: '数据不足', 
                action: `K线仅${closes.length}根，至少需要20根`, 
                position: 0, 
                confidence: 0, 
                tpSl: null, 
                score: -999, 
                trendOk: false 
            };
        }
        const n = closes.length;
        const price = Number(closes[n - 1]) || 0;
        if (price <= 0) {
            return { 
                overall: '数据异常', 
                action: '最新收盘价无效，无法计算信号', 
                position: 0, 
                confidence: 0, 
                tpSl: null, 
                score: -999, 
                trendOk: false 
            };
        }

        // ---- 趋势均线信号（增加数组长度兜底） ----
        // MA5
        const ma5Slice = closes.slice(-5);
        const ma5 = ma5Slice.reduce((a, b) => a + (Number(b) || 0), 0) / ma5Slice.length;
        // MA20
        const ma20Slice = closes.slice(-20);
        const ma20 = ma20Slice.reduce((a, b) => a + (Number(b) || 0), 0) / ma20Slice.length;
        // MA60 长度不足复用MA20兜底
        const ma60Slice = closes.length >= 60 ? closes.slice(-60) : ma20Slice;
        const ma60 = ma60Slice.reduce((a, b) => a + (Number(b) || 0), 0) / ma60Slice.length;

        const prev = Number(closes[n - 2]) || price;
        const changePct = prev === 0 ? 0 : ((price - prev) / prev) * 100;
        const fiveDayClose = Number(closes[Math.max(0, n - 5)]) || price;
        const pct5 = fiveDayClose === 0 ? 0 : ((price - fiveDayClose) / fiveDayClose) * 100;

        // 计分逻辑不变
        let score = 0;
        if (price > ma5) score += 1.5; else score -= 1.5;
        if (price > ma20) score += 1.2; else score -= 1.2;
        if (price > ma60) score += 0.8; else score -= 0.8;
        if (ma5 > ma20) score += 0.5; else score -= 0.5;
        if (ma20 > ma60) score += 0.3; else score -= 0.3;
        if (changePct > 1) score += 0.5; else if (changePct < -1) score -= 0.5;
        if (pct5 > 3) score += 1; else if (pct5 < -3) score -= 1;

        // 信号档位判定
        let overall, action, position, confidence;
        if (score >= 5) { overall = '强力买入'; action = '强势突破，积极跟进'; position = 85; confidence = 90; }
        else if (score >= 3.5) { overall = '买入'; action = '趋势向好，分批建仓'; position = 65; confidence = 75; }
        else if (score >= 2) { overall = '左侧试探'; action = '底部区域，轻仓试水'; position = 35; confidence = 55; }
        else if (score >= 0.5) { overall = '超卖区'; action = '超跌反弹机会'; position = 20; confidence = 40; }
        else if (score >= -0.5) { overall = '观望'; action = '等待方向明朗'; position = 0; confidence = 30; }
        else if (score >= -2) { overall = '高空防守'; action = '高位滞涨，逐步减仓'; position = 25; confidence = 50; }
        else if (score >= -3.5) { overall = '卖出'; action = '趋势走弱，果断减仓'; position = 50; confidence = 70; }
        else { overall = '强力卖出'; action = '全面转空，清仓避险'; position = 75; confidence = 85; }

        // ---- ATR计算：增加highs/lows空数组、长度不匹配兜底 ----
        let atr = price * 0.02;
        let validHLC = false;
        if (Array.isArray(highs) && Array.isArray(lows) && highs.length === lows.length && highs.length === closes.length) {
            validHLC = true;
            const tr = [];
            for (let i = 1; i < closes.length; i++) {
                const h = Number(highs[i]) || price;
                const l = Number(lows[i]) || price;
                const cPrev = Number(closes[i - 1]) || price;
                const hl = h - l;
                const hc = Math.abs(h - cPrev);
                const lc = Math.abs(l - cPrev);
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

        // ---- 短期高低点、枢轴：无高低价直接用价格兜底 ----
        let high, low;
        if (validHLC) {
            high = Math.max(...highs.slice(-20).map(x => Number(x) || price));
            low = Math.min(...lows.slice(-20).map(x => Number(x) || price));
        } else {
            high = price * 1.05;
            low = price * 0.95;
        }
        const pp = (high + low + price) / 3;
        const s1 = 2 * pp - high;
        const r1 = 2 * pp - low;
        const r2 = pp + (high - low);

        // v7 核心逻辑
        const trendOk = price > ma20 && ma5 > ma20;
        // 20日动量兜底，防止n-21越界
        const momentumStartIdx = Math.max(0, n - 21);
        const close20Ago = Number(closes[momentumStartIdx]) || price;
        const momentum20 = close20Ago === 0 ? 0 : (price - close20Ago) / close20Ago;
        const atrPct = price === 0 ? 0 : atr / price;
        const isStrongTrend = momentum20 > 0.10;
        const isVeryStrong = momentum20 > 0.15;

        // 波动率自适应止损倍数
        let stopMult = 2.0;
        if (atrPct > 0.04) stopMult = 3.0;
        else if (atrPct > 0.035) stopMult = 2.5;
        const stopByATR = price - stopMult * atr;
        const stopByS1 = s1 || (price * 0.97);
        const stopLoss = Math.min(stopByATR, stopByS1, price * 0.95);

        // 止盈倍数
        let mult1 = 1.0, mult2 = 2.0, mult3 = 3.5;
        if (isVeryStrong) {
            mult1 = 1.5; mult2 = 3.0; mult3 = 5.25;
        }
        // 波动率系数
        let volMult = 1.0;
        if (atrPct < 0.015) volMult = 1.5;
        else if (atrPct > 0.04) volMult = 0.8;

        // 三级止盈
        const atr1 = price + mult1 * atr * volMult;
        const atr2 = price + mult2 * atr * volMult;
        const atr3 = price + mult3 * atr * volMult;

        // 减仓比例
        let l1Ratio = 0.30, l2Ratio = 0.30, l3Ratio = 0.40;
        if (isStrongTrend) l3Ratio = 0.30;

        const takeProfitLevels = [
            { price: atr1, ratio: l1Ratio, label: `+${(mult1 * volMult).toFixed(2)}ATR(短线)` },
            { price: atr2, ratio: l2Ratio, label: `+${(mult2 * volMult).toFixed(2)}ATR(中线)` },
            { price: atr3, ratio: l3Ratio, label: `+${(mult3 * volMult).toFixed(2)}ATR(长线)` }
        ];

        // 移动止损触发参数
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

        // 仓位自适应比例
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
            note: 'v7增强容错：空值/短K线/高低价缺失兜底，防加载崩溃'
        };

        return { overall, action, position, confidence, tpSl, score, trendOk };
    } catch (err) {
        // 全局捕获计算异常，返回标准化错误，不中断页面加载
        console.error('simpleSignal_v7计算失败：', err.message);
        return {
            overall: '计算失败',
            action: `指标运算异常：${err.message}`,
            position: 0,
            confidence: 0,
            tpSl: null,
            score: -999,
            trendOk: false
        };
    }
}

// ============================================================
// 持仓止盈执行配套逻辑 · 容错增强
// ============================================================
function calcSellShares_v7(trade, currentPrice, currentDate) {
    try {
        // 前置判空兜底
        if (!trade || !trade.tpSl || !Array.isArray(trade.tpSl.takeProfitLevels)) {
            console.warn('calcSellShares_v7：交易对象或止盈档位缺失');
            return trade;
        }
        const { initial_shares = 0, remaining_shares = 0, tpSl } = trade;
        const levels_executed = trade.levels_executed || {};
        const sell_records = trade.sell_records || [];
        const targets = tpSl.takeProfitLevels;
        const levelMap = { L1: 0, L2: 1, L3: 2 };

        for (const levelKey of ['L1', 'L2', 'L3']) {
            const idx = levelMap[levelKey];
            if (levels_executed[levelKey] || idx >= targets.length) continue;
            const target = targets[idx];
            if (!target || currentPrice < target.price) continue;

            let sellRatio = target.ratio || 0;
            if (levelKey === 'L3' && tpSl.isStrongTrend) sellRatio = 0.30;

            const sellNum = Math.floor(initial_shares * sellRatio);
            const realSell = Math.min(sellNum, remaining_shares);
            if (realSell <= 0) continue;

            trade.remaining_shares = remaining_shares - realSell;
            trade.levels_executed = levels_executed;
            trade.levels_executed[levelKey] = true;
            trade.sell_records = sell_records;
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
        console.error('calcSellShares_v7执行报错：', err);
        return trade;
    }
}

// ============================================================
// v7 建仓判断辅助函数 · 空值容错
// ============================================================
function canOpenPosition_v7(signal, daysSinceLastExit, cooldownDays = 5) {
    try {
        if (!signal || !signal.tpSl) return false;
        if (typeof daysSinceLastExit !== 'number' || daysSinceLastExit < cooldownDays) return false;
        if (!signal.trendOk) return false;
        const atrPct = signal.tpSl.atrPct || 0;
        const minScore = atrPct > 0.035 ? 3.5 : 2.0;
        return Number(signal.score) >= minScore;
    } catch (err) {
        console.error('canOpenPosition_v7校验失败：', err);
        return false;
    }
}
