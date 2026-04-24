/**
 * Tweet Hotspot Worker v3
 * 数据源：HN + Reddit + Product Hunt + GitHub + Dev.to
 * 部署：npx wrangler deploy
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
.badge-hn{color:#fdba74;border-color:#fb923c;background:rgba(251,146,60,.1)}
.badge-rd{color:#f87171;border-color:#f87171;background:rgba(248,113,113,.1)}
.badge-ph{color:#c084fc;border-color:#a855f7;background:rgba(168,85,247,.1)}
.badge-gh{color:#93c5fd;border-color:#60a5fa;background:rgba(96,165,250,.1)}
.badge-dt{color:#86efac;border-color:#4ade80;background:rgba(74,222,128,.1)}
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
  <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
    <div class="flex gap-3">
      <input id="keyword" type="text" placeholder="输入关键词，例如：AI、side hustle、crypto……"
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

  <div id="main-section" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
const badgeClass = {hn:'badge-hn',rd:'badge-rd',ph:'badge-ph',gh:'badge-gh',dt:'badge-dt'};
const badgeLabel = {hn:'HN',rd:'Reddit',ph:'Product Hunt',gh:'GitHub',dt:'Dev.to'};

function renderBadge(src){
  return \`<span class="badge \${badgeClass[src]||''}">\${badgeLabel[src]||src}</span>\`;
}

function renderList(){
  document.getElementById('hotspot-list').innerHTML = allItems.map((item,i)=>\`
    <div class="card \${selected.has(i)?'selected':''}" onclick="toggle(\${i})">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            \${renderBadge(item.src)}
            \${item.url?\`<a href="\${item.url}" target="_blank" onclick="event.stopPropagation()"
              class="text-slate-500 hover:text-blue-400 text-xs" title="\${item.url}">↗ 原文</a>\`:''}
          </div>
          <p class="text-slate-200 text-sm leading-snug">\${esc(item.title)}</p>
          \${item.summary?\`<p class="text-slate-500 text-xs mt-1">\${esc(item.summary)}</p>\`:''}
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
  const n=selected.size;
  document.getElementById('sel-count').textContent=n?\`已选 \${n} 条\`:'点击卡片选择素材';
  document.getElementById('gen-btn').disabled=n===0;
}

function setBusy(btnId,iconId,txtId,on,txt){
  document.getElementById(btnId).disabled=on;
  document.getElementById(iconId).className='w-4 h-4'+(on?' spin':'');
  document.getElementById(txtId).textContent=txt;
}

async function doSearch(){
  const kw=document.getElementById('keyword').value.trim();
  if(!kw){alert('请输入关键词');return;}
  setBusy('search-btn','search-icon','search-txt',true,'搜索中…');
  document.getElementById('err').classList.add('hidden');
  document.getElementById('main-section').classList.add('hidden');
  selected.clear(); allItems=[];
  try{
    const r=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({keyword:kw})});
    const d=await r.json();
    if(d.error) throw new Error(d.error);
    allItems=d.results;
    renderList();
    document.getElementById('main-section').classList.remove('hidden');
    document.getElementById('main-section').style.display='grid';
    document.getElementById('insights-content').innerHTML='<p class="text-slate-600 text-sm text-center py-10">← 选择热点素材后点击生成</p>';
    document.getElementById('gen-btn').disabled=true;
    document.getElementById('sel-count').textContent='点击卡片选择素材';
  }catch(e){
    document.getElementById('err-msg').textContent=e.message;
    document.getElementById('err').classList.remove('hidden');
  }finally{setBusy('search-btn','search-icon','search-txt',false,'搜索热点');}
}

async function doInsights(){
  const items=[...selected].map(i=>allItems[i]);
  setBusy('gen-btn','gen-icon','gen-txt',true,'生成中…');
  document.getElementById('insights-content').innerHTML='<p class="text-slate-500 text-sm text-center py-10">AI 正在生成切入角度…</p>';
  try{
    const r=await fetch('/api/insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});
    const d=await r.json();
    if(d.error) throw new Error(d.error);
    document.getElementById('insights-content').innerHTML=renderInsights(d.insights);
  }catch(e){
    document.getElementById('insights-content').innerHTML=\`<p class="text-red-400 text-sm">\${e.message}</p>\`;
  }finally{setBusy('gen-btn','gen-icon','gen-txt',false,'生成推文切入角度');}
}

function renderInsights(raw){
  const blocks=raw.split(/\\n---\\n/).map(b=>b.trim()).filter(Boolean);
  if(!blocks.length) return '<p class="text-slate-500 text-sm text-center py-10">没有结果，换个素材试试</p>';
  return blocks.map(block=>{
    const get=key=>block.match(new RegExp(key+':\\\\s*(.+)'))?.[1]?.trim()||'';
    const hot=get('HOT'),summary=get('SUMMARY'),angle=get('ANGLE');
    if(!angle) return '';
    return \`<div class="insight-card" onclick="this.classList.toggle('open')">
      <div class="insight-header">
        <span class="text-slate-200 text-sm flex-1 leading-snug">✏️ \${esc(angle)}</span>
        <span class="insight-arrow">▸</span>
      </div>
      <div class="insight-body">
        \${summary?\`<div class="text-orange-400 mb-1">🔥 \${esc(summary)}</div>\`:''}
        \${hot?\`<div>来源：\${esc(hot)}</div>\`:''}
      </div>
    </div>\`;
  }).join('');
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
document.getElementById('keyword').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
</script>
</body>
</html>`;

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── GLM ─────────────────────────────────────────────────────────────────────

async function callGLM(prompt, maxTokens, apiKey) {
  const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'glm-4-flash', messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0.7 }),
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || '';
}

async function translateKw(kw, apiKey) {
  if (/^[\x00-\x7F]+$/.test(kw)) return kw;
  try {
    const raw = await Promise.race([callGLM(`把"${kw}"翻译成英文搜索词，只输出英文，不超过3个词`, 20, apiKey), new Promise(r=>setTimeout(()=>r(''),5000))]);
    return raw.replace(/[\"']/g, '') || kw;
  } catch { return kw; }
}

// ─── 数据源 ───────────────────────────────────────────────────────────────────

async function fetchHN(kw) {
  try {
    const r = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(kw)}&tags=story&hitsPerPage=10`,
      { signal: AbortSignal.timeout(6000) }
    );
    const j = await r.json();
    return (j?.hits || []).map(h => ({
      src: 'hn', title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      summary: ''
    })).filter(i => i.title);
  } catch { return []; }
}

async function fetchReddit(kw) {
  try {
    const r = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(kw)}&sort=hot&limit=10&type=link`,
      { headers: { 'User-Agent': 'TweetHotspot/2.0' }, signal: AbortSignal.timeout(6000) }
    );
    const j = await r.json();
    return (j?.data?.children || []).map(p => ({
      src: 'rd', title: p.data?.title,
      url: `https://reddit.com${p.data?.permalink}`,
      summary: p.data?.subreddit_name_prefixed || ''
    })).filter(i => i.title);
  } catch { return []; }
}

async function fetchProductHunt(kw) {
  try {
    const r = await fetch('https://www.producthunt.com/feed', {
      headers: { 'User-Agent': 'TweetHotspot/2.0', 'Accept': 'application/xml' },
      signal: AbortSignal.timeout(6000),
    });
    const xml = await r.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    const kl = kw.toLowerCase();
    return entries.map(e => {
      const titleM = e.match(/<title>([^<]+)<\/title>/);
      const urlM = e.match(/rel="alternate"[^>]+href="([^"]+)"/);
      const desc = e.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      return { src: 'ph', title: titleM?.[1]?.trim() || '', url: urlM?.[1] || '', summary: '', _desc: desc };
    }).filter(i => i.title && (i.title.toLowerCase().includes(kl) || i._desc.toLowerCase().includes(kl)))
      .slice(0, 8).map(({ _desc, ...rest }) => rest);
  } catch { return []; }
}

async function fetchGitHub(kw) {
  try {
    const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10);
    const r = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(kw)}+created:>${since}&sort=stars&order=desc&per_page=8`,
      { headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'TweetHotspot/2.0' }, signal: AbortSignal.timeout(6000) }
    );
    const j = await r.json();
    return (j?.items || []).map(repo => ({
      src: 'gh',
      title: `${repo.name}：${(repo.description || '').slice(0, 60)}`,
      url: repo.html_url, summary: ''
    })).filter(i => i.title);
  } catch { return []; }
}

async function fetchDevTo(kw) {
  try {
    const tag = kw.toLowerCase().replace(/\s+/g, '');
    let r = await fetch(`https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=8&top=1`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'TweetHotspot/2.0' }, signal: AbortSignal.timeout(6000) });
    let j = await r.json();
    if (!Array.isArray(j) || !j.length) {
      r = await fetch(`https://dev.to/api/articles/search?q=${encodeURIComponent(kw)}&per_page=8`,
        { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(6000) });
      j = await r.json();
      j = Array.isArray(j) ? j : (j?.result || []);
    }
    return j.slice(0, 8).map(a => ({
      src: 'dt', title: a.title, url: a.url || `https://dev.to${a.path}`, summary: ''
    })).filter(i => i.title);
  } catch { return []; }
}

async function addSummaries(items, apiKey) {
  if (!items.length) return items;
  const list = items.map((it, i) => `${i + 1}. ${it.title}`).join('\n');
  try {
    const raw = await Promise.race([callGLM(`为以下每条热点生成一句话中文摘要（15字内），只输出"编号. 摘要"：\n${list}`, 500, apiKey), new Promise(r=>setTimeout(()=>r(''),10000))]);
    raw.split('\n').forEach(line => {
      const m = line.match(/^(\d+)[.、]\s*(.+)/);
      if (m) { const idx = parseInt(m[1]) - 1; if (items[idx] && !items[idx].summary) items[idx].summary = m[2].trim(); }
    });
  } catch {}
  return items;
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

    // /api/search
    if (request.method === 'POST' && url.pathname === '/api/search') {
      let keyword;
      try { ({ keyword } = await request.json()); } catch { return json({ error: '请求格式错误' }, 400); }
      if (!keyword?.trim()) return json({ error: '请输入关键词' }, 400);

      const apiKey = env.GLM_API_KEY;
      const enKw = apiKey ? await translateKw(keyword, apiKey) : keyword;

      const [hn, rd, ph, gh, dt] = await Promise.all([
        fetchHN(enKw), fetchReddit(enKw), fetchProductHunt(enKw), fetchGitHub(enKw), fetchDevTo(enKw),
      ]);
      let results = [...hn, ...rd, ...ph, ...gh, ...dt];
      if (!results.length) return json({ error: '未找到相关热点，换个关键词试试' }, 404);
      if (apiKey) results = await addSummaries(results, apiKey);
      return json({ results });
    }

    // /api/insights
    if (request.method === 'POST' && url.pathname === '/api/insights') {
      let items;
      try { ({ items } = await request.json()); } catch { return json({ error: '请求格式错误' }, 400); }
      if (!items?.length) return json({ error: '请先选择热点素材' }, 400);
      const apiKey = env.GLM_API_KEY;
      if (!apiKey) return json({ error: 'GLM_API_KEY 未配置' }, 500);

      const itemText = items.map((it, i) => `${i + 1}. 【${it.title}】${it.summary ? ' — ' + it.summary : ''}`).join('\n');
      const prompt = `你是帮中文推特创作者找推文灵感的助手。

用户选中了以下热点：
${itemText}

对每条热点给出一个推文切入角度，严格按格式输出（每条之间用---分隔）：

HOT: 热点标题（原样复制）
SUMMARY: 一句话背景（15字内，中文）
ANGLE: 推文切入角度（一句话有观点，可直接作为推文开头，不超过30字）
---

要求：角度要有真实观点，不要套话，不要强行拉关系。`;

      const insights = await callGLM(prompt, 1000, apiKey);
      return json({ insights });
    }

    return new Response('Not found', { status: 404 });
  },
};
