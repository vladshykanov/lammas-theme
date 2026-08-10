#!/usr/bin/env python3
"""Placeholder scenery for the LAMMAS preview.

This shop is photography-led and I have no photographs. Rather than pass
generated imagery off as a picture of a real field, these are deliberately soft
plates: colour, light direction and depth are right, detail is absent. They
stand in for a photograph and read as a stand-in when you look closely.

Anything botanical is drawn as vector instead (see snippets/variety.liquid) —
a blurred plate cannot tell you what a Scabiosa looks like, and that is
information the shop actually sells.
"""

import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "assets"  # flat: "plates-" prefix
OUT.mkdir(parents=True, exist_ok=True)


def grain(img, amount=7, seed=0):
    rnd = random.Random(seed)
    w, h = img.size
    noise = Image.new("L", (w // 2, h // 2))
    noise.putdata([rnd.randint(128 - amount * 6, 128 + amount * 6) for _ in range((w // 2) * (h // 2))])
    noise = noise.resize((w, h), Image.BICUBIC)
    return Image.blend(img, Image.merge("RGB", (noise, noise, noise)), amount / 100)


def vertical_field(w, h, sky, ground, stems, seed, stem_count=220):
    """Warm light behind upright stems — the hero and the field shots."""
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    rnd = random.Random(seed)

    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=tuple(
            int(sky[i] + (ground[i] - sky[i]) * (t ** 1.4)) for i in range(3)))

    # A low sun behind the crop: a soft bloom, off centre.
    glow = Image.new("RGB", (w, h), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy, r = int(w * 0.68), int(h * 0.52), int(min(w, h) * 0.42)
    for i in range(r, 0, -6):
        v = int(240 * (1 - i / r) ** 2)
        gd.ellipse([cx - i, cy - i * 0.7, cx + i, cy + i * 0.7], fill=(v, int(v * 0.86), int(v * 0.6)))
    glow = glow.filter(ImageFilter.GaussianBlur(w / 22))
    # Screen, not blend: the glow layer is black outside the bloom, so blending
    # it in darkens the whole frame instead of lighting one corner of it.
    img = ImageChops.screen(img, glow)

    # Stems: near ones darker and thicker, far ones lost in the light.
    d = ImageDraw.Draw(img, "RGBA")
    for _ in range(stem_count):
        depth = rnd.random()
        x = rnd.uniform(-20, w + 20)
        top = h * rnd.uniform(0.18, 0.62)
        lean = rnd.uniform(-14, 14)
        width = int(1 + depth * 3)
        alpha = int(22 + depth * 96)
        col = tuple(int(stems[i] * (0.55 + depth * 0.45)) for i in range(3)) + (alpha,)
        d.line([(x + lean, top), (x, h)], fill=col, width=width)
        if rnd.random() < 0.35:  # a head on some of them
            rr = 3 + depth * 7
            d.ellipse([x + lean - rr, top - rr, x + lean + rr, top + rr], fill=col)

    img = img.filter(ImageFilter.GaussianBlur(1.1))
    return grain(img, 6, seed)


def tunnel(w, h, seed):
    """Inside a polytunnel: bright roof, green benches receding."""
    img = Image.new("RGB", (w, h), (226, 230, 214))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=(
            int(238 - 60 * t), int(240 - 44 * t), int(226 - 70 * t)))

    # Hoops converging on a vanishing point.
    d = ImageDraw.Draw(img, "RGBA")
    vx, vy = w * 0.5, h * 0.42
    for i in range(1, 9):
        k = i / 9
        rx, ry = w * 0.62 * (1 - k * 0.82), h * 0.55 * (1 - k * 0.82)
        d.arc([vx - rx, vy - ry, vx + rx, vy + ry * 1.7], 180, 360,
              fill=(255, 255, 255, int(150 - k * 110)), width=max(1, int(5 - k * 4)))

    rnd = random.Random(seed)
    for _ in range(160):
        depth = rnd.random()
        x = rnd.uniform(0, w)
        y = vy + (h - vy) * (0.15 + depth * 0.9)
        s = 2 + depth * 12
        g = (int(70 + depth * 60), int(96 + depth * 58), int(52 + depth * 40), int(90 + depth * 120))
        d.ellipse([x - s, y - s * 0.6, x + s, y + s * 0.6], fill=g)

    return grain(img.filter(ImageFilter.GaussianBlur(1.4)), 5, seed)


def buckets(w, h, seed):
    """Buckets of cut stems on the packing bench. No people: a blurred human
    figure reads as a mistake, a blurred bucket reads as depth of field."""
    img = Image.new("RGB", (w, h), (222, 219, 206))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([(0, y), (w, y)], fill=(int(232 - 40 * t), int(229 - 34 * t), int(214 - 34 * t)))

    rnd = random.Random(seed)
    d = ImageDraw.Draw(img, "RGBA")
    for i in range(5):
        depth = 0.35 + i * 0.14
        bx = w * (0.08 + i * 0.19) + rnd.uniform(-14, 14)
        by = h * (0.58 + rnd.uniform(-.04, .04))
        bw, bh = w * 0.13 * depth * 1.5, h * 0.30 * depth
        # galvanised bucket
        d.polygon([(bx - bw, by), (bx + bw, by), (bx + bw * .78, by + bh), (bx - bw * .78, by + bh)],
                  fill=(150, 154, 150, 230))
        # the stems above it
        for _ in range(70):
            sx = bx + rnd.uniform(-bw, bw)
            top = by - bh * rnd.uniform(0.8, 1.9)
            col = rnd.choice([(96, 108, 72), (150, 92, 104), (196, 152, 78), (120, 96, 132)])
            d.line([(sx + rnd.uniform(-8, 8), top), (sx, by)], fill=col + (170,), width=max(1, int(3 * depth)))
            rr = 3 + 6 * depth
            d.ellipse([sx - rr, top - rr, sx + rr, top + rr], fill=col + (200,))

    return grain(img.filter(ImageFilter.GaussianBlur(2.6)), 5, seed)


def seamless(w, h, tone=(238, 235, 228)):
    """The plain sweep every bouquet is shot against."""
    img = Image.new("RGB", (w, h), tone)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        v = 1 - (t ** 2) * 0.10
        d.line([(0, y), (w, y)], fill=tuple(int(c * v) for c in tone))
    return grain(img, 3, 5)


PLATES = {
    "field-dawn":  lambda: vertical_field(1600, 900, (252, 238, 208), (150, 132, 96), (86, 88, 62), 11, 240),
    "field-wide":  lambda: vertical_field(1200, 800, (246, 240, 218), (154, 146, 108), (92, 98, 70), 23, 180),
    "tunnel":      lambda: tunnel(1200, 800, 31),
    "bench":       lambda: buckets(1200, 800, 47),
    "seamless":    lambda: seamless(1200, 1200),
    "seamless-wide": lambda: seamless(1600, 900),
}


def main():
    for name, make in PLATES.items():
        img = make()
        img.save(OUT / f"plates-{name}.jpg", "JPEG", quality=86, optimize=True)
        print(f"{name:16s} {img.size[0]}x{img.size[1]}")
    print(f"\n{len(PLATES)} plates -> {OUT}")
    print("These are placeholders, not photographs. Replace before launch.")


if __name__ == "__main__":
    main()
