#!/usr/bin/env node
/**
 * Tweet Hotspot Server v3
 * - 抖音/V2EX：全榜 + GLM 过滤
 * - HN/Reddit：真正关键词搜索
 * - 支持多切入主题生成推文灵感
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8877;
const GLM_API_KEY = '20746b76dc8c41efab48bfc6f4fa1b88.cqOfA4BCLr6VZzHE';

// ─── 工具 ─────────────────────────────────────────────────────────────────────

function httpsGet(options, timeout = 10000) {
  return new Promise((resolve) => {
    const req = https.request({ ...options, timeout }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

function formatCount(n) {
  if (!n || isNaN(n)) return null;
  n = parseInt(n);
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toString();
}

// ─── 数据源 ───────────────────────────────────────────────────────────────────

// 抖音：抓全榜（无法关键词搜索）
async function fetchDouyin() {
  const data = await httpsGet({
    hostname: 'www.iesdouyin.com',
    path: '/web/api/v2/hotsearch/billboard/word/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://www.douyin.com/'
    }
  });
  try {
    const json = JSON.parse(data);
    return (json?.word_list || []).slice(0, 30).map(i => ({
      word: i.word,
      hotValue: i.hot_value
    }));
  } catch { return []; }
}

// V2EX：抓热帖列表（无公开搜索接口）
async function fetchV2EX() {
  const data = await httpsGet({
    hostname: 'www.v2ex.com',
    path: '/api/topics/hot.json',
    method: 'GET',
    headers: { 'User-Agent': 'TweetHotspot/3.0', 'Accept': 'application/json' }
  });
  try {
    const json = JSON.parse(data);
    return (json || []).slice(0, 20).map(t => ({
      word: t.title,
      hotValue: t.replies,
      url: `https://www.v2ex.com/t/${t.id}`
    }));
  } catch { return []; }
}

// HN：Algolia 官方免费搜索 API
async function searchHN(keyword) {
  const encoded = encodeURIComponent(keyword);
  const data = await httpsGet({
    hostname: 'hn.algolia.com',
    path: `/api/v1/search?query=${encoded}&tags=story&hitsPerPage=10`,
    method: 'GET',
    headers: { 'User-Agent': 'TweetHotspot/3.0', 'Accept': 'application/json' }
  });
  try {
    const json = JSON.parse(data);
    return (json?.hits || []).map(h => ({
      title: h.title || '',
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      views: formatCount(h.points),
      comments: formatCount(h.num_comments),
      source: 'Hacker News'
    })).filter(i => i.title);
  } catch { return []; }
}

// Reddit：关键词搜索
async function searchReddit(keyword) {
  const encoded = encodeURIComponent(keyword);
  const data = await httpsGet({
    hostname: 'www.reddit.com',
    path: `/search.json?q=${encoded}&sort=hot&limit=10&type=link`,
    method: 'GET',
    headers: { 'User-Agent': 'TweetHotspot/3.0', 'Accept': 'application/json' }
  });
  try {
    const json = JSON.parse(data);
    return (json?.data?.children || []).map(p => ({
      title: p.data?.title || '',
      url: `https://reddit.com${p.data?.permalink}`,
      views: formatCount(p.data?.score),
      comments: formatCount(p.data?.num_comments),
      subreddit: p.data?.subreddit_name_prefixed,
      source: 'Reddit'
    })).filter(i => i.title);
  } catch { return []; }
}

// ─── GLM ─────────────────────────────────────────────────────────────────────

async function callGLM(prompt, maxTokens = 1500) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7
    });
    const options = {
      hostname: 'open.bigmodel.cn',
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 25000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)?.choices?.[0]?.message?.content || ''); }
        catch { resolve(''); }
      });
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
    req.write(body);
    req.end();
  });
}

// 从榜单里过滤关键词相关条目
async function filterByKeyword(list, keyword, sourceName, urlBuilder) {
  if (!list.length) return [];

  // 第一步：字符串粗筛，包含关键词的直接保留
  const kw = keyword.toLowerCase();
  const directMatch = list.filter(i => i.word.toLowerCase().includes(kw));
  if (directMatch.length >= 3) {
    // 直接匹配够用，不调 GLM
    return directMatch.slice(0, 8).map(i => ({
      title: i.word,
      url: urlBuilder(i),
      views: i.hotValue ? formatCount(i.hotValue) : null,
      comments: i.comments ? formatCount(i.comments) : null,
      source: sourceName
    }));
  }

  // 第二步：字符串匹配不够，让 GLM 判断，但明确告知"无关就返回NONE"
  const listText = list.map((i, idx) => `${idx + 1}. ${i.word}`).join('\n');
  const prompt = `以下是${sourceName}热点列表，找出与「${keyword}」**真正相关**的条目编号（技术/行业/工具/趋势等方向）。

严格要求：
- 只选真正相关的，不要强行关联
- 娱乐、明星、影视、体育、八卦等一律不选
- 如果没有任何真正相关的条目，直接返回 NONE
- 有相关的，只返回编号用逗号分隔，不要其他内容

${listText}`;
  const result = await callGLM(prompt, 80);
  if (!result || result.trim().toUpperCase() === 'NONE') return [];
  const indexes = result.match(/\d+/g)?.map(n => parseInt(n) - 1).filter(n => n >= 0 && n < list.length) || [];
  return indexes.map(i => ({
    title: list[i].word,
    url: urlBuilder(list[i]),
    views: list[i].hotValue ? formatCount(list[i].hotValue) : null,
    comments: list[i].comments ? formatCount(list[i].comments) : null,
    source: sourceName
  }));
}

// 生成推文灵感（支持多个切入主题）
async function generateInsights(selectedItems, topics) {
  const itemText = selectedItems.map((item, i) =>
    `${i + 1}. 【${item.source}】${item.title}`
  ).join('\n');

  const prompt = `你是帮助中文推特创作者找推文灵感的助手。

用户选中了以下热点素材：
${itemText}

用户想切入的主题：${topics.join('、')}

请针对每个切入主题，结合热点，给出2-3个推文角度。每个角度严格按以下格式输出（每个角度一个块，用---分隔）：

TOPIC: 【切入主题名】
HOT: 引用的热点标题
SUMMARY: 这条热点的一句话背景概括（15字内）
ANGLE: 推文切入角度（一句话，有观点，可直接作为推文开头）
---

每个主题给2-3个角度块，角度要有真实观点，不要套话。`;

  const raw = await callGLM(prompt, 1800) || '';
  return raw;
}

// ─── HTTP 服务器 ──────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'GET' && url.pathname === '/') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html); return;
  }

  // 搜索热点
  if (req.method === 'POST' && url.pathname === '/api/search') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { keyword } = JSON.parse(body);
        if (!keyword?.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '请输入关键词' })); return;
        }

        // 并发抓取四个源
        const [douyinRaw, v2exRaw, hn, reddit] = await Promise.all([
          fetchDouyin(),
          fetchV2EX(),
          searchHN(keyword),
          searchReddit(keyword)
        ]);

        // 并发用 GLM 过滤抖音和 V2EX
        const [douyin, v2ex] = await Promise.all([
          filterByKeyword(douyinRaw, keyword, '抖音热搜',
            i => `https://www.douyin.com/search/${encodeURIComponent(i.word)}`),
          filterByKeyword(v2exRaw, keyword, 'V2EX',
            i => i.url || 'https://www.v2ex.com')
        ]);

        const results = [...douyin, ...v2ex, ...hn, ...reddit].filter(i => i.title);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ results }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 生成推文灵感
  if (req.method === 'POST' && url.pathname === '/api/generate') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { selectedItems, topics } = JSON.parse(body);
        if (!selectedItems?.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '请先选择热点素材' })); return;
        }
        if (!topics?.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '请输入切入主题' })); return;
        }

        const insights = await generateInsights(selectedItems, topics);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ insights }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`✅ Tweet Hotspot v3 已启动: http://localhost:${PORT}`);
});
