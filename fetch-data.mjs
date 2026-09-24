// Runs in GitHub Actions (Node 20, no dependencies, no API keys). Real data or explicit errors; nothing invented.
import { mkdir, writeFile } from 'node:fs/promises';

const H = { 'User-Agent': 'MISOCRYPTO/5 (github-actions public-data client)', Accept: 'application/json' };
const get = async (u, i = {}) => {
  const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(15000), ...i });
  if (!r.ok) throw new Error(`${r.status} ${new URL(u).hostname}`);
  return r;
};
const num = x => (x == null || x === '' || isNaN(+x) ? null : +x);
const wrap = async (source, fn) => {
  const retrievedAt = new Date().toISOString();
  try { return { ok: true, source, retrievedAt, data: await fn() }; }
  catch (e) { return { ok: false, source, retrievedAt, error: e.message }; }
};

const btc = () => wrap('mempool.space', async () => {
  const b = 'https://mempool.space/api';
  const [tip, fees, diff, hr] = await Promise.all([
    get(`${b}/blocks/tip/height`).then(r => r.json()), get(`${b}/v1/fees/recommended`).then(r => r.json()),
    get(`${b}/v1/difficulty-adjustment`).then(r => r.json()), get(`${b}/v1/mining/hashrate/1m`).then(r => r.json())]);
  const last = hr.hashrates?.at(-1);
  return { tipHeight: tip, feesSatVb: fees,
    retarget: { progressPct: num(diff.progressPercent), estChangePct: num(diff.difficultyChange), remainingBlocks: num(diff.remainingBlocks),
      estAt: diff.estimatedRetargetDate ? new Date(diff.estimatedRetargetDate).toISOString() : null },
    hashrate: last ? { EHs: +(last.avgHashrate / 1e18).toFixed(1), at: new Date(last.timestamp * 1000).toISOString() } : null };
});

const stables = () => wrap('DefiLlama stablecoins', async () => {
  const j = await (await get('https://stablecoins.llama.fi/stablecoins?includePrices=true')).json();
  return j.peggedAssets.filter(s => ['USDT', 'USDC', 'DAI', 'USDe', 'USDS'].includes(s.symbol)).map(s => ({
    symbol: s.symbol, priceUsd: num(s.price), pegDevPct: s.price ? +((s.price - 1) * 100).toFixed(4) : null, circulatingUsd: num(s.circulating?.peggedUSD) }));
});

const perps = () => wrap('Hyperliquid public API', async () => {
  const [meta, ctx] = await (await get('https://api.hyperliquid.xyz/info', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'metaAndAssetCtxs' }) })).json();
  return meta.universe.map((u, i) => ({ u, c: ctx[i] })).filter(x => ['BTC', 'ETH', 'SOL'].includes(x.u.name)).map(x => ({
    symbol: x.u.name, markPx: num(x.c.markPx), fundingAnnualPct: num(x.c.funding) == null ? null : +(num(x.c.funding) * 100 * 24 * 365).toFixed(2), oiCoins: num(x.c.openInterest) }));
});

const yields = () => wrap('US Treasury par yield curve', async () => {
  const d = new Date();
  for (let back = 0; back < 2; back++) {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back, 1));
    const ym = `${m.getUTCFullYear()}${String(m.getUTCMonth() + 1).padStart(2, '0')}`;
    const xml = await (await get(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value_month=${ym}`)).text();
    const e = xml.split('<entry>').slice(1).at(-1);
    if (!e) continue;
    const f = t => num((e.match(new RegExp(`<d:${t}[^>]*>([^<]*)<`)) || [])[1]);
    const y2 = f('BC_2YEAR'), y10 = f('BC_10YEAR');
    return { date: ((e.match(/<d:NEW_DATE[^>]*>([^<]*)</) || [])[1] || '').slice(0, 10) || null, y3m: f('BC_3MONTH'), y2, y10, spread10y2: y2 != null && y10 != null ? +(y10 - y2).toFixed(3) : null };
  }
  throw new Error('no yield data');
});

const auctions = () => wrap('TreasuryDirect upcoming auctions', async () => {
  const j = await (await get('https://www.treasurydirect.gov/TA_WS/securities/upcoming?format=json')).json();
  return (Array.isArray(j) ? j : []).slice(0, 20).map(a => ({ type: a.securityType ?? null, term: a.securityTerm ?? null, auctionDate: a.auctionDate ?? null, issueDate: a.issueDate ?? null }));
});

const expiries = () => wrap('Deribit public API', async () => {
  const j = await (await get('https://www.deribit.com/api/v2/public/get_instruments?currency=BTC&kind=future')).json();
  const now = Date.now();
  return [...new Set(j.result.map(i => i.expiration_timestamp).filter(t => t > now && t < 4e12))].sort((a, b) => a - b).map(t => new Date(t).toISOString());
});

const rss = (xml, outlet) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12).map(m => {
  const g = t => (m[1].match(new RegExp(`<${t}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`)) || [])[1]?.trim() ?? null;
  const dt = g('pubDate') ? new Date(g('pubDate')) : null;
  return { outlet, title: g('title'), link: g('link'), publishedAt: dt && !isNaN(dt) ? dt.toISOString() : null };
});
const news = () => wrap('Cointelegraph + CoinDesk RSS', async () => {
  const feeds = [['Cointelegraph', 'https://cointelegraph.com/rss'], ['CoinDesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/']];
  const r = await Promise.allSettled(feeds.map(async ([n, u]) => rss(await (await get(u)).text(), n)));
  const items = r.flatMap(x => (x.status === 'fulfilled' ? x.value : [])).sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  if (!items.length) throw new Error('no items');
  return items;
});

const obs = (step, r, ev, at) => r.ok ? { step, status: 'OBSERVED', at: at ?? r.retrievedAt, timestampKind: at ? 'source' : 'retrieved', evidence: ev, source: r.source }
  : { step, status: 'NO_DATA', at: null, timestampKind: null, evidence: { error: r.error }, source: r.source };
const sched = (step, at, ev, source) => at ? { step, status: 'SCHEDULED', at, timestampKind: 'calendar', evidence: ev, source } : { step, status: 'NO_DATA', at: null, timestampKind: null, evidence: ev, source };

const [b, st, pp, yl, au, ex, nw] = await Promise.all([btc(), stables(), perps(), yields(), auctions(), expiries(), news()]);
const pipelines = [
  { id: 1, title: 'Bitcoin hashrate -> difficulty retarget -> miner margin pressure', steps: [
    obs('Hashrate observed', b, b.data?.hashrate, b.data?.hashrate?.at ?? null),
    sched('Next difficulty retarget (projected from block times)', b.data?.retarget.estAt ?? null, b.data?.retarget, 'mempool.space')] },
  { id: 2, title: 'Stablecoin peg deviation -> liquidity stress', steps: [obs('Peg deviation observed', st, st.data, null)] },
  { id: 3, title: 'Perp funding skew -> leverage unwind risk -> dated futures expiry', steps: [
    obs('Funding and open interest observed', pp, pp.data, null),
    ...(ex.data ?? []).slice(0, 3).map(t => sched('BTC futures expiry (Deribit)', t, { expiry: t }, 'Deribit'))] },
  { id: 4, title: 'US yield curve -> Treasury supply -> dollar liquidity', steps: [
    obs('Yield curve observed', yl, yl.data, yl.data?.date ? `${yl.data.date}T00:00:00.000Z` : null),
    ...(au.data ?? []).slice(0, 5).map(a => sched(`Treasury auction ${a.type ?? ''} ${a.term ?? ''}`.trim(), a.auctionDate ? new Date(a.auctionDate).toISOString() : null, a, 'TreasuryDirect'))] },
].map(p => ({ ...p, horizonEnd: p.steps.filter(s => s.status === 'SCHEDULED').map(s => s.at).sort().at(-1) ?? null }));

await mkdir('site/data', { recursive: true });
await writeFile('site/data/snapshot.json', JSON.stringify({ generatedAt: new Date().toISOString(), pipelines, news: nw, sources: { btc: b.ok, stables: st.ok, perps: pp.ok, yields: yl.ok, auctions: au.ok, expiries: ex.ok, news: nw.ok } }));
console.log('snapshot written');
