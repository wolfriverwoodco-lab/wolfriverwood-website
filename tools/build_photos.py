"""Client photos (Drive) -> web images in public/img/work/ + src/data/photos.json.

Run: python tools/build_photos.py
Source: _client-assets/photos／videos (rclone copy of the client's shared Drive folder; gitignored).
Never upscales. Writes WebP at 480/800/1200 (capped at the source width).
"""
import json, os
from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_client-assets', 'photos／videos')
OUT = os.path.join(ROOT, 'public', 'img', 'work')
os.makedirs(OUT, exist_ok=True)

# slug: (source file prefix, alt text). Alt text describes only what is visible.
PHOTOS = {
    'monogram-sign': ('0046C21B', 'Dark wood sign with a large inlaid light-wood letter B and a light border'),
    'built-in-cabinets': ('08A085DC', 'Built-in shelving and cabinets around a living room fireplace and TV'),
    'adirondack-chair': ('1200E275', 'Light wood Adirondack chair on a patio'),
    'dog-gate-barn': ('124E6A20', 'Barn-door style wooden dog gate fitted across a bedroom doorway'),
    'endgrain-brick-cover': ('131047B3', 'End-grain cutting board in a brick pattern of dark and purple wood with light accents'),
    'coaster-holder-angled': ('1BF957D3', 'Striped wooden coasters standing in an angled holder'),
    'endgrain-checker-feet': ('1DB53AE6', 'End-grain checkerboard cutting board on edge, showing brass feet'),
    'fold-desk-closed': ('201F4C67', 'Wall-mounted fold-down desk, closed, with a chalkboard face and yellow frame'),
    'coaster-octagon-pair': ('254AA4EE', 'Octagonal walnut coaster beside its striped holder'),
    'diamond-boards-kitchen': ('30AE6577', 'Two cutting boards with dark diamond inlays standing in a kitchen'),
    'coaster-octagon-holder': ('36ECE051', 'Set of octagonal coasters in a striped wooden holder'),
    'fold-desk-open': ('3CE0FADE', 'Wall-mounted fold-down desk opened, with shelves above'),
    'diamond-board-bench': ('480D28B0', 'Long board with a row of dark diamonds on the workbench'),
    'coaster-padauk-set': ('55E86A58', 'Stack of red and light striped square coasters with a matching holder'),
    'striped-chevron-board': ('5F1C6D12', 'Striped edge-grain cutting board with a chevron band'),
    'challenge-coin-display': ('64196660', 'Walnut challenge coin display with five shelves and an engraved W4 crest'),
    'endgrain-brick-counter': ('7284E7B4', 'End-grain brick-pattern cutting board on a kitchen counter'),
    'boards-in-progress': ('7DFA61AB', 'Cutting boards in progress on a shop bench'),
    'pumpkin-tray': ('84AF8731', 'Cherry serving tray carved in the shape of a pumpkin with grooved sections'),
    'diamond-board-feet': ('8B4A98CB', 'Diamond-pattern cutting board on edge with brass feet'),
    'diamond-band-board': ('8EFAB3E2', 'Cutting board with a band of dark diamonds between striped edges'),
    'built-in-wide': ('90403D1F', 'Living room with built-in cabinets and shelving around the fireplace'),
    'pumpkin-board': ('9676BF22', 'Cherry cutting board cut in the shape of a pumpkin'),
    'coaster-stack': ('9B67D156', 'Small stack of square coasters in red, walnut and light wood'),
    'striped-board-counter': ('9EF3C920', 'Walnut and maple striped cutting board on a granite counter'),
    'dog-gate-tall': ('ABAA6ECB', 'Wooden dog gate across a hallway'),
    'endgrain-stripe-board': ('BE60DEFA', 'Dark end-grain cutting board with a padauk stripe'),
    'endgrain-checker-tall': ('C3C5351B', 'Tall end-grain checkerboard cutting board standing on a counter'),
    'endgrain-brick-feet': ('C42569F4', 'Brick-pattern end-grain board on edge with brass feet'),
    'dog-gate-panel': ('E0BA5642', 'Wooden gate panel held up outdoors with two dogs beside it'),
    'dog-gate-installed': ('E86C9287', 'Barn-door dog gate installed in a doorway'),
    'shop-dog': ('3CE50BCF', 'The black shop dog asleep on the cool concrete floor of the shop'),
    'walnut-backer': ('ED8206B0', 'Arched walnut panel showing its grain'),
}
WIDTHS = (480, 800, 1200)

files = os.listdir(SRC)
manifest = {}
for slug, (prefix, alt) in PHOTOS.items():
    name = next(f for f in files if f.startswith(prefix))
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, name))).convert('RGB')
    w, h = im.size
    variants = []
    targets = sorted({t for t in WIDTHS if t < w} | {min(w, WIDTHS[-1])})
    for tw in targets:
        r = im.resize((tw, round(h * tw / w)), Image.LANCZOS) if tw < w else im
        fn = f'{slug}-{tw}.webp'
        r.save(os.path.join(OUT, fn), 'WEBP', quality=80, method=6)
        afn = f'{slug}-{tw}.avif'
        r.save(os.path.join(OUT, afn), 'AVIF', quality=50, speed=4)
        variants.append({'w': tw, 'src': f'/img/work/{fn}', 'avif': f'/img/work/{afn}'})
    # square-ish thumbnail for 40-76px UI (menus, gallery thumbs, cart): centre crop, 160px
    s = min(w, h)
    t = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((160, 160), Image.LANCZOS)
    tfn = f'{slug}-thumb.webp'
    t.save(os.path.join(OUT, tfn), 'WEBP', quality=78, method=6)
    manifest[slug] = {'alt': alt, 'width': w, 'height': h, 'ratio': round(w / h, 4), 'variants': variants, 'thumb': f'/img/work/{tfn}'}
    print(slug, w, h, len(variants))

os.makedirs(os.path.join(ROOT, 'src', 'data'), exist_ok=True)
json.dump(manifest, open(os.path.join(ROOT, 'src', 'data', 'photos.json'), 'w'), indent=1)
