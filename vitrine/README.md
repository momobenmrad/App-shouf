# Démos Flownova (page vitrine)

Static page listing the sector demo shops (served by Render as the static site `flownova-demos`, publish
path `vitrine/`). Each demo is a Render web service built from `shop/demo/Dockerfile` with `DEMO=<folder>`:

| Sector | Shop | Service | `DEMO` |
|---|---|---|---|
| Bijoux | Maison Saphir | flownova-bijoux | saphir |
| Mode femme | Yasmine Couture | flownova-mode | mode |
| Beauté | Nour Cosmetics | flownova-beaute | beaute |
| Déco | Dar Zina | flownova-deco | deco |
| Terroir | Zitouna Terroir | flownova-terroir | terroir |
| Cadeaux | Lina Gifts | flownova-coffrets | coffrets |

- WhatsApp number: the `WHATSAPP` constant at the top of the script in `index.html`.
- Screens (`img/<demo>.webp`): mobile home page of each demo, 600 px wide, captured with Playwright.
- Product illustrations of the new demos: `python3 shop/demo/make_svgs.py`.

## Mini-page catalogue (`mini/`)

Entry offer demo, served at `/mini/`: one static page for a fictional seller ("Amira Boutique") with the
products and prices, a size/quantity sheet and a pre-filled WhatsApp order. Everything a seller changes is
in the constants at the top of the script (`SHOP`, `WHATSAPP`, `SHIPPING`, `CATS`, `PRODUCTS`).
