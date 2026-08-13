// ============================================
// 历史数据存档表（类似 Excel 工作表）
// ============================================
// 集中存储所有自选股的历史数据快照
// 每只股票每天一行：包含价格 + 基本面 + 技术信号 + 建议

const HISTORY_KEY = 'history_v1';
const HISTORY_LIMIT = 5000;           // 最多存 5000 行
const HISTORY_COLUMNS = [
  { key: 'date',         label: '日期',     type: 'string' },
  { key: 'code',         label: '代码',     type: 'string' },
  { key: 'name',         label: '名称',     type: 'string' },
  { key: 'open',         label: '开盘',     type: 'number' },
  { key: 'high',         label: '最高',     type: 'number' },
  { key: 'low',          label: '最低',     type: 'number' },
  { key: 'close',        label: '收盘',     type: 'number' },
  { key: 'change',       label: '涨跌',     type: 'number' },
  { key: 'changePct',    label: '涨跌幅',   type: 'percent' },
  { key: 'volume',       label: '成交量',   type: 'number' },
  { key: 'amount',       label: '成交额',   type: 'number' },
  { key: 'pe',           label: 'PE',       type: 'number' },
  { key: 'pb',           label: 'PB',       type: 'number' },
  { key: 'totalCap',     label: '总市值',   type: 'number' },
  { key: 'turnover',     label: '换手率',   type: 'percent' },
  { key: 'overall',      label: '判定',     type: 'string' },
  { key: 'position',     label: '建议仓位', type: 'percent' },
  { key: 'confidence',   label: '置信度',   type: 'percent' },
  { key: 'netScore',     label: '加权分',   type: 'number' },
  { key: 'trend',        label: '趋势',     type: 'string' },
  { key: 'vpLabel',      label: '量价',     type: 'string' },
  { key: 'stopLoss',     label: '止损',     type: 'number' },
  { key: 'takeProfitR1', label: '止盈R1',   type: 'number' },
  { key: 'dataSource',   label: '数据源',   type: 'string' },  // realtime/cached/fallback
  { key: 'updatedAt',    label: '更新时间', type: 'string' },
];

// ============================================
// 1. 读取整张表
// ============================================
function loadHistoryTable() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return createEmptyTable();
    const t = JSON.parse(raw);
    if (!t.rows) return createEmptyTable();
    return t;
  } catch {
    return createEmptyTable();
  }
}
function createEmptyTable() {
  return {
    meta: { version: 1, lastUpdate: null, tradeDate: null, rowCount: 0 },
    columns: HISTORY_COLUMNS,
    rows: [],
  };
}

// ============================================
// 2. 保存整张表（带容量控制）
// ============================================
function saveHistoryTable(t) {
  try {
    // 限制行数（FIFO 淘汰旧的）
    if (t.rows.length > HISTORY_LIMIT) {
      t.rows = t.rows.slice(-HISTORY_LIMIT);
    }
    t.meta.rowCount = t.rows.length;
    t.meta.lastUpdate = new Date().toISOString();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(t));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // 满了 → 砍掉一半老数据再试
      t.rows = t.rows.slice(Math.floor(t.rows.length / 2));
      t.meta.rowCount = t.rows.length;
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(t)); return true; } catch {}
    }
    return false;
  }
}

// ============================================
// 3. 追加一行（同 code+date 已存在则覆盖）
// ============================================
function appendHistoryRow(row) {
  const t = loadHistoryTable();
  const idx = t.rows.findIndex(r => r.code === row.code && r.date === row.date);
  if (idx >= 0) {
    t.rows[idx] = { ...t.rows[idx], ...row };  // 覆盖
  } else {
    t.rows.push(row);
  }
  // 按 code+date 排序（让数据有序）
  t.rows.sort((a, b) => {
    if (a.code !== b.code) return a.code.localeCompare(b.code);
    return a.date.localeCompare(b.date);
  });
  saveHistoryTable(t);
  return t.rows.length;
}

// ============================================
// 4. 批量追加（推荐用这个）
// ============================================
function appendHistoryRows(rows) {
  const t = loadHistoryTable();
  rows.forEach(row => {
    const idx = t.rows.findIndex(r => r.code === row.code && r.date === row.date);
    if (idx >= 0) t.rows[idx] = { ...t.rows[idx], ...row };
    else t.rows.push(row);
  });
  t.rows.sort((a, b) => a.code === b.code ? a.date.localeCompare(b.date) : a.code.localeCompare(b.code));
  return saveHistoryTable(t) ? t.rows.length : -1;
}

// ============================================
// 5. 查询（核心：替代实时数据源）
// ============================================
// 5.1 取某只股票最新一行（没实时数据时的主入口）
function getLatestRow(code) {
  const t = loadHistoryTable();
  const rows = t.rows.filter(r => r.code === code);
  if (!rows.length) return null;
  return rows[rows.length - 1];
}
// 5.2 取某只股票某天的一行
function getRow(code, date) {
  const t = loadHistoryTable();
  return t.rows.find(r => r.code === code && r.date === date) || null;
}
// 5.3 取某只股票最近 N 天
function getRecentRows(code, n = 30) {
  const t = loadHistoryTable();
  return t.rows.filter(r => r.code === code).slice(-n);
}
// 5.4 取所有股票最近 1 行（用于首页/自选股列表）
function getAllLatestRows() {
  const t = loadHistoryTable();
  const map = new Map();
  t.rows.forEach(r => {
    if (!map.has(r.code) || r.date > map.get(r.code).date) {
      map.set(r.code, r);
    }
  });
  return Array.from(map.values());
}
// 5.5 取所有自选股最新一行（结合 loadStocks 过滤）
function getWatchlistLatest() {
  const stocks = loadStocks();
  const codes = new Set(stocks.map(s => s.code));
  const latest = getAllLatestRows();
  return latest.filter(r => codes.has(r.code));
}

// ============================================
// 6. 数据完整性
// ============================================
function getHistoryStats() {
  const t = loadHistoryTable();
  const byCode = {};
  t.rows.forEach(r => {
    if (!byCode[r.code]) byCode[r.code] = { count: 0, first: r.date, last: r.date, name: r.name };
    byCode[r.code].count++;
    if (r.date < byCode[r.code].first) byCode[r.code].first = r.date;
    if (r.date > byCode[r.code].last) byCode[r.code].last = r.date;
  });
  return {
    totalRows: t.rows.length,
    stockCount: Object.keys(byCode).length,
    byCode,
    lastUpdate: t.meta.lastUpdate,
    usedBytes: (localStorage.getItem(HISTORY_KEY) || '').length,
  };
}

// ============================================
// 7. 清理
// ============================================
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
function deleteStockHistory(code) {
  const t = loadHistoryTable();
  t.rows = t.rows.filter(r => r.code !== code);
  saveHistoryTable(t);
}

// ============================================
// 8. 导出 CSV（类似 Excel 导出）
// ============================================
function exportHistoryCSV() {
  const t = loadHistoryTable();
  const headers = t.columns.map(c => c.label).join(',');
  const lines = t.rows.map(r => t.columns.map(c => {
    const v = r[c.key];
    if (v == null) return '';
    if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
    return v;
  }).join(','));
  return '\uFEFF' + [headers, ...lines].join('\n');  // 加 BOM 让 Excel 识别 UTF-8
}

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HISTORY_KEY, HISTORY_COLUMNS, HISTORY_LIMIT,
    loadHistoryTable, saveHistoryTable,
    appendHistoryRow, appendHistoryRows,
    getLatestRow, getRow, getRecentRows, getAllLatestRows, getWatchlistLatest,
    getHistoryStats, clearHistory, deleteStockHistory, exportHistoryCSV,
  };
}
if (typeof window !== 'undefined') {
  window.HistoryTable = {
    load: loadHistoryTable,
    appendRow: appendHistoryRow,
    appendRows: appendHistoryRows,
    getLatest: getLatestRow,
    getAllLatest: getAllLatestRows,
    getWatchlist: getWatchlistLatest,
    getRecent: getRecentRows,
    stats: getHistoryStats,
    clear: clearHistory,
    exportCSV: exportHistoryCSV,
  };
}
