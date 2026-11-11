import catalog from '../../src/data/catalog.json';
export { catalog };

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });

export async function readJson(request, maxBytes = 32_000) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) throw new Error('too-large');
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('too-large');
  return JSON.parse(text);
}
