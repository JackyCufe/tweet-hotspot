/**
 * Tweet Hotspot Worker v2
 * /api/search  → 搜热点（带URL+摘要）
 * /api/insights → 传选中条目生成推文切入角度
 */

// ─── HTML ─────────────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>推文热点素材库</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
body{background:#020617;color:#f8fafc;font-family:system-ui,sans-serif}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:#475569;border-radius:3px}
.card{border:1px solid #1e293b;border-radius:10px;padding:12px 14px;cursor:pointer;transition:.15s}
.card:hover{border-color:#334155;background:rgba(255,255,255,.02)}
.card.selected{border-color:#2563eb;background:rgba(37,99,235,.08)}
.badge{font-size:10px;padding:1px 6px;border-radius:4px;border:1px solid;display:inline-block}
.badge-wb{color:#f0abfc;border-color:#d946ef;background:rgba(217,70,239,.1)}
.badge-dy{color:#fb923c;border-color:#fb923c;background:rgba(251,146,60,.1)}
.badge-hn{color:#fdba74;border-color:#fb923c;background:rgba(251,146,60,.1)}
.badge-dt{color:#86efac;border-color:#4ade80;background:rgba(74,222,128,.1)}
.badge-gh{color:#93c5fd;border-color:#60a5fa;background:rgba(96,165,250,.1)}
.insight-card{border:1px solid #1e293b;border-radius:10px;overflow:hidden;margin-bottom:6px}
.insight-header{cursor:pointer;padding:10px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.insight-header:hover{background:rgba(255,255,255,.03)}
.insight-body{display:none;padding:8px 12px 10px;border-top:1px solid #0f172a;font-size:12px;color:#64748b}
.insight-card.open .insight-body{display:block}
.insight-arrow{transition:transform .2s;flex-shrink:0;margin-top:3px;color:#475569;font-size:10px}
.insight-card.open .insight-arrow{transform:rotate(90deg)}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin 1s linear infinite}
</style>
</head>
<body class="min-h-screen">
<header class="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
  <div class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
      <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    </div>
    <h1 class="text-slate-100 font-semibold text-base">推文热点素材库</h1>
    <span class="text-slate-500 text-xs ml-auto">by @Jacky_cufe</span>
  </div>
</header>

<main class="max-w-5xl mx-auto px-4 py-8 space-y-6">
  <!-- 搜索区 -->
  <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
    <div class="flex gap-3">
      <input id="keyword" type="text" placeholder="输入关键词，例如：AI、副业、微服务……"
        class="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm outline-none focus:border-blue-500"/>
      <button onclick="doSearch()" id="search-btn"
        class="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm transition-colors flex items-center gap-2 shrink-0">
        <svg id="search-icon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span id="search-txt">搜索热点</span>
      </button>
    </div>
  </div>

  <!-- 两栏 -->
  <div id="main-section" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
    <!-- 左：热点列表 -->
    <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl flex flex-col" style="max-height:80vh">
      <div class="flex items-center justify-between p-5 pb-3 shrink-0">
        <h2 class="text-slate-300 text-sm font-medium">🔥 相关热点</h2>
        <span id="sel-count" class="text-slate-600 text-xs">点击卡片选择素材</span>
      </div>
      <div id="hotspot-list" class="space-y-2 overflow-y-auto px-5 flex-1"></div>
      <div class="p-5 pt-3 shrink-0 border-t border-slate-800/60">
        <button id="gen-btn" onclick="doInsights()" disabled
          class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2">
          <svg id="gen-icon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span id="gen-txt">生成推文切入角度</span>
        </button>
      </div>
    </div>

    <!-- 右：推文灵感 -->
    <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 space-y-3">
      <h2 class="text-slate-300 text-sm font-medium">✏️ 推文切入角度</h2>
      <div id="insights-content">
        <p class="text-slate-600 text-sm text-center py-10">← 选择热点素材后点击生成</p>
      </div>
      <p class="text-slate-600 text-xs pt-2 border-t border-slate-800">💡 角度仅供参考，内容要结合你的真实经历来写</p>
    </div>
  </div>

  <div id="err" class="hidden bg-red-950/60 border border-red-800/60 rounded-2xl p-4">
    <p id="err-msg" class="text-red-300 text-sm"></p>
  </div>
</main>

<footer class="mt-16 border-t border-slate-800/60 py-6">
  <p class="text-center text-slate-600 text-xs">推文热点素材库 · Made by <a href="https://x.com/Jacky_cufe" target="_blank" class="text-blue-500 hover:text-blue-400">@Jacky_cufe</a></p>
</footer>

<script>
let allItems = [], selected = new Set();

const badgeClass = {wb:'badge-wb',dy:'badge-dy',hn:'badge-hn',dt:'badge-dt',gh:'badge-gh'};
const badgeLabel = {wb:'微博',dy:'抖音',hn:'HN',dt:'Dev.to',gh:'GitHub'};

function renderBadge(src){
  return \`<span class="badge \${badgeClass[src]||''}">\${badgeLabel[src]||src}</span>\`;
}

function renderList(){
  const el = document.getElementById('hotspot-list');
  el.innerHTML = allItems.map((item,i)=>\`
    <div class="card \${selected.has(i)?'selected':''}" onclick="toggle(\${i})">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            \${renderBadge(item.src)}
            \${item.url ? \`<a href="\${item.url}" target="_blank" onclick="event.stopPropagation()"
              class="text-slate-500 hover:text-blue-400 text-xs truncate max-w-[180px]" title="\${item.url}">↗ 原文</a>\`: ''}
          </div>
          <p class="text-slate-200 text-sm leading-snug">\${item.title}</p>
          \${item.summary ? \`<p class="text-slate-500 text-xs mt-1 leading-relaxed">\${item.summary}</p>\` : ''}
        </div>
        <div class="w-4 h-4 rounded border \${selected.has(i)?'bg-blue-600 border-blue-500':'border-slate-600'} flex items-center justify-center shrink-0 mt-0.5">
          \${selected.has(i)?'<svg class=\\"w-3 h-3 text-white\\" fill=\\"none\\" viewBox=\\"0 0 24 24\\" stroke=\\"currentColor\\" stroke-width=\\"3\\"><path stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" d=\\"M5 13l4 4L19 7\\"/></svg>':''}
        </div>
      </div>
    </div>
  \`).join('');
}

function toggle(i){
  selected.has(i)?selected.delete(i):selected.add(i);
  renderList();
  const n = selected.size;
  document.getElementById('sel-count').textContent = n ? \`已选 \${n} 条\` : '点击卡片选择素材';
  document.getElementById('gen-btn').disabled = n===0;
}

function setSearchLoading(on){
  document.getElementById('search-btn').disabled=on;
  document.getElementById('search-icon').className='w-4 h-4'+(on?' spin':'');
  document.getElementById('search-txt').textContent=on?'搜索中…':'搜索热点';
}

async function doSearch(){
  const kw = document.getElementById('keyword').value.trim();
  if(!kw){alert('请输入关键词');return;}
  setSearchLoading(true);
  document.getElementById('err').classList.add('hidden');
  document.getElementById('main-section').classList.add('hidden');
  selected.clear(); allItems=[];
  try{
    const r = await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({keyword:kw})});
    const d = await r.json();
    if(d.error) throw new Error(d.error);
    allItems = d.results;
    renderList();
    document.getElementById('main-section').classList.remove('hidden');
    document.getElementById('main-section').style.display='grid';
    document.getElementById('insights-content').innerHTML='<p class="text-slate-600 text-sm text-center py-10">← 选择热点素材后点击生成</p>';
    document.getElementById('gen-btn').disabled=true;
    document.getElementById('sel-count').textContent='点击卡片选择素材';
  }catch(e){
    document.getElementById('err-msg').textContent=e.message;
    document.getElementById('err').classList.remove('hidden');
  }finally{setSearchLoading(false);}
}

function setGenLoading(on){
  document.getElementById('gen-btn').disabled=on;
  document.getElementById('gen-icon').className='w-4 h-4'+(on?' spin':'');
  document.getElementById('gen-txt').textContent=on?'生成中…':'生成推文切入角度';
}

async function doInsights(){
  const items = [...selected].map(i=>allItems[i]);
  setGenLoading(true);
  document.getElementById('insights-content').innerHTML='<p class="text-slate-500 text-sm text-center py-10">AI 正在生成切入角度…</p>';
  try{
    const r = await fetch('/api/insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});
    const d = await r.json();
    if(d.error) throw new Error(d.error);
    document.getElementById('insights-content').innerHTML = renderInsights(d.insights);
  }catch(e){
    document.getElementById('insights-content').innerHTML=\`<p class="text-red-400 text-sm">\${e.message}</p>\`;
  }finally{setGenLoading(false);}
}

function renderInsights(raw){
  const blocks = raw.split(/\\n---\\n/).map(b=>b.trim()).filter(Boolean);
  if(!blocks.length) return '<p class="text-slate-500 text-sm text-center py-10">没有生成结果，换个素材试试</p>';
  return blocks.map(block=>{
    const get=(key)=>block.match(new RegExp(key+':\\\\s*(.+)'))?.[1]?.trim()||'';
    const hot=get('HOT'), summary=get('SUMMARY'), angle=get('ANGLE');
    if(!angle) return '';
    return \`<div class="insight-card" onclick="this.classList.toggle('open')">
      <div class="insight-header">
        <span class="text-slate-200 text-sm flex-1 leading-snug">✏️ \${esc(angle)}</span>
        <span class="insight-arrow">▸</span>
      </div>
      <div class="insight-body">
        \${summary?\`<div class="text-orange-400 mb-1">🔥 \${esc(summary)}</div>\`:''}
        \${hot?\`<div class="text-slate-500 text-xs mt-1">来源：\${esc(hot)}</div>\`:''}
      </div>
    </div>\`;
  }).join('');
}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

document.getElementById('keyword').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
</script>
</body>
</html>`;

// ─── CORS ────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── 数据源 ───────────────────────────────────────────────────────────────────

// 宽松匹配：关键词任意一个字符命中即保留
function loosMatch(text, kw) {
  const tl = text.toLowerCase();
  const kl = kw.toLowerCase();
  if (tl.includes(kl)) return true;
  // 中文：逐字匹配（词长>1时至少匹配2个连续字）
  if (kl.length >= 2) {
    for (let i = 0; i < kl.length - 1; i++) {
      if (tl.includes(kl.slice(i, i + 2))) return true;
    }
  }
  return false;
}

async function fetchWeibo(kw) {
  try {
    const r = await fetch('https://weibo.com/ajax/side/hotSearch', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://weibo.com/', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    const all = (j?.data?.realtime || []).map(i => i.word || i.note).filter(Boolean);
    return all.filter(w => loosMatch(w, kw)).slice(0, 6).map(w => ({
      src: 'wb', title: w, url: `https://s.weibo.com/weibo?q=%23${encodeURIComponent(w)}%23`, summary: ''
    }));
  } catch { return []; }
}

async function fetchDouyin(kw) {
  try {
    const r = await fetch('https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.douyin.com/' },
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    const all = (j?.word_list || []).map(i => i.word).filter(Boolean);
    return all.filter(w => loosMatch(w, kw)).slice(0, 6).map(w => ({
      src: 'dy', title: w, url: `https://www.douyin.com/search/${encodeURIComponent(w)}`, summary: ''
    }));
  } catch { return []; }
}

async function fetchHN(kw) {
  try {
    const r = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(kw)}&tags=story&hitsPerPage=8`,
      { signal: AbortSignal.timeout(8000) }
    );
    const j = await r.json();
    return (j?.hits || []).map(h => ({
      src: 'hn', title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      summary: ''
    })).filter(i => i.title);
  } catch { return []; }
}

async function fetchDevTo(kw) {
  try {
    const tag = kw.toLowerCase().replace(/\s+/g, '');
    let r = await fetch(`https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=8&top=1`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'TweetHotspot/2.0' }, signal: AbortSignal.timeout(8000) });
    let j = await r.json();
    if (!Array.isArray(j) || !j.length) {
      r = await fetch(`https://dev.to/api/articles/search?q=${encodeURIComponent(kw)}&per_page=8`,
        { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) });
      j = await r.json();
      j = Array.isArray(j) ? j : (j?.result || []);
    }
    return j.slice(0, 8).map(a => ({
      src: 'dt', title: a.title, url: a.url || `https://dev.to${a.path}`, summary: ''
    })).filter(i => i.title);
  } catch { return []; }
}

async function fetchGitHub(kw) {
  try {
    const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10);
    const r = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(kw)}+created:>${since}&sort=stars&order=desc&per_page=8`,
      { headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'TweetHotspot/2.0' }, signal: AbortSignal.timeout(8000) }
    );
    const j = await r.json();
    return (j?.items || []).map(repo => ({
      src: 'gh',
      title: `${repo.name}：${(repo.description || '').slice(0, 60)}`,
      url: repo.html_url,
      summary: ''
    })).filter(i => i.title);
  } catch { return []; }
}

// ─── GLM ─────────────────────────────────────────────────────────────────────

async function callGLM(prompt, maxTokens, apiKey) {
  const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'glm-4-flash', messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0.7 }),
    signal: AbortSignal.timeout(25000),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || '';
}

// 翻译关键词为英文（用于英文平台搜索）
async function translateKw(kw, apiKey) {
  // 纯ASCII直接返回
  if (/^[\x00-\x7F]+$/.test(kw)) return kw;
  try {
    const raw = await callGLM(`把"${kw}"翻译成英文搜索词，只输出英文，不超过3个词`, 30, apiKey);
    return raw.trim().replace(/["']/g, '') || kw;
  } catch { return kw; }
}

// 批量生成摘要（一次GLM调用处理所有条目）
async function addSummaries(items, apiKey) {
  if (!items.length) return items;
  const list = items.map((it, i) => `${i + 1}. ${it.title}`).join('\n');
  const prompt = `为以下每条热点生成一句话中文摘要（15字内，说清楚是什么事），只输出编号和摘要，格式"1. xxx"：\n${list}`;
  try {
    const raw = await callGLM(prompt, 400, apiKey);
    const lines = raw.split('\n').filter(Boolean);
    lines.forEach(line => {
      const m = line.match(/^(\d+)[.、]\s*(.+)/);
      if (m) {
        const idx = parseInt(m[1]) - 1;
        if (items[idx]) items[idx].summary = m[2].trim();
      }
    });
  } catch {}
  return items;
}

// 生成切入角度
async function generateInsights(items, apiKey) {
  const itemText = items.map((it, i) => `${i + 1}. 【${it.title}】${it.summary ? ' — ' + it.summary : ''}`).join('\n');
  const prompt = `你是帮中文推特创作者找推文灵感的助手。

用户选中了以下热点：
${itemText}

对每条热点给出一个推文切入角度，严格按格式输出（每条之间用---分隔）：

HOT: 热点标题（原样复制）
SUMMARY: 一句话背景（15字内）
ANGLE: 推文切入角度（一句话有观点，可直接作为推文开头，不超过30字）
---

要求：角度要有真实观点，不要套话，不要强行拉关系。`;
  return await callGLM(prompt, 800, apiKey);
}

// ─── Worker ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });

    if (request.method === 'GET' && url.pathname === '/')
      return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    const json = (data, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }
    });

    // 搜索热点
    if (request.method === 'POST' && url.pathname === '/api/search') {
      let keyword;
      try { ({ keyword } = await request.json()); } catch { return json({ error: '请求格式错误' }, 400); }
      if (!keyword?.trim()) return json({ error: '请输入关键词' }, 400);

      // 中文关键词翻译为英文供英文平台使用
      const apiKey = env.GLM_API_KEY;
      const enKw = apiKey ? await translateKw(keyword, apiKey) : keyword;
      const [wb, dy, hn, dt, gh] = await Promise.all([
        fetchWeibo(keyword), fetchDouyin(keyword),
        fetchHN(enKw), fetchDevTo(enKw), fetchGitHub(enKw),
      ]);
      let results = [...wb, ...dy, ...hn, ...dt, ...gh];

      if (!results.length) return json({ error: '未找到相关热点，换个关键词试试' }, 404);

      if (apiKey) results = await addSummaries(results, apiKey);

      return json({ results });
    }

    // 生成切入角度
    if (request.method === 'POST' && url.pathname === '/api/insights') {
      let items;
      try { ({ items } = await request.json()); } catch { return json({ error: '请求格式错误' }, 400); }
      if (!items?.length) return json({ error: '请先选择热点素材' }, 400);

      const apiKey = env.GLM_API_KEY;
      if (!apiKey) return json({ error: 'GLM_API_KEY 未配置' }, 500);

      const insights = await generateInsights(items, apiKey);
      return json({ insights });
    }

    return new Response('Not found', { status: 404 });
  },
};
