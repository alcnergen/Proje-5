"""Generates the PWA icons (a simple tree on a green tile)."""
from PIL import Image, ImageDraw
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')

def icon(size, pad=0.0, rounded=True):
    S = 1024
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    bg = (47, 125, 79, 255)
    if rounded: d.rounded_rectangle([0, 0, S, S], radius=220, fill=bg)
    else: d.rectangle([0, 0, S, S], fill=bg)
    k = 1 - pad * 2; o = S * pad
    T = lambda x, y: (o + x * k, o + y * k)
    d.ellipse([*T(250, 820), *T(774, 900)], fill=(30, 85, 52, 255))
    d.polygon([T(470, 840), T(490, 520), T(534, 520), T(554, 840)], fill=(122, 85, 48, 255))
    for (x, y, r, c) in [(512, 380, 230, (120, 200, 120)), (370, 470, 150, (96, 180, 110)), (654, 470, 150, (96, 180, 110)),
                         (512, 250, 150, (150, 215, 140)), (430, 330, 110, (170, 225, 150)), (610, 360, 100, (140, 210, 130))]:
        d.ellipse([*T(x - r, y - r), *T(x + r, y + r)], fill=(*c, 255))
    for (x, y) in [(440, 420), (600, 300), (560, 470), (380, 520), (670, 520)]:
        d.ellipse([*T(x - 22, y - 22), *T(x + 22, y + 22)], fill=(242, 183, 5, 255))
    return im.resize((size, size), Image.LANCZOS)

icon(192).save(os.path.join(OUT, 'icon-192.png'))
icon(512).save(os.path.join(OUT, 'icon-512.png'))
icon(512, pad=0.12, rounded=False).save(os.path.join(OUT, 'icon-maskable-512.png'))
icon(180, rounded=False).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))
