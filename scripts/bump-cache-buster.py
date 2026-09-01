#!/usr/bin/env python3
# scripts/bump-cache-buster.py
#
# Bumps ?v=20 -> ?v=21 (or whatever) across every HTML file in the repo,
# while preserving line endings. The repo uses CRLF, so we detect and
# restore it explicitly.
#
# Usage:  python scripts/bump-cache-buster.py OLD NEW
# Example: python scripts/bump-cache-buster.py 20 21

import os
import sys
import glob

if len(sys.argv) != 3:
    print('Usage: python bump-cache-buster.py OLD NEW')
    print('Example: python bump-cache-buster.py 20 21')
    sys.exit(1)

OLD, NEW = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = []
for ext in ('*.html',):
    files.extend(glob.glob(os.path.join(ROOT, '**', ext), recursive=True))

changed = 0
for f in files:
    with open(f, 'rb') as fh:
        raw = fh.read()
    if ('?v=' + OLD).encode('utf-8') not in raw:
        continue
    new = raw.replace(('?v=' + OLD).encode('utf-8'), ('?v=' + NEW).encode('utf-8'))
    if new == raw:
        continue
    with open(f, 'wb') as fh:
        fh.write(new)
    # Count substitutions
    count = raw.count(('?v=' + OLD).encode('utf-8'))
    rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
    print(f'  {count}x  {rel}')
    changed += 1

print(f'\nUpdated {changed} file(s).')
