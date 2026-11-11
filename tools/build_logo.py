"""Rebuild the Wolf River Wood Co. logo from the Facebook profile raster (1206px).

Adjustments over the source:
  * the source ring is elliptical (~1806 x 1894) and off-centre, and the R in RIVER runs into it
    -> ring removed and redrawn as a true circle centred on the artwork with clear space
  * wood-grain fill flattened to one ink colour so it can be recoloured and vectorised
Outputs vectors + rasters to public/brand and favicons/app icons to public/.
"""
import os, re
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage
import vtracer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_client-assets', 'logo', 'logo-source-facebook-1206.jpg')
OUT = os.path.join(ROOT, 'public', 'brand')
PUB = os.path.join(ROOT, 'public')
TMP = os.path.join(ROOT, '.qa', 'logo')
for d in (OUT, TMP):
    os.makedirs(d, exist_ok=True)

INK, CREAM = '#2a1d15', '#f4ecdc'

g = Image.open(SRC).convert('L').resize((2412, 2412), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
ink = np.array(g) < 190

# 1. drop the old ring band only. The R in RIVER is fused to the ring, so removing the
#    whole component would delete it: fit the ring's outer radius per degree and strip
#    only pixels within one stroke-width of it.
lab, _ = ndimage.label(ink)
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    if (sl[0].stop - sl[0].start) > 1600 and (sl[1].stop - sl[1].start) > 1600:
        yy, xx = np.nonzero(lab == i)
        rcx, rcy = (xx.min() + xx.max()) / 2, (yy.min() + yy.max()) / 2
        rr = np.hypot(xx - rcx, yy - rcy)
        th = ((np.degrees(np.arctan2(yy - rcy, xx - rcx)) + 360) % 360).astype(int)
        r_outer = np.array([np.percentile(rr[th == b], 99) if np.any(th == b) else np.nan for b in range(360)])
        r_inner = np.array([np.percentile(rr[th == b], 1) if np.any(th == b) else np.nan for b in range(360)])
        thick = np.nanmedian(r_outer - r_inner)
        r_outer = ndimage.median_filter(np.nan_to_num(r_outer, nan=np.nanmedian(r_outer)), size=9, mode='wrap')
        band = rr >= r_outer[th] - thick - 3
        ink[yy[band], xx[band]] = False
        print(f'ring stroke ~{thick:.0f}px, kept {int((~band).sum())} fused px (the R)')

# 2. fit a true circle around the remaining artwork
ys, xs = np.nonzero(ink)
cx = (xs.min() + xs.max()) / 2
cy = (ys.min() + ys.max()) / 2
r_content = float(np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2).max())
ring_w, gap = 44, 56
r_in = r_content + gap
r_out = r_in + ring_w
print(f'centre=({cx:.0f},{cy:.0f}) content r={r_content:.0f} ring {r_in:.0f}-{r_out:.0f}')

pad = 24
side = int(2 * (r_out + pad))
x0, y0 = int(cx - side / 2), int(cy - side / 2)
content = Image.fromarray((ink * 255).astype('uint8'))
canvas = Image.new('L', (side, side), 0)
canvas.paste(content.crop((x0, y0, x0 + side, y0 + side)), (0, 0))
SS = 4
ring = Image.new('L', (side * SS, side * SS), 0)
d = ImageDraw.Draw(ring)
c = side * SS / 2
d.ellipse([c - r_out * SS, c - r_out * SS, c + r_out * SS, c + r_out * SS], fill=255)
d.ellipse([c - r_in * SS, c - r_in * SS, c + r_in * SS, c + r_in * SS], fill=0)
ring = ring.resize((side, side), Image.LANCZOS)
badge = Image.fromarray(np.maximum(np.array(canvas), np.array(ring)))
badge.save(os.path.join(TMP, 'badge-mask.png'))


def to_b(x, y):
    return x - x0, y - y0


def components_inside(mask_img, box):
    a = np.array(mask_img) > 127
    lab, _ = ndimage.label(a)
    keep = np.zeros_like(a)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl[0].start >= box[1] and sl[0].stop <= box[3] and sl[1].start >= box[0] and sl[1].stop <= box[2]:
            keep |= lab == i
    m = Image.fromarray((keep * 255).astype('uint8'))
    return m.crop(m.getbbox())


wolf = components_inside(badge, (*to_b(820, 360), *to_b(1520, 1170)))
text = components_inside(badge, (*to_b(470, 1440), *to_b(1970, 1820)))
wolf.save(os.path.join(TMP, 'wolf-mask.png'))
text.save(os.path.join(TMP, 'text-mask.png'))
print('wolf', wolf.size, 'text', text.size)


def pad_square(m, frac):
    w, h = m.size
    s = int(max(w, h) * (1 + frac))
    o = Image.new('L', (s, s), 0)
    o.paste(m, ((s - w) // 2, (s - h) // 2))
    return o


def trace(mask, path, color):
    tmp = os.path.join(TMP, 'trace-in.png')
    Image.fromarray(255 - np.array(mask)).convert('RGB').save(tmp)
    raw = path + '.raw'
    vtracer.convert_image_to_svg_py(tmp, raw, colormode='binary', mode='spline', filter_speckle=6,
                                    corner_threshold=60, length_threshold=4.0, splice_threshold=45,
                                    path_precision=2)
    svg = open(raw, encoding='utf-8').read()
    os.remove(raw)
    w, h = mask.size
    paths = re.findall(r'<path[^>]*/>', svg)
    body = '\n'.join(re.sub(r'\s*fill="[^"]*"', '', p) for p in paths)
    out = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" '
           f'aria-label="Wolf River Wood Co.">\n<g fill="{color}">\n{body}\n</g>\n</svg>\n')
    open(path, 'w', encoding='utf-8').write(out)


def colorize(mask, color, bg=None, size=None):
    m = mask if size is None else mask.resize(size, Image.LANCZOS)
    rgb = Image.new('RGBA', m.size, color)
    rgb.putalpha(m)
    if bg:
        b = Image.new('RGBA', m.size, bg)
        b.alpha_composite(rgb)
        return b
    return rgb


wolf_sq = pad_square(wolf, 0.08)

# vectors
trace(badge, os.path.join(OUT, 'logo-badge.svg'), INK)
trace(badge, os.path.join(OUT, 'logo-badge-cream.svg'), CREAM)
trace(wolf_sq, os.path.join(OUT, 'mark-wolf.svg'), INK)
trace(wolf_sq, os.path.join(OUT, 'mark-wolf-cream.svg'), CREAM)
trace(text, os.path.join(OUT, 'wordmark.svg'), INK)
trace(text, os.path.join(OUT, 'wordmark-cream.svg'), CREAM)

# rasters
for sz in (512, 1024, 2048):
    colorize(badge, INK, size=(sz, sz)).save(os.path.join(OUT, f'logo-badge-{sz}.png'))
    colorize(badge, CREAM, size=(sz, sz)).save(os.path.join(OUT, f'logo-badge-cream-{sz}.png'))
colorize(badge, INK, bg=CREAM, size=(1024, 1024)).convert('RGB').save(
    os.path.join(OUT, 'logo-badge-on-cream-1024.jpg'), quality=92)


def disk(r):
    return np.hypot(*np.mgrid[-r:r + 1, -r:r + 1]) <= r


def bold_wolf(r):
    """Small-size optical correction: thicken the line-art strokes so the wolf survives 16-48px."""
    p = np.pad(np.array(wolf) > 127, 30)
    dd = ndimage.binary_dilation(p, structure=disk(r)) if r else p
    return pad_square(Image.fromarray((dd * 255).astype('uint8')), 0.04)


WOLF_BY_SIZE = {16: bold_wolf(20), 32: bold_wolf(14), 48: bold_wolf(8)}


def tile(size, maskable=False, round_=True):
    big = size * 4
    t = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    dd = ImageDraw.Draw(t)
    if maskable or not round_:
        dd.rectangle([0, 0, big, big], fill=INK)
    else:
        dd.ellipse([0, 0, big - 1, big - 1], fill=INK)
    inner = int(big * (0.56 if maskable else (0.8 if size <= 48 else 0.74)))
    w = colorize(WOLF_BY_SIZE.get(size, wolf_sq), CREAM, size=(inner, inner))
    t.alpha_composite(w, ((big - inner) // 2, (big - inner) // 2 - int(big * 0.01)))
    return t.resize((size, size), Image.LANCZOS)


icos = [tile(s) for s in (16, 32, 48)]
icos[2].save(os.path.join(PUB, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)], append_images=icos[:2])
tile(180, round_=False).convert('RGB').save(os.path.join(PUB, 'apple-touch-icon.png'))
tile(192).save(os.path.join(PUB, 'icon-192.png'))
tile(512).save(os.path.join(PUB, 'icon-512.png'))
tile(512, maskable=True).save(os.path.join(PUB, 'icon-maskable-512.png'))

trace(bold_wolf(14), os.path.join(TMP, 'wolf-bold.svg'), CREAM)
wsvg = open(os.path.join(TMP, 'wolf-bold.svg'), encoding='utf-8').read()
W = int(re.search(r'viewBox="0 0 (\d+) (\d+)"', wsvg).group(1))
g_body = re.search(r'(<g fill=.*</g>)', wsvg, re.S).group(1)
k = 0.8 * 100 / W
off = (100 - W * k) / 2
open(os.path.join(PUB, 'favicon.svg'), 'w', encoding='utf-8').write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="{INK}"/>'
    f'<g transform="translate({off:.2f} {off - 1:.2f}) scale({k:.5f})">{g_body}</g></svg>\n')

# review sheet
sheet = Image.new('RGBA', (1640, 760), CREAM)
b = colorize(badge, INK, size=(600, 600))
sheet.alpha_composite(b, (20, 20))
dark = Image.new('RGBA', (600, 600), INK)
dark.alpha_composite(colorize(badge, CREAM, size=(560, 560)), (20, 20))
sheet.alpha_composite(dark, (640, 20))
x = 1260
for s in (16, 32, 48):
    sheet.alpha_composite(tile(s), (x, 30))
    x += s + 20
sheet.alpha_composite(tile(96), (1260, 110))
sheet.alpha_composite(tile(180, round_=False), (1380, 110))
sheet.alpha_composite(tile(192, maskable=True).resize((180, 180)), (1260, 320))
tw = colorize(text, INK)
tw.thumbnail((560, 180))
sheet.alpha_composite(tw, (20, 640))
sheet.convert('RGB').save(os.path.join(TMP, 'logo-sheet.png'))
print('done')
