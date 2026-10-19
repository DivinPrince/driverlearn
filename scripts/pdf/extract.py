"""Step 1 of the data pipeline: dump text lines (with red = answer-key detection) and image crops from the source PDF.

Usage: python extract.py   (needs: pip install pymupdf). Set PDF=<path> and OUT=<work dir> env vars.
Outputs OUT/stream.json, OUT/pages/pNNN.png (page renders for review) and OUT/imgs/<id>.png (image crops).
"""
import pymupdf, json, re
import os
PDF = os.environ.get("PDF", "questions.pdf")
OUT = os.environ.get("OUT", "/tmp/dl")
for d in ("pages", "imgs"): os.makedirs(f"{OUT}/{d}", exist_ok=True)
doc = pymupdf.open(PDF)
RED = {0xff0000, 0xc00000}
items = []  # stream of {page, y0, y1, x0, kind, text, red, img}
img_count = 0
for pno, page in enumerate(doc):
    P = pno + 1
    page.get_pixmap(dpi=110).save(f"{OUT}/pages/p{P:03d}.png")
    d = page.get_text("dict")
    for b in d["blocks"]:
        for l in b.get("lines", []):
            spans = [s for s in l["spans"] if s["text"].strip()]
            if not spans: continue
            text = "".join(s["text"] for s in l["spans"])
            redchars = sum(len(s["text"].strip()) for s in spans if s["color"] in RED)
            allc = sum(len(s["text"].strip()) for s in spans)
            t = text.strip()
            if t in ("RESTRICTED", "IKINYARWANDA") or (re.fullmatch(r"\d{1,3}", t) and l["bbox"][1] < 70):
                continue
            x0, y0, x1, y1 = l["bbox"]
            items.append(dict(page=P, x0=round(x0,1), y0=round(y0,1), y1=round(y1,1), kind="text", text=t,
                              red=redchars > allc * 0.5))
    seen = set()
    for i, info in enumerate(page.get_image_info(xrefs=True)):
        bbox = pymupdf.Rect(info["bbox"])
        key = (info["xref"], tuple(round(v) for v in bbox))
        if key in seen: continue
        seen.add(key)
        img_count += 1
        name = f"p{P:03d}_{i}"
        pix = page.get_pixmap(clip=bbox, dpi=200)
        pix.save(f"{OUT}/imgs/{name}.png")
        items.append(dict(page=P, x0=round(bbox.x0,1), y0=round(bbox.y0,1), y1=round(bbox.y1,1), kind="img", img=name, x1=round(bbox.x1,1), w=pix.width, h=pix.height))
# sort by page, then vertical center, then x
def key(it):
    return (it["page"], round((it["y0"]+it["y1"])/2 / 4), it["x0"])
items.sort(key=lambda it: (it["page"], it["y0"], it["x0"]))
json.dump(items, open(f"{OUT}/stream.json","w"), ensure_ascii=False, indent=0)
print("items", len(items), "images", img_count)
