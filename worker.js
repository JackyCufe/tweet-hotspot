/**
 * Tweet Hotspot - Cloudflare Worker
 * 抓取微博/抖音/HN/Dev.to/GitHub Trending热点，结合GLM-4-Flash生成推文切入角度
 * GLM_API_KEY 通过环境变量注入（wrangler secret 或 .dev.vars）
 *
 * 数据源说明（均无爬虫限制）：
 *   微博热搜  → weibo.com/ajax/side/hotSearch （JSON API，稳定）
 *   抖音热搜  → iesdouyin.com API（JSON API）
 *   Hacker News → hacker-news.firebaseio.com（Firebase官方，完全免费无限制）
 *   Dev.to     → dev.to/api/articles（官方REST API，无需认证）
 *   GitHub     → gh-trending-api.waningflow.com（第三方聚合，无需Token）
 */

// ─── 内嵌前端页面 ──────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>推文热点素材库</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet" />
  <style>
    body { background-color: #020617; color: #f8fafc; font-family: 'Noto Sans SC', sans-serif; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #1e293b; }
    ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
    .result-card { white-space: pre-wrap; line-height: 1.8; }
    .hotspot-tag { display: inline-block; background: #1e3a5f; border: 1px solid #2563eb;
                   border-radius: 6px; padding: 2px 8px; margin: 2px; font-size: 12px; color: #93c5fd; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 1s linear infinite; }
  </style>
</head>
<body class="min-h-screen">

  <!-- 顶部导航 -->
  <header class="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
    <div class="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h1 class="text-slate-100 font-semibold text-base">推文热点素材库</h1>
      <span class="text-slate-500 text-xs ml-auto">by @Jacky_cufe</span>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-8 space-y-6">

    <!-- 说明 -->
    <div class="text-slate-400 text-sm leading-relaxed">
      输入你的内容方向，自动抓取微博、抖音、Hacker News、Dev.to、GitHub Trending 今日热点，AI 帮你找出最适合结合的素材切入角度。
    </div>

    <!-- 输入区 -->
    <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
      <label class="block text-slate-300 text-sm font-medium">你的内容方向</label>
      <input
        id="direction"
        type="text"
        placeholder="例如：AI工具、职场提效、创业记录、副业变现……"
        class="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100
               placeholder-slate-500 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button
        id="generate-btn"
        onclick="generate()"
        class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm
               transition-colors duration-150 flex items-center justify-center gap-2"
      >
        <svg id="btn-icon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span id="btn-text">获取今日热点素材</span>
      </button>
    </div>

    <!-- 热点来源 -->
    <div id="hotspot-section" class="hidden bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
      <h2 class="text-slate-300 text-sm font-medium flex items-center gap-2">
        <svg class="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
        今日热点
      </h2>
      <div id="hotspot-content" class="space-y-3"></div>
    </div>

    <!-- AI素材建议 -->
    <div id="insights-section" class="hidden bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
      <h2 class="text-slate-300 text-sm font-medium flex items-center gap-2">
        <svg class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        AI 推荐素材切入角度
      </h2>
      <div id="insights-content" class="result-card text-slate-300 text-sm"></div>
      <div class="pt-2 border-t border-slate-700/50">
        <p class="text-slate-500 text-xs">💡 这些只是切入角度，具体推文内容需要你根据自己的真实经历来写</p>
      </div>
    </div>

    <!-- 错误提示 -->
    <div id="error-section" class="hidden bg-red-950/60 border border-red-800/60 rounded-2xl p-4">
      <p id="error-msg" class="text-red-300 text-sm"></p>
    </div>

  </main>

  <footer class="mt-16 border-t border-slate-800/60 py-6">
    <p class="text-center text-slate-600 text-xs">
      推文热点素材库 · Made by <a href="https://x.com/Jacky_cufe" target="_blank" class="text-blue-500 hover:text-blue-400">@Jacky_cufe</a>
    </p>
  </footer>

  <script>
    let loading = false;

    async function generate() {
      if (loading) return;
      const direction = document.getElementById('direction').value.trim();
      if (!direction) {
        alert('请先输入你的内容方向');
        return;
      }

      loading = true;
      const btn = document.getElementById('generate-btn');
      const btnText = document.getElementById('btn-text');
      const btnIcon = document.getElementById('btn-icon');
      btn.disabled = true;
      btn.classList.add('opacity-70');
      btnText.textContent = '正在抓取热点并生成素材…';
      btnIcon.classList.add('spinner');

      document.getElementById('hotspot-section').classList.add('hidden');
      document.getElementById('insights-section').classList.add('hidden');
      document.getElementById('error-section').classList.add('hidden');

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction })
        });
        const data = await res.json();

        if (data.error) {
          document.getElementById('error-msg').textContent = data.error;
          document.getElementById('error-section').classList.remove('hidden');
        } else {
          const hotspotEl = document.getElementById('hotspot-content');
          hotspotEl.innerHTML = data.hotspots.map(h => \`
            <div>
              <p class="text-slate-500 text-xs mb-1">\${h.source}</p>
              <div class="flex flex-wrap gap-1">
                \${h.items.map(item => \`<span class="hotspot-tag">\${item}</span>\`).join('')}
              </div>
            </div>
          \`).join('');
          document.getElementById('hotspot-section').classList.remove('hidden');

          document.getElementById('insights-content').textContent = data.insights;
          document.getElementById('insights-section').classList.remove('hidden');
        }
      } catch (e) {
        document.getElementById('error-msg').textContent = '请求失败：' + e.message;
        document.getElementById('error-section').classList.remove('hidden');
      } finally {
        loading = false;
        btn.disabled = false;
        btn.classList.remove('opacity-70');
        btnText.textContent = '获取今日热点素材';
        btnIcon.classList.remove('spinner');
      }
    }

    document.getElementById('direction').addEventListener('keydown', e => {
      if (e.key === 'Enter') generate();
    });
  </script>
</body>
</html>`;

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── 抓取热点 ─────────────────────────────────────────────────────────────────

async function fetchWeibo() {
  try {
    const res = await fetch('https://weibo.com/ajax/side/hotSearch', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://weibo.com/',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    const items = json?.data?.realtime || [];
    const result = items.slice(0, 10).map(i => i.word || i.note).filter(Boolean);
    return { source: '微博热搜', items: result };
  } catch {
    return { source: '微博热搜', items: [] };
  }
}

async function fetchDouyin() {
  try {
    const res = await fetch('https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.douyin.com/',
      },
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    const items = json?.word_list || [];
    const result = items.slice(0, 10).map(i => i.word).filter(Boolean);
    return { source: '抖音热搜', items: result };
  } catch {
    return { source: '抖音热搜', items: [] };
  }
}

// ── Hacker News Top Stories（官方 Firebase API，无任何限制）──────────────────
async function fetchHackerNews() {
  try {
    // 获取 top story ID 列表
    const idsRes = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { signal: AbortSignal.timeout(8000) }
    );
    const ids = await idsRes.json();
    // 并发取前 8 条标题
    const items = await Promise.all(
      ids.slice(0, 8).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(6000),
        })
          .then(r => r.json())
          .then(d => d?.title)
          .catch(() => null)
      )
    );
    return { source: 'Hacker News', items: items.filter(Boolean) };
  } catch {
    return { source: 'Hacker News', items: [] };
  }
}

// ── Dev.to 热门文章（官方 API，无需认证）────────────────────────────────────────
async function fetchDevTo() {
  try {
    const res = await fetch(
      'https://dev.to/api/articles?top=1&per_page=8',
      {
        headers: { 'Accept': 'application/json', 'User-Agent': 'TweetHotspot/1.0' },
        signal: AbortSignal.timeout(8000),
      }
    );
    const json = await res.json();
    const result = json.slice(0, 8).map(a => a.title).filter(Boolean);
    return { source: 'Dev.to 热门', items: result };
  } catch {
    return { source: 'Dev.to 热门', items: [] };
  }
}

// ── GitHub Trending（第三方聚合 API，无需 Token）─────────────────────────────
async function fetchGitHubTrending() {
  try {
    const res = await fetch(
      'https://gh-trending-api.waningflow.com/repositories?since=daily&language=',
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );
    const json = await res.json();
    const repos = Array.isArray(json) ? json : json?.items || [];
    const result = repos
      .slice(0, 8)
      .map(r => `${r.author}/${r.name}：${r.description || ''}`.trim())
      .filter(Boolean);
    return { source: 'GitHub Trending', items: result };
  } catch {
    return { source: 'GitHub Trending', items: [] };
  }
}

// ─── 按方向过滤热点（仅对微博/抖音做粗筛，HN/Dev.to/GitHub 不过滤）─────────────

// 纯娱乐/无关关键词黑名单（中文热搜常见噪音）
const NOISE_KEYWORDS = [
  '明星','演员','歌手','综艺','选秀','恋情','出轨','结婚','离婚','怀孕','生娃',
  '流量','粉丝','饭圈','偶像','爱豆','海军宣传片','宣传片','电视剧','电影','剧情',
  '舞蹈','跳舞','造型','穿搭','白月光','cha cha','单人cha',
  '红毛猩猩','猩猩','动物','宠物',
  '足球','篮球','乒乓','羽毛球','运动员','奥运','世界杯',
];

/**
 * 对微博/抖音热搜做双重过滤：
 * 1. 先用黑名单排除明显娱乐噪音
 * 2. 再用 direction 关键词做正向匹配（宽松）
 */
function filterHotspots(hotspots, direction) {
  // 提取用户方向关键词（按空格/逗号/、分割）
  const dirKeys = direction
    .split(/[\s,，、/]+/)
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length >= 2);

  return hotspots.map(({ source, items }) => {
    // HN / Dev.to / GitHub 不过滤，保留原样
    if (!source.includes('微博') && !source.includes('抖音')) {
      return { source, items };
    }
    // 对微博/抖音：先黑名单过滤，再宽松正向匹配
    const filtered = items.filter(item => {
      const lower = item.toLowerCase();
      // 黑名单命中 → 丢弃
      if (NOISE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))) return false;
      // 如果有方向关键词，要求至少模糊相关（只要不是纯娱乐就保留）
      // 这里采用宽松策略：没命中黑名单就保留，让 GLM 做第二层判断
      return true;
    });
    return { source, items: filtered };
  }).filter(h => h.items.length > 0);
}

// ─── 调用GLM生成素材建议 ──────────────────────────────────────────────────────

async function generateInsights(hotspots, direction, apiKey) {
  const hotspotText = hotspots
    .map(h => `【${h.source}】\n${h.items.map((item, i) => `${i + 1}. ${item}`).join('\n')}`)
    .join('\n\n');

  const prompt = `你是一个帮助中文推特创作者找推文素材的助手。

用户的内容方向是：${direction}

以下是今天的热点话题：
${hotspotText}

严格要求：
- 只选择与「${direction}」**直接相关**的热点（技术、行业、商业、工具、趋势等）
- **禁止**选择娱乐八卦、明星绯闻、影视综艺、体育赛事等无关内容
- 如果热点与方向**完全无关**，直接跳过，不要强行扯关系
- 如果相关热点不足5条，只输出真正相关的，不要凑数

请从这些热点中，选出最适合与用户方向结合的话题（最多5条），对每个话题：
1. 说明这个热点和「${direction}」方向的结合点（必须真实，不能牵强）
2. 给一个具体的推文切入角度（一句话，不超过30字）

格式如下：
🔥 [热点话题]
📌 结合点：xxx
✏️ 切入角度：xxx

简洁直接，不要废话，不要强行拉关系。`;

  try {
    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json();
    return json?.choices?.[0]?.message?.content || '生成失败，请重试';
  } catch (e) {
    return `GLM调用失败：${e.message}`;
  }
}

// ─── Worker 入口 ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: CORS });
    }

    // 主页
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // API: 获取热点 + 生成素材
    if (request.method === 'POST' && url.pathname === '/api/generate') {
      let direction;
      try {
        ({ direction } = await request.json());
      } catch {
        return new Response(JSON.stringify({ error: '请求格式错误' }), {
          status: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      if (!direction?.trim()) {
        return new Response(JSON.stringify({ error: '请输入内容方向' }), {
          status: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      // 并发抓热点，任意平台失败不中断
      const [weibo, douyin, hn, devto, github] = await Promise.all([
        fetchWeibo(), fetchDouyin(), fetchHackerNews(), fetchDevTo(), fetchGitHubTrending(),
      ]);
      // 对微博/抖音做关键词过滤，HN/Dev.to/GitHub 不过滤
      const hotspots = filterHotspots(
        [weibo, douyin, hn, devto, github].filter(h => h.items.length > 0),
        direction
      );

      if (hotspots.length === 0) {
        return new Response(JSON.stringify({ error: '所有热点平台均无法访问，请稍后重试' }), {
          status: 500,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      const apiKey = env.GLM_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'GLM_API_KEY 未配置' }), {
          status: 500,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      const insights = await generateInsights(hotspots, direction, apiKey);

      return new Response(JSON.stringify({ hotspots, insights }), {
        headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
