"""Slice public/assets/characters-v2.png into one uncropped image per character.
Pure numpy region growing from one seed per character. Output: public/assets/characters/<id>.png"""
import sys, numpy as np
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
src = np.asarray(Image.open(root / 'public/assets/characters-v2.png').convert('RGB'))
mask = np.abs(src.astype(int) - 254).sum(2) > 30
def dilate(m, n=1):
    for _ in range(n):
        d = m.copy(); d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]; m = d
    return m
ids = ['DEMO-BASIC-001', 'DEMO-LIMITED-001', 'DEMO-GOLD-001', 'DEMO-SIGNED-001', 'DEMO-ONE-001']
seeds = [(466, 247), (437, 687), (449, 1090), (467, 1515), (444, 1976)]  # chest heart (y, x) of each character
regions = []
for y, x in seeds:
    r = np.zeros_like(mask); r[y, x] = True
    while True:
        g = dilate(r) & mask
        if g.sum() == r.sum(): break
        r = g
    regions.append(r)
for i in range(5):
    for j in range(i + 1, 5):
        if (regions[i] & regions[j]).any(): sys.exit(f'characters {ids[i]} and {ids[j]} touch, slicing stopped')
W, H = 500, 725
out = root / 'public/assets/characters'; out.mkdir(exist_ok=True)
for k, r in enumerate(regions):
    others = dilate(np.logical_or.reduce([regions[j] for j in range(5) if j != k]), 2)
    keep = dilate(r, 5) & ~others
    img = src.copy(); img[~keep] = 255
    xs = np.where(r.any(0))[0]; left = int(round((xs.min() + xs.max() + 1) / 2 - W / 2))
    canvas = np.full((H, W, 3), 255, np.uint8)
    x0, x1 = max(0, left), min(src.shape[1], left + W)
    canvas[:src.shape[0], x0 - left:x1 - left] = img[:, x0:x1]
    Image.fromarray(canvas).save(out / f'{ids[k]}.png', optimize=True)
    print(ids[k], 'pixels', int(r.sum()), 'heartX', round((seeds[k][1] - left) / W * 100, 1), 'heartY', round(seeds[k][0] / H * 100, 1))
