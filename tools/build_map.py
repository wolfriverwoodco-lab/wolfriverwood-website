"""Render a stylised Collierville map (OpenStreetMap data, ODbL) as a brand-coloured SVG.
Usage:
  curl -s -A "map-render-script/1.0" --data-urlencode "data@tools/collierville-overpass.txt" https://overpass-api.de/api/interpreter -o osm.json
  python -I tools/build_map.py osm.json public/img/collierville-map.svg
Keep the "Map data (c) OpenStreetMap contributors" credit wherever the map is shown."""
import json, math, sys

src, out = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding='utf-8'))
S, W, N, E = 35.000, -89.745, 35.110, -89.590
LAT0 = math.radians((S + N) / 2)
VW = 1600
sx = VW / ((E - W) * math.cos(LAT0))
VH = round((N - S) * sx)

def proj(lat, lon):
    return ((lon - W) * math.cos(LAT0) * sx, (N - lat) * sx)

def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    def rdp(a, b):
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy) or 1e-9
        best, idx = 0, None
        for i in range(a + 1, b):
            x0, y0 = pts[i]
            d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / L
            if d > best:
                best, idx = d, i
        if best > tol and idx is not None:
            return rdp(a, idx)[:-1] + rdp(idx, b)
        return [pts[a], pts[b]]
    return rdp(0, len(pts) - 1)

def path(pts, close=False):
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    return d + ('Z' if close else '')

groups = {k: [] for k in ['water', 'minor', 'mid', 'major', 'rail', 'stream', 'creek', 'river']}
river_ways = []
for el in data.get('elements', []):
    if el.get('type') != 'way' or 'geometry' not in el:
        continue
    t = el.get('tags', {})
    pts = [proj(g['lat'], g['lon']) for g in el['geometry']]
    hw, ww = t.get('highway', ''), t.get('waterway', '')
    if t.get('natural') == 'water':
        p = simplify(pts, 1.2)
        if len(p) > 3:
            groups['water'].append(path(p, True))
        continue
    p = simplify(pts, 0.9)
    if len(p) < 2:
        continue
    name = t.get('name', '')
    if ww and ('wolf' in name.lower() or (ww == 'river' and not name)):
        groups['river'].append(path(p))
        if 'wolf' in name.lower():
            river_ways.append(p)
    elif ww == 'river' or (ww and 'creek' in name.lower()):
        groups['creek'].append(path(p))
    elif ww:
        groups['stream'].append(path(p))
    elif t.get('railway') == 'rail':
        groups['rail'].append(path(p))
    elif hw in ('motorway', 'trunk', 'primary', 'motorway_link', 'trunk_link', 'primary_link'):
        groups['major'].append(path(p))
    elif hw in ('secondary', 'tertiary'):
        groups['mid'].append(path(p))
    elif hw:
        groups['minor'].append(path(p))

# Longest river way carries the label.
label_path = ''
if river_ways:
    lw = max(river_ways, key=lambda p: sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1)))
    if lw[0][0] > lw[-1][0]:
        lw = lw[::-1]
    label_path = path(lw)

tx, ty = proj(35.0420, -89.6645)  # Collierville Town Square (public landmark, not the shop)
CREAM, MAPLE, PADAUK = '#efe9e1', '#e3c295', '#e0805a'
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VW} {VH}" preserveAspectRatio="xMidYMid slice">',
       '<!-- Collierville, Tennessee. Map data (c) OpenStreetMap contributors, ODbL. Stylised for Wolf River Wood Co. -->',
       f'<g fill="{MAPLE}" fill-opacity=".10" stroke="none">' + ''.join(f'<path d="{d}"/>' for d in groups['water']) + '</g>',
       '<g fill="none" stroke-linecap="round" stroke-linejoin="round">',
       f'<g stroke="{CREAM}" stroke-opacity=".13" stroke-width="1">' + ''.join(f'<path d="{d}"/>' for d in groups['minor']) + '</g>',
       f'<g stroke="{MAPLE}" stroke-opacity=".16" stroke-width="1.2" stroke-dasharray="2 4">' + ''.join(f'<path d="{d}"/>' for d in groups['stream']) + '</g>',
       f'<g stroke="{MAPLE}" stroke-opacity=".32" stroke-width="2">' + ''.join(f'<path d="{d}"/>' for d in groups['creek']) + '</g>',
       f'<g stroke="{CREAM}" stroke-opacity=".26" stroke-width="1.8">' + ''.join(f'<path d="{d}"/>' for d in groups['mid']) + '</g>',
       f'<g stroke="{MAPLE}" stroke-opacity=".42" stroke-width="3">' + ''.join(f'<path d="{d}"/>' for d in groups['major']) + '</g>',
       f'<g stroke="{CREAM}" stroke-opacity=".3" stroke-width="1.4" stroke-dasharray="7 5">' + ''.join(f'<path d="{d}"/>' for d in groups['rail']) + '</g>',
       f'<g stroke="{PADAUK}" stroke-opacity=".22" stroke-width="12">' + ''.join(f'<path d="{d}"/>' for d in groups['river']) + '</g>',
       f'<g stroke="{PADAUK}" stroke-opacity=".85" stroke-width="3.2">' + ''.join(f'<path d="{d}"/>' for d in groups['river']) + '</g>',
       '</g>']
if river_ways:
    # Straight label above a calm stretch of the Wolf River, angled to its general direction.
    pts = sorted([pt for w in river_ways for pt in w], key=lambda q: q[0])
    target = VW * 0.40
    near = [q for q in pts if abs(q[0] - target) < 110]
    if len(near) >= 2:
        (x1, y1), (x2, y2) = near[0], near[-1]
        ang = math.degrees(math.atan2(y2 - y1, x2 - x1))
        cx, cy = (x1 + x2) / 2, min(q[1] for q in near) - 22
        svg.append(f'<text transform="translate({cx:.1f} {cy:.1f}) rotate({ang:.1f})" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="600" font-size="26" letter-spacing="8" fill="{PADAUK}" fill-opacity=".95">WOLF RIVER</text>')
svg.append('</svg>')
open(out, 'w', encoding='utf-8', newline='\n').write(''.join(svg))
print({k: len(v) for k, v in groups.items()}, 'viewBox', VW, VH, 'bytes', sum(len(x) for x in svg), 'town', round(tx), round(ty))
