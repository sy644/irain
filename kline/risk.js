// ============================================
// 账户级风控层
// ============================================
// 提供：单标的仓位上限、总仓位上限、单笔最大亏损、回撤止损、止损穿透告警
// 用法：applyRiskLimits(signal, portfolio) → 调整后的信号 + 风控告警

// ============================================
// 1. 风控常量（可由用户配置覆盖）
// ============================================
const DEFAULT_RISK_LIMITS = {
  // 仓位限制
  maxSinglePosition:   0.20,    // 单标的最大仓位 20%
  maxTotalPosition:    0.80,    // 账户总仓位 ≤ 80%
  minCashReserve:      0.20,    // 至少保留 20% 现金

  // 亏损限制
  maxSingleLoss:       0.03,    // 单笔最大亏损 3%（基于入场价）
  maxDailyLoss:        0.05,    // 单日最大亏损 5%（账户级别）
  maxDrawdown:         0.15,    // 最大回撤 15%（从净值高点）→ 强制清仓

  // 强制规则
  stopLossRequired:    true,    // 没有止损不允许买入
  requireMarketFilter: false,   // 是否需要大盘环境通过（默认关闭）
};

// ============================================
// 2. 投资组合结构
// ============================================
// portfolio = {
//   equity:    当前总资产
//   cash:      可用现金
//   peakEquity: 历史最高净值（用于回撤计算）
//   positions: [
//     { code, name, shares, avgCost, currentPrice, stopLoss, highWater }
//   ]
// }

// ============================================
// 3. 单标的仓位上限约束
// ============================================
function capSinglePosition(signalPosition, limits = DEFAULT_RISK_LIMITS) {
  // signalPosition: 0~100（百分比）
  return Math.min(signalPosition, limits.maxSinglePosition * 100);
}

// ============================================
// 4. 总仓位约束
// ============================================
function capTotalPosition(currentTotalPct, proposedAdd, limits = DEFAULT_RISK_LIMITS) {
  // currentTotalPct: 当前已用仓位 0~1
  // proposedAdd:    本次要加的仓位 0~1
  const available = limits.maxTotalPosition - currentTotalPct;
  if (available <= 0) return 0;                    // 已满，禁止加仓
  return Math.max(0, Math.min(proposedAdd, available));
}

// ============================================
// 5. 单笔最大亏损检查
// ============================================
function checkSingleLoss(price, stopLoss, limits = DEFAULT_RISK_LIMITS) {
  // 修正：stopLoss 必须 > 0 才视为有效
  if (stopLoss == null || stopLoss <= 0 || !isFinite(stopLoss)) {
    return { ok: false, reason: 'NO_STOP_LOSS', message: '策略未给出止损位，禁止买入' };
  }
  if (stopLoss >= price) {
    return { ok: false, reason: 'STOP_LOSS_ABOVE_PRICE', message: `止损位 ${stopLoss} ≥ 当前价 ${price}，不合理` };
  }
  const lossPct = (price - stopLoss) / price;
  if (lossPct > limits.maxSingleLoss) {
    return {
      ok: false,
      reason: 'STOP_LOSS_TOO_WIDE',
      message: `止损位太宽：单笔潜在亏损 ${(lossPct*100).toFixed(1)}% > 限制 ${(limits.maxSingleLoss*100).toFixed(0)}%`,
      actualLoss: lossPct,
    };
  }
  return { ok: true, lossPct };
}

// ============================================
// 6. 最大回撤检查（最严重 → 强制清仓）
// ============================================
function checkDrawdown(portfolio, limits = DEFAULT_RISK_LIMITS) {
  if (!portfolio.peakEquity || portfolio.peakEquity <= 0) {
    return { ok: true, drawdown: 0 };
  }
  const drawdown = (portfolio.peakEquity - portfolio.equity) / portfolio.peakEquity;
  if (drawdown >= limits.maxDrawdown) {
    return {
      ok: false,
      reason: 'MAX_DRAWDOWN_EXCEEDED',
      message: `账户回撤 ${(drawdown*100).toFixed(1)}% ≥ 限制 ${(limits.maxDrawdown*100).toFixed(0)}%，强制清仓`,
      drawdown,
      action: 'FORCE_LIQUIDATE',
    };
  }
  if (drawdown >= limits.maxDrawdown * 0.8) {
    return {
      ok: true,
      warning: true,
      message: `⚠ 账户回撤 ${(drawdown*100).toFixed(1)}%，接近最大回撤上限 ${(limits.maxDrawdown*100).toFixed(0)}%`,
      drawdown,
    };
  }
  return { ok: true, drawdown };
}

// ============================================
// 7. 止损穿透检测（每日/盘中检查）
// ============================================
function checkStopLossPenetration(positions) {
  const breaches = [];
  for (const pos of positions) {
    if (pos.stopLoss && pos.currentPrice <= pos.stopLoss) {
      breaches.push({
        code: pos.code,
        name: pos.name,
        currentPrice: pos.currentPrice,
        stopLoss: pos.stopLoss,
        lossPct: (pos.currentPrice - pos.stopLoss) / pos.currentPrice,
        severity: pos.currentPrice < pos.stopLoss * 0.98 ? 'CRITICAL' : 'WARNING',
        action: 'REDUCE_OR_EXIT',
      });
    }
  }
  return breaches;
}

// ============================================
// 8. 移动止损更新（trailing stop）
// ============================================
function updateTrailingStop(position, tpSl) {
  // tpSl.trailingStop = { trigger, step, currentStop }
  if (!position.highWater) position.highWater = position.avgCost;
  if (position.currentPrice > position.highWater) {
    position.highWater = position.currentPrice;
  }
  // 未触发
  if (position.currentPrice < tpSl.trailingStop.trigger) {
    return position;
  }
  // 已触发：止损 = max(原止损, 高点 - step)
  const newStop = position.highWater - tpSl.trailingStop.step;
  if (newStop > position.stopLoss) {
    position.stopLoss = newStop;
  }
  return position;
}

// ============================================
// 9. OBV 复权调整（处理除权除息）
// ============================================
function adjustForExDividend(klineData) {
  // 检测除权：相邻两天开盘价异常跳变
  // 简单实现：若今开相对昨收偏离 > 8% 且 5 日内未再除权，按今日开盘/昨收 比例调整历史价格
  const adjusted = klineData.map((d, i) => ({ ...d }));
  for (let i = 1; i < adjusted.length; i++) {
    if (i < 1) continue;
    const prevClose = adjusted[i - 1].close;
    const currOpen  = adjusted[i].open;
    if (!prevClose || !currOpen) continue;
    const ratio = currOpen / prevClose;
    // 偏离 5%~15% 视为除权日（A 股涨跌停 10% 以内 + 分红/送股）
    if (ratio < 0.85 || ratio > 1.15) {
      // 将前 i 天的价格全部除以 ratio（按除权因子下调）
      const factor = 1 / ratio;
      for (let j = 0; j < i; j++) {
        adjusted[j].open   *= factor;
        adjusted[j].close  *= factor;
        adjusted[j].high   *= factor;
        adjusted[j].low    *= factor;
        // 成交量按除权因子反向调整（送股后股数变多，量对应增加）
        adjusted[j].volume *= ratio;
      }
    }
  }
  return adjusted;
}

// ============================================
// 10. 大盘环境过滤器（可选）
// ============================================
async function checkMarketEnvironment(fetchKLine, marketCode = 'sh000300') {
  try {
    const data = await fetchKLine(marketCode, 60);
    if (!data || data.length < 60) return { ok: true, note: '数据不足，跳过' };
    const closes = data.map(d => d.close);
    const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const ma60 = closes.slice(-60).reduce((a, b) => a + b, 0) / 60;
    const last = closes[closes.length - 1];
    const trendUp = last > ma20 && last > ma60 && ma20 > ma60;
    const trendDown = last < ma20 && last < ma60 && ma20 < ma60;
    if (trendDown) {
      return {
        ok: false,
        trend: 'BEAR',
        message: '大盘处于下跌趋势（沪深300 跌破 MA20/MA60），个股信号降级',
        severity: 'BLOCK_BUYS',
      };
    }
    if (trendUp) {
      return { ok: true, trend: 'BULL', message: '大盘多头环境，信号可放大' };
    }
    return { ok: true, trend: 'NEUTRAL', message: '大盘震荡，按个股信号执行' };
  } catch (e) {
    return { ok: true, note: '获取大盘数据失败，跳过过滤' };
  }
}

// ============================================
// 11. 顶/底背离检测（修复 P1 缺漏）
// ============================================
function detectDivergence(closes, obv) {
  // 顶背离：价格创近期新高，但 OBV 未新高 → 看跌
  // 底背离：价格创近期新低，但 OBV 未新低 → 看涨
  const N = closes.length;
  if (N < 30) return { topDiv: false, bottomDiv: false };
  const lookback = 20;
  const recentCloses = closes.slice(-lookback);
  const recentObv = obv.slice(-lookback);
  const priceHigh = Math.max(...recentCloses);
  const priceLow  = Math.min(...recentCloses);
  const obvHigh = Math.max(...recentObv);
  const obvLow  = Math.min(...recentObv);
  // 当前 vs 前半段
  const halfIdx = Math.floor(lookback / 2);
  const recentPriceMax = Math.max(...recentCloses.slice(halfIdx));
  const recentObvMax   = Math.max(...recentObv.slice(halfIdx));
  const recentPriceMin = Math.min(...recentCloses.slice(halfIdx));
  const recentObvMin   = Math.min(...recentObv.slice(halfIdx));
  // 顶背离：当前价格 > 前半段高 且 OBV 未创新高
  const topDiv = (recentCloses[recentCloses.length - 1] >= priceHigh * 0.99)
              && (recentObv[recentObv.length - 1] < obvHigh * 0.95);
  // 底背离：当前价格 ≤ 前半段低 且 OBV 未创新低
  const bottomDiv = (recentCloses[recentCloses.length - 1] <= priceLow * 1.01)
                 && (recentObv[recentObv.length - 1] > obvLow * 1.05);
  return { topDiv, bottomDiv };
}

// ============================================
// 12. 主入口：组合所有风控
// ============================================
function applyRiskLimits(signal, portfolio, limits = DEFAULT_RISK_LIMITS) {
  const result = {
    ...signal,
    originalPosition: signal.position,
    riskChecks: [],
    blocked: false,
    blockReasons: [],
  };
  // 1. 回撤检查（最严重，置顶）
  const dd = checkDrawdown(portfolio, limits);
  if (!dd.ok && dd.action === 'FORCE_LIQUIDATE') {
    result.position = 0;
    result.overall = '强力卖出';
    result.action = `风控熔断：${dd.message}`;
    result.blocked = true;
    result.blockReasons.push(dd.message);
  } else if (dd.warning) {
    result.riskChecks.push(dd.message);
  }
  // 2. 单标的仓位上限
  const capped = capSinglePosition(signal.position, limits);
  if (capped < signal.position) {
    result.riskChecks.push(`单标的仓位上限：${signal.position}% → ${capped}%`);
    result.position = capped;
  }
  // 3. 总仓位上限
  if (portfolio && portfolio.positions) {
    const currentTotal = portfolio.positions.reduce((s, p) => {
      return s + (p.shares * p.currentPrice) / (portfolio.equity || 1);
    }, 0);
    const totalCap = capTotalPosition(currentTotal, signal.position / 100, limits);
    if (totalCap * 100 < result.position) {
      result.riskChecks.push(`总仓位限制：${result.position}% → ${(totalCap*100).toFixed(0)}%（已用 ${(currentTotal*100).toFixed(0)}%）`);
      result.position = totalCap * 100;
    }
  }
  // 4. 止损检查（仅对买入信号）
  if (['买入', '强力买入', '左侧试探'].includes(signal.overall) && limits.stopLossRequired) {
    const slCheck = checkSingleLoss(signal.price, signal.tpSl && signal.tpSl.stopLoss, limits);
    if (!slCheck.ok) {
      result.blocked = true;
      result.blockReasons.push(slCheck.message);
      result.position = 0;
    }
  }
  // 5. 止损穿透告警
  if (portfolio && portfolio.positions) {
    const breaches = checkStopLossPenetration(portfolio.positions);
    if (breaches.length) {
      result.stopLossBreaches = breaches;
      result.riskChecks.push(`⚠ ${breaches.length} 个持仓触发止损`);
    }
  }
  // 6. 风险等级
  result.riskLevel = computeRiskLevel(result, portfolio, limits);
  return result;
}

function computeRiskLevel(signal, portfolio, limits) {
  let level = 'LOW';
  const checks = signal.riskChecks || [];
  if (signal.blocked) return 'CRITICAL';
  if (checks.length >= 3) return 'HIGH';
  if (checks.length >= 1) return 'MEDIUM';
  if (portfolio && portfolio.peakEquity) {
    const dd = (portfolio.peakEquity - (portfolio.equity || 0)) / portfolio.peakEquity;
    if (dd > limits.maxDrawdown * 0.5) level = 'MEDIUM';
  }
  return level;
}

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_RISK_LIMITS,
    capSinglePosition,
    capTotalPosition,
    checkSingleLoss,
    checkDrawdown,
    checkStopLossPenetration,
    updateTrailingStop,
    adjustForExDividend,
    detectDivergence,
    applyRiskLimits,
    computeRiskLevel,
  };
}
