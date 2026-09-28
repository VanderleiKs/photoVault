#!/usr/bin/env python3
"""Labeled evaluation set for the analysis heuristics (PLANO, Fase 4).

    python3 generate.py <real-photos-dir> <out-dir>

Builds ~200 images from real photos plus synthetic screenshots/documents and writes
`labels.json` (ground truth). Deterministic for a given input. The images are not
committed; run `cargo run --release -p photovault-core --example analysis_eval -- <out-dir>`.
"""
import hashlib, json, os, random, shutil, sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from PIL.TiffImagePlugin import IFDRational

random.seed(42)
src, out = sys.argv[1], sys.argv[2]
shutil.rmtree(out, ignore_errors=True)
os.makedirs(out)
labels = []

def exif(model, when):
    e = Image.Exif()
    e[0x010F] = model.split()[0]
    e[0x0110] = model
    e[0x8769] = {0x9003: when, 0x829D: IFDRational(18, 10)}
    return e.tobytes()

def save(img, rel, fmt="JPEG", quality=90, camera=True, when="2024:01:01 12:00:00", **truth):
    path = os.path.join(out, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    kw = {}
    if fmt == "JPEG":
        kw["quality"] = quality
        if camera:
            kw["exif"] = exif("Canon EOS R6", when)
    img.convert("RGB").save(path, fmt, **kw)
    labels.append({"file": rel.replace(os.sep, "/"), **truth})
    return rel

# 1. Distinct bases: 4 quadrant crops of each unique real photo.
seen, photos = set(), []
for d, _, fs in sorted(os.walk(src)):
    for f in sorted(fs):
        p = os.path.join(d, f)
        if f.lower().endswith((".jpg", ".jpeg")) and os.path.getsize(p) > 150_000:
            h = hashlib.md5(open(p, "rb").read()).hexdigest()
            if h not in seen:
                seen.add(h)
                photos.append(p)
bases = []
for i, p in enumerate(photos):
    im = Image.open(p).convert("RGB")
    w, h = im.size
    for q, (x, y) in enumerate([(0, 0), (w // 2, 0), (0, h // 2), (w // 2, h // 2)]):
        crop = im.crop((x, y, x + w // 2, y + h // 2))
        crop.thumbnail((1800, 1800))
        bases.append(crop)
random.shuffle(bases)
names = []
for i, b in enumerate(bases):
    # Dates far apart so "similar" (time window) never links bases by accident.
    when = f"20{10 + i % 14:02d}:{1 + i % 12:02d}:{1 + i % 27:02d} 10:00:00"
    names.append(save(b, f"fotos/IMG_{i:04d}.jpg", when=when, base=i))
n = len(bases)

# 2. Exact copies (same bytes).
os.makedirs(os.path.join(out, "backup"), exist_ok=True)
for i in range(0, min(n, 15)):
    rel = f"backup/IMG_{i:04d} (1).jpg"
    shutil.copy(os.path.join(out, names[i]), os.path.join(out, rel))
    labels.append({"file": rel, "base": i, "exact_of": names[i]})

# 3. Visual duplicates of other bases.
def variants(b):
    w, h = b.size
    yield "reduzida", b.resize((w // 2, h // 2)), 60
    yield "recomprimida", b, 35
    yield "recorte", b.crop((int(w * .03), int(h * .03), int(w * .97), int(h * .97))), 85
    yield "clareada", ImageEnhance.Brightness(b).enhance(1.12), 85
k = 0
for i in range(15, min(n, 45)):
    kind, img, q = list(variants(bases[i]))[k % 4]
    save(img, f"whatsapp/IMG-2024{k:04d}-WA{k:04d}_{kind}.jpg", quality=q, camera=False, base=i, visual_of=names[i])
    k += 1

# 4. Blurry and dark versions (quality ground truth; not scored as duplicates).
for j, i in enumerate(range(45, min(n, 60))):
    save(bases[i].filter(ImageFilter.GaussianBlur(4 + j % 3)), f"tremidas/IMG_B{j:03d}.jpg", base=i, blurry=True, derived=True)
for j, i in enumerate(range(60, min(n, 70))):
    save(ImageEnhance.Brightness(bases[i]).enhance(0.12), f"escuras/IMG_D{j:03d}.jpg", base=i, dark=True, derived=True)

# 5. Wallpapers: screen-sized, no camera data, not screenshots (hard negatives).
for j, i in enumerate(range(70, min(n, 75))):
    save(bases[i].resize((1920, 1080)), f"papeis/wallpaper_{j}.jpg", camera=False, base=i, screenshot=False, derived=True)

# 6. Synthetic screenshots.
SCREENS = [(1080, 2400), (1170, 2532), (1080, 2340), (1920, 1080), (1366, 768), (2560, 1440), (1284, 2778)]
def ui(w, h, seed):
    r = random.Random(seed)
    bg = r.choice([(255, 255, 255), (18, 18, 18), (245, 245, 247), (250, 250, 250)])
    fg = (30, 30, 30) if sum(bg) > 400 else (230, 230, 230)
    accent = r.choice([(33, 150, 243), (76, 175, 80), (233, 30, 99), (255, 152, 0), (103, 58, 183)])
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, w, int(h * .08)), fill=accent)
    y = int(h * .1)
    while y < h * .9:
        if r.random() < .25:
            d.rounded_rectangle((int(w * .05), y, int(w * .95), y + int(h * .08)), 18, fill=tuple(min(255, c + 12) for c in bg), outline=accent)
            y += int(h * .1)
        else:
            for line in range(r.randint(1, 4)):
                d.text((int(w * .06), y), "Lorem ipsum dolor sit amet " * r.randint(1, 3), fill=fg)
                y += 28
            y += 24
    return img
for j in range(23):
    w, h = SCREENS[j % len(SCREENS)]
    img = ui(w, h, j)
    if j < 10:
        save(img, f"Screenshot_2024{j:04d}-101112.png", fmt="PNG", camera=False, screenshot=True)
    elif j < 15:
        save(img, f"Pictures/Screenshots/IMG_{9000 + j}.PNG", fmt="PNG", camera=False, screenshot=True)
    elif j < 20:
        save(img, f"imagens/tela_{j}.png", fmt="PNG", camera=False, screenshot=True)
    else:
        save(img, f"Screenshot_2024{j:04d}-101112.jpg", quality=85, camera=False, screenshot=True)

# 7. Photos of documents (paper on a table, photographed).
for j in range(12):
    r = random.Random(100 + j)
    w, h = 2480, 3508
    table = Image.new("RGB", (w, h), r.choice([(92, 64, 40), (60, 60, 64), (120, 110, 100)]))
    page = Image.new("RGB", (int(w * .88), int(h * .9)), (238, 236, 230))
    d = ImageDraw.Draw(page)
    for y in range(120, page.height - 120, 46):
        if r.random() < .85:
            d.text((110, y), "Recibo Nº 12345 · Valor R$ 1.234,56 · " * r.randint(1, 2), fill=(35, 35, 40))
            d.line((110, y + 30, int(page.width * r.uniform(.4, .9)), y + 30), fill=(60, 60, 70), width=3)
    page = page.rotate(r.uniform(-3, 3), expand=False, fillcolor=(238, 236, 230))
    table.paste(page, (int(w * .06), int(h * .05)))
    save(table.resize((1240, 1754)), f"documentos/DOC_{j:03d}.jpg", quality=88, document=True)

with open(os.path.join(out, "labels.json"), "w") as f:
    json.dump(labels, f, indent=1, ensure_ascii=False)
print(f"{len(labels)} images from {len(photos)} real photos → {out}")
