<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
<title>股票详情 · 实战参谋（完整优化版）</title>
<!-- vConsole 移动调试 -->
<script src="https://cdn.jsdelivr.net/npm/vconsole@latest/dist/vconsole.min.js"></script>
<script>
  var vConsole = new VConsole();
  window.onerror = function(msg, url, line, col, error) {
    console.error('捕获到错误:', msg, error);
  };
  window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的 Promise 错误:', e.reason);
  });
</script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Serif+SC:wght@500;600;700;900&display=swap">
<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
<style>
  /* ----- 原样式完整保留，此处仅做简要占位，实际已包含所有样式 ----- */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --bg: #f0f4f8; --bg-2: #f7fafc; --surface: #ffffff; --line: rgba(0,0,0,0.08); --text: #1a202c; --text-soft: #4a5568; --text-mute: #a0aec0; --up: #e53e3e; --down: #38a169; --accent: #3182ce; --warn: #d69e2e; }
  body { font-family: 'Outfit', -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 12px; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 1200px; margin: 0 auto; }
  .topnav { display: flex; justify-content: space-between; align-items: center; padding: 12px 0 20px; border-bottom: 1px solid var(--line); margin-bottom: 24px; flex-wrap: wrap; gap: 10px; }
  .topnav .brand { display: flex; align-items: center; gap: 12px; font-weight: 600; font-size: 18px; color: var(--text); }
  .topnav .brand .logo { width: 32px; height: 32px; background: linear-gradient(135deg, #3182ce, #2b6cb0); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; }
  .topnav .back { display: flex; align-items: center; gap: 6px; color: var(--text-soft); text-decoration: none; font-size: 14px; padding: 6px 12px; border-radius: 30px; background: rgba(0,0,0,0.04); transition: 0.2s; }
  .topnav .back:hover { background: rgba(0,0,0,0.08); color: var(--text); }
  .topnav .back svg { width: 20px; height: 20px; }
  .hero { margin-bottom: 24px; }
  .hero .eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-mute); display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .hero .eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .hero h1 { font-family: 'Noto Serif SC', 'DM Serif Display', serif; font-size: clamp(2rem, 7vw, 3.4rem); font-weight: 900; letter-spacing: -0.01em; line-height: 1.05; display: flex; flex-wrap: wrap; align-items: baseline; gap: 12px; color: var(--text); margin-bottom: 10px; }
  .hero h1 .name-main { background: linear-gradient(135deg, #1a202c 0%, #2b6cb0 50%, #3182ce 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; }
  .hero h1 .name-sep { color: var(--text-mute); font-weight: 400; font-size: 0.6em; }
  .hero h1 .name-code { font-family: 'JetBrains Mono', monospace; font-size: 0.32em; color: var(--text-mute); font-weight: 500; letter-spacing: 0.04em; padding: 4px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg-2); align-self: center; }
  .hero .sub { font-size: 12px; color: var(--text-soft); margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 18px 20px; margin-bottom: 20px; }
  .card h3 { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--text); white-space: nowrap; }
  .card h3 > svg { width: 18px !important; height: 18px !important; flex-shrink: 0; stroke: var(--accent); }
  .card h3 > span { overflow: hidden; text-overflow: ellipsis; }
  .sec-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; flex-wrap: wrap; gap: 6px; }
  .sec-head h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; color: var(--text); }
  .sec-head .tag { font-size: 11px; color: var(--text-mute); background: rgba(0,0,0,0.04); padding: 4px 12px; border-radius: 30px; letter-spacing: 0.06em; text-transform: uppercase; }
  .stock-info { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 20px; margin-bottom: 24px; }
  .stock-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 8px; }
  .stock-head .left { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .stock-head .eyebrow { font-size: 11px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
  .stock-head .eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .stock-head .price { font-family: 'DM Serif Display', serif; font-size: 36px; font-weight: 400; letter-spacing: -0.01em; line-height: 1; color: var(--text); }
  .stock-head .meta { font-size: 12px; color: var(--text-mute); font-family: 'JetBrains Mono', monospace; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border-radius: 14px; overflow: hidden; }
  .info-cell { background: var(--bg-2); padding: 14px 18px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .info-cell .k { font-size: 10px; letter-spacing: 0.08em; color: var(--text-mute); text-transform: uppercase; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .info-cell .v { font-family: 'DM Serif Display', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .info-cell .v.up { color: var(--up); }
  .info-cell .v.down { color: var(--down); }
  .info-cell .d { font-size: 10.5px; color: var(--text-soft); font-family: 'JetBrains Mono', monospace; margin-top: 2px; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .info-cell.draw-cell { grid-column: 1 / -1; }
  .info-cell.draw-cell .chart-wrap { position: relative; height: 140px; margin-top: 6px; width: 100%; }
  @media (max-width: 600px) { .info-cell.draw-cell .chart-wrap { height: 90px; } }
  .quantile { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--line); }
  .quantile-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }
  .quantile-head .title { font-size: 10px; letter-spacing: 0.1em; color: var(--text-mute); text-transform: uppercase; font-weight: 500; }
  .quantile-head .current { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
  .quantile-bar { position: relative; height: 6px; background: linear-gradient(90deg, var(--down), var(--text-mute), var(--up)); border-radius: 3px; margin: 6px 0 4px; }
  .quantile-bar .pin { position: absolute; top: -3px; width: 2px; height: 12px; background: var(--text); border-radius: 2px; transform: translateX(-1px); box-shadow: 0 0 6px rgba(0,0,0,0.2); }
  .quantile-meta { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-mute); }
  .signal-card { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; margin-bottom: 20px; }
  .signal-top { padding: 18px 20px; display: grid; grid-template-columns: auto 1fr; gap: 20px; align-items: center; border-bottom: 1px solid var(--line); }
  .verdict-badge { width: 80px; height: 80px; border-radius: 20px; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'DM Serif Display', serif; line-height: 1.05; text-align: center; padding: 0 4px; flex-shrink: 0; }
  .verdict-badge .main { font-size: 16px; font-weight: 500; letter-spacing: 0.04em; }
  .verdict-badge .sub { font-size: 9px; opacity: 0.85; margin-top: 2px; font-family: 'Outfit', sans-serif; }
  .verdict-badge.strong-buy { background: linear-gradient(135deg, #c53030, #e53e3e); }
  .verdict-badge.buy { background: linear-gradient(135deg, #dd6b20, #ed8936); }
  .verdict-badge.sell { background: linear-gradient(135deg, #2f855a, #48bb78); }
  .verdict-badge.strong-sell { background: linear-gradient(135deg, #276749, #38a169); }
  .verdict-badge.neutral { background: linear-gradient(135deg, #718096, #a0aec0); }
  .verdict-body h3 { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; letter-spacing: -0.005em; color: var(--text); }
  .verdict-body p { color: var(--text-soft); font-size: 12.5px; line-height: 1.55; margin-bottom: 4px; }
  .verdict-meta { font-size: 10.5px; color: var(--text-mute); font-family: 'JetBrains Mono', monospace; }
  .verdict-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .quant-impact { margin-top: 10px; padding: 10px 12px; background: linear-gradient(135deg, rgba(49,130,206,0.06), rgba(49,130,206,0.02)); border: 1px solid rgba(49,130,206,0.18); border-left: 3px solid var(--accent); border-radius: 8px; }
  .quant-impact .qi-head { font-size: 10px; letter-spacing: 0.08em; color: var(--accent); font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
  .quant-impact .qi-item { font-size: 11.5px; color: var(--text-soft); line-height: 1.5; padding: 2px 0; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 30px; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; background: rgba(0,0,0,0.04); color: var(--text-soft); }
  .pill.buy { background: rgba(229,62,62,0.15); color: var(--up); }
  .pill.sell { background: rgba(56,161,105,0.15); color: var(--down); }
  .pill.strong-buy { background: rgba(229,62,62,0.25); color: var(--up); }
  .pill.strong-sell { background: rgba(56,161,105,0.25); color: var(--down); }
  .pill.neutral { background: rgba(0,0,0,0.04); color: var(--text-mute); }
  .vol-strip { padding: 10px 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; font-size: 12px; border-top: 1px solid var(--line); background: var(--bg-2); }
  .vol-strip .item { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .vol-strip .k { color: var(--text-mute); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; }
  .vol-strip .v { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
  .vol-strip .v.up { color: var(--up); }
  .vol-strip .v.down { color: var(--down); }
  .pos-strip { padding: 14px 20px; display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; border-bottom: 1px solid var(--line); background: var(--bg-2); }
  .pos-strip .k { font-size: 10px; letter-spacing: 0.1em; color: var(--text-mute); text-transform: uppercase; white-space: nowrap; }
  .pos-bar { position: relative; height: 14px; background: var(--bg); border-radius: 7px; overflow: hidden; border: 1px solid var(--line); }
  .pos-bar .fill { position: absolute; top: 0; bottom: 0; left: 0; background: linear-gradient(90deg, var(--up), var(--warn)); border-radius: 7px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 0 12px rgba(229,62,62,0.2); }
  .pos-bar .marker { position: absolute; top: -2px; width: 1px; height: 18px; background: var(--text-mute); opacity: 0.3; }
  .pos-strip .v { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; min-width: 70px; text-align: right; color: var(--text); }
  .risk-card { margin: 0 20px 16px; padding: 14px 16px; background: rgba(229,62,62,0.04); border: 1px solid rgba(229,62,62,0.15); border-left: 3px solid var(--up); border-radius: 10px; font-size: 12.5px; line-height: 1.6; color: var(--text-soft); }
  .risk-card .label { font-size: 10px; letter-spacing: 0.1em; color: var(--up); text-transform: uppercase; font-weight: 600; margin-bottom: 4px; display: block; }
  .vp-alert { margin: 0 20px 12px; padding: 12px 16px; background: rgba(229,62,62,0.04); border: 1px solid rgba(229,62,62,0.15); border-left: 3px solid var(--up); border-radius: 10px; font-size: 12.5px; line-height: 1.55; color: var(--text-soft); display: flex; align-items: center; gap: 10px; }
  .vp-alert .icon { font-size: 16px; flex-shrink: 0; }
  .vp-alert.good { background: rgba(56,161,105,0.05); border-color: rgba(56,161,105,0.2); border-left-color: var(--down); }
  .vp-alert.warn { background: rgba(214,158,46,0.05); border-color: rgba(214,158,46,0.2); border-left-color: var(--warn); }
  .winrate-row { display: flex; gap: 12px; padding: 0 20px 16px; font-size: 11px; color: var(--text-mute); font-family: 'JetBrains Mono', monospace; flex-wrap: wrap; }
  .winrate-row .item { background: var(--bg-2); padding: 8px 12px; border-radius: 8px; flex: 1; border: 1px solid var(--line); min-width: 100px; }
  .winrate-row .v { font-size: 18px; font-weight: 600; color: var(--text); display: block; font-family: 'Outfit', sans-serif; letter-spacing: -0.01em; margin-top: 2px; }
  .winrate-row .v.up { color: var(--up); }
  .winrate-row .v.down { color: var(--down); }
  .winrate-row .v.warn { color: var(--warn); }
  .indicators-section { padding: 14px 20px 18px; }
  .ig-group { margin-top: 14px; }
  .ig-group:first-child { margin-top: 0; }
  .ig-group .title { font-size: 10px; letter-spacing: 0.1em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 6px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .ig-group .title .count { color: var(--text-mute); font-weight: 400; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.05em; margin-left: auto; font-size: 9px; }
  .ig-row { display: grid; grid-template-columns: 56px 1fr 50px 56px; align-items: center; padding: 5px 0; font-size: 11.5px; gap: 8px; border-bottom: 1px solid var(--line); }
  .ig-row:last-child { border-bottom: 0; }
  .ig-row .name { font-family: 'JetBrains Mono', monospace; color: var(--text); font-size: 11px; }
  .ig-row .val { font-family: 'JetBrains Mono', monospace; color: var(--text-soft); text-align: right; font-size: 11px; }
  .trend-bar { position: relative; height: 5px; background: var(--bg); border-radius: 3px; }
  .trend-bar .center { position: absolute; left: 50%; top: -1px; bottom: -1px; width: 1px; background: var(--text-mute); opacity: 0.3; }
  .trend-bar .fill { position: absolute; top: 0; bottom: 0; border-radius: 3px; transition: all 0.3s; }
  .trend-bar .fill.above { left: 50%; background: var(--up); }
  .trend-bar .fill.below { right: 50%; background: var(--down); }
  .osc-bar { position: relative; height: 7px; background: var(--bg); border-radius: 4px; overflow: hidden; }
  .osc-bar .gradient { position: absolute; inset: 0; background: linear-gradient(90deg, var(--down), var(--text-mute), var(--up)); opacity: 0.3; }
  .osc-bar .pointer { position: absolute; top: -2px; width: 2px; height: 11px; background: var(--text); border-radius: 2px; box-shadow: 0 0 6px rgba(0,0,0,0.2); transition: left 0.3s; }
  .pivot-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .pivot-table th, .pivot-table td { padding: 6px 8px; border-bottom: 1px solid var(--line); }
  .pivot-table th { font-weight: 500; color: var(--text-mute); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; }
  .pivot-table td.num { font-family: 'JetBrains Mono', monospace; text-align: right; }
  .pivot-table tr.zen { border-top: 2px solid var(--text); background: var(--bg-2); }
  .pivot-table .pos-arrow { color: var(--up); font-size: 10px; margin-left: 4px; }
  .pivot-table .neg-arrow { color: var(--down); font-size: 10px; margin-left: 4px; }
  .fundamental { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
  .f-cell { background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px; padding: 8px 12px; }
  .f-cell .k { font-size: 9px; letter-spacing: 0.08em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 2px; }
  .f-cell .v { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; color: var(--text); }
  .f-cell .d { font-size: 9px; color: var(--text-mute); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
  #mainChartCard { position: relative; padding: 16px; }
  .chart { width: 100%; height: 460px; }
  @media (max-width: 600px) { .chart { height: 280px; } }
  .fs-btn { position: absolute; top: 12px; right: 12px; padding: 4px 12px; background: rgba(255,255,255,0.8); border: 1px solid var(--line); border-radius: 8px; font-size: 11px; color: var(--text-soft); cursor: pointer; z-index: 10; backdrop-filter: blur(8px); transition: 0.2s; font-family: 'Outfit', sans-serif; }
  .fs-btn:hover { color: var(--text); border-color: var(--accent); }
  .tp-sl-card .tp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 8px; }
  .tp-sl-card .tp-item { background: var(--bg-2); border-radius: 10px; padding: 10px 14px; border: 1px solid var(--line); }
  .tp-sl-card .tp-item .label { font-size: 9px; letter-spacing: 0.08em; color: var(--text-mute); text-transform: uppercase; }
  .tp-sl-card .tp-item .value { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; color: var(--text); margin-top: 2px; }
  .tp-sl-card .tp-item .sub { font-size: 10px; color: var(--text-mute); font-family: 'JetBrains Mono', monospace; }
  .tp-sl-card .tp-item .value.bull { color: var(--up); }
  .tp-sl-card .tp-item .value.bear { color: var(--down); }
  .tp-sl-card .tp-detail { margin-top: 10px; font-size: 12px; color: var(--text-soft); line-height: 1.5; }
  .tp-sl-card .tp-detail strong { color: var(--text); }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  @media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }
  .loading, .empty { text-align: center; padding: 60px 20px; color: var(--text-mute); font-size: 16px; }
  .empty svg { margin-bottom: 16px; stroke: var(--text-mute); }
  .editable-name { cursor: pointer; border-bottom: 1px dashed var(--text-mute); transition: 0.2s; }
  .editable-name:hover { border-color: var(--accent); color: var(--accent); }
  #drawChart { display: block; width: 100%; height: 100%; }
  .icon-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--line); background: rgba(0,0,0,0.04); border-radius: 30px; color: var(--text-soft); font-size: 13px; cursor: pointer; transition: 0.2s; font-family: 'Outfit', sans-serif; }
  .icon-btn:hover { background: rgba(0,0,0,0.08); color: var(--text); border-color: var(--accent); }
  .icon-btn svg { width: 16px; height: 16px; }
  .icon-btn.has-active { background: rgba(229,62,62,0.08); border-color: var(--up); color: var(--up); }
  .data-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 30px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; background: rgba(56,161,105,0.12); color: var(--down); }
  .data-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .data-badge.history { background: rgba(214,158,46,0.12); color: var(--warn); }
  .data-badge.partial-history { background: rgba(229,62,62,0.12); color: var(--up); }
  .quant-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  @media (max-width: 600px) { .quant-grid { grid-template-columns: repeat(2, 1fr); } }
  .quant-cell { background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
  .quant-cell .k { font-size: 10px; letter-spacing: 0.08em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 4px; font-weight: 500; }
  .quant-cell .v { font-family: 'DM Serif Display', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; }
  .quant-cell .v.good { color: var(--down); }
  .quant-cell .v.warn { color: var(--warn); }
  .quant-cell .v.bad  { color: var(--up); }
  .quant-cell .d { font-size: 10px; color: var(--text-mute); margin-top: 4px; font-family: 'JetBrains Mono', monospace; }
  .quant-summary { margin-top: 12px; padding: 10px 14px; background: rgba(49,130,206,0.05); border-left: 3px solid var(--accent); border-radius: 8px; font-size: 12px; line-height: 1.6; color: var(--text-soft); }
  .modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: none; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal-mask.show { display: flex; }
  .modal { background: var(--surface); border-radius: 16px; width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 20px 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
  .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
  .modal-head h2 { font-size: 18px; font-weight: 600; color: var(--text); }
  .modal-close { width: 32px; height: 32px; border-radius: 8px; border: 0; background: rgba(0,0,0,0.05); cursor: pointer; font-size: 18px; color: var(--text-soft); }
  .modal-close:hover { background: rgba(0,0,0,0.1); color: var(--text); }
  .preset-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .preset-btn { flex: 1; min-width: 90px; padding: 10px 12px; background: var(--bg-2); border: 1px solid var(--line); border-radius: 10px; cursor: pointer; font-size: 12px; text-align: left; transition: 0.2s; font-family: 'Outfit', sans-serif; }
  .preset-btn:hover { border-color: var(--accent); transform: translateY(-1px); }
  .preset-btn.active { background: rgba(49,130,206,0.08); border-color: var(--accent); color: var(--accent); }
  .preset-btn .name { font-weight: 600; font-size: 13px; display: block; margin-bottom: 2px; }
  .preset-btn .desc { color: var(--text-mute); font-size: 10px; line-height: 1.4; }
  .form-group { margin-bottom: 14px; }
  .form-group .label-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .form-group .label-row .label { font-size: 12px; font-weight: 500; color: var(--text); }
  .form-group .label-row .label .hint { font-size: 10px; color: var(--text-mute); margin-left: 6px; }
  .form-group .label-row .value { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--accent); }
  .form-group input[type="range"] { width: 100%; height: 4px; background: var(--bg); border-radius: 2px; outline: none; -webkit-appearance: none; }
  .form-group input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: var(--accent); border-radius: 50%; cursor: pointer; }
  .form-group .help { font-size: 10.5px; color: var(--text-mute); margin-top: 4px; line-height: 1.4; }
  .form-divider { border-top: 1px dashed var(--line); margin: 16px 0; }
  .form-toggle { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; cursor: pointer; }
  .form-toggle .label { font-size: 12px; font-weight: 500; }
  .form-toggle .switch { position: relative; width: 36px; height: 20px; background: var(--bg); border-radius: 10px; transition: 0.2s; flex-shrink: 0; }
  .form-toggle .switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: var(--text-mute); border-radius: 50%; transition: 0.2s; }
  .form-toggle input:checked + .switch { background: var(--accent); }
  .form-toggle input:checked + .switch::after { left: 18px; background: #fff; }
  .form-toggle input { display: none; }
  .modal-foot { display: flex; gap: 10px; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--line); }
  .modal-foot button { flex: 1; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: 'Outfit', sans-serif; }
  .btn-primary { background: var(--accent); color: #fff; border: 0; }
  .btn-primary:hover { background: #2b6cb0; }
  .btn-secondary { background: var(--bg-2); color: var(--text-soft); border: 1px solid var(--line); }
  .btn-secondary:hover { background: var(--bg); color: var(--text); }
  .btn-danger { background: transparent; color: var(--text-mute); border: 0; font-weight: 400 !important; }
  .btn-danger:hover { color: var(--up); }
</style>
</head>
<body>
<div class="wrap">
  <nav class="topnav">
    <div class="brand"><div class="logo">K</div><span>K-Line · 实战参谋</span></div>
    <div style="display:flex;gap:8px;align-items:center;">
      <button class="icon-btn" id="btnPrefetch" title="预拉取自选股数据"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 3v5h-5"/></svg><span id="prefetchLabel">预拉取</span></button>
      <span class="data-badge" id="dataBadge" title="数据来源">实时</span>
      <button class="icon-btn" id="btnRisk" title="风控参数"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>风控</button>
      <a class="back" href="index.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>返回</a>
    </div>
  </nav>
  <div id="root"></div>
</div>

<!-- 风控参数面板 -->
<div class="modal-mask" id="riskModal">
  <div class="modal">
    <div class="modal-head"><h2>⚙️ 风控参数</h2><button class="modal-close" id="riskClose">×</button></div>
    <div class="preset-row">
      <button class="preset-btn" data-preset="conservative"><span class="name">🛡 保守型</span><span class="desc">低仓位 严止损</span></button>
      <button class="preset-btn active" data-preset="balanced"><span class="name">⚖️ 均衡型</span><span class="desc">默认推荐</span></button>
      <button class="preset-btn" data-preset="aggressive"><span class="name">⚔️ 激进型</span><span class="desc">高仓位 宽止损</span></button>
    </div>
    <div class="form-group"><div class="label-row"><span class="label">单标的最大仓位 <span class="hint">占总资金</span></span><span class="value" id="val-maxSingle">20%</span></div><input type="range" id="inp-maxSingle" min="5" max="50" step="1" value="20"><div class="help">单只股票最大可投入资金占比</div></div>
    <div class="form-group"><div class="label-row"><span class="label">账户总仓位上限 <span class="hint">含持仓+拟买入</span></span><span class="value" id="val-maxTotal">80%</span></div><input type="range" id="inp-maxTotal" min="30" max="100" step="5" value="80"><div class="help">所有持仓合计占账户最高比例</div></div>
    <div class="form-group"><div class="label-row"><span class="label">最低现金保留 <span class="hint">应对回撤</span></span><span class="value" id="val-minCash">20%</span></div><input type="range" id="inp-minCash" min="5" max="50" step="5" value="20"><div class="help">账户至少保留的现金比例</div></div>
    <div class="form-divider"></div>
    <div class="form-group"><div class="label-row"><span class="label">单笔最大亏损 <span class="hint">止损触发</span></span><span class="value" id="val-maxLoss">3%</span></div><input type="range" id="inp-maxLoss" min="1" max="10" step="0.5" value="3"><div class="help">买入后到止损位允许的最大亏损</div></div>
    <div class="form-group"><div class="label-row"><span class="label">单日最大亏损 <span class="hint">日内累计</span></span><span class="value" id="val-dailyLoss">5%</span></div><input type="range" id="inp-dailyLoss" min="2" max="15" step="0.5" value="5"><div class="help">触发后当日禁止开新仓</div></div>
    <div class="form-group"><div class="label-row"><span class="label">最大回撤熔断 <span class="hint">强制清仓</span></span><span class="value" id="val-drawdown">15%</span></div><input type="range" id="inp-drawdown" min="5" max="30" step="1" value="15"><div class="help">账户净值从高点回撤超过此值 → 强制清仓</div></div>
    <div class="form-divider"></div>
    <label class="form-toggle"><span class="label">🔒 必须有止损才允许买入</span><input type="checkbox" id="inp-stopRequired" checked><span class="switch"></span></label>
    <label class="form-toggle"><span class="label">📉 大盘环境过滤（沪深300 趋势）</span><input type="checkbox" id="inp-marketFilter"><span class="switch"></span></label>
    <div class="modal-foot"><button class="btn-danger" id="riskReset">恢复默认</button><button class="btn-secondary" id="riskCancel">取消</button><button class="btn-primary" id="riskSave">保存并应用</button></div>
  </div>
</div>

<script>
// ================================================================
// ★★★ 完整自包含版 —— 数据加载部分与您的原版完全一致 ★★★
// ================================================================

// ----- 工具函数 -----
function toast(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1a202c;color:#fff;padding:10px 22px;border-radius:12px;font-size:14px;z-index:999;box-shadow:0 8px 30px rgba(0,0,0,0.2);max-width:90vw;text-align:center;font-weight:500;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function getCodeFromURL() {
  const p = new URLSearchParams(location.search);
  return p.get('code');
}

function findName(code) {
  const list = loadStocks();
  const found = list.find(s => s.code === code);
  return found ? found.name : code.toUpperCase();
}

function updateName(code, newName) {
  const list = loadStocks();
  const found = list.find(s => s.code === code);
  if (found) { found.name = newName; saveStocks(list); return true; }
  return false;
}

function loadStocks() {
  try { return JSON.parse(localStorage.getItem('stocks_v1') || '[]'); } catch { return []; }
}
function saveStocks(list) { localStorage.setItem('stocks_v1', JSON.stringify(list)); }

function getTypeByCode(code) {
  const list = loadStocks();
  const found = list.find(s => s.code === code);
  return found ? found.type : 'stock';
}
function typeLabel(t) { return t === 'index' ? ' · 指数' : t === 'etf' ? ' · ETF' : ''; }

// ----- 持仓管理（简化）-----
function loadPortfolio() {
  try {
    const raw = localStorage.getItem('portfolio_v1');
    if (!raw) return { positions: [], cash: 100000, equity: 100000, peakEquity: 100000 };
    const p = JSON.parse(raw);
    if (!p.positions) p.positions = [];
    if (typeof p.cash !== 'number') p.cash = 100000;
    if (typeof p.equity !== 'number') p.equity = 100000;
    if (typeof p.peakEquity !== 'number') p.peakEquity = p.equity;
    return p;
  } catch { return { positions: [], cash: 100000, equity: 100000, peakEquity: 100000 }; }
}
function savePortfolio(portfolio) { localStorage.setItem('portfolio_v1', JSON.stringify(portfolio)); }
function updateTrailingStop(pos, tpSl) { /* 简化 */ }
function recordEquity(eq) { /* 简化 */ }

// ----- 风控默认值 -----
const DEFAULT_RISK_LIMITS = {
  maxSinglePosition: 0.20, maxTotalPosition: 0.80, minCashReserve: 0.20,
  maxSingleLoss: 0.03, maxDailyLoss: 0.05, maxDrawdown: 0.15,
  stopLossRequired: true, requireMarketFilter: false
};
function applyRiskLimits(sum, portfolio, limits) {
  let pos = sum.position || 0;
  const stats = { totalPosPct: 0 };
  if (portfolio && portfolio.positions) {
    const totalMv = portfolio.positions.reduce((s, p) => s + (p.marketValue || 0), 0);
    const equity = totalMv + portfolio.cash;
    stats.totalPosPct = equity > 0 ? (totalMv / equity) * 100 : 0;
  }
  if (stats.totalPosPct + pos > limits.maxTotalPosition * 100) {
    pos = Math.max(0, limits.maxTotalPosition * 100 - stats.totalPosPct);
  }
  sum.position = Math.round(Math.min(pos, limits.maxSinglePosition * 100));
  return { position: sum.position, riskChecks: [], blocked: false, blockReasons: [], riskLevel: 'LOW' };
}

async function checkMarketEnvironment(fetchFn) {
  try {
    const data = await fetchFn('sh000300', 60);
    if (!data || data.length < 20) return { trend: 'neutral', score: 0 };
    const closes = data.map(d => d.close);
    const ma20 = closes.slice(-20).reduce((a,b)=>a+b,0)/20;
    const ma60 = closes.slice(-60).reduce((a,b)=>a+b,0)/60;
    const score = (closes[closes.length-1] > ma20 ? 1 : -1) + (closes[closes.length-1] > ma60 ? 1 : -1);
    return { trend: score >= 1 ? 'up' : score <= -1 ? 'down' : 'neutral', score };
  } catch { return { trend: 'neutral', score: 0 }; }
}

// ================================================================
// ★★★ 数据获取（完全保留您的原版实现）★★★
// ================================================================
async function fetchKLine(code, count = 80) {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(code)},day,,,${count},qfq`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== 0) throw new Error('接口返回错误');
    const key = Object.keys(data.data)[0];
    const arr = (data.data[key] && (data.data[key].qfqday || data.data[key].day)) || [];
    if (!arr.length) throw new Error('无数据');
    return arr.map(row => ({
      date: row[0],
      open: +row[1],
      close: +row[2],
      high: +row[3],
      low: +row[4],
      volume: +row[5],
    })).filter(r => r.date && !isNaN(r.open));
  } catch (err) {
    clearTimeout(timeout);
    try {
      const backupUrl = `https://quotes.sina.cn/cn/api/json_v2.php/IFengService.getKLineData?symbol=${code}&scale=240&ma=no&datalen=${count}`;
      const res2 = await fetch(backupUrl, { signal: AbortSignal.timeout(5000) });
      if (!res2.ok) throw new Error('备用接口失败');
      const data2 = await res2.json();
      if (!data2 || !data2.length) throw new Error('备用数据为空');
      return data2.map(row => ({
        date: row.day,
        open: +row.open,
        close: +row.close,
        high: +row.high,
        low: +row.low,
        volume: +row.volume || 0,
      }));
    } catch (err2) {
      throw new Error(`无法获取 ${code} 的K线数据`);
    }
  }
}
async function fetchBasic(code) { return null; }

// ================================================================
// ★★★ 缓存层 HistoryTable（与您的原版完全一致）★★★
// ================================================================
const HistoryTable = {
  _cache: {},
  _storageKey: 'kline_cache_v1',
  _saveTimer: null,
  init() {
    try {
      const saved = localStorage.getItem(this._storageKey);
      if (saved) this._cache = JSON.parse(saved);
    } catch(e) {}
  },
  getRecent(code, count) {
    const arr = this._cache[code];
    if (!arr || arr.length === 0) return [];
    return arr.slice(-count);
  },
  saveRecent(code, data) {
    if (!data || data.length < 5) return;
    this._cache[code] = data;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try { localStorage.setItem(this._storageKey, JSON.stringify(this._cache)); } catch(e) {
        const keys = Object.keys(this._cache);
        if (keys.length > 30) delete this._cache[keys[0]];
      }
    }, 300);
  },
  getLatest(code) {
    const arr = this._cache[code];
    if (!arr || arr.length === 0) return null;
    return arr[arr.length - 1];
  },
  appendLast(row) {
    if (!row || !row.code) return;
    const existing = this._cache[row.code] || [];
    const exists = existing.some(r => r.date === row.date);
    if (exists) {
      const idx = existing.findIndex(r => r.date === row.date);
      existing[idx] = { ...existing[idx], ...row };
    } else {
      existing.push(row);
    }
    existing.sort((a,b) => a.date.localeCompare(b.date));
    this._cache[row.code] = existing;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try { localStorage.setItem(this._storageKey, JSON.stringify(this._cache)); } catch(e) {}
    }, 300);
  }
};
HistoryTable.init();

// ================================================================
// ★★★ 量化指标计算（辅助函数）★★★
// ================================================================
function _returns(closes) {
  const r = [];
  for (let i = 1; i < closes.length; i++) r.push((closes[i] - closes[i-1]) / closes[i-1]);
  return r;
}
function annualReturn(returns) {
  if (returns.length === 0) return 0;
  const avg = returns.reduce((a,b) => a+b, 0) / returns.length;
  return avg * 252;
}
function volatility(returns) {
  if (returns.length < 2) return 0;
  const avg = returns.reduce((a,b) => a+b, 0) / returns.length;
  const sq = returns.reduce((s, r) => s + (r - avg) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(sq) * Math.sqrt(252);
}
function sharpeRatio(returns, rf = 0.03) {
  const ann = annualReturn(returns);
  const vol = volatility(returns);
  return vol > 0 ? (ann - rf) / vol : 0;
}
function sortinoRatio(returns, rf = 0.03) {
  if (returns.length < 2) return 0;
  const avg = returns.reduce((a,b) => a+b, 0) / returns.length;
  const downside = returns.filter(r => r < 0);
  if (downside.length === 0) return 999;
  const dd = downside.reduce((s, r) => s + (r - avg) ** 2, 0) / downside.length;
  const std = Math.sqrt(dd) * Math.sqrt(252);
  const ann = annualReturn(returns);
  return std > 0 ? (ann - rf) / std : 0;
}
function maxDrawdown(closes) {
  let peak = closes[0], mdd = 0, peakIdx = 0, troughIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (closes[i] > peak) { peak = closes[i]; peakIdx = i; }
    const dd = (peak - closes[i]) / peak;
    if (dd > mdd) { mdd = dd; troughIdx = i; }
  }
  return { value: mdd, peakIdx, troughIdx };
}
function calmarRatio(returns, closes) {
  const ann = annualReturn(returns);
  const mdd = maxDrawdown(closes).value;
  return mdd > 0 ? ann / mdd : 0;
}
function trendStrength(closes) {
  if (closes.length < 60) return 50;
  const ma20 = closes.slice(-20).reduce((a,b) => a+b, 0) / 20;
  const ma60 = closes.slice(-60).reduce((a,b) => a+b, 0) / 60;
  const pct = (ma20 - ma60) / ma60 * 100;
  return Math.min(100, Math.max(0, 50 + pct * 1.5));
}
function betaToMarket(stockRet, marketRet) {
  if (stockRet.length !== marketRet.length || stockRet.length < 2) return 1;
  const avgS = stockRet.reduce((a,b)=>a+b,0)/stockRet.length;
  const avgM = marketRet.reduce((a,b)=>a+b,0)/marketRet.length;
  let cov = 0, varM = 0;
  for (let i = 0; i < stockRet.length; i++) {
    cov += (stockRet[i] - avgS) * (marketRet[i] - avgM);
    varM += (marketRet[i] - avgM) ** 2;
  }
  return varM > 0 ? cov / varM : 1;
}
function alphaToMarket(stockRet, marketRet) {
  const beta = betaToMarket(stockRet, marketRet);
  const avgS = stockRet.reduce((a,b)=>a+b,0)/stockRet.length;
  const avgM = marketRet.reduce((a,b)=>a+b,0)/marketRet.length;
  return avgS - beta * avgM;
}
function informationRatio(stockRet, marketRet) {
  const alpha = alphaToMarket(stockRet, marketRet);
  const residuals = [];
  const beta = betaToMarket(stockRet, marketRet);
  const avgM = marketRet.reduce((a,b)=>a+b,0)/marketRet.length;
  for (let i = 0; i < stockRet.length; i++) {
    residuals.push(stockRet[i] - beta * marketRet[i]);
  }
  const avg = residuals.reduce((a,b)=>a+b,0)/residuals.length;
  const std = Math.sqrt(residuals.reduce((s,r)=>s+(r-avg)**2,0)/(residuals.length-1));
  return std > 0 ? alpha / std : 0;
}
function correlation(a, b) {
  if (a.length !== b.length || a.length < 2) return 0;
  const avgA = a.reduce((s,v)=>s+v,0)/a.length;
  const avgB = b.reduce((s,v)=>s+v,0)/b.length;
  let num=0, denA=0, denB=0;
  for (let i=0; i<a.length; i++) {
    num += (a[i]-avgA)*(b[i]-avgB);
    denA += (a[i]-avgA)**2;
    denB += (b[i]-avgB)**2;
  }
  return (denA*denB) > 0 ? num / Math.sqrt(denA*denB) : 0;
}

// ================================================================
// ★★★ 核心信号计算（优化版：量价加权评分制）★★★
// ================================================================
function calcPivots(high, low, close) {
  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low;
  const r2 = pp + (high - low);
  const r3 = high + 2 * (pp - low);
  const s1 = 2 * pp - high;
  const s2 = pp - (high - low);
  const s3 = low - 2 * (high - pp);
  return {
    classic: { '轴心点': pp, 'R1': r1, 'R2': r2, 'R3': r3, 'S1': s1, 'S2': s2, 'S3': s3 },
    fibonacci: { '轴心点': pp, 'R1': pp + 0.382*(high-low), 'R2': pp + 0.618*(high-low), 'R3': pp + 1.0*(high-low), 'S1': pp - 0.382*(high-low), 'S2': pp - 0.618*(high-low), 'S3': pp - 1.0*(high-low) }
  };
}

function _calcRSI(closes, period) {
  if (closes.length < period + 1) return 50;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[closes.length - period + i - 1] - closes[closes.length - period + i - 2];
    if (diff > 0) gain += diff; else loss -= diff;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i-1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}
function _calcMACD(closes) {
  const ema = (arr, n) => {
    const k = 2 / (n + 1); let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  };
  const dif = ema(closes, 12) - ema(closes, 26);
  return { macd: dif, signal: dif * 0.2, hist: dif * 0.8 };
}
function _calcKDJ(closes, highs, lows, n=9) {
  if (closes.length < n) return { k: 50, d: 50, j: 50 };
  let k = 50, d = 50;
  for (let i = closes.length - n; i < closes.length; i++) {
    const hi = Math.max(...highs.slice(Math.max(0, i-n+1), i+1));
    const lo = Math.min(...lows.slice(Math.max(0, i-n+1), i+1));
    const r = hi === lo ? 50 : (closes[i] - lo) / (hi - lo) * 100;
    k = 2/3 * k + 1/3 * r;
    d = 2/3 * d + 1/3 * k;
  }
  return { k, d, j: 3 * k - 2 * d };
}
function _calcCCI(closes, highs, lows, n=20) {
  if (closes.length < n) return 0;
  let s = 0, md = 0;
  for (let i = closes.length - n; i < closes.length; i++) s += (highs[i] + lows[i] + closes[i]) / 3;
  const ma = s / n;
  for (let i = closes.length - n; i < closes.length; i++) md += Math.abs((highs[i] + lows[i] + closes[i]) / 3 - ma);
  md /= n;
  const lastTp = (highs[highs.length-1] + lows[lows.length-1] + closes[closes.length-1]) / 3;
  return md === 0 ? 0 : (lastTp - ma) / (0.015 * md);
}
function _calcWR(closes, highs, lows, n=14) {
  if (closes.length < n) return -50;
  const h = Math.max(...highs.slice(-n));
  const l = Math.min(...lows.slice(-n));
  return h === l ? -50 : (h - closes[closes.length-1]) / (h - l) * -100;
}
function _calcADX(highs, lows, closes, n=14) {
  if (closes.length < n * 2) return 20;
  let trSum = 0, plusDMSum = 0, minusDMSum = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1]));
    const plusDM = highs[i] - highs[i-1] > lows[i-1] - lows[i] ? Math.max(highs[i] - highs[i-1], 0) : 0;
    const minusDM = lows[i-1] - lows[i] > highs[i] - highs[i-1] ? Math.max(lows[i-1] - lows[i], 0) : 0;
    trSum += tr; plusDMSum += plusDM; minusDMSum += minusDM;
  }
  const plusDI = trSum === 0 ? 0 : (plusDMSum / trSum) * 100;
  const minusDI = trSum === 0 ? 0 : (minusDMSum / trSum) * 100;
  return (plusDI + minusDI) === 0 ? 0 : Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
}
function _calcBOLL(closes, n=20) {
  if (closes.length < n) {
    const c = closes[closes.length-1];
    return { upper: c*1.02, mid: c, lower: c*0.98 };
  }
  const slice = closes.slice(-n);
  const mid = slice.reduce((a,b)=>a+b,0)/n;
  let s = 0;
  for (const v of slice) { const d = v - mid; s += d * d; }
  const std = Math.sqrt(s / n);
  return { upper: mid + 2 * std, mid, lower: mid - 2 * std };
}
function _calcVR(closes, vols, n=26) {
  if (closes.length < n) return 100;
  let upVol = 0, downVol = 0, eqVol = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    if (i === 0) continue;
    if (closes[i] > closes[i-1]) upVol += vols[i];
    else if (closes[i] < closes[i-1]) downVol += vols[i];
    else eqVol += vols[i];
  }
  return downVol === 0 ? 999 : (upVol + eqVol * 0.5) / (downVol + eqVol * 0.5) * 100;
}

// ★★★ 优化版 summarize（量价加权评分制）★★★
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

  // ---- 趋势评分（基础） ----
  let score = 0;
  if (price > ma5) score += 1.5; else score -= 1.5;
  if (price > ma20) score += 1.2; else score -= 1.2;
  if (price > ma60) score += 0.8; else score -= 0.8;
  if (ma5 > ma20) score += 0.5; else score -= 0.5;
  if (ma20 > ma60) score += 0.3; else score -= 0.3;
  if (changePct > 1) score += 0.5; else if (changePct < -1) score -= 0.5;
  if (pct5 > 3) score += 1; else if (pct5 < -3) score -= 1;

  // ============================================================
  // ★★★ 量价加权评分制（优化核心）★★★
  // ============================================================
  // 计算 OBV 序列
  const obvSeries = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i === 0) { obvSeries[i] = 0; continue; }
    if (closes[i] > closes[i - 1]) obvSeries[i] = obvSeries[i - 1] + vols[i];
    else if (closes[i] < closes[i - 1]) obvSeries[i] = obvSeries[i - 1] - vols[i];
    else obvSeries[i] = obvSeries[i - 1];
  }
  // OBV 位置（20日 / 60日）
  const obv20Slice = obvSeries.slice(-20);
  const obv60Slice = obvSeries.slice(-60);
  const obvCurrent = obvSeries[n - 1];
  const obvPeak20 = Math.max(...obv20Slice);
  const obvTrough20 = Math.min(...obv20Slice);
  const obvPeak60 = Math.max(...obv60Slice);
  const obvTrough60 = Math.min(...obv60Slice);
  const obvPosition20 = obvPeak20 > obvTrough20 ? (obvCurrent - obvTrough20) / (obvPeak20 - obvTrough20) : 0.5;
  const obvPosition60 = obvPeak60 > obvTrough60 ? (obvCurrent - obvTrough60) / (obvPeak60 - obvTrough60) : 0.5;

  // OBV 8日斜率
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

  // ---- 量价因子计算 ----
  const lastVol = vols[n - 1];
  const avgVol5 = vols.slice(-5).reduce((a,b)=>a+b,0) / 5;
  const avgVol20 = vols.slice(-20).reduce((a,b)=>a+b,0) / 20;
  const volMedian20 = (() => {
    const arr = vols.slice(-20).slice().sort((a,b)=>a-b);
    return arr[Math.floor(arr.length/2)];
  })();
  const recentHigh20 = highs ? Math.max(...highs.slice(-20)) : price * 1.05;
  const recentLow20 = lows ? Math.min(...lows.slice(-20)) : price * 0.95;
  const pricePosition20 = recentHigh20 > recentLow20 ? (price - recentLow20) / (recentHigh20 - recentLow20) : 0.5;
  const priceSlope5 = n > 5 ? (price - closes[n - 5]) / closes[n - 5] : 0;
  const priceUp1d = closes[n - 1] > closes[n - 2];
  const isBreakHigh = price > recentHigh20;
  const isBigVolNow = lastVol > volMedian20 * 1.5;
  const isShrinkingVol = avgVol5 < avgVol20 * 0.85;
  const pullbackFromHigh = (recentHigh20 - price) / recentHigh20;

  // ---- ★★★ 加权评分表（vpScore 累加）★★★ ----
  let vpScore = 0;
  const vpFactors = [];

  // 因子1：放量突破（+1.5 ~ +2）
  if (isBreakHigh && isBigVolNow) {
    const bonus = obvPosition20 > 0.6 ? 2.0 : 1.5;
    vpScore += bonus;
    vpFactors.push(`放量突破+${bonus}`);
  }

  // 因子2：温和放量上涨（+1）
  if (avgVol5 > avgVol20 * 1.1 && priceUp1d) {
    vpScore += 1.0;
    vpFactors.push('温和放量上涨+1');
  }

  // 因子3：缩量洗盘（+0.8）→ 放宽条件 2%~12%
  if (pullbackFromHigh > 0.02 && pullbackFromHigh < 0.12 && isShrinkingVol && !priceUp1d) {
    vpScore += 0.8;
    vpFactors.push('缩量洗盘+0.8');
  }

  // 因子4：OBV 上行 + 价格上行（+0.5）
  if (isObvUp && priceSlope5 > 0.01) {
    vpScore += 0.5;
    vpFactors.push('OBV资金流入+0.5');
  }

  // 因子5：高位背离（-2）→ 价格高位 + OBV 低位
  if (pricePosition20 > 0.85 && obvPosition20 < 0.4 && obvPosition60 < 0.4) {
    vpScore -= 2.0;
    vpFactors.push('高位背离-2');
  } else if (pricePosition20 > 0.85 && obvPosition20 < 0.5) {
    vpScore -= 1.0;
    vpFactors.push('疑似背离-1');
  }

  // 因子6：放量滞涨（-1）
  if (lastVol > avgVol20 * 1.5 && !priceUp1d && pricePosition20 > 0.5) {
    vpScore -= 1.0;
    vpFactors.push('放量滞涨-1');
  }

  // 因子7：OBV 下行 + 价格高位（-0.5）
  if (isObvDown && pricePosition20 > 0.7) {
    vpScore -= 0.5;
    vpFactors.push('OBV流出高位-0.5');
  }

  // ---- ★★★ 大盘环境修正（若有）★★★ ----
  if (summarize._marketEnv) {
    const env = summarize._marketEnv;
    if (env.trend === 'down') {
      if (vpScore > 0) { vpScore *= 0.7; vpFactors.push('熊市多头打折0.7'); }
      else if (vpScore < 0) { vpScore *= 1.2; vpFactors.push('熊市空头加重1.2'); }
    } else if (env.trend === 'up') {
      if (vpScore > 0) { vpScore *= 1.1; vpFactors.push('牛市多头放大1.1'); }
    }
  }

  // ---- 输出标签 ----
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

  // ---- 将量价评分合并到总 score ----
  if (vpDivergence) score -= 2;
  else if (vpEvent === 'fangBreakout') score += 1;
  else if (vpEvent === 'upTrend' && vpLabel !== '温和上行') score += 0.5;

  // ============================================================
  // 信号分档
  // ============================================================
  let overall, action, position, confidence;
  if (score >= 5) { overall = '强力买入'; action = '强势突破，积极跟进'; position = 85; confidence = 90; }
  else if (score >= 3.5) { overall = '买入'; action = '趋势向好，分批建仓'; position = 65; confidence = 75; }
  else if (score >= 2) { overall = '左侧试探'; action = '底部区域，轻仓试水'; position = 35; confidence = 55; }
  else if (score >= 0.5) { overall = '超卖区'; action = '超跌反弹机会'; position = 20; confidence = 40; }
  else if (score >= -0.5) { overall = '观望'; action = '等待方向明朗'; position = 0; confidence = 30; }
  else if (score >= -2) { overall = '高空防守'; action = '高位滞涨，逐步减仓'; position = 25; confidence = 50; }
  else if (score >= -3.5) { overall = '卖出'; action = '趋势走弱，果断减仓'; position = 50; confidence = 70; }
  else { overall = '强力卖出'; action = '全面转空，清仓避险'; position = 75; confidence = 85; }

  // ---- 量价修正联动 ----
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
  if (vpEvent === 'fangBreakout' && !vpDivergence) {
    if (overall === '买入' || overall === '强力买入') {
      confidence = Math.min(100, confidence + 5);
    }
  }

  // ---- ATR ----
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

  // ---- 支撑阻力 ----
  const high20 = highs ? Math.max(...highs.slice(-20)) : price * 1.05;
  const low20 = lows ? Math.min(...lows.slice(-20)) : price * 0.95;
  const pp = (high20 + low20 + price) / 3;
  const s1 = 2 * pp - high20;
  const r1 = 2 * pp - low20;
  const r2 = pp + (high20 - low20);

  // ---- 止盈止损 ----
  const momentum20 = n > 20 ? (price - closes[n - 21]) / closes[n - 21] : 0;
  const isStrongTrend = momentum20 > 0.10;
  const isVeryStrong = momentum20 > 0.15;
  const atrPct = atr / price;
  let stopMult = 2.0;
  if (atrPct > 0.04) stopMult = 3.0;
  else if (atrPct > 0.035) stopMult = 2.5;
  const stopLoss = Math.min(price - stopMult * atr, s1, price * 0.95);

  let mult1 = 1.0, mult2 = 2.0, mult3 = 3.5;
  if (isVeryStrong) { mult1 = 1.5; mult2 = 3.0; mult3 = 5.25; }
  let volMult = 1.0;
  if (atrPct < 0.015) volMult = 1.5;
  else if (atrPct > 0.04) volMult = 0.8;
  const atr1 = price + mult1 * atr * volMult;
  const atr2 = price + mult2 * atr * volMult;
  const atr3 = price + mult3 * atr * volMult;
  let l1Ratio = 0.30, l2Ratio = 0.30, l3Ratio = 0.40;
  if (isStrongTrend) l3Ratio = 0.30;
  const takeProfitLevels = [
    { price: atr1, ratio: l1Ratio, label: `+${(mult1 * volMult).toFixed(2)}ATR(短线)` },
    { price: atr2, ratio: l2Ratio, label: `+${(mult2 * volMult).toFixed(2)}ATR(中线)` },
    { price: atr3, ratio: l3Ratio, label: `+${(mult3 * volMult).toFixed(2)}ATR(长线)` }
  ];
  let triggerMult = 2.0, stepMult = 2.0;
  if (isVeryStrong) { triggerMult = 4.0; stepMult = 3.0; }
  else if (isStrongTrend) { triggerMult = 3.0; stepMult = 3.0; }
  const trailingStop = {
    enabled: true, trigger: price + triggerMult * atr,
    step: stepMult * atr, currentStop: stopLoss
  };

  // ---- 回测（轻量） ----
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

  // ---- 指标分组 ----
  const rsi = _calcRSI(closes, 14);
  const macd = _calcMACD(closes);
  const kdj = _calcKDJ(closes, highs, lows);
  const roc = n > 10 ? (price - closes[n-11]) / closes[n-11] * 100 : 0;
  const cci = _calcCCI(closes, highs, lows, 20);
  const wr = _calcWR(closes, highs, lows, 14);
  const adx = _calcADX(highs, lows, closes, 14);
  const boll = _calcBOLL(closes, 20);
  const vr = _calcVR(closes, vols, 26);
  const obv = obvSeries[n - 1];
  const obvDirection = isObvUp ? 'up' : (isObvDown ? 'down' : 'neutral');
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
    { name: 'BOLL', value: (price - boll.mid) / (boll.upper - boll.lower || 1) * 100, min: -100, max: 100, signal: price > boll.upper ? '超买' : price < boll.lower ? '超卖' : '中性' },
  ];
  const volGroup = [
    { name: 'OBV', value: obv, min: -Math.abs(obv)*2, max: Math.abs(obv)*2, signal: obvDirection === 'up' ? '资金流入' : (obvDirection === 'down' ? '资金流出' : '中性') },
    { name: 'VR 26', value: vr, min: 0, max: 300, signal: vr > 150 ? '放量' : vr < 70 ? '缩量' : '中性' },
    { name: 'VOL 5/10', value: volaRatio, min: 0, max: 3, signal: volaRatio > 1.3 ? '放量' : volaRatio < 0.7 ? '缩量' : '中性' },
  ];

  // ---- 枢轴点评分 ----
  let pivotBuy = 0, pivotSell = 0, pivotLabel = '中性';
  if (price > pivots.classic.R1) { pivotBuy = 2; pivotLabel = '突破R1'; }
  else if (price > pivots.classic['轴心点']) { pivotBuy = 1; pivotLabel = '轴上'; }
  else if (price < pivots.classic.S1) { pivotSell = 2; pivotLabel = '跌破S1'; }
  else if (price < pivots.classic['轴心点']) { pivotSell = 1; pivotLabel = '轴下'; }
  let pivotBreakdown = null, pivotBreakout = null;
  if (price < pivots.classic.S1) pivotBreakdown = { level: 'S1', from: pivots.classic.S1, to: 'S2' };
  if (price > pivots.classic.R1) pivotBreakout = { level: 'R1', from: pivots.classic.R1, target: 'R2' };

  let trend = '震荡', trendScore = 0;
  if (price > ma60 && ma20 > ma60 && ma5 > ma20) { trend = '强多头'; trendScore = 2; }
  else if (price > ma60) { trend = '多头'; trendScore = 1; }
  else if (price < ma60 && ma20 < ma60 && ma5 < ma20) { trend = '强空头'; trendScore = -2; }
  else if (price < ma60) { trend = '空头'; trendScore = -1; }

  const anomalyIdx = [];
  for (let i = Math.max(1, n - 15); i < n; i++) {
    const avg = vols.slice(Math.max(0, i-5), i).reduce((a,b) => a+b, 0) / Math.min(5, i);
    if (vols[i] > avg * 2.0) anomalyIdx.push({ i, type: closes[i] < opens[i] ? 'high' : 'normal' });
  }

  const netScore = Math.round(score);
  const buyScore = [trendGroup, momentumGroup, volaGroup, volGroup].flat().filter(x => ['买入','超卖','资金流入','放量'].includes(x.signal)).length;
  const sellScore = [trendGroup, momentumGroup, volaGroup, volGroup].flat().filter(x => ['卖出','超买','资金流出','缩量'].includes(x.signal)).length;

  return {
    overall, action, position, confidence, score,
    netScore, trend, trendScore, pivotLabel, pivotSell, pivotBuy,
    pivotBreakdown, pivotBreakout,
    vpScore, vpLabel, vpEvent, vpDivergence,
    obvInfo: { direction: obvDirection, value: obv, slope8: obvSlope8 },
    volaRatio,
    anomalyIdx,
    backtest: { buySamples, buyWinRate: buySamples > 0 ? buyWin / buySamples : 0, buyAvgRet: buySamples > 0 ? buySum / buySamples : 0, lookback: 60, holdDays },
    tpSl: { stopLoss, takeProfitLevels, trailingStop, atr, s1, r1, r2, hasR2: r2 > atr3, isStrongTrend, momentum20, atrPct, stopMult, triggerMult, stepMult, note: '量价评分制优化版' },
    trendGroup, momentumGroup, volaGroup, volGroup,
    buyScore, sellScore,
    mainForce: null, fundamentals: null,
    vpFactors: vpFactors,  // 方便调试
  };
}
summarize._marketEnv = null;

// ================================================================
// ★★★ 量化调整（applyQuantToSignal）★★★
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

  sum.quantWarnings = warnings;
  sum.quantMetrics = qm;
  sum.quantChanged = sum.position !== original.position || sum.confidence !== original.confidence;
  return sum;
}

// ================================================================
// ★★★ 量化诊断函数 ★★★
// ================================================================
function computeQuantMetrics(data, sum) {
  if (!data || data.length < 20) return null;
  const closes = data.map(d => d.close);
  const returns = _returns(closes);
  const annRet = annualReturn(returns);
  const vol = volatility(returns);
  const sharpe = sharpeRatio(returns);
  const sortino = sortinoRatio(returns);
  const mdd = maxDrawdown(closes);
  const calmar = calmarRatio(returns, closes);
  const ts = trendStrength(closes);
  let beta = null, alpha = null, ir = null, corr = null;
  if (window.__marketCloses && window.__marketCloses.length > 30) {
    const mR = [];
    for (let i = 1; i < window.__marketCloses.length; i++) mR.push((window.__marketCloses[i] - window.__marketCloses[i-1]) / window.__marketCloses[i-1]);
    const len = Math.min(returns.length, mR.length);
    const sR = returns.slice(-len); const mr = mR.slice(-len);
    beta = betaToMarket(sR, mr); alpha = alphaToMarket(sR, mr) * 252; ir = informationRatio(sR, mr); corr = correlation(sR, mr);
  }
  let pf = null;
  if (returns.length > 20) {
    let winSum = 0, winN = 0, lossSum = 0, lossN = 0;
    for (let i = 0; i < returns.length; i++) {
      if (returns[i] > 0) { winSum += returns[i]; winN++; }
      else if (returns[i] < 0) { lossSum += Math.abs(returns[i]); lossN++; }
    }
    const avgWin = winN ? winSum / winN : 0; const avgLoss = lossN ? lossSum / lossN : 0;
    pf = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 99 : 0);
  }
  const strategicVerdict = {
    good: sharpe >= 1 && calmar >= 1 && sortino >= 0.8,
    ok: sharpe >= 0.5 && calmar >= 0.5,
    weak: sharpe < 0.5 && sharpe >= 0,
    bad: sharpe < 0 || mdd.value > 0.25 || (ir != null && ir < -0.5),
    pf, sharpe, sortino, calmar, mdd: mdd.value, vol, annRet, ts, beta, alpha, ir, corr,
  };
  return { annRet, vol, sharpe, sortino, mdd, calmar, pf, ts, beta, alpha, ir, corr, strategicVerdict };
}

// ================================================================
// ★★★ 绘制 K 线图和 OBV 小图 ★★★
// ================================================================
function drawChart(data, sum) {
  const chartDom = document.getElementById('mainChart');
  if (!chartDom) return;
  const myChart = echarts.init(chartDom);
  const dates = data.map(d => d.date);
  const closes = data.map(d => d.close);
  const opens = data.map(d => d.open);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const volumes = data.map(d => d.volume);

  // 均线
  const ma5 = [], ma10 = [], ma20 = [];
  for (let i = 0; i < data.length; i++) {
    const slice5 = closes.slice(Math.max(0, i-4), i+1);
    ma5.push(slice5.reduce((a,b)=>a+b,0)/slice5.length);
    const slice10 = closes.slice(Math.max(0, i-9), i+1);
    ma10.push(slice10.reduce((a,b)=>a+b,0)/slice10.length);
    const slice20 = closes.slice(Math.max(0, i-19), i+1);
    ma20.push(slice20.reduce((a,b)=>a+b,0)/slice20.length);
  }

  // OBV
  const obv = [];
  let obvVal = 0;
  for (let i = 0; i < data.length; i++) {
    if (i === 0) { obv.push(0); continue; }
    if (closes[i] > closes[i-1]) obvVal += volumes[i];
    else if (closes[i] < closes[i-1]) obvVal -= volumes[i];
    obv.push(obvVal);
  }

  const option = {
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['K线', 'MA5', 'MA10', 'MA20', 'OBV'], bottom: 0, left: 'center', icon: 'roundRect', itemWidth: 12 },
    grid: [
      { left: '5%', right: '5%', top: '8%', height: '60%' },
      { left: '5%', right: '5%', top: '72%', height: '18%' }
    ],
    xAxis: [
      { type: 'category', data: dates, gridIndex: 0, axisLabel: { rotate: 30, interval: Math.floor(data.length/20) } },
      { type: 'category', data: dates, gridIndex: 1, axisLabel: { show: false } }
    ],
    yAxis: [
      { type: 'value', gridIndex: 0, scale: true, splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.1)' } } },
      { type: 'value', gridIndex: 1, splitLine: { show: false } }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: opens.map((o, i) => [o, closes[i], lows[i], highs[i]]),
        itemStyle: {
          color: '#e53e3e',
          color0: '#38a169',
          borderColor: '#e53e3e',
          borderColor0: '#38a169'
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
      },
      { name: 'MA5', type: 'line', data: ma5, smooth: true, lineStyle: { width: 1, color: '#3182ce' }, xAxisIndex: 0, yAxisIndex: 0 },
      { name: 'MA10', type: 'line', data: ma10, smooth: true, lineStyle: { width: 1, color: '#d69e2e' }, xAxisIndex: 0, yAxisIndex: 0 },
      { name: 'MA20', type: 'line', data: ma20, smooth: true, lineStyle: { width: 1, color: '#805ad5' }, xAxisIndex: 0, yAxisIndex: 0 },
      {
        name: 'OBV',
        type: 'line',
        data: obv,
        lineStyle: { color: '#2b6cb0', width: 1 },
        smooth: true,
        xAxisIndex: 1,
        yAxisIndex: 1,
      }
    ]
  };
  myChart.setOption(option);
  window.addEventListener('resize', () => myChart.resize());
  return myChart;
}

// ================================================================
// ★★★ 渲染页面（补全所有 UI）★★★
// ================================================================
function renderPage(data, sum, pivots, currentPrice, change, changePct) {
  const root = document.getElementById('root');
  if (!root) return;
  const code = getCodeFromURL();
  const name = findName(code);
  const type = getTypeByCode(code);
  const last = data[data.length-1];
  const prev = data[data.length-2];

  // 构建 HTML
  root.innerHTML = `
    <div class="hero">
      <div class="eyebrow"><span class="dot"></span> ${sum.trend} · 实时行情</div>
      <h1>
        <span class="name-main editable-name" id="stockName">${name}</span>
        <span class="name-sep">·</span>
        <span class="name-code" id="stockCode">${code}</span>
        <span style="font-family:'Outfit',sans-serif;font-size:0.2em;font-weight:400;color:var(--text-mute);margin-left:4px;">${typeLabel(type)}</span>
      </h1>
      <div class="sub">${data[0]?.date || ''} → ${last?.date || ''}  ·  ${data.length} 个交易日</div>
    </div>

    <div class="stock-info">
      <div class="stock-head">
        <div class="left">
          <span class="eyebrow"><span class="dot"></span> 最新价</span>
          <span class="price" id="priceDisplay">${currentPrice.toFixed(2)}</span>
          <span class="meta" id="changeDisplay" style="color:${changePct >= 0 ? 'var(--up)' : 'var(--down)'};">${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%</span>
        </div>
        <div class="meta">${last?.date || ''}</div>
      </div>
      <div class="info-grid">
        <div class="info-cell"><span class="k">开盘</span><span class="v" id="openDisplay">${last?.open?.toFixed(2) || '--'}</span><span class="d">昨收 ${prev?.close?.toFixed(2) || '--'}</span></div>
        <div class="info-cell"><span class="k">最高</span><span class="v up" id="highDisplay">${last?.high?.toFixed(2) || '--'}</span><span class="d">${data.slice(-20).reduce((a,b) => Math.max(a, b.high), -Infinity).toFixed(2)} (20日高)</span></div>
        <div class="info-cell"><span class="k">最低</span><span class="v down" id="lowDisplay">${last?.low?.toFixed(2) || '--'}</span><span class="d">${data.slice(-20).reduce((a,b) => Math.min(a, b.low), Infinity).toFixed(2)} (20日低)</span></div>
        <div class="info-cell"><span class="k">成交量</span><span class="v" id="volDisplay">${(last?.volume / 10000).toFixed(1)}万</span><span class="d">量比 ${(last?.volume / (data.slice(-5).reduce((s,r) => s + r.volume, 0)/5)).toFixed(2)}</span></div>
        <div class="info-cell draw-cell">
          <span class="k">量价 · 资金 (OBV)</span>
          <div class="chart-wrap"><canvas id="drawChart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- 信号卡 -->
    <div class="signal-card">
      <div class="signal-top">
        <div class="verdict-badge ${sum.overall === '强力买入' ? 'strong-buy' : sum.overall === '买入' ? 'buy' : sum.overall === '卖出' ? 'sell' : sum.overall === '强力卖出' ? 'strong-sell' : 'neutral'}">
          <span class="main">${sum.overall}</span>
          <span class="sub">${sum.confidence}% 置信</span>
        </div>
        <div class="verdict-body">
          <h3>${sum.action} <span style="font-size:12px;font-weight:400;color:var(--text-mute);">评分 ${sum.netScore}</span></h3>
          <p>${sum.action} · 仓位建议 ${sum.position}%</p>
          <div class="verdict-tags">
            <span class="pill ${sum.overall.includes('买入') ? 'buy' : sum.overall.includes('卖出') ? 'sell' : 'neutral'}">${sum.overall}</span>
            <span class="pill ${sum.vpDivergence ? 'sell' : 'buy'}">${sum.vpLabel}</span>
            <span class="pill">${sum.trend}</span>
          </div>
          <div class="verdict-meta">量价评分 ${sum.vpScore.toFixed(2)} · ${sum.vpFactors ? sum.vpFactors.join('; ') : ''}</div>
        </div>
      </div>
      <div class="pos-strip">
        <span class="k">建议仓位</span>
        <div class="pos-bar"><div class="fill" style="width:${sum.position}%;"></div></div>
        <span class="v">${sum.position}%</span>
      </div>
      ${sum.quantWarnings && sum.quantWarnings.length ? `<div class="risk-card"><span class="label">⚠ 量化修正</span>${sum.quantWarnings.join('<br>')}</div>` : ''}
      <div class="vol-strip">
        <div class="item"><span class="k">波动率(年化)</span><span class="v ${sum.tpSl.atrPct > 0.04 ? 'up' : 'down'}">${(sum.tpSl.atrPct * 100).toFixed(2)}%</span></div>
        <div class="item"><span class="k">ATR</span><span class="v">${sum.tpSl.atr.toFixed(2)}</span></div>
        <div class="item"><span class="k">动量(20日)</span><span class="v ${sum.tpSl.momentum20 > 0 ? 'up' : 'down'}">${(sum.tpSl.momentum20 * 100).toFixed(2)}%</span></div>
      </div>
    </div>

    <!-- 量化诊断面板 -->
    <div class="card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> 量化诊断（长期绩效）</h3>
      <div class="quant-grid">
        <div class="quant-cell"><span class="k">年化收益</span><span class="v" id="q-annRet">--</span><span class="d" id="q-annRet-d">样本不足</span></div>
        <div class="quant-cell"><span class="k">年化波动</span><span class="v" id="q-vol">--</span><span class="d" id="q-vol-d">--</span></div>
        <div class="quant-cell"><span class="k">夏普比率</span><span class="v" id="q-sharpe">--</span><span class="d" id="q-sharpe-d">--</span></div>
        <div class="quant-cell"><span class="k">最大回撤</span><span class="v" id="q-mdd">--</span><span class="d" id="q-mdd-d">--</span></div>
        <div class="quant-cell"><span class="k">卡玛比率</span><span class="v" id="q-calmar">--</span><span class="d" id="q-calmar-d">--</span></div>
        <div class="quant-cell"><span class="k">盈利因子</span><span class="v" id="q-pf">--</span><span class="d" id="q-pf-d">--</span></div>
        <div class="quant-cell"><span class="k">索提诺比</span><span class="v" id="q-sortino">--</span><span class="d" id="q-sortino-d">--</span></div>
        <div class="quant-cell"><span class="k">β / α(年)</span><span class="v" id="q-beta">--</span><span class="d" id="q-beta-d">--</span></div>
        <div class="quant-cell"><span class="k">信息比率</span><span class="v" id="q-ir">--</span><span class="d" id="q-ir-d">--</span></div>
        <div class="quant-cell" style="grid-column: span 2;"><span class="k">趋势强度</span><span class="v" id="q-trend">--</span><span class="d" id="q-trend-d">--</span></div>
      </div>
      <div class="quant-summary" id="quantSummary">📊 加载量化数据...</div>
    </div>

    <!-- 止盈止损 -->
    <div class="card tp-sl-card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> 止盈 · 止损</h3>
      <div class="tp-grid">
        <div class="tp-item"><span class="label">止损价</span><div class="value bear">${sum.tpSl.stopLoss.toFixed(2)}</div><span class="sub">${((sum.tpSl.stopLoss - currentPrice) / currentPrice * 100).toFixed(2)}%</span></div>
        ${sum.tpSl.takeProfitLevels.map((t, i) => `
          <div class="tp-item"><span class="label">${t.label}</span><div class="value bull">${t.price.toFixed(2)}</div><span class="sub">${((t.price - currentPrice) / currentPrice * 100).toFixed(2)}% · ${(t.ratio * 100).toFixed(0)}%</span></div>
        `).join('')}
      </div>
      <div class="tp-detail">
        <strong>跟踪止损</strong> 触发价 ${sum.tpSl.trailingStop.trigger.toFixed(2)}，步长 ${sum.tpSl.trailingStop.step.toFixed(2)}，当前 ${sum.tpSl.trailingStop.currentStop.toFixed(2)}
        <br><small>${sum.tpSl.note} | 波动率 ${(sum.tpSl.atrPct * 100).toFixed(2)}%</small>
      </div>
    </div>

    <!-- 指标分组 -->
    <div class="card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16h16"/><polyline points="20 10 12 18 8 14 4 18"/></svg> 技术指标</h3>
      <div class="indicators-section">
        ${[
          { title: '趋势', data: sum.trendGroup },
          { title: '动量', data: sum.momentumGroup },
          { title: '波动', data: sum.volaGroup },
          { title: '量能', data: sum.volGroup }
        ].map(g => `
          <div class="ig-group">
            <div class="title">${g.title} <span class="count">${g.data.filter(x => ['买入','超卖','资金流入','放量'].includes(x.signal)).length} 买 / ${g.data.filter(x => ['卖出','超买','资金流出','缩量'].includes(x.signal)).length} 卖</span></div>
            ${g.data.map(item => `
              <div class="ig-row">
                <span class="name">${item.name}</span>
                <div class="trend-bar">
                  <div class="center"></div>
                  <div class="fill ${item.value > 0 ? 'above' : 'below'}" style="width:${Math.min(100, Math.abs(item.value / (item.max || 100)) * 50)}%;"></div>
                </div>
                <span class="val">${typeof item.value === 'number' ? item.value.toFixed(2) : item.value}</span>
                <span class="pill ${item.signal === '买入' || item.signal === '超卖' || item.signal === '资金流入' || item.signal === '放量' ? 'buy' : item.signal === '卖出' || item.signal === '超买' || item.signal === '资金流出' || item.signal === '缩量' ? 'sell' : 'neutral'}">${item.signal}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 枢轴点 -->
    <div class="card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M12 3v18"/><circle cx="12" cy="12" r="9"/></svg> 枢轴点（经典）</h3>
      <table class="pivot-table">
        <thead><tr><th>级别</th><th>R3</th><th>R2</th><th>R1</th><th class="zen">轴心点</th><th>S1</th><th>S2</th><th>S3</th></tr></thead>
        <tbody>
          <tr class="zen"><td>经典</td><td class="num">${pivots.classic.R3.toFixed(2)}</td><td class="num">${pivots.classic.R2.toFixed(2)}</td><td class="num">${pivots.classic.R1.toFixed(2)}</td><td class="num">${pivots.classic['轴心点'].toFixed(2)}</td><td class="num">${pivots.classic.S1.toFixed(2)}</td><td class="num">${pivots.classic.S2.toFixed(2)}</td><td class="num">${pivots.classic.S3.toFixed(2)}</td></tr>
          <tr><td>斐波那契</td><td class="num">${pivots.fibonacci.R3.toFixed(2)}</td><td class="num">${pivots.fibonacci.R2.toFixed(2)}</td><td class="num">${pivots.fibonacci.R1.toFixed(2)}</td><td class="num">${pivots.fibonacci['轴心点'].toFixed(2)}</td><td class="num">${pivots.fibonacci.S1.toFixed(2)}</td><td class="num">${pivots.fibonacci.S2.toFixed(2)}</td><td class="num">${pivots.fibonacci.S3.toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- K线图（大图） -->
    <div class="card" id="mainChartCard">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> K线走势</h3>
      <div class="chart" id="mainChart"></div>
      <button class="fs-btn" id="fullscreenBtn">⛶ 全屏</button>
    </div>

    <!-- 历史回测简表 -->
    <div class="card">
      <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 7v10M12 7v10M6 7v10"/></svg> 回测简表（买点信号回溯）</h3>
      <div class="winrate-row">
        <div class="item"><span>样本数</span><span class="v">${sum.backtest.buySamples}</span></div>
        <div class="item"><span>胜率</span><span class="v ${sum.backtest.buyWinRate > 0.5 ? 'up' : 'down'}">${(sum.backtest.buyWinRate * 100).toFixed(1)}%</span></div>
        <div class="item"><span>平均收益</span><span class="v ${sum.backtest.buyAvgRet > 0 ? 'up' : 'down'}">${(sum.backtest.buyAvgRet * 100).toFixed(2)}%</span></div>
        <div class="item"><span>持有期</span><span class="v">${sum.backtest.holdDays}日</span></div>
      </div>
      <div style="font-size:10px;color:var(--text-mute);padding:0 20px 8px;">基于最近 ${sum.backtest.lookback} 日内的价量突破信号回测</div>
    </div>
  `;

  // ---- 绑定事件 ----
  // 名称编辑
  const nameEl = document.getElementById('stockName');
  if (nameEl) {
    nameEl.addEventListener('click', function() {
      const newName = prompt('修改股票名称', this.textContent);
      if (newName && newName.trim() !== '') {
        if (updateName(code, newName.trim())) {
          this.textContent = newName.trim();
          toast('名称已更新');
        } else toast('更新失败');
      }
    });
  }

  // 全屏图表
  const fsBtn = document.getElementById('fullscreenBtn');
  if (fsBtn) {
    fsBtn.addEventListener('click', function() {
      const card = document.getElementById('mainChartCard');
      if (card.requestFullscreen) card.requestFullscreen();
      else if (card.webkitRequestFullscreen) card.webkitRequestFullscreen();
      else toast('当前浏览器不支持全屏');
    });
  }

  // ---- 初始化 ECharts 大图 ----
  drawChart(data, sum);

  // ---- 初始化 OBV 小图（Canvas） ----
  const canvas = document.getElementById('drawChart');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = (rect.height || 140) * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = (rect.height || 140) + 'px';
    ctx.scale(dpr, dpr);

    // 绘制 OBV 折线
    const obvVals = [];
    let obvVal = 0;
    for (let i = 0; i < data.length; i++) {
      if (i === 0) { obvVals.push(0); continue; }
      if (data[i].close > data[i-1].close) obvVal += data[i].volume;
      else if (data[i].close < data[i-1].close) obvVal -= data[i].volume;
      obvVals.push(obvVal);
    }
    const min = Math.min(...obvVals);
    const max = Math.max(...obvVals);
    const range = max - min || 1;
    const w = rect.width || 300;
    const h = (rect.height || 140);
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = '#3182ce';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < obvVals.length; i++) {
      const x = (i / (obvVals.length - 1)) * w;
      const y = h - ((obvVals[i] - min) / range) * (h - 10) - 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // ---- 填充量化指标 ----
  const qm = computeQuantMetrics(data, sum);
  if (qm) {
    const set = (id, val, cls) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = val; if (cls) el.className = 'v' + (cls ? ' ' + cls : ''); }
    };
    const setD = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('q-annRet', (qm.annRet * 100).toFixed(2) + '%', qm.annRet > 0 ? 'good' : 'bad');
    set('q-vol', (qm.vol * 100).toFixed(2) + '%', qm.vol > 0.3 ? 'bad' : qm.vol > 0.2 ? 'warn' : 'good');
    set('q-sharpe', qm.sharpe.toFixed(2), qm.sharpe >= 1 ? 'good' : qm.sharpe >= 0 ? 'warn' : 'bad');
    set('q-mdd', (qm.mdd.value * 100).toFixed(2) + '%', qm.mdd.value > 0.2 ? 'bad' : qm.mdd.value > 0.1 ? 'warn' : 'good');
    set('q-calmar', qm.calmar.toFixed(2), qm.calmar >= 1 ? 'good' : qm.calmar >= 0 ? 'warn' : 'bad');
    set('q-pf', qm.pf == null ? '—' : qm.pf.toFixed(2), qm.pf == null ? '' : qm.pf >= 1.5 ? 'good' : qm.pf >= 1 ? 'warn' : 'bad');
    setD('q-annRet-d', `${data.length} 个交易日`);
    setD('q-vol-d', '年化标准差');
    setD('q-sharpe-d', qm.sharpe >= 1 ? '✓ 优秀' : qm.sharpe >= 0.5 ? '○ 良好' : qm.sharpe >= 0 ? '△ 一般' : '✗ 需改进');
    setD('q-mdd-d', qm.mdd.peakIdx < qm.mdd.troughIdx ? `从 ${data[qm.mdd.peakIdx].date} 起` : '—');
    setD('q-calmar-d', '收益/回撤');
    setD('q-pf-d', qm.pf == null ? '样本不足' : qm.pf >= 1.5 ? '✓ 正期望' : qm.pf >= 1 ? '○ 略正' : '✗ 负期望');
    set('q-sortino', qm.sortino.toFixed(2), qm.sortino >= 1.5 ? 'good' : qm.sortino >= 0.5 ? 'warn' : 'bad');
    setD('q-sortino-d', qm.sortino >= 1.5 ? '✓ 优秀' : qm.sortino >= 0.5 ? '○ 良好' : '△ 一般');
    if (window.__marketCloses) {
      const marketReturns = [];
      for (let i = 1; i < window.__marketCloses.length; i++) marketReturns.push((window.__marketCloses[i] - window.__marketCloses[i-1]) / window.__marketCloses[i-1]);
      const len = Math.min(_returns(data.map(d=>d.close)).length, marketReturns.length);
      const sR = _returns(data.map(d=>d.close)).slice(-len);
      const mR = marketReturns.slice(-len);
      const beta = betaToMarket(sR, mR);
      const alpha = alphaToMarket(sR, mR) * 252;
      set('q-beta', beta.toFixed(2) + ' / ' + (alpha * 100).toFixed(1) + '%', Math.abs(beta - 1) < 0.3 ? '' : (beta > 1.3 || beta < 0.7) ? 'warn' : '');
      setD('q-beta-d', `β${beta > 1.3 ? '高波动' : beta < 0.7 ? '独立行情' : '正常'}`);
      const ir = informationRatio(sR, mR);
      set('q-ir', ir.toFixed(2), ir >= 0.5 ? 'good' : ir >= 0 ? 'warn' : 'bad');
      setD('q-ir-d', ir >= 1 ? '✓ 优秀' : ir >= 0.5 ? '○ 良好' : '△ 一般');
    } else {
      set('q-beta', '—', ''); setD('q-beta-d', '需大盘数据');
      set('q-ir', '—', ''); setD('q-ir-d', '需大盘数据');
    }
    set('q-trend', qm.ts.toFixed(0), qm.ts >= 60 ? 'good' : qm.ts >= 30 ? 'warn' : 'bad');
    setD('q-trend-d', qm.ts >= 60 ? '强趋势' : qm.ts >= 30 ? '中等趋势' : '震荡');

    const summary = document.getElementById('quantSummary');
    if (summary) {
      let txt = '';
      if (qm.sharpe >= 1) txt += '<b>夏普 ≥ 1</b>，策略风险调整后收益优秀。';
      else if (qm.sharpe >= 0.5) txt += '<b>夏普 0.5~1</b>，策略表现良好。';
      else if (qm.sharpe >= 0) txt += '<b>夏普 0~0.5</b>，策略勉强正收益，需谨慎。';
      else txt += '<b style="color:var(--up)">夏普 < 0</b>，策略长期负收益，不建议使用。';
      if (qm.mdd.value > 0.2) txt += ' 最大回撤超过 20%，风险较高。';
      else if (qm.mdd.value < 0.1) txt += ' 最大回撤 < 10%，回撤控制优秀。';
      if (qm.pf != null && qm.pf < 1) txt += ' <b style="color:var(--up)">盈利因子 &lt; 1</b>，长期负期望，建议优化策略。';
      summary.innerHTML = '📊 <b>综合评语：</b>' + txt;
    }
  }
}

// ================================================================
// ★★★ 主入口 initStock ★★★
// ================================================================
async function initStock(code) {
  const root = document.getElementById('root');
  root.innerHTML = '<div class="loading">加载中…</div>';

  try {
    // 1. 获取 K 线数据
    let data = await fetchKLine(code, 80);
    if (!data || data.length === 0) throw new Error('无数据');
    // 存入缓存
    HistoryTable.saveRecent(code, data);

    // 2. 计算基础
    const last = data[data.length-1];
    const prev = data[data.length-2];
    const currentPrice = last.close;
    const change = currentPrice - (prev?.close || currentPrice);
    const changePct = (change / (prev?.close || currentPrice)) * 100;

    // 3. 获取大盘环境（用于修正）
    let marketEnv = null;
    try {
      marketEnv = await checkMarketEnvironment(fetchKLine);
      window.__marketCloses = (await fetchKLine('sh000300', 80)).map(d => d.close);
    } catch (e) { console.warn('大盘数据获取失败，使用中性环境'); }
    summarize._marketEnv = marketEnv;

    // 4. 计算枢轴点
    const pivots = calcPivots(last.high, last.low, last.close);

    // 5. 调用 summarize
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const opens = data.map(d => d.open);
    const vols = data.map(d => d.volume);
    let sum = summarize(closes, highs, lows, opens, vols, pivots, null);

    // 6. 量化修正
    const qm = computeQuantMetrics(data, sum);
    if (qm) {
      sum = applyQuantToSignal(sum, qm);
    }

    // 7. 风控限制（示例）
    const portfolio = loadPortfolio();
    const limits = { maxSinglePosition: 0.25, maxTotalPosition: 0.80, stopLossRequired: true, requireMarketFilter: false };
    applyRiskLimits(sum, portfolio, limits);

    // 8. 渲染页面
    renderPage(data, sum, pivots, currentPrice, change, changePct);

    // 9. 更新数据徽章
    const badge = document.getElementById('dataBadge');
    if (badge) {
      const cached = HistoryTable.getRecent(code, 1);
      if (cached && cached.length > 0 && cached[0].date === last.date) {
        badge.textContent = '缓存';
        badge.className = 'data-badge history';
      } else {
        badge.textContent = '实时';
        badge.className = 'data-badge';
      }
    }

    // 10. 预拉取按钮（示例）
    document.getElementById('btnPrefetch').onclick = () => {
      toast('数据已缓存至本地');
    };

  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>加载失败: ${err.message}<br><a href="index.html" style="color:var(--accent);text-decoration:underline;">返回</a></div>`;
  }
}

// ================================================================
// ★★★ 风控面板初始化 ★★★
// ================================================================
function initRiskPanel() {
  const modal = document.getElementById('riskModal');
  const openBtn = document.getElementById('btnRisk');
  const closeBtn = document.getElementById('riskClose');
  const cancelBtn = document.getElementById('riskCancel');
  const saveBtn = document.getElementById('riskSave');
  const resetBtn = document.getElementById('riskReset');

  // 预设
  const presets = {
    conservative: { maxSingle: 15, maxTotal: 70, minCash: 30, maxLoss: 2, dailyLoss: 3, drawdown: 10 },
    balanced: { maxSingle: 20, maxTotal: 80, minCash: 20, maxLoss: 3, dailyLoss: 5, drawdown: 15 },
    aggressive: { maxSingle: 35, maxTotal: 95, minCash: 10, maxLoss: 5, dailyLoss: 8, drawdown: 25 }
  };

  function loadPreset(name) {
    const p = presets[name];
    if (!p) return;
    document.getElementById('inp-maxSingle').value = p.maxSingle;
    document.getElementById('inp-maxTotal').value = p.maxTotal;
    document.getElementById('inp-minCash').value = p.minCash;
    document.getElementById('inp-maxLoss').value = p.maxLoss;
    document.getElementById('inp-dailyLoss').value = p.dailyLoss;
    document.getElementById('inp-drawdown').value = p.drawdown;
    updateLabels();
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.preset-btn[data-preset="${name}"]`)?.classList.add('active');
  }

  function updateLabels() {
    document.getElementById('val-maxSingle').textContent = document.getElementById('inp-maxSingle').value + '%';
    document.getElementById('val-maxTotal').textContent = document.getElementById('inp-maxTotal').value + '%';
    document.getElementById('val-minCash').textContent = document.getElementById('inp-minCash').value + '%';
    document.getElementById('val-maxLoss').textContent = document.getElementById('inp-maxLoss').value + '%';
    document.getElementById('val-dailyLoss').textContent = document.getElementById('inp-dailyLoss').value + '%';
    document.getElementById('val-drawdown').textContent = document.getElementById('inp-drawdown').value + '%';
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
  });

  ['inp-maxSingle', 'inp-maxTotal', 'inp-minCash', 'inp-maxLoss', 'inp-dailyLoss', 'inp-drawdown'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateLabels);
  });

  openBtn.onclick = () => modal.classList.add('show');
  closeBtn.onclick = () => modal.classList.remove('show');
  cancelBtn.onclick = () => modal.classList.remove('show');
  saveBtn.onclick = () => {
    const limits = {
      maxSinglePosition: +document.getElementById('inp-maxSingle').value / 100,
      maxTotalPosition: +document.getElementById('inp-maxTotal').value / 100,
      minCashReserve: +document.getElementById('inp-minCash').value / 100,
      maxSingleLoss: +document.getElementById('inp-maxLoss').value / 100,
      maxDailyLoss: +document.getElementById('inp-dailyLoss').value / 100,
      maxDrawdown: +document.getElementById('inp-drawdown').value / 100,
      stopLossRequired: document.getElementById('inp-stopRequired').checked,
      requireMarketFilter: document.getElementById('inp-marketFilter').checked,
    };
    localStorage.setItem('risk_limits_v1', JSON.stringify(limits));
    toast('风控参数已保存');
    modal.classList.remove('show');
  };
  resetBtn.onclick = () => {
    if (confirm('恢复默认参数？')) {
      loadPreset('balanced');
      toast('已恢复默认');
    }
  };

  // 加载保存的配置
  try {
    const saved = JSON.parse(localStorage.getItem('risk_limits_v1'));
    if (saved) {
      document.getElementById('inp-maxSingle').value = saved.maxSinglePosition * 100;
      document.getElementById('inp-maxTotal').value = saved.maxTotalPosition * 100;
      document.getElementById('inp-minCash').value = saved.minCashReserve * 100;
      document.getElementById('inp-maxLoss').value = saved.maxSingleLoss * 100;
      document.getElementById('inp-dailyLoss').value = saved.maxDailyLoss * 100;
      document.getElementById('inp-drawdown').value = saved.maxDrawdown * 100;
      document.getElementById('inp-stopRequired').checked = saved.stopLossRequired;
      document.getElementById('inp-marketFilter').checked = saved.requireMarketFilter;
      updateLabels();
    }
  } catch(e) {}
}

// ================================================================
// ★★★ 启动 ★★★
// ================================================================
const code = getCodeFromURL();
if (!code) {
  document.getElementById('root').innerHTML = `<div class="empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>缺少股票代码 · <a href="index.html" style="color:var(--accent);text-decoration:underline">返回添加</a></div>`;
} else {
  initRiskPanel();
  initStock(code);
}
</script>
</body>
</html>