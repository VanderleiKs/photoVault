#!/usr/bin/env python3
"""Library with trips and events for the phase 6 check (EXIF date + GPS).

    python3 trips.py <real-photos-dir> <out-dir>

Home in Porto Alegre (photos on 40 days), a 3-day trip to Gramado and Canela, a party at
home, a 4-day trip to Buenos Aires (one day without GPS) and a day at the beach.
Expected: 2 trips ("Gramado e Canela", "Buenos Aires"), 2 events (party, beach).
"""
import os, random, shutil, sys
from datetime import datetime, timedelta
from PIL import Image
from PIL.TiffImagePlugin import IFDRational

random.seed(7)
src, out = sys.argv[1], sys.argv[2]
shutil.rmtree(out, ignore_errors=True)
os.makedirs(out)
photos = sorted(os.path.join(d, f) for d, _, fs in os.walk(src) for f in fs if f.lower().endswith((".jpg", ".jpeg")))
bases = [Image.open(p).convert("RGB") for p in photos]

def dms(v):
    v = abs(v)
    d = int(v); m = int((v - d) * 60); s = (v - d - m / 60) * 3600
    return (IFDRational(d, 1), IFDRational(m, 1), IFDRational(round(s * 100), 100))

n = 0
def shoot(folder, start, count, every_min, place=None):
    global n
    t = datetime.fromisoformat(start)
    for i in range(count):
        b = bases[n % len(bases)]
        w, h = b.size
        x, y = random.randint(0, w // 3), random.randint(0, h // 3)  # distinct crops, distinct hashes
        img = b.crop((x, y, x + w // 2, y + h // 2)).resize((1200, 900))
        e = Image.Exif()
        e[0x010F], e[0x0110] = "Apple", "iPhone 13"
        e[0x8769] = {0x9003: t.strftime("%Y:%m:%d %H:%M:%S")}
        if place:
            lat, lon = place[0] + random.uniform(-0.01, 0.01), place[1] + random.uniform(-0.01, 0.01)
            e[0x8825] = {1: "S" if lat < 0 else "N", 2: dms(lat), 3: "W" if lon < 0 else "E", 4: dms(lon)}
        os.makedirs(os.path.join(out, folder), exist_ok=True)
        img.save(os.path.join(out, folder, f"IMG_{n:05d}.jpg"), quality=82, exif=e.tobytes())
        n += 1
        t += timedelta(minutes=every_min)

POA, GRAMADO, CANELA = (-30.03, -51.23), (-29.378, -50.876), (-29.365, -50.816)
BA, TRAMANDAI = (-34.60, -58.38), (-29.985, -50.133)
for d in range(40):
    day = datetime(2025, 3, 1) + timedelta(days=d * 5)
    shoot("casa", day.replace(hour=12).isoformat(), 3, 25, POA)
for day, place in [("2025-07-10", GRAMADO), ("2025-07-11", CANELA), ("2025-07-12", GRAMADO)]:
    shoot("gramado", f"{day}T09:00", 30, 12, place)
shoot("festa", "2025-08-02T19:00", 30, 4, POA)
for day, place in [("2025-10-03", BA), ("2025-10-04", BA), ("2025-10-05", None), ("2025-10-06", BA)]:
    shoot("buenos-aires", f"{day}T10:00", 20, 15, place)
shoot("praia", "2025-12-20T09:00", 25, 15, TRAMANDAI)
print(f"{n} photos -> {out}")
