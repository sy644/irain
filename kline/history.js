// ============================================
// 历史数据存档表（分片存储版）
// 每只股票独立存储，避免单表过大导致的性能瓶颈
// ============================================

const HISTORY_PREFIX = 'hist_v2_';
const HISTORY_LIMIT = 250;           // 每只股票最多存 250 天
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
  { key: 'dataSource',   label: '数据源',   type: 'string' },
  { key: 'updatedAt',    label: '更新时间', type: 'string' },
];

// ============================================
// 1. 按 code 分片读写
// ============================================
function getHistoryKey(code) {
  return HISTORY_PREFIX + code;
}

function loadStockHistory(code) {
  try {
    const raw = localStorage.getItem(getHistoryKey(code));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveStockHistory(code, rows) {
  try {
    localStorage.setItem(getHistoryKey(code), JSON.stringify(rows));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      const trimmed = rows.slice(Math.floor(rows.length / 2));
      try {
        localStorage.setItem(getHistoryKey(code), JSON.stringify(trimmed));
        return true;
      } catch {}
    }
    return false;
  }
}

// ============================================
// 2. 追加数据（按 code 分片，覆盖同日期）
// ============================================
function appendHistoryRows(rows) {
  const byCode = {};
  rows.forEach(r => {
    if (!byCode[r.code]) byCode[r.code] = [];
    byCode[r.code].push(r);
  });

  for (const [code, codeRows] of Object.entries(byCode)) {
    const existing = loadStockHistory(code);
    const map = new Map();
    existing.forEach(r => map.set(r.date, r));
    codeRows.forEach(r => {
      const prev = map.get(r.date) || {};
      map.set(r.date, { ...prev, ...r });
    });
    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    const trimmed = sorted.slice(-HISTORY_LIMIT);
    saveStockHistory(code, trimmed);
  }
  return true;
}

function appendHistoryRow(row) {
  return appendHistoryRows([row]);
}

// ============================================
// 3. 查询（O(1) 分片读取）
// ============================================
function getLatestRow(code) {
  const arr = loadStockHistory(code);
  return arr.length ? arr[arr.length - 1] : null;
}

function getRow(code, date) {
  const arr = loadStockHistory(code);
  return arr.find(r => r.date === date) || null;
}

function getRecentRows(code, n = 30) {
  const arr = loadStockHistory(code);
  return arr.slice(-n);
}

function getAllLatestRows() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(HISTORY_PREFIX));
  const result = [];
  for (const key of keys) {
    const code = key.replace(HISTORY_PREFIX, '');
    const latest = getLatestRow(code);
    if (latest) result.push(latest);
  }
  return result;
}

function getWatchlistLatest() {
  const stocks = loadStocks();
  const codes = new Set(stocks.map(s => s.code));
  return getAllLatestRows().filter(r => codes.has(r.code));
}

// ============================================
// 4. 统计与清理
// ============================================
function getHistoryStats() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(HISTORY_PREFIX));
  let totalRows = 0;
  const byCode = {};
  for (const key of keys) {
    const code = key.replace(HISTORY_PREFIX, '');
    const rows = loadStockHistory(code);
    totalRows += rows.length;
    if (rows.length) {
      byCode[code] = {
        count: rows.length,
        first: rows[0].date,
        last: rows[rows.length - 1].date,
        name: rows[rows.length - 1].name || code
      };
    }
  }
  return { totalRows, stockCount: Object.keys(byCode).length, byCode };
}

function clearHistory() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(HISTORY_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}

function deleteStockHistory(code) {
  localStorage.removeItem(getHistoryKey(code));
}

// ============================================
// 5. 导出 CSV
// ============================================
function exportHistoryCSV() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(HISTORY_PREFIX));
  const allRows = [];
  for (const key of keys) {
    allRows.push(...loadStockHistory(key.replace(HISTORY_PREFIX, '')));
  }
  allRows.sort((a, b) => a.code === b.code ? a.date.localeCompare(b.date) : a.code.localeCompare(b.code));

  const headers = HISTORY_COLUMNS.map(c => c.label).join(',');
  const lines = allRows.map(r => HISTORY_COLUMNS.map(c => {
    const v = r[c.key];
    if (v == null) return '';
    if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
    return v;
  }).join(','));
  return '\uFEFF' + [headers, ...lines].join('\n');
}

// ============================================
// 导出
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HISTORY_PREFIX, HISTORY_COLUMNS, HISTORY_LIMIT,
    loadStockHistory, saveStockHistory,
    appendHistoryRow, appendHistoryRows,
    getLatestRow, getRow, getRecentRows, getAllLatestRows, getWatchlistLatest,
    getHistoryStats, clearHistory, deleteStockHistory, exportHistoryCSV,
  };
}
if (typeof window !== 'undefined') {
  window.HistoryTable = {
    load: () => ({ rows: getAllLatestRows(), columns: HISTORY_COLUMNS }),
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
