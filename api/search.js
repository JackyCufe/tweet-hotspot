/**
 * /api/search — 搜索热点
 * 数据源：HN + Reddit + Product Hunt + GitHub + Dev.to
 */

const GLM_API_KEY = process.env.GLM_API_KEY;

// ─── 工具 ─────────────────────────────────────────────────────────────────────

async function callGLM(prompt, maxTokens) {
  const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GLM_API_KEY}` },
    body: JSON.stringify({ model: 'glm-4-flash', messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0.5 }),
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || '';
}

// 中文关键词翻译为英文
async function translateKw(kw) {
  if (/^[\x00-\x7F]+$/.test(kw)) return kw;
  try {
    const raw = await callGLM(`把"${kw}"翻译成英文搜索词，只输出英文，不超过3个词`, 20);
    return raw.replace(/[\"']/g, '') || kw;
  } catch { return kw; }
}

// 解析 XML 里的字段
function xmlField(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

// ─── 数据源 ───────────────────────────────────────────────────────────────────

async function fetchHN(kw) {
  try {
    const r = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(kw)}&tags=story&hitsPerPage=10`,
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

async function fetchReddit(kw) {
  try {
    const r = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(kw)}&sort=hot&limit=10&type=link`,
      { headers: { 'User-Agent': 'TweetHotspot/2.0' }, signal: AbortSignal.timeout(8000) }
    );
    const j = await r.json();
    return (j?.data?.children || []).map(p => ({
      src: 'rd',
      title: p.data?.title,
      url: `https://reddit.com${p.data?.permalink}`,
      summary: p.data?.subreddit_name_prefixed || ''
    })).filter(i => i.title);
  } catch { return []; }
}

async function fetchProductHunt(kw) {
  try {
    const r = await fetch('https://www.producthunt.com/feed', {
      headers: { 'User-Agent': 'TweetHotspot/2.0', 'Accept': 'application/xml' },
      signal: AbortSignal.timeout(8000),
    });
    const xml = await r.text();
    // 解析 entry 列表
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    const kl = kw.toLowerCase();
    return entries
      .map(e => {
        const title = xmlField(e, 'title');
        const url = (e.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/) || [])[1] || '';
        const desc = e.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200);
        return { src: 'ph', title, url, summary: '', _desc: desc };
      })
      .filter(i => i.title && (i.title.toLowerCase().includes(kl) || i._desc.toLowerCase().includes(kl)))
      .slice(0, 8)
      .map(({ _desc, ...rest }) => rest);
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

// 批量生成摘要（一次 GLM 调用）
async function addSummaries(items) {
  if (!items.length || !GLM_API_KEY) return items;
  const list = items.map((it, i) => `${i + 1}. ${it.title}`).join('\n');
  try {
    const raw = await callGLM(`为以下每条热点生成一句话中文摘要（15字内），只输出"编号. 摘要"，不要其他内容：\n${list}`, 500);
    raw.split('\n').forEach(line => {
      const m = line.match(/^(\d+)[.、]\s*(.+)/);
      if (m) {
        const idx = parseInt(m[1]) - 1;
        if (items[idx] && !items[idx].summary) items[idx].summary = m[2].trim();
      }
    });
  } catch {}
  return items;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { keyword } = req.body || {};
  if (!keyword?.trim()) return res.status(400).json({ error: '请输入关键词' });

  const enKw = GLM_API_KEY ? await translateKw(keyword) : keyword;

  const [hn, rd, ph, gh, dt] = await Promise.all([
    fetchHN(enKw),
    fetchReddit(enKw),
    fetchProductHunt(enKw),
    fetchGitHub(enKw),
    fetchDevTo(enKw),
  ]);

  let results = [...hn, ...rd, ...ph, ...gh, ...dt];
  if (!results.length) return res.status(404).json({ error: '未找到相关热点，换个关键词试试' });

  results = await addSummaries(results);
  res.status(200).json({ results });
}
