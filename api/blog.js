// 네이버 블로그 최신 글 → JSON (RSS 파싱 + 썸네일 보강), 이미지 프록시
const BLOG_ID = 'taxjw24';
const RSS = `https://rss.blog.naver.com/${BLOG_ID}.xml`;
const UA = 'Mozilla/5.0 (compatible; TaxcoreBlogFetcher/1.0; +https://taxcore-jw.com)';

const decode = s => (s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`)); return m ? decode(m[1]).trim() : ''; };
const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const isNaverImg = u => { try { const h = new URL(u).hostname; return /(^|\.)pstatic\.net$/.test(h) || /(^|\.)naver\.net$/.test(h); } catch { return false; } };

async function ogImage(link) {
  try {
    const m = link.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
    const url = m ? `https://blog.naver.com/PostView.naver?blogId=${m[1]}&logNo=${m[2]}` : link;
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const html = await r.text();
    const og = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    return og ? decode(og[1]) : '';
  } catch { return ''; }
}

module.exports = async (req, res) => {
  const q = req.query || {};
  // 이미지 프록시 (네이버 이미지 핫링크 차단 회피, pstatic.net만 허용)
  if (q.img) {
    if (!isNaverImg(q.img)) { res.status(400).end('bad image host'); return; }
    try {
      const r = await fetch(q.img, { headers: { 'User-Agent': UA, Referer: 'https://blog.naver.com/' } });
      if (!r.ok) { res.status(r.status).end(); return; }
      res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, s-maxage=86400, max-age=86400, stale-while-revalidate=604800');
      res.status(200).send(Buffer.from(await r.arrayBuffer()));
    } catch { res.status(502).end(); }
    return;
  }
  const limit = Math.min(parseInt(q.limit, 10) || 3, 6);
  try {
    const r = await fetch(RSS, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error('rss ' + r.status);
    const xml = await r.text();
    const items = (xml.match(/<item>[\s\S]*?<\/item>/g) || []).slice(0, limit);
    const posts = await Promise.all(items.map(async it => {
      const link = tag(it, 'link').replace(/[?&]fromRss=true.*$/, '');
      const desc = tag(it, 'description');
      const imgM = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
      let image = imgM ? imgM[1] : '';
      if (!image) image = await ogImage(link);
      if (image) image = image.replace(/\?type=\w+$/, '') + '?type=w2';
      const text = strip(desc);
      return {
        title: tag(it, 'title'),
        link,
        date: new Date(tag(it, 'pubDate')).toISOString(),
        category: tag(it, 'category'),
        excerpt: text.length > 90 ? text.slice(0, 90) + '…' : text,
        image: image && isNaverImg(image) ? `/api/blog?img=${encodeURIComponent(image)}` : '',
      };
    }));
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json({ blog: `https://blog.naver.com/${BLOG_ID}`, posts });
  } catch (e) {
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(200).json({ blog: `https://blog.naver.com/${BLOG_ID}`, posts: [], error: String(e.message || e) });
  }
};
