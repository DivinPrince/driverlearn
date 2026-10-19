"""Step 2: turn OUT/stream.json into OUT/raw_questions.json (questions, options, red answers, image placement).
After this, each chunk was reviewed against the page renders, translated and explained, then merged with
`bun scripts/build-data.ts`.
"""
import os
OUT = os.environ.get("OUT", "/tmp/dl")
import json, re
from collections import Counter
items = json.load(open(f"{OUT}/stream.json"))
Q_RE = re.compile(r"^\s*(\d{1,3})\s*[\.\)]\s*(.*)$")
Q_NODOT_RE = re.compile(r"^\s*(\d{2,3})([A-Z][a-z].*)$")
OPT_RE = re.compile(r"^\s*\(?\s*([a-dA-D])\s*[\)\.]\s*(.*)$")
questions, cur = [], None
for it in items:
    if it["kind"] == "text":
        t = it["text"]
        m = Q_RE.match(t) or Q_NODOT_RE.match(t)
        if m and int(m.group(1)) <= 433 and (Q_RE.match(t) or (questions and abs(int(m.group(1)) - questions[-1]["src"]) < 40)):
            cur = dict(src=int(m.group(1)), text=m.group(2).strip(), options=[], imgs=[], pages=[it["page"]])
            questions.append(cur); continue
        if cur is None: continue
        if it["page"] not in cur["pages"]: cur["pages"].append(it["page"])
        mo = OPT_RE.match(t)
        if mo and len(cur["options"]) < 6:
            cur["options"].append(dict(label=mo.group(1).lower(), text=mo.group(2).strip(), red=it["red"] or t.lstrip().startswith("("),
                                       images=[], page=it["page"], y0=it["y0"], y1=it["y1"], x0=it["x0"]))
            continue
        if cur["options"]:
            o = cur["options"][-1]; o["text"] = (o["text"] + " " + t).strip(); o["red"] = o["red"] or it["red"]
        else:
            cur["text"] = (cur["text"] + " " + t).strip()
    elif cur is not None:
        if it["page"] not in cur["pages"]: cur["pages"].append(it["page"])
        cur["imgs"].append(it)
def rect_dist(px, py, r):
    # option labels sit at the left / bottom-left of their image
    if r["x0"] < px - 4: return 1000 + px - r["x0"]
    dy = max(r["y0"] - py, 0, py - r["y1"])
    return (r["x0"] - px) + 2 * dy
out = []
for i, q in enumerate(questions):
    stem_imgs = []
    empty = [o for o in q["options"] if len(re.sub(r"[\s\(\)]", "", o["text"])) < 2]
    imgs = list(q["imgs"])
    if len(empty) >= 2 and len(imgs) >= len(empty):
        pairs = sorted(((rect_dist(o["x0"], (o["y0"] + o["y1"]) / 2, im) if o["page"] == im["page"] else 1e9, oi, ii)
                        for oi, o in enumerate(empty) for ii, im in enumerate(imgs)))
        used_o, used_i = set(), set()
        for d, oi, ii in pairs:
            if oi in used_o or ii in used_i or d > 1e8: continue
            empty[oi]["images"].append(imgs[ii]["img"]); used_o.add(oi); used_i.add(ii)
        stem_imgs = [im["img"] for ii, im in enumerate(imgs) if ii not in used_i]
    else:
        stem_imgs = [im["img"] for im in imgs]
    out.append(dict(
        id=i + 1, src=q["src"], pages=q["pages"], text=re.sub(r"\s+", " ", q["text"]).strip(), images=stem_imgs,
        options=[dict(label=o["label"], text=re.sub(r"\s+", " ", o["text"]).strip(), red=o["red"], images=o["images"]) for o in q["options"]],
    ))
for q in out: q["answer_labels"] = [o["label"] for o in q["options"] if o["red"]]
json.dump(out, open(f"{OUT}/raw_questions.json", "w"), ensure_ascii=False, indent=1)
print("count", len(out))
print("answers per q", Counter(len(q["answer_labels"]) for q in out))
print("options per q", Counter(len(q["options"]) for q in out))
print("bad answers:", [(q["id"], q["src"]) for q in out if len(q["answer_labels"]) != 1])
print("odd options:", [(q["id"], q["src"], len(q["options"])) for q in out if len(q["options"]) != 4])
print("stem imgs:", sum(len(q["images"]) for q in out), "option imgs:", sum(len(o["images"]) for q in out for o in q["options"]))
print("questions with images:", sum(1 for q in out if q["images"] or any(o["images"] for o in q["options"])))
