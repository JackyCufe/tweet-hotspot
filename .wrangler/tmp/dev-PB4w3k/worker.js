var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>\u63A8\u6587\u70ED\u70B9\u7D20\u6750\u5E93</title>
<script src="https://cdn.tailwindcss.com"><\/script>
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
    <h1 class="text-slate-100 font-semibold text-base">\u63A8\u6587\u70ED\u70B9\u7D20\u6750\u5E93</h1>
    <span class="text-slate-500 text-xs ml-auto">by @Jacky_cufe</span>
  </div>
</header>

<main class="max-w-5xl mx-auto px-4 py-8 space-y-6">
  <!-- \u641C\u7D22\u533A -->
  <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
    <div class="flex gap-3">
      <input id="keyword" type="text" placeholder="\u8F93\u5165\u5173\u952E\u8BCD\uFF0C\u4F8B\u5982\uFF1AAI\u3001\u526F\u4E1A\u3001\u5FAE\u670D\u52A1\u2026\u2026"
        class="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm outline-none focus:border-blue-500"/>
      <button onclick="doSearch()" id="search-btn"
        class="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm transition-colors flex items-center gap-2 shrink-0">
        <svg id="search-icon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span id="search-txt">\u641C\u7D22\u70ED\u70B9</span>
      </button>
    </div>
  </div>

  <!-- \u4E24\u680F -->
  <div id="main-section" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
    <!-- \u5DE6\uFF1A\u70ED\u70B9\u5217\u8868 -->
    <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl flex flex-col" style="max-height:80vh">
      <div class="flex items-center justify-between p-5 pb-3 shrink-0">
        <h2 class="text-slate-300 text-sm font-medium">\u{1F525} \u76F8\u5173\u70ED\u70B9</h2>
        <span id="sel-count" class="text-slate-600 text-xs">\u70B9\u51FB\u5361\u7247\u9009\u62E9\u7D20\u6750</span>
      </div>
      <div id="hotspot-list" class="space-y-2 overflow-y-auto px-5 flex-1"></div>
      <div class="p-5 pt-3 shrink-0 border-t border-slate-800/60">
        <button id="gen-btn" onclick="doInsights()" disabled
          class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2">
          <svg id="gen-icon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span id="gen-txt">\u751F\u6210\u63A8\u6587\u5207\u5165\u89D2\u5EA6</span>
        </button>
      </div>
    </div>

    <!-- \u53F3\uFF1A\u63A8\u6587\u7075\u611F -->
    <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 space-y-3">
      <h2 class="text-slate-300 text-sm font-medium">\u270F\uFE0F \u63A8\u6587\u5207\u5165\u89D2\u5EA6</h2>
      <div id="insights-content">
        <p class="text-slate-600 text-sm text-center py-10">\u2190 \u9009\u62E9\u70ED\u70B9\u7D20\u6750\u540E\u70B9\u51FB\u751F\u6210</p>
      </div>
      <p class="text-slate-600 text-xs pt-2 border-t border-slate-800">\u{1F4A1} \u89D2\u5EA6\u4EC5\u4F9B\u53C2\u8003\uFF0C\u5185\u5BB9\u8981\u7ED3\u5408\u4F60\u7684\u771F\u5B9E\u7ECF\u5386\u6765\u5199</p>
    </div>
  </div>

  <div id="err" class="hidden bg-red-950/60 border border-red-800/60 rounded-2xl p-4">
    <p id="err-msg" class="text-red-300 text-sm"></p>
  </div>
</main>

<footer class="mt-16 border-t border-slate-800/60 py-6">
  <p class="text-center text-slate-600 text-xs">\u63A8\u6587\u70ED\u70B9\u7D20\u6750\u5E93 \xB7 Made by <a href="https://x.com/Jacky_cufe" target="_blank" class="text-blue-500 hover:text-blue-400">@Jacky_cufe</a></p>
</footer>

<script>
let allItems = [], selected = new Set();

const badgeClass = {wb:'badge-wb',dy:'badge-dy',hn:'badge-hn',dt:'badge-dt',gh:'badge-gh'};
const badgeLabel = {wb:'\u5FAE\u535A',dy:'\u6296\u97F3',hn:'HN',dt:'Dev.to',gh:'GitHub'};

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
              class="text-slate-500 hover:text-blue-400 text-xs truncate max-w-[180px]" title="\${item.url}">\u2197 \u539F\u6587</a>\`: ''}
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
  document.getElementById('sel-count').textContent = n ? \`\u5DF2\u9009 \${n} \u6761\` : '\u70B9\u51FB\u5361\u7247\u9009\u62E9\u7D20\u6750';
  document.getElementById('gen-btn').disabled = n===0;
}

function setSearchLoading(on){
  document.getElementById('search-btn').disabled=on;
  document.getElementById('search-icon').className='w-4 h-4'+(on?' spin':'');
  document.getElementById('search-txt').textContent=on?'\u641C\u7D22\u4E2D\u2026':'\u641C\u7D22\u70ED\u70B9';
}

async function doSearch(){
  const kw = document.getElementById('keyword').value.trim();
  if(!kw){alert('\u8BF7\u8F93\u5165\u5173\u952E\u8BCD');return;}
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
    document.getElementById('insights-content').innerHTML='<p class="text-slate-600 text-sm text-center py-10">\u2190 \u9009\u62E9\u70ED\u70B9\u7D20\u6750\u540E\u70B9\u51FB\u751F\u6210</p>';
    document.getElementById('gen-btn').disabled=true;
    document.getElementById('sel-count').textContent='\u70B9\u51FB\u5361\u7247\u9009\u62E9\u7D20\u6750';
  }catch(e){
    document.getElementById('err-msg').textContent=e.message;
    document.getElementById('err').classList.remove('hidden');
  }finally{setSearchLoading(false);}
}

function setGenLoading(on){
  document.getElementById('gen-btn').disabled=on;
  document.getElementById('gen-icon').className='w-4 h-4'+(on?' spin':'');
  document.getElementById('gen-txt').textContent=on?'\u751F\u6210\u4E2D\u2026':'\u751F\u6210\u63A8\u6587\u5207\u5165\u89D2\u5EA6';
}

async function doInsights(){
  const items = [...selected].map(i=>allItems[i]);
  setGenLoading(true);
  document.getElementById('insights-content').innerHTML='<p class="text-slate-500 text-sm text-center py-10">AI \u6B63\u5728\u751F\u6210\u5207\u5165\u89D2\u5EA6\u2026</p>';
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
  if(!blocks.length) return '<p class="text-slate-500 text-sm text-center py-10">\u6CA1\u6709\u751F\u6210\u7ED3\u679C\uFF0C\u6362\u4E2A\u7D20\u6750\u8BD5\u8BD5</p>';
  return blocks.map(block=>{
    const get=(key)=>block.match(new RegExp(key+':\\\\s*(.+)'))?.[1]?.trim()||'';
    const hot=get('HOT'), summary=get('SUMMARY'), angle=get('ANGLE');
    if(!angle) return '';
    return \`<div class="insight-card" onclick="this.classList.toggle('open')">
      <div class="insight-header">
        <span class="text-slate-200 text-sm flex-1 leading-snug">\u270F\uFE0F \${esc(angle)}</span>
        <span class="insight-arrow">\u25B8</span>
      </div>
      <div class="insight-body">
        \${summary?\`<div class="text-orange-400 mb-1">\u{1F525} \${esc(summary)}</div>\`:''}
        \${hot?\`<div class="text-slate-500 text-xs mt-1">\u6765\u6E90\uFF1A\${esc(hot)}</div>\`:''}
      </div>
    </div>\`;
  }).join('');
}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

document.getElementById('keyword').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
<\/script>
</body>
</html>`;
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function loosMatch(text, kw) {
  const tl = text.toLowerCase();
  const kl = kw.toLowerCase();
  if (tl.includes(kl)) return true;
  if (kl.length >= 2) {
    for (let i = 0; i < kl.length - 1; i++) {
      if (tl.includes(kl.slice(i, i + 2))) return true;
    }
  }
  return false;
}
__name(loosMatch, "loosMatch");
async function fetchWeibo(kw) {
  try {
    const r = await fetch("https://weibo.com/ajax/side/hotSearch", {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://weibo.com/", "Accept": "application/json" },
      signal: AbortSignal.timeout(8e3)
    });
    const j = await r.json();
    const all = (j?.data?.realtime || []).map((i) => i.word || i.note).filter(Boolean);
    return all.filter((w) => loosMatch(w, kw)).slice(0, 6).map((w) => ({
      src: "wb",
      title: w,
      url: `https://s.weibo.com/weibo?q=%23${encodeURIComponent(w)}%23`,
      summary: ""
    }));
  } catch {
    return [];
  }
}
__name(fetchWeibo, "fetchWeibo");
async function fetchDouyin(kw) {
  try {
    const r = await fetch("https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/", {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.douyin.com/" },
      signal: AbortSignal.timeout(8e3)
    });
    const j = await r.json();
    const all = (j?.word_list || []).map((i) => i.word).filter(Boolean);
    return all.filter((w) => loosMatch(w, kw)).slice(0, 6).map((w) => ({
      src: "dy",
      title: w,
      url: `https://www.douyin.com/search/${encodeURIComponent(w)}`,
      summary: ""
    }));
  } catch {
    return [];
  }
}
__name(fetchDouyin, "fetchDouyin");
async function fetchHN(kw) {
  try {
    const r = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(kw)}&tags=story&hitsPerPage=8`,
      { signal: AbortSignal.timeout(8e3) }
    );
    const j = await r.json();
    return (j?.hits || []).map((h) => ({
      src: "hn",
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      summary: ""
    })).filter((i) => i.title);
  } catch {
    return [];
  }
}
__name(fetchHN, "fetchHN");
async function fetchDevTo(kw) {
  try {
    const tag = kw.toLowerCase().replace(/\s+/g, "");
    let r = await fetch(
      `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=8&top=1`,
      { headers: { "Accept": "application/json", "User-Agent": "TweetHotspot/2.0" }, signal: AbortSignal.timeout(8e3) }
    );
    let j = await r.json();
    if (!Array.isArray(j) || !j.length) {
      r = await fetch(
        `https://dev.to/api/articles/search?q=${encodeURIComponent(kw)}&per_page=8`,
        { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(8e3) }
      );
      j = await r.json();
      j = Array.isArray(j) ? j : j?.result || [];
    }
    return j.slice(0, 8).map((a) => ({
      src: "dt",
      title: a.title,
      url: a.url || `https://dev.to${a.path}`,
      summary: ""
    })).filter((i) => i.title);
  } catch {
    return [];
  }
}
__name(fetchDevTo, "fetchDevTo");
async function fetchGitHub(kw) {
  try {
    const since = new Date(Date.now() - 7 * 86400 * 1e3).toISOString().slice(0, 10);
    const r = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(kw)}+created:>${since}&sort=stars&order=desc&per_page=8`,
      { headers: { "Accept": "application/vnd.github+json", "User-Agent": "TweetHotspot/2.0" }, signal: AbortSignal.timeout(8e3) }
    );
    const j = await r.json();
    return (j?.items || []).map((repo) => ({
      src: "gh",
      title: `${repo.name}\uFF1A${(repo.description || "").slice(0, 60)}`,
      url: repo.html_url,
      summary: ""
    })).filter((i) => i.title);
  } catch {
    return [];
  }
}
__name(fetchGitHub, "fetchGitHub");
async function callGLM(prompt, maxTokens, apiKey) {
  const r = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "glm-4-flash", messages: [{ role: "user", content: prompt }], max_tokens: maxTokens, temperature: 0.7 }),
    signal: AbortSignal.timeout(25e3)
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || "";
}
__name(callGLM, "callGLM");
async function translateKw(kw, apiKey) {
  if (/^[\x00-\x7F]+$/.test(kw)) return kw;
  try {
    const raw = await callGLM(`\u628A"${kw}"\u7FFB\u8BD1\u6210\u82F1\u6587\u641C\u7D22\u8BCD\uFF0C\u53EA\u8F93\u51FA\u82F1\u6587\uFF0C\u4E0D\u8D85\u8FC73\u4E2A\u8BCD`, 30, apiKey);
    return raw.trim().replace(/["']/g, "") || kw;
  } catch {
    return kw;
  }
}
__name(translateKw, "translateKw");
async function addSummaries(items, apiKey) {
  if (!items.length) return items;
  const list = items.map((it, i) => `${i + 1}. ${it.title}`).join("\n");
  const prompt = `\u4E3A\u4EE5\u4E0B\u6BCF\u6761\u70ED\u70B9\u751F\u6210\u4E00\u53E5\u8BDD\u4E2D\u6587\u6458\u8981\uFF0815\u5B57\u5185\uFF0C\u8BF4\u6E05\u695A\u662F\u4EC0\u4E48\u4E8B\uFF09\uFF0C\u53EA\u8F93\u51FA\u7F16\u53F7\u548C\u6458\u8981\uFF0C\u683C\u5F0F"1. xxx"\uFF1A
${list}`;
  try {
    const raw = await callGLM(prompt, 400, apiKey);
    const lines = raw.split("\n").filter(Boolean);
    lines.forEach((line) => {
      const m = line.match(/^(\d+)[.、]\s*(.+)/);
      if (m) {
        const idx = parseInt(m[1]) - 1;
        if (items[idx]) items[idx].summary = m[2].trim();
      }
    });
  } catch {
  }
  return items;
}
__name(addSummaries, "addSummaries");
async function generateInsights(items, apiKey) {
  const itemText = items.map((it, i) => `${i + 1}. \u3010${it.title}\u3011${it.summary ? " \u2014 " + it.summary : ""}`).join("\n");
  const prompt = `\u4F60\u662F\u5E2E\u4E2D\u6587\u63A8\u7279\u521B\u4F5C\u8005\u627E\u63A8\u6587\u7075\u611F\u7684\u52A9\u624B\u3002

\u7528\u6237\u9009\u4E2D\u4E86\u4EE5\u4E0B\u70ED\u70B9\uFF1A
${itemText}

\u5BF9\u6BCF\u6761\u70ED\u70B9\u7ED9\u51FA\u4E00\u4E2A\u63A8\u6587\u5207\u5165\u89D2\u5EA6\uFF0C\u4E25\u683C\u6309\u683C\u5F0F\u8F93\u51FA\uFF08\u6BCF\u6761\u4E4B\u95F4\u7528---\u5206\u9694\uFF09\uFF1A

HOT: \u70ED\u70B9\u6807\u9898\uFF08\u539F\u6837\u590D\u5236\uFF09
SUMMARY: \u4E00\u53E5\u8BDD\u80CC\u666F\uFF0815\u5B57\u5185\uFF09
ANGLE: \u63A8\u6587\u5207\u5165\u89D2\u5EA6\uFF08\u4E00\u53E5\u8BDD\u6709\u89C2\u70B9\uFF0C\u53EF\u76F4\u63A5\u4F5C\u4E3A\u63A8\u6587\u5F00\u5934\uFF0C\u4E0D\u8D85\u8FC730\u5B57\uFF09
---

\u8981\u6C42\uFF1A\u89D2\u5EA6\u8981\u6709\u771F\u5B9E\u89C2\u70B9\uFF0C\u4E0D\u8981\u5957\u8BDD\uFF0C\u4E0D\u8981\u5F3A\u884C\u62C9\u5173\u7CFB\u3002`;
  return await callGLM(prompt, 800, apiKey);
}
__name(generateInsights, "generateInsights");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 200, headers: CORS });
    if (request.method === "GET" && url.pathname === "/")
      return new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    const json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
    }), "json");
    if (request.method === "POST" && url.pathname === "/api/search") {
      let keyword;
      try {
        ({ keyword } = await request.json());
      } catch {
        return json({ error: "\u8BF7\u6C42\u683C\u5F0F\u9519\u8BEF" }, 400);
      }
      if (!keyword?.trim()) return json({ error: "\u8BF7\u8F93\u5165\u5173\u952E\u8BCD" }, 400);
      const apiKey = env.GLM_API_KEY;
      const enKw = apiKey ? await translateKw(keyword, apiKey) : keyword;
      const [wb, dy, hn, dt, gh] = await Promise.all([
        fetchWeibo(keyword),
        fetchDouyin(keyword),
        fetchHN(enKw),
        fetchDevTo(enKw),
        fetchGitHub(enKw)
      ]);
      let results = [...wb, ...dy, ...hn, ...dt, ...gh];
      if (!results.length) return json({ error: "\u672A\u627E\u5230\u76F8\u5173\u70ED\u70B9\uFF0C\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5" }, 404);
      if (apiKey) results = await addSummaries(results, apiKey);
      return json({ results });
    }
    if (request.method === "POST" && url.pathname === "/api/insights") {
      let items;
      try {
        ({ items } = await request.json());
      } catch {
        return json({ error: "\u8BF7\u6C42\u683C\u5F0F\u9519\u8BEF" }, 400);
      }
      if (!items?.length) return json({ error: "\u8BF7\u5148\u9009\u62E9\u70ED\u70B9\u7D20\u6750" }, 400);
      const apiKey = env.GLM_API_KEY;
      if (!apiKey) return json({ error: "GLM_API_KEY \u672A\u914D\u7F6E" }, 500);
      const insights = await generateInsights(items, apiKey);
      return json({ insights });
    }
    return new Response("Not found", { status: 404 });
  }
};

// ../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-4Ajq7U/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-4Ajq7U/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
