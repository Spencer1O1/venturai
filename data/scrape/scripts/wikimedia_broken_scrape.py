#!/usr/bin/env python3
"""
Download images of "broken stuff" from Wikimedia Commons using the MediaWiki API.

- Creates category folders
- Downloads N images per category (default 10)
- Writes a manifest CSV with attribution fields + source URLs
- Skips duplicates and non-image files
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple

import requests


WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "venturai-broken-scraper/1.0 (educational; contact: you@weber.edu)"


@dataclass
class ImageRecord:
    category: str
    title: str
    file_url: str
    page_url: str
    mime: str
    license_short: str
    license_url: str
    artist: str
    credit: str


def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "category"


def sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def api_get(params: Dict, session: requests.Session, retries: int = 5, backoff: float = 1.0) -> Dict:
    params = dict(params)
    params["format"] = "json"
    for i in range(retries):
        try:
            r = session.get(WIKIMEDIA_API, params=params, timeout=30)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if i == retries - 1:
                raise
            sleep_s = backoff * (2 ** i)
            print(f"[warn] API error: {e} - retrying in {sleep_s:.1f}s", file=sys.stderr)
            time.sleep(sleep_s)
    raise RuntimeError("unreachable")


def search_file_titles(query: str, session: requests.Session, limit: int = 200) -> List[str]:
    """
    Use list=search to find File: pages matching the query.
    """
    titles: List[str] = []
    sroffset = 0
    while len(titles) < limit:
        data = api_get(
            {
                "action": "query",
                "list": "search",
                "srsearch": f"{query} filetype:bitmap",
                "srnamespace": 6,  # File:
                "srlimit": min(50, limit - len(titles)),
                "sroffset": sroffset,
            },
            session,
        )
        batch = [x["title"] for x in data.get("query", {}).get("search", [])]
        if not batch:
            break
        titles.extend(batch)
        sroffset += len(batch)
        if "continue" not in data:
            break
    return titles


def get_imageinfo(titles: List[str], session: requests.Session) -> List[ImageRecord]:
    """
    Fetch direct file URL + attribution/license fields.
    """
    out: List[ImageRecord] = []

    # MediaWiki allows batching titles with | separators, but keep it moderate
    CHUNK = 25
    for i in range(0, len(titles), CHUNK):
        chunk = titles[i : i + CHUNK]
        data = api_get(
            {
                "action": "query",
                "prop": "imageinfo",
                "titles": "|".join(chunk),
                "iiprop": "url|mime|extmetadata",
            },
            session,
        )
        pages = data.get("query", {}).get("pages", {})
        for _, page in pages.items():
            title = page.get("title", "")
            if not title.startswith("File:"):
                continue
            ii = (page.get("imageinfo") or [])
            if not ii:
                continue
            info = ii[0]
            mime = info.get("mime", "")
            if not (mime.startswith("image/")):
                continue

            url = info.get("url", "")
            if not url:
                continue

            extm = info.get("extmetadata") or {}
            license_short = (extm.get("LicenseShortName") or {}).get("value", "")
            license_url = (extm.get("LicenseUrl") or {}).get("value", "")
            artist = (extm.get("Artist") or {}).get("value", "")
            credit = (extm.get("Credit") or {}).get("value", "")

            page_url = f"https://commons.wikimedia.org/wiki/{title.replace(' ', '_')}"

            out.append(
                ImageRecord(
                    category="",
                    title=title,
                    file_url=url,
                    page_url=page_url,
                    mime=mime,
                    license_short=license_short,
                    license_url=license_url,
                    artist=artist,
                    credit=credit,
                )
            )
    return out


def download_file(url: str, dest: Path, session: requests.Session) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with session.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 256):
                if chunk:
                    f.write(chunk)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="wikimedia_broken_100", help="Output folder under current directory")
    ap.add_argument("--per-category", type=int, default=10, help="Images per category (5-10 recommended)")
    ap.add_argument("--seed", default="venturai", help="Seed string to stabilize sampling")
    ap.add_argument("--sleep", type=float, default=0.25, help="Sleep between downloads (seconds)")
    args = ap.parse_args()

    # Define categories (you can change these)
    categories: Dict[str, str] = {
        "broken_window": "broken window",
        "cracked_screen": "cracked screen phone",
        "pothole": "pothole road",
        "broken_chair": "broken chair",
        "rust_corrosion": "rust corrosion metal",
        "broken_pipe": "broken pipe leak",
        "damaged_sign": "damaged road sign",
        "broken_sidewalk": "cracked sidewalk pavement",
        "broken_keyboard": "broken keyboard",
        "broken_appliance": "broken washing machine appliance",
    }

    out_root = Path(args.out).resolve()
    out_root.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    seen_file_urls: Set[str] = set()
    manifest_rows: List[ImageRecord] = []

    for cat_slug, query in categories.items():
        print(f"\n== {cat_slug} :: '{query}' ==")
        titles = search_file_titles(query, session, limit=300)

        # Stable-but-varied ordering:
        titles_sorted = sorted(titles, key=lambda t: sha1(args.seed + "::" + cat_slug + "::" + t))

        # Fetch metadata for a wider pool, then keep unique URLs
        records = get_imageinfo(titles_sorted[: min(200, len(titles_sorted))], session)

        chosen: List[ImageRecord] = []
        for rec in records:
            if rec.file_url in seen_file_urls:
                continue
            seen_file_urls.add(rec.file_url)
            rec.category = cat_slug
            chosen.append(rec)
            if len(chosen) >= args.per_category:
                break

        print(f"Found {len(records)} candidate images; selected {len(chosen)}")
        if not chosen:
            print(f"[warn] No images selected for {cat_slug} (query too narrow?)", file=sys.stderr)
            continue

        cat_dir = out_root / cat_slug
        cat_dir.mkdir(parents=True, exist_ok=True)

        for idx, rec in enumerate(chosen, start=1):
            # file extension guess from URL
            ext = os.path.splitext(rec.file_url.split("?")[0])[1].lower()
            if ext not in [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".gif", ".bmp"]:
                # fallback based on mime
                ext = {
                    "image/jpeg": ".jpg",
                    "image/png": ".png",
                    "image/webp": ".webp",
                    "image/gif": ".gif",
                    "image/tiff": ".tif",
                    "image/bmp": ".bmp",
                }.get(rec.mime, ".img")

            safe_title = slugify(rec.title.replace("File:", ""))
            filename = f"{idx:02d}_{safe_title[:80]}{ext}"
            dest = cat_dir / filename

            if dest.exists():
                print(f"skip exists: {dest.name}")
            else:
                print(f"downloading {idx:02d}/{len(chosen)} -> {dest.name}")
                try:
                    download_file(rec.file_url, dest, session)
                except Exception as e:
                    print(f"[warn] download failed: {rec.file_url} ({e})", file=sys.stderr)
                    continue

            manifest_rows.append(rec)
            time.sleep(args.sleep)

    # Write manifest
    manifest_path = out_root / "manifest.csv"
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "category",
                "title",
                "file_url",
                "page_url",
                "mime",
                "license_short",
                "license_url",
                "artist",
                "credit",
            ]
        )
        for r in manifest_rows:
            w.writerow(
                [
                    r.category,
                    r.title,
                    r.file_url,
                    r.page_url,
                    r.mime,
                    r.license_short,
                    r.license_url,
                    r.artist,
                    r.credit,
                ]
            )

    print(f"\nDone. Downloaded ~{len(manifest_rows)} images into: {out_root}")
    print(f"Manifest: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
