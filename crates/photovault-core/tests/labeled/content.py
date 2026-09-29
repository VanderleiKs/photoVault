#!/usr/bin/env python3
"""Content-labeled photos for the phase 7 check (semantic search, scene labels).

    python3 content.py <out-dir> [per-category]

Downloads free photos from Wikimedia Commons ("Quality images" / featured categories),
one folder per category, resized to 1024 px. Only for local measurement: not committed.
"""
import json, os, sys, time, urllib.parse, urllib.request
from io import BytesIO
from PIL import Image

out = sys.argv[1]
per = int(sys.argv[2]) if len(sys.argv) > 2 else 12
# folder = what the search should find; Commons categories to take it from.
CATEGORIES = {
    "praia": ["Quality images of beaches"],
    "montanha": ["Quality images of mountains"],
    "cachorro": ["Quality images of dogs"],
    "gato": ["Quality images of cats"],
    "comida": ["Quality images of food", "Quality images of dishes"],
    "cidade-noite": ["Cities at night", "Cities at night from above", "Night views of Bangkok"],
    "flores": ["Quality images of flowers"],
    "carro": ["Quality images of automobiles"],
    "por-do-sol": ["Quality images of sunsets"],
    "floresta": ["Quality images of forests"],
    "igreja": ["Quality images of church interiors"],
    "passaro": ["Quality images of birds"],
}
UA = {"User-Agent": "PhotoVault-eval/1.0 (local test set)"}

def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)

os.makedirs(out, exist_ok=True)
credits = []
for folder, cats in CATEGORIES.items():
    dest = os.path.join(out, folder)
    os.makedirs(dest, exist_ok=True)
    have = len(os.listdir(dest))
    for cat in cats:
        if have >= per:
            break
        data = api({"action": "query", "generator": "categorymembers", "gcmtitle": f"Category:{cat}", "gcmtype": "file",
                    "gcmlimit": 60, "prop": "imageinfo", "iiprop": "url|mime|extmetadata", "iiurlwidth": 1024})
        for page in (data.get("query", {}).get("pages", {}) or {}).values():
            if have >= per:
                break
            info = (page.get("imageinfo") or [{}])[0]
            if info.get("mime") != "image/jpeg" or "thumburl" not in info:
                continue
            try:
                with urllib.request.urlopen(urllib.request.Request(info["thumburl"], headers=UA), timeout=60) as r:
                    img = Image.open(BytesIO(r.read())).convert("RGB")
            except Exception as e:
                print("skip", e); continue
            name = f"{folder}-{have:02d}.jpg"
            img.save(os.path.join(dest, name), quality=88)
            meta = info.get("extmetadata", {})
            credits.append(f"{folder}/{name}\t{page['title']}\t{meta.get('LicenseShortName', {}).get('value', '?')}")
            have += 1
            time.sleep(0.2)
    print(f"{folder}: {have}")
with open(os.path.join(out, "CREDITS.tsv"), "a", encoding="utf-8") as f:
    f.write("\n".join(credits) + "\n")
