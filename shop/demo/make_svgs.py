"""Product illustrations for the demos (mode, beaute, deco, terroir, charme): flat SVGs in the style of
the hand-drawn ones of demo/foufaa, 600x750, two per product (-a: studio shot, -b: styled backdrop).
Writes demo/<demo>/assets/<slug>-a.svg and -b.svg.

Usage: python3 demo/make_svgs.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def shade(hex_color, f):
    """Lighten (f > 0, towards white) or darken (f < 0) a #rrggbb color."""
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    t = 255 if f > 0 else 0
    f = abs(f)
    return "#%02x%02x%02x" % tuple(round(c + (t - c) * f) for c in (r, g, b))


# ── Shapes: each draws the product centred around x=300, resting on y≈640. ─────────────────────
def dropper(c, a):
    return (f'<rect x="230" y="330" width="140" height="300" rx="34" fill="{c}"/>'
            f'<rect x="230" y="330" width="140" height="300" rx="34" fill="#fff" opacity=".14"/>'
            f'<rect x="252" y="420" width="96" height="120" rx="8" fill="#fffaf2"/>'
            f'<rect x="268" y="450" width="64" height="8" rx="4" fill="{a}"/><rect x="276" y="470" width="48" height="6" rx="3" fill="{shade(a, .4)}"/>'
            f'<rect x="262" y="270" width="76" height="66" rx="10" fill="{a}"/>'
            f'<path d="M272 270 Q272 190 300 190 Q328 190 328 270 Z" fill="{shade(a, -.25)}"/>'
            f'<rect x="246" y="350" width="16" height="250" rx="8" fill="#fff" opacity=".35"/>')


def pump(c, a):
    return (f'<rect x="215" y="320" width="170" height="310" rx="40" fill="{c}"/>'
            f'<rect x="240" y="410" width="120" height="140" rx="10" fill="#fffaf2"/>'
            f'<rect x="258" y="445" width="84" height="9" rx="4" fill="{a}"/><rect x="270" y="466" width="60" height="7" rx="3" fill="{shade(a, .4)}"/>'
            f'<rect x="268" y="270" width="64" height="54" rx="8" fill="{a}"/><rect x="290" y="210" width="20" height="62" fill="{a}"/>'
            f'<rect x="290" y="206" width="90" height="22" rx="11" fill="{a}"/>'
            f'<rect x="232" y="340" width="18" height="260" rx="9" fill="#fff" opacity=".3"/>')


def jar(c, a, label="#fffaf2", wide=1.0):
    w = int(230 * wide)
    x = 300 - w // 2
    return (f'<rect x="{x}" y="430" width="{w}" height="200" rx="40" fill="{c}"/>'
            f'<rect x="{x}" y="430" width="{w}" height="200" rx="40" fill="#fff" opacity=".12"/>'
            f'<rect x="{x - 10}" y="380" width="{w + 20}" height="66" rx="16" fill="{a}"/>'
            f'<rect x="{x - 10}" y="380" width="{w + 20}" height="20" rx="10" fill="#fff" opacity=".18"/>'
            f'<rect x="{x + 30}" y="480" width="{w - 60}" height="96" rx="10" fill="{label}"/>'
            f'<rect x="{x + 50}" y="510" width="{w - 100}" height="9" rx="4" fill="{a}"/><rect x="{x + 70}" y="532" width="{w - 140}" height="7" rx="3" fill="{shade(a, .45)}"/>')


def tube(c, a):
    return (f'<path d="M240 260 L360 260 L370 560 Q370 590 340 590 L260 590 Q230 590 230 560 Z" fill="{c}"/>'
            f'<rect x="232" y="240" width="136" height="30" rx="6" fill="{shade(c, -.15)}"/>'
            f'<rect x="262" y="590" width="76" height="46" rx="10" fill="{a}"/>'
            f'<rect x="262" y="360" width="76" height="9" rx="4" fill="{a}"/><rect x="272" y="382" width="56" height="7" rx="3" fill="#fff" opacity=".8"/>'
            f'<rect x="248" y="280" width="14" height="260" rx="7" fill="#fff" opacity=".3"/>')


def soap(c, a):
    return (f'<rect x="170" y="520" width="260" height="110" rx="30" fill="{shade(c, -.12)}"/>'
            f'<rect x="190" y="420" width="220" height="110" rx="30" fill="{c}"/>'
            f'<rect x="190" y="420" width="220" height="26" rx="13" fill="#fff" opacity=".25"/>'
            f'<circle cx="300" cy="476" r="26" fill="none" stroke="{a}" stroke-width="6"/>'
            f'<path d="M150 400 Q170 360 200 390" stroke="{shade(a, .3)}" stroke-width="10" fill="none" stroke-linecap="round"/>'
            f'<circle cx="430" cy="400" r="16" fill="#fff" opacity=".7"/><circle cx="455" cy="370" r="9" fill="#fff" opacity=".6"/>')


def box(c, a):
    return (f'<rect x="140" y="370" width="320" height="260" rx="14" fill="{c}"/>'
            f'<rect x="140" y="370" width="320" height="260" rx="14" fill="#fff" opacity=".1"/>'
            f'<rect x="282" y="370" width="36" height="260" fill="{a}"/>'
            f'<rect x="125" y="320" width="350" height="70" rx="14" fill="{c}"/><rect x="125" y="320" width="350" height="70" rx="14" fill="#000" opacity=".07"/>'
            f'<rect x="282" y="320" width="36" height="70" fill="{a}"/>'
            f'<path d="M300 320 C240 240 190 270 230 315 Z" fill="{a}"/><path d="M300 320 C360 240 410 270 370 315 Z" fill="{a}"/>'
            f'<circle cx="300" cy="318" r="18" fill="{a}"/>')


def hanger():
    return ('<path d="M300 150 Q300 128 318 128 Q336 128 336 146 Q336 160 300 176" stroke="#8a7a63" stroke-width="7" fill="none" stroke-linecap="round"/>'
            '<path d="M300 176 L190 226 L410 226 Z" fill="none" stroke="#8a7a63" stroke-width="7" stroke-linejoin="round"/>')


def dress(c, a):
    return (hanger() + f'<path d="M250 210 Q300 236 350 210 L372 330 Q352 340 340 330 L338 360 L430 640 L170 640 L262 360 L260 330 Q248 340 228 330 Z" fill="{c}"/>'
            f'<path d="M262 360 L338 360 L336 384 L264 384 Z" fill="{a}"/>'
            f'<path d="M300 384 L300 640" stroke="#000" stroke-opacity=".08" stroke-width="10"/>'
            f'<path d="M262 384 L200 640 L240 640 Z" fill="#fff" opacity=".12"/>')


def abaya(c, a):
    return (hanger() + f'<path d="M240 212 Q300 240 360 212 L470 330 L440 360 L380 300 L400 650 L200 650 L220 300 L160 360 L130 330 Z" fill="{c}"/>'
            f'<path d="M300 236 L300 650" stroke="{a}" stroke-width="6"/>'
            f'<path d="M270 226 Q300 300 330 226" stroke="{a}" stroke-width="6" fill="none"/>'
            f'<path d="M150 344 L172 322 M440 344 L418 322" stroke="{a}" stroke-width="8"/>'
            f'<path d="M210 610 L390 610" stroke="{a}" stroke-width="6" stroke-dasharray="14 10"/>')


def set2(c, a):
    return (hanger() + f'<path d="M245 212 Q300 236 355 212 L420 290 L395 312 L365 285 L365 420 L235 420 L235 285 L205 312 L180 290 Z" fill="{c}"/>'
            f'<path d="M285 220 L300 300 L315 220" stroke="{a}" stroke-width="6" fill="none"/>'
            f'<path d="M240 440 L360 440 L372 650 L316 650 L300 520 L284 650 L228 650 Z" fill="{shade(c, -.12)}"/>'
            f'<rect x="240" y="440" width="120" height="16" fill="{a}" opacity=".7"/>')


def bag(c, a):
    return (f'<path d="M230 400 Q230 250 300 250 Q370 250 370 400" stroke="{shade(c, -.25)}" stroke-width="18" fill="none"/>'
            f'<path d="M160 400 L440 400 L410 630 L190 630 Z" fill="{c}"/>'
            f'<path d="M160 400 L440 400 L432 460 L168 460 Z" fill="{shade(c, -.1)}"/>'
            f'<rect x="282" y="440" width="36" height="40" rx="6" fill="{a}"/>'
            f'<path d="M190 630 L200 470" stroke="#fff" stroke-opacity=".2" stroke-width="10"/>')


def scarf(c, a):
    return (f'<path d="M150 380 Q300 330 450 380 L470 600 Q300 650 130 600 Z" fill="{c}"/>'
            f'<path d="M150 380 Q300 430 450 380" stroke="{shade(c, -.15)}" stroke-width="10" fill="none"/>'
            + "".join(f'<circle cx="{x}" cy="{y}" r="16" fill="{a}" opacity=".8"/><circle cx="{x}" cy="{y}" r="6" fill="#fff"/>'
                      for x, y in ((210, 470), (300, 520), (390, 470), (250, 570), (350, 575), (300, 430)))
            + f'<path d="M300 610 L280 690 M320 610 L330 690" stroke="{a}" stroke-width="6"/>')


def plate(c, a):
    petals = "".join(f'<ellipse cx="300" cy="{430 - 90}" rx="22" ry="52" fill="{a}" transform="rotate({k * 45} 300 430)"/>' for k in range(8))
    return (f'<ellipse cx="300" cy="620" rx="200" ry="22" fill="#000" opacity=".08"/>'
            f'<circle cx="300" cy="430" r="200" fill="{c}"/><circle cx="300" cy="430" r="200" fill="none" stroke="{a}" stroke-width="16"/>'
            f'<circle cx="300" cy="430" r="168" fill="none" stroke="{a}" stroke-width="4" stroke-dasharray="10 12"/>'
            + petals + f'<circle cx="300" cy="430" r="44" fill="{c}" stroke="{a}" stroke-width="8"/><circle cx="300" cy="430" r="14" fill="{a}"/>')


def vase(c, a):
    return (f'<path d="M255 230 L345 230 L340 280 Q440 340 420 480 Q405 600 340 640 L260 640 Q195 600 180 480 Q160 340 260 280 Z" fill="{c}"/>'
            f'<path d="M190 420 L410 420" stroke="{a}" stroke-width="14"/><path d="M186 460 L414 460" stroke="{a}" stroke-width="5"/>'
            + "".join(f'<path d="M{x} 470 L{x + 20} 520 L{x + 40} 470" fill="none" stroke="{a}" stroke-width="7"/>' for x in range(205, 380, 45))
            + f'<path d="M248 228 L352 228" stroke="{shade(c, -.2)}" stroke-width="14" stroke-linecap="round"/>'
            f'<path d="M215 360 Q205 470 250 600" stroke="#fff" stroke-opacity=".2" stroke-width="16" fill="none"/>')


def candle(c, a):
    return (f'<rect x="200" y="360" width="200" height="270" rx="24" fill="{shade(a, .55)}" opacity=".85"/>'
            f'<rect x="215" y="400" width="170" height="225" rx="18" fill="{c}"/>'
            f'<rect x="240" y="470" width="120" height="80" rx="8" fill="#fffaf2"/><rect x="258" y="495" width="84" height="8" rx="4" fill="{a}"/>'
            f'<rect x="296" y="360" width="8" height="44" fill="#3f3a33"/>'
            f'<path d="M300 300 Q326 340 300 366 Q274 340 300 300 Z" fill="#f59e0b"/><path d="M300 326 Q312 346 300 360 Q288 346 300 326 Z" fill="#fde68a"/>')


def tray(c, a):
    glass = lambda x: (f'<path d="M{x - 30} 360 L{x + 30} 360 L{x + 22} 470 L{x - 22} 470 Z" fill="#fde68a" opacity=".85"/>'
                       f'<path d="M{x - 30} 360 L{x + 30} 360 L{x + 28} 390 L{x - 28} 390 Z" fill="#b45309" opacity=".55"/>'
                       f'<path d="M{x - 24} 400 Q{x} 420 {x + 24} 400" stroke="{a}" stroke-width="4" fill="none"/>')
    return (f'<ellipse cx="300" cy="520" rx="230" ry="96" fill="{shade(c, -.2)}"/><ellipse cx="300" cy="505" rx="230" ry="96" fill="{c}"/>'
            f'<ellipse cx="300" cy="505" rx="190" ry="76" fill="none" stroke="{shade(c, .35)}" stroke-width="6" stroke-dasharray="4 10"/>'
            + glass(200) + glass(300) + glass(400)
            + f'<path d="M150 260 Q170 220 190 250" stroke="#fff" stroke-opacity=".6" stroke-width="6" fill="none"/>')


def cushion(c, a):
    return (f'<path d="M150 300 Q300 270 450 300 Q480 450 450 600 Q300 630 150 600 Q120 450 150 300 Z" fill="{c}"/>'
            f'<path d="M300 340 L380 450 L300 560 L220 450 Z" fill="none" stroke="{a}" stroke-width="14"/>'
            f'<path d="M300 400 L340 450 L300 500 L260 450 Z" fill="{a}"/>'
            f'<path d="M180 340 L220 340 M380 340 L420 340 M180 560 L220 560 M380 560 L420 560" stroke="{a}" stroke-width="10"/>'
            + "".join(f'<path d="M{x} 600 L{x} 630" stroke="{a}" stroke-width="6"/>' for x in range(170, 440, 30)))


def bowls(c, a):
    return (f'<path d="M150 470 L450 470 Q440 610 300 620 Q160 610 150 470 Z" fill="{c}"/>'
            f'<path d="M190 390 L410 390 Q402 490 300 498 Q198 490 190 390 Z" fill="{shade(c, .15)}"/>'
            f'<path d="M230 320 L370 320 Q365 386 300 392 Q235 386 230 320 Z" fill="{shade(c, .3)}"/>'
            f'<path d="M160 500 L440 500" stroke="{a}" stroke-width="10"/><path d="M200 415 L400 415" stroke="{a}" stroke-width="8"/>'
            f'<path d="M238 340 L362 340" stroke="{a}" stroke-width="6"/>')


def oil(c, a, big=False):
    if big:
        return (f'<rect x="180" y="300" width="240" height="330" rx="20" fill="{c}"/>'
                f'<rect x="250" y="250" width="100" height="60" rx="10" fill="{shade(c, -.2)}"/><rect x="270" y="225" width="60" height="30" rx="6" fill="{a}"/>'
                f'<rect x="210" y="380" width="180" height="170" rx="10" fill="#fffaf2"/>'
                f'<path d="M300 410 Q340 440 300 500 Q260 440 300 410 Z" fill="{c}"/><rect x="240" y="515" width="120" height="9" rx="4" fill="{a}"/>')
    return (f'<path d="M262 330 L338 330 L360 400 L360 630 L240 630 L240 400 Z" fill="{c}"/>'
            f'<rect x="276" y="200" width="48" height="136" fill="{c}"/><rect x="272" y="170" width="56" height="40" rx="8" fill="{a}"/>'
            f'<rect x="250" y="450" width="100" height="120" rx="8" fill="#fffaf2"/>'
            f'<path d="M300 470 Q326 490 300 530 Q274 490 300 470 Z" fill="{shade(c, -.1)}"/><rect x="266" y="545" width="68" height="7" rx="3" fill="{a}"/>'
            f'<rect x="250" y="410" width="12" height="200" rx="6" fill="#fff" opacity=".25"/>')


def dates(c, a):
    d = "".join(f'<ellipse cx="{x}" cy="{y}" rx="34" ry="18" fill="{c}" transform="rotate({r} {x} {y})"/>'
                f'<ellipse cx="{x - 6}" cy="{y - 5}" rx="16" ry="5" fill="#fff" opacity=".22" transform="rotate({r} {x} {y})"/>'
                for x, y, r in ((230, 430, -20), (300, 415, 10), (370, 432, 25), (260, 460, 5), (340, 462, -15), (300, 445, 40)))
    return (d + f'<path d="M140 450 L460 450 Q450 620 300 630 Q150 620 140 450 Z" fill="{a}"/>'
            f'<path d="M160 490 L440 490" stroke="#fff" stroke-opacity=".3" stroke-width="8" stroke-dasharray="20 14"/>'
            f'<path d="M380 360 Q420 300 470 300" stroke="#4d7c0f" stroke-width="8" fill="none"/><ellipse cx="455" cy="290" rx="34" ry="12" fill="#65a30d" transform="rotate(-25 455 290)"/>')


SHAPES = dict(dropper=dropper, pump=pump, jar=jar, tube=tube, soap=soap, box=box, dress=dress, abaya=abaya, set2=set2, bag=bag,
              scarf=scarf, plate=plate, vase=vase, candle=candle, tray=tray, cushion=cushion, bowls=bowls, oil=oil, dates=dates)


# ── Accessories (demo "charme"): bags, jewellery sets, necklaces, bracelets, key rings. ────────
def handbag(c, a, bow="#c9a26b"):
    return (f'<path d="M225 400 Q225 270 300 270 Q375 270 375 400" stroke="{shade(c, -.3)}" stroke-width="16" fill="none"/>'
            f'<rect x="150" y="390" width="300" height="240" rx="22" fill="{c}"/>'
            f'<rect x="150" y="390" width="300" height="70" rx="22" fill="{shade(c, -.14)}"/>'
            f'<rect x="270" y="430" width="60" height="44" rx="8" fill="{a}"/><rect x="286" y="444" width="28" height="16" rx="4" fill="{shade(a, -.3)}"/>'
            f'<path d="M232 392 Q190 330 150 356 Q178 392 232 398 Z" fill="{bow}"/><path d="M232 392 Q262 320 300 350 Q276 396 232 398 Z" fill="{shade(bow, -.15)}"/>'
            f'<path d="M226 398 Q200 470 214 540 L236 536 Q228 470 240 400 Z" fill="{bow}"/><path d="M236 398 Q262 450 252 510 L272 506 Q276 446 246 396 Z" fill="{shade(bow, .25)}"/>'
            f'<circle cx="234" cy="396" r="13" fill="{shade(bow, -.3)}"/>'
            f'<path d="M172 610 L172 480" stroke="#fff" stroke-opacity=".18" stroke-width="10"/>')


def minibag(c, a):
    petals = "".join(f'<ellipse cx="398" cy="{520 - 20}" rx="11" ry="20" fill="#fff8ee" transform="rotate({k * 72} 398 520)"/>' for k in range(5))
    return (f'<path d="M240 420 Q240 310 300 310 Q360 310 360 420" stroke="{shade(c, -.25)}" stroke-width="14" fill="none"/>'
            f'<path d="M180 410 L420 410 Q440 520 410 630 L190 630 Q160 520 180 410 Z" fill="{c}"/>'
            f'<path d="M180 410 L420 410 Q426 440 426 470 L174 470 Q174 440 180 410 Z" fill="{shade(c, -.1)}"/>'
            f'<circle cx="300" cy="470" r="14" fill="{a}"/>'
            f'<path d="M398 430 L398 500" stroke="{a}" stroke-width="4"/>' + petals + f'<circle cx="398" cy="520" r="9" fill="{a}"/>'
            f'<path d="M200 600 Q190 520 200 440" stroke="#fff" stroke-opacity=".2" stroke-width="10" fill="none"/>')


def tote(c, a):
    return (f'<path d="M215 400 L215 300 Q215 270 245 270 Q275 270 275 300 L275 400" stroke="{a}" stroke-width="14" fill="none"/>'
            f'<path d="M325 400 L325 300 Q325 270 355 270 Q385 270 385 300 L385 400" stroke="{a}" stroke-width="14" fill="none"/>'
            f'<path d="M150 400 L450 400 L430 640 L170 640 Z" fill="{c}"/>'
            f'<path d="M300 470 L330 510 L300 560 L270 510 Z" fill="none" stroke="{a}" stroke-width="8"/>'
            f'<rect x="230" y="580" width="140" height="8" rx="4" fill="{a}"/>'
            f'<path d="M150 400 L450 400 L447 430 L153 430 Z" fill="{shade(c, -.08)}"/>')


def _pendant(kind, x, y, m, r=30):
    if kind == "heart":
        return f'<path d="M{x} {y + r} C{x - r * 1.5} {y - r * .1} {x - r * .6} {y - r} {x} {y - r * .25} C{x + r * .6} {y - r} {x + r * 1.5} {y - r * .1} {x} {y + r} Z" fill="{m}"/>'
    if kind == "butterfly":
        return (f'<ellipse cx="{x - r * .55}" cy="{y - r * .2}" rx="{r * .6}" ry="{r * .8}" fill="{m}" transform="rotate(-25 {x - r * .55} {y - r * .2})"/>'
                f'<ellipse cx="{x + r * .55}" cy="{y - r * .2}" rx="{r * .6}" ry="{r * .8}" fill="{m}" transform="rotate(25 {x + r * .55} {y - r * .2})"/>'
                f'<ellipse cx="{x - r * .4}" cy="{y + r * .55}" rx="{r * .4}" ry="{r * .5}" fill="{shade(m, -.15)}"/><ellipse cx="{x + r * .4}" cy="{y + r * .55}" rx="{r * .4}" ry="{r * .5}" fill="{shade(m, -.15)}"/>'
                f'<rect x="{x - 3}" y="{y - r * .7}" width="6" height="{r * 1.6}" rx="3" fill="{shade(m, -.4)}"/>')
    if kind == "clover":
        return "".join(f'<circle cx="{x + dx * r * .5}" cy="{y + dy * r * .5}" r="{r * .5}" fill="{m}"/>' for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1))) + f'<circle cx="{x}" cy="{y}" r="{r * .22}" fill="{shade(m, .5)}"/>'
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="{m}"/><circle cx="{x}" cy="{y}" r="{r - 6}" fill="none" stroke="{shade(m, -.3)}" stroke-width="3"/>'
            f'<text x="{x}" y="{y + r * .38}" text-anchor="middle" font-family="Georgia, serif" font-size="{r * 1.1}" font-weight="700" fill="{shade(m, -.45)}">{kind}</text>')


def necklace(c, a, pendant="heart"):
    return (f'<path d="M170 260 Q170 520 300 560 Q430 520 430 260" stroke="{c}" stroke-width="7" fill="none" stroke-dasharray="3 7" stroke-linecap="round"/>'
            f'<path d="M170 260 Q170 520 300 560 Q430 520 430 260" stroke="{shade(c, .45)}" stroke-width="2" fill="none"/>'
            f'<circle cx="300" cy="566" r="9" fill="none" stroke="{c}" stroke-width="5"/>' + _pendant(pendant, 300, 612, a if pendant == "heart" else c, 38))


def bracelet(c, a, charm="bead"):
    if charm == "bead":
        beads = "".join(f'<circle cx="{300 + 150 * __import__("math").cos(k * 0.3927):.0f}" cy="{470 + 110 * __import__("math").sin(k * 0.3927):.0f}" r="21" fill="{c if k % 4 else a}"/>'
                        f'<circle cx="{294 + 150 * __import__("math").cos(k * 0.3927):.0f}" cy="{463 + 110 * __import__("math").sin(k * 0.3927):.0f}" r="6" fill="#fff" opacity=".5"/>' for k in range(16))
        return beads
    return (f'<ellipse cx="300" cy="470" rx="160" ry="112" fill="none" stroke="{c}" stroke-width="8" stroke-dasharray="3 8" stroke-linecap="round"/>'
            f'<ellipse cx="300" cy="470" rx="160" ry="112" fill="none" stroke="{shade(c, .5)}" stroke-width="2"/>'
            + "".join(_pendant("clover", x, y, a, 30) for x, y in ((300, 582), (176, 540), (424, 540))))


def keyring(c, a, kind="flower"):
    ring = (f'<circle cx="300" cy="300" r="52" fill="none" stroke="#b9bec7" stroke-width="12"/><circle cx="300" cy="300" r="52" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>'
            f'<path d="M300 352 L300 420" stroke="#b9bec7" stroke-width="8" stroke-dasharray="10 6"/>')
    if kind == "flower":
        petals = "".join(f'<ellipse cx="300" cy="{520 - 62}" rx="36" ry="62" fill="{c}" transform="rotate({k * 60} 300 520)"/>' for k in range(6))
        return ring + petals + f'<circle cx="300" cy="520" r="34" fill="{a}"/><circle cx="290" cy="510" r="9" fill="#fff" opacity=".45"/>'
    letters = "".join(f'<rect x="{188 + i * 58}" y="440" width="50" height="62" rx="12" fill="{c if i % 2 else shade(c, .35)}"/>'
                      f'<text x="{213 + i * 58}" y="485" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="700" fill="{a}">{ch}</text>' for i, ch in enumerate(kind))
    return ring + f'<path d="M300 420 L300 440" stroke="#b9bec7" stroke-width="6"/>' + letters + f'<path d="M300 502 L300 540" stroke="{a}" stroke-width="5"/><path d="M300 540 L280 630 L320 630 Z" fill="{a}"/>'


def parure(c, a, pendant="butterfly"):
    return (f'<rect x="150" y="250" width="300" height="390" rx="18" fill="#fffdf8" stroke="#e7dccb" stroke-width="3"/>'
            f'<text x="300" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="3" fill="#8a7a63">STAINLESS STEEL</text>'
            f'<path d="M205 320 Q215 450 300 470 Q385 450 395 320" stroke="{c}" stroke-width="5" fill="none" stroke-dasharray="3 6" stroke-linecap="round"/>'
            + _pendant(pendant, 300, 500, a, 34) + _pendant(pendant, 215, 585, a, 22) + _pendant(pendant, 385, 585, a, 22)
            + f'<circle cx="300" cy="592" r="22" fill="none" stroke="{c}" stroke-width="8"/><circle cx="300" cy="566" r="9" fill="{a}"/>')


SHAPES.update(handbag=handbag, minibag=minibag, tote=tote, necklace=necklace, bracelet=bracelet, keyring=keyring, parure=parure)


def svg(body, bg, variant):
    top, bottom = (shade(bg, .55), bg) if variant == "a" else (shade(bg, .15), shade(bg, -.12))
    extra = ""
    if variant == "b":
        extra = (f'<circle cx="300" cy="430" r="250" fill="#fff" opacity=".22"/>'
                 f'<path d="M60 700 Q120 600 90 520" stroke="#fff" stroke-opacity=".45" stroke-width="8" fill="none"/>'
                 f'<ellipse cx="96" cy="560" rx="26" ry="11" fill="#fff" opacity=".45" transform="rotate(-50 96 560)"/>'
                 f'<ellipse cx="112" cy="630" rx="26" ry="11" fill="#fff" opacity=".45" transform="rotate(30 112 630)"/>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">'
            f'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>'
            '<radialGradient id="sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="600" height="750" fill="url(#bg)"/>{extra}<ellipse cx="300" cy="645" rx="210" ry="22" fill="url(#sh)"/>'
            f'<g transform="translate(300 450) scale({1.15 if variant == "a" else 1.3}) translate(-300 -450)">{body}</g></svg>')


# demo → [(slug, shape, main color, accent, background, extra kwargs)]
PRODUCTS = {
    "mode": [
        ("robe-satin-emeraude", "dress", "#047857", "#d4af37", "#e7efe9", {}),
        ("robe-longue-fleurie", "dress", "#f9a8d4", "#be185d", "#fbeff3", {}),
        ("abaya-noire-brodee", "abaya", "#1c1917", "#c9a14a", "#efe9e1", {}),
        ("kimono-lin-sable", "abaya", "#d6c3a3", "#8a6d3b", "#f4efe7", {}),
        ("ensemble-lin-blanc", "set2", "#f5f0e6", "#a8a29e", "#e8e1d5", {}),
        ("tailleur-rose-poudre", "set2", "#f4b6c2", "#9f1239", "#f8ecee", {}),
        ("sac-cuir-camel", "bag", "#b7793f", "#d4af37", "#f3ebe1", {}),
        ("foulard-soie-imprime", "scarf", "#9f1239", "#fbbf24", "#f6ece9", {}),
    ],
    "beaute": [
        ("serum-vitamine-c", "dropper", "#f59e0b", "#7c2d12", "#fdf3e4", {}),
        ("creme-hydratante-rose", "jar", "#fbcfe8", "#be185d", "#fbf0f4", {}),
        ("huile-figue-barbarie", "dropper", "#a21caf", "#3b0764", "#f6eef7", {}),
        ("gommage-cafe", "jar", "#78350f", "#d6a35c", "#f4ece2", {}),
        ("savon-nila", "soap", "#2563eb", "#1e3a8a", "#eaf0fb", {}),
        ("lait-corps-jasmin", "pump", "#fefce8", "#65a30d", "#f1f5e9", {}),
        ("masque-argile-verte", "tube", "#84a98c", "#2f3e46", "#eef3ef", {}),
        ("coffret-glow", "box", "#fbcfe8", "#b45372", "#f8eef1", {}),
    ],
    "deco": [
        ("assiettes-nabeul", "plate", "#f8fafc", "#1d4e89", "#e8eef6", {}),
        ("plat-service-terracotta", "plate", "#f4e4cf", "#b45309", "#f5ece2", {}),
        ("vase-sejnane", "vase", "#c2703d", "#1c1917", "#f3e9df", {}),
        ("vase-bleu-sidi-bou", "vase", "#1d4e89", "#f8fafc", "#e8eef6", {}),
        ("bougie-jasmin", "candle", "#fefce8", "#4d7c0f", "#eff3e8", {}),
        ("plateau-the-cuivre", "tray", "#b87333", "#7c2d12", "#f2e8de", {}),
        ("coussin-kilim", "cushion", "#b91c1c", "#fbbf24", "#f6ebe6", {}),
        ("bols-poterie", "bowls", "#e7d7c1", "#1d4e89", "#eef1f4", {}),
    ],
    "charme": [
        ("sac-noeud-foulard", "handbag", "#5b2333", "#d4af37", "#f1e9e4", {}),
        ("mini-sac-fleur", "minibag", "#c9b3d6", "#c9a14a", "#f3eef6", {}),
        ("cabas-toile", "tote", "#efe6d6", "#1a1a1a", "#ece6dc", {}),
        ("parure-papillon", "parure", "#c9a14a", "#b89ad6", "#f4eef2", {}),
        ("parure-coeur", "parure", "#b9bec7", "#e0a3ad", "#f1f1f3", {"pendant": "heart"}),
        ("collier-coeur", "necklace", "#c9a14a", "#c9a14a", "#f5efe6", {}),
        ("collier-initiale", "necklace", "#c9a14a", "#c9a14a", "#efeae4", {"pendant": "D"}),
        ("bracelet-perles", "bracelet", "#dcc9a6", "#b8924a", "#f1ebe2", {}),
        ("bracelet-trefle", "bracelet", "#c9a14a", "#1a1a1a", "#f3efe9", {"charm": "clover"}),
        ("porte-cle-fleur", "keyring", "#f3c6cf", "#c9a14a", "#f6eef0", {}),
        ("porte-cle-prenom", "keyring", "#1a1a1a", "#f3d27a", "#efebe5", {"kind": "DOHA"}),
    ],
    "terroir": [
        ("huile-olive-chemlali", "oil", "#4d7c0f", "#c9a14a", "#eef2e4", {}),
        ("huile-olive-bidon-5l", "oil", "#65a30d", "#3f6212", "#eef3e6", {"big": True}),
        ("dattes-deglet-nour", "dates", "#92400e", "#c9a14a", "#f5ede1", {}),
        ("dattes-fourrees", "box", "#78350f", "#c9a14a", "#f3ebe0", {}),
        ("miel-thym", "jar", "#d97706", "#78350f", "#fbf1e1", {}),
        ("harissa-artisanale", "jar", "#b91c1c", "#1c1917", "#f8ebe7", {"wide": 0.85}),
        ("bsissa-tradition", "jar", "#d6b98c", "#6b4f2a", "#f5efe4", {}),
        ("coffret-terroir", "box", "#e7d7c1", "#4d7c0f", "#f1f0e6", {}),
    ],
}

if __name__ == "__main__":
    n = 0
    for demo, items in PRODUCTS.items():
        out = os.path.join(HERE, demo, "assets")
        os.makedirs(out, exist_ok=True)
        for slug, shape, main, accent, bg, kw in items:
            body = SHAPES[shape](main, accent, **kw)
            for v in "ab":
                with open(os.path.join(out, f"{slug}-{v}.svg"), "w") as f:
                    f.write(svg(body, bg, v))
                n += 1
    print(n, "illustrations")
