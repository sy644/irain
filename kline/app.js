// ================================================================
// ★★★ 增强版 summarize（集成布林带+均线趋势判断）★★★
// ================================================================
function summarize(closes, highs, lows, opens, vols, pivots, basic) {
  const n = closes.length;
  const price = closes[n - 1];

  // ---- 均线计算 ----
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

  // ---- 布林带（20日，2倍标准差） ----
  const bollPeriod = 20;
  const bollSlice = closes.slice(-bollPeriod);
  const bollMid = bollSlice.reduce((a,b)=>a+b,0) / bollSlice.length;
  let bollStd = 0;
  for (const v of bollSlice) { const d = v - bollMid; bollStd += d*d; }
  bollStd = Math.sqrt(bollStd / bollSlice.length);
  const bollUpper = bollMid + 2 * bollStd;
  const bollLower = bollMid - 2 * bollStd;
  const bollWidth = bollStd / bollMid;
  const bollPosition = (price - bollLower) / (bollUpper - bollLower || 1);

  // ---- 布林带宽变化 ----
  let bollWidthRecent = 0, bollWidthPast = 0;
  if (n >= 30) {
    const recentSlice = closes.slice(-5);
    const pastSlice = closes.slice(-10, -5);
    const calcWidth = (arr) => {
      const m = arr.reduce((a,b)=>a+b,0)/arr.length;
      let s = 0;
      for (const v of arr) { const d = v-m; s+=d*d; }
      return Math.sqrt(s/arr.length) / m;
    };
    bollWidthRecent = calcWidth(recentSlice);
    bollWidthPast = calcWidth(pastSlice);
  }
  const bollWidthChange = bollWidthRecent - bollWidthPast;

  // ---- 均线排列强度 ----
  const maOrder = (ma5 > ma10) + (ma10 > ma20) + (ma20 > ma60);
  const ma5Slope = n > 10 ? (ma5 - closes[n-6]) / closes[n-6] : 0;

  // ---- 趋势综合评分 ----
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

  // ---- 量价因子（原逻辑不变） ----
  const obvSeries = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i === 0) { obvSeries[i] = 0; continue; }
    if (closes[i] > closes[i - 1]) obvSeries[i] = obvSeries[i - 1] + vols[i];
    else if (closes[i] < closes[i - 1]) obvSeries[i] = obvSeries[i - 1] - vols[i];
    else obvSeries[i] = obvSeries[i - 1];
  }
  const obvCurrent = obvSeries[n - 1];
  const obv20Slice = obvSeries.slice(-20);
  const obv60Slice = obvSeries.slice(-60);
  const obvPeak20 = Math.max(...obv20Slice);
  const obvTrough20 = Math.min(...obv20Slice);
  const obvPosition20 = obvPeak20 > obvTrough20 ? (obvCurrent - obvTrough20) / (obvPeak20 - obvTrough20) : 0.5;
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
  const lastVol = vols[n - 1];
  const avgVol5 = vols.slice(-5).reduce((a,b)=>a+b,0) / 5;
  const avgVol20 = vols.slice(-20).reduce((a,b)=>a+b,0) / 20;
  const volMedian20 = (() => {
    const arr = vols.slice(-20).slice().sort((a,b)=>a-b);
    return arr[Math.floor(arr.length/2)];
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
    const bonus = obvPosition20 > 0.6 ? 2.0 : 1.5;
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
  if (pricePosition20_high > 0.85 && obvPosition20 < 0.4 && obvPosition20 < 0.4) {
    vpScore -= 2.0;
    vpFactors.push('高位背离-2');
  } else if (pricePosition20_high > 0.85 && obvPosition20 < 0.5) {
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
  if (vpScore >= 1.5) {
    vpLabel = '放量突破'; vpEvent = 'fangBreakout'; vpDivergence = false;
  } else if (vpScore >= 0.8) {
    vpLabel = '放量上涨'; vpEvent = 'upTrend'; vpDivergence = false;
  } else if (vpScore >= 0.3) {
    vpLabel = '温和上行'; vpEvent = 'upTrend'; vpDivergence = false;
  } else if (vpScore >= -0.3) {
    vpLabel = '量价中性'; vpEvent = ''; vpDivergence = false;
  } else if (vpScore >= -1.0) {
    vpLabel = '量价滞涨'; vpEvent = 'fangBreak'; vpDivergence = true;
  } else {
    vpLabel = '量价背离'; vpEvent = 'divergence'; vpDivergence = true;
  }

  // ---- 最终评分 ----
  const absTrend = Math.abs(trendScore);
  let trendWeight = 1.0;
  if (absTrend > 5) trendWeight = 1.3;
  else if (absTrend < 1) trendWeight = 0.8;
  let score = trendScore * trendWeight + vpScore * (2 - trendWeight);

  // ---- 信号分档 ----
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

  // ---- ATR 与止盈止损 ----
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
  const trailingStop = {
    enabled: true,
    trigger: price + 2 * atr,
    step: 1.5 * atr,
    currentStop: stopLoss
  };

  // ---- 其他指标 ----
  const rsi = _calcRSI(closes, 14);
  const macd = _calcMACD(closes);
  const kdj = _calcKDJ(closes, highs, lows);
  const roc = n > 10 ? (price - closes[n-11]) / closes[n-11] * 100 : 0;
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
    { name: 'MACD', value: macd.macd, min: -Math.abs(macd.signal)*2, max: Math.abs(macd.signal)*2, signal: macd.hist > 0 ? '买入' : '卖出' },
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
    { name: 'OBV', value: obvCurrent, min: -Math.abs(obvCurrent)*2, max: Math.abs(obvCurrent)*2, signal: isObvUp ? '资金流入' : (isObvDown ? '资金流出' : '中性') },
    { name: 'VR 26', value: vr, min: 0, max: 300, signal: vr > 150 ? '放量' : vr < 70 ? '缩量' : '中性' },
    { name: 'VOL 5/10', value: volaRatio, min: 0, max: 3, signal: volaRatio > 1.3 ? '放量' : volaRatio < 0.7 ? '缩量' : '中性' },
  ];
  const buyScore = [trendGroup, momentumGroup, volaGroup, volGroup].flat().filter(x => ['买入','超卖','资金流入','放量'].includes(x.signal)).length;
  const sellScore = [trendGroup, momentumGroup, volaGroup, volGroup].flat().filter(x => ['卖出','超买','资金流出','缩量'].includes(x.signal)).length;

  // ---- 回测 ----
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

  // ---- 异常量 ----
  const anomalyIdx = [];
  for (let i = Math.max(1, n - 15); i < n; i++) {
    const avg = vols.slice(Math.max(0, i-5), i).reduce((a,b)=>a+b,0) / Math.min(5, i);
    if (vols[i] > avg * 2.0) anomalyIdx.push({ i, type: closes[i] < opens[i] ? 'high' : 'normal' });
  }

  // ---- 返回 ----
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
      upper: bollUpper,
      mid: bollMid,
      lower: bollLower,
      position: bollPosition,
      width: bollWidth,
      widthChange: bollWidthChange,
      isExpanding: bollWidthChange > 0.001,
      isContracting: bollWidthChange < -0.001
    },
    maInfo: {
      ma5, ma10, ma20, ma60,
      alignment: maOrder,
      slope5: ma5Slope
    },
    pivotLabel: (price > pivots.classic.R1) ? '突破R1' : (price > pivots.classic['轴心点']) ? '轴上' : (price < pivots.classic.S1) ? '跌破S1' : (price < pivots.classic['轴心点']) ? '轴下' : '中性',
    pivotBreakdown: price < pivots.classic.S1 ? { level: 'S1', from: pivots.classic.S1, to: 'S2' } : null,
    pivotBreakout: price > pivots.classic.R1 ? { level: 'R1', from: pivots.classic.R1, target: 'R2' } : null,
    vpScore, vpLabel, vpEvent, vpDivergence,
    obvInfo: { direction: isObvUp ? 'up' : (isObvDown ? 'down' : 'neutral'), value: obvCurrent, slope8: obvSlope8 },
    volaRatio,
    anomalyIdx,
    backtest: { buySamples, buyWinRate: buySamples > 0 ? buyWin / buySamples : 0, buyAvgRet: buySamples > 0 ? buySum / buySamples : 0, lookback: 60, holdDays },
    tpSl: { stopLoss, takeProfitLevels, trailingStop, atr, s1, r1: pivots.classic.R1, r2: pivots.classic.R2, hasR2: pivots.classic.R2 > takeProfitLevels[2].price, isStrongTrend: Math.abs(trendScore) > 3, momentum20: n > 20 ? (price - closes[n-21]) / closes[n-21] : 0, atrPct, stopMult, triggerMult: 2.0, stepMult: 1.5, note: '趋势增强版（布林+均线）' },
    trendGroup, momentumGroup, volaGroup, volGroup,
    buyScore, sellScore,
    mainForce: null,
    fundamentals: null,
    trendDiagnosis: {
      direction: trendDir,
      strength: trendStrength,
      score: trendScore,
      bollPosition: bollPosition,
      maAlignment: maOrder,
      adx: adx
    }
  };
}
summarize._marketEnv = null;

// ================================================================
// ★★★ 增强版 applyQuantToSignal（融入趋势信息）★★★
// ================================================================
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
    if (sum.position > 30) { sum.position = 30; let reason = ''; if (v.sharpe < 0) reason += `夏普${v.sharpe.toFixed(2)}<0 `; if (v.mdd > 0.25) reason += `回撤${(v.mdd*100).toFixed(0)}%>25% `; if (v.ir != null && v.ir < -0.5) reason += `IR${v.ir.toFixed(2)}<-0.5 `; warnings.push(`📉 量化战略偏弱（${reason.trim() || '综合指标不佳'}），仓位封顶 30%`); }
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
    warnings.push(`⚠ 短期信号「${signal}」与长期战略${v.bad?'差':'好'}冲突，置信度 ≤ 30%`);
  }

  if (v.pf != null && v.pf < 1 && ['买入', '强力买入', '左侧试探'].includes(signal) && !isStrongBreakout) {
    sum.position = Math.min(sum.position, 25);
    warnings.push(`💸 盈利因子 ${v.pf.toFixed(2)} < 1，长期负期望，买入仓位封顶 25%`);
  }

  // ---- 🆕 趋势融合 ----
  if (sum.trendStrength > 70 && signal.includes('买入')) {
    sum.position = Math.min(100, sum.position * 1.2);
    sum.confidence = Math.min(100, sum.confidence + 10);
    warnings.push(`📈 强趋势（${sum.trend}）加成，仓位扩大 20%`);
  }
  if (sum.trendStrength < 30 && signal.includes('卖出')) {
    sum.position = Math.min(80, sum.position * 1.2);
    warnings.push(`📉 弱趋势（${sum.trend}）强化空头信号`);
  }
  // 布林收缩 + 价格中轨附近 → 震荡，大幅减仓
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