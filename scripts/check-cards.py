#!/usr/bin/env python3
"""校验 docs/02-决策照明卡总表.md 与 src/knowledge/concepts.ts 是否一致。

改了卡的名称或一句话，这个脚本会指出总表哪一行没跟上。
用法：python3 scripts/check-cards.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONCEPTS = ROOT / "src/knowledge/concepts.ts"
TABLE = ROOT / "docs/02-决策照明卡总表.md"

# 总表里允许的附加标记，比较前先去掉
MARKERS = ("**（账本页可算）**",)

concepts = CONCEPTS.read_text(encoding="utf-8")
table = TABLE.read_text(encoding="utf-8")

items = re.findall(
    r"id: '([\w-]+)'[^\n]*?name: '([^']+)'[^\n]*\n\s*oneLine: '((?:[^'\\]|\\.)*)'",
    concepts,
)
rows = re.findall(r"\| \*\*(.+?)\*\* \| (.+?) \| ([ABCD]) \| (.+?) \|", table)
by_name = {r[0]: r[1] for r in rows}

missing, orphan, mismatch = [], [], []
for _cid, name, one in items:
    if name not in by_name:
        missing.append(name)
        continue
    cell = by_name[name]
    for m in MARKERS:
        cell = cell.replace(m, "")
    if cell.strip() != one.strip():
        mismatch.append((name, one.strip(), cell.strip()))

code_names = {n for _c, n, _o in items}
orphan = [n for n in by_name if n not in code_names]

ok = True
if len(items) != len(rows):
    print(f"✗ 数量不一致：代码 {len(items)} 张，总表 {len(rows)} 行")
    ok = False
if missing:
    print("✗ 总表缺这些卡：", "、".join(missing)); ok = False
if orphan:
    print("✗ 总表有代码里没有的卡：", "、".join(orphan)); ok = False
for name, a, b in mismatch:
    print(f"✗ {name} 的一句话不一致\n    代码：{a}\n    总表：{b}")
    ok = False

if ok:
    print(f"✓ {len(items)} 张卡，名称与一句话全部对齐")
    sys.exit(0)
sys.exit(1)
