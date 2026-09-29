#!/usr/bin/env python3
"""Builds `cities.tsv.gz` (offline reverse geocoding) from GeoNames.

    curl -O https://download.geonames.org/export/dump/cities1000.zip && unzip cities1000.zip
    curl -O https://download.geonames.org/export/dump/admin1CodesASCII.txt
    python3 build_cities.py cities1000.txt admin1CodesASCII.txt

Data: GeoNames (https://www.geonames.org), CC BY 4.0. Populated places with 1000+
inhabitants, without neighbourhoods and historical/abandoned places (feature codes PPLX,
PPLH, PPLQ, PPLW, PPLCH) and French arrondissements ("Paris 16 Passy"), so a district
doesn't stand for its city.

Format (UTF-8, tab-separated): `@<CC.admin1>\t<state name>` lines, then
`<name>\t<lat>\t<lon>\t<CC>\t<admin1>\t<population>` lines with 4-decimal coordinates.
"""
import gzip, re, sys

cities, admin = sys.argv[1], sys.argv[2]
SKIP = {"PPLX", "PPLH", "PPLQ", "PPLW", "PPLCH"}
ARRONDISSEMENT = re.compile(r" \d{2}( |$)")
used, rows = set(), []
for line in open(cities, encoding="utf-8"):
    f = line.rstrip("\n").split("\t")
    if f[6] != "P" or f[7] in SKIP:
        continue
    cc, a1 = f[8], f[10]
    if cc == "FR" and ARRONDISSEMENT.search(f[1]):
        continue
    used.add(f"{cc}.{a1}")
    rows.append(f"{f[1]}\t{float(f[4]):.4f}\t{float(f[5]):.4f}\t{cc}\t{a1}\t{f[14] or 0}")
out = []
for line in open(admin, encoding="utf-8"):
    code, name, ascii_name, _ = line.rstrip("\n").split("\t")
    if code in used:
        out.append(f"@{code}\t{name}")
out.extend(sorted(rows))
with gzip.open("cities.tsv.gz", "wt", encoding="utf-8", compresslevel=9) as g:
    g.write("\n".join(out) + "\n")
print(f"{len(rows)} places, {len(out) - len(rows)} states")
