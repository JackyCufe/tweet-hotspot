/**
 * /api/insights — 生成推文切入角度
 */

const GLM_API_KEY = process.env.GLM_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { items } = req.body || {};
  if (!items?.length) return res.status(400).json({ error: '请先选择热点素材' });
  if (!GLM_API_KEY) return res.status(500).json({ error: 'GLM_API_KEY 未配置' });

  const itemText = items.map((it, i) =>
    `${i + 1}. 【${it.title}】${it.summary ? ' — ' + it.summary : ''}`
  ).join('\n');

  const prompt = `你是帮中文推特创作者找推文灵感的助手。

用户选中了以下热点：
${itemText}

对每条热点给出一个推文切入角度，严格按格式输出（每条之间用---分隔）：

HOT: 热点标题（原样复制）
SUMMARY: 一句话背景（15字内，中文）
ANGLE: 推文切入角度（一句话有观点，可直接作为推文开头，不超过30字）
---

要求：角度要有真实观点，不要套话，不要强行拉关系。`;

  try {
    const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GLM_API_KEY}` },
      body: JSON.stringify({ model: 'glm-4-flash', messages: [{ role: 'user', content: prompt }], max_tokens: 1000, temperature: 0.7 }),
      signal: AbortSignal.timeout(25000),
    });
    const j = await r.json();
    const insights = j?.choices?.[0]?.message?.content || '';
    res.status(200).json({ insights });
  } catch (e) {
    res.status(500).json({ error: 'GLM 调用失败：' + e.message });
  }
}
