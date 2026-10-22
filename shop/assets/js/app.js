/* Boutique — progressive enhancement. Every feature works without JavaScript; scripts only make it smoother. */
(() => {
    'use strict';
    const SHOP = window.SHOP || { i18n: {}, money: { decimals: 3, symbol: 'DT', position: 'after' } };
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const formatMoney = (minor) => {
        const { decimals, symbol, position } = SHOP.money;
        const n = (minor / 10 ** decimals).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        return position === 'before' ? `${symbol} ${n}` : `${n} ${symbol}`;
    };
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* ---------------------------------------------------------- header & drawer */

    const header = $('[data-header]');
    if (header) {
        const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    const drawer = $('[data-drawer]');
    let lastFocus = null;
    const openDrawer = (focusSearch) => {
        if (!drawer) return;
        lastFocus = document.activeElement;
        drawer.hidden = false;
        document.body.style.overflow = 'hidden';
        $$('[data-drawer-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
        (focusSearch ? $('#q-drawer', drawer) : $('[data-drawer-close].icon-btn', drawer))?.focus();
    };
    const closeDrawer = () => {
        if (!drawer || drawer.hidden) return;
        drawer.hidden = true;
        document.body.style.overflow = '';
        $$('[data-drawer-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        lastFocus?.focus();
    };
    $$('[data-drawer-open]').forEach((b) => b.addEventListener('click', () => openDrawer(b.hasAttribute('data-focus-search'))));
    $$('[data-drawer-close]').forEach((b) => b.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDrawer();
            $$('details.lang-switch[open]').forEach((d) => d.removeAttribute('open'));
        }
    });
    document.addEventListener('click', (e) => {
        $$('details.lang-switch[open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open'); });
    });

    /* ---------------------------------------------------------- quantity steppers & autosubmit */

    document.addEventListener('click', (e) => {
        const step = e.target.closest('[data-qty-step]');
        if (!step) return;
        const input = $('input', step.closest('[data-qty]'));
        const min = Number(input.min || 1);
        const max = Number(input.max || 99);
        const next = Math.min(max, Math.max(min, (Number(input.value) || min) + Number(step.dataset.qtyStep)));
        if (next !== Number(input.value)) {
            input.value = next;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    let autoTimer;
    document.addEventListener('change', (e) => {
        const el = e.target.closest('[data-autosubmit]');
        if (!el) return;
        clearTimeout(autoTimer);
        autoTimer = setTimeout(() => el.form.requestSubmit ? el.form.requestSubmit() : el.form.submit(), el.tagName === 'SELECT' ? 0 : 450);
    });

    /* ---------------------------------------------------------- toasts */

    const toasts = $('[data-toasts]');
    const showToast = (html, className = '', ttl = 5000) => {
        if (!toasts) return;
        const t = document.createElement('div');
        t.className = `toast ${className}`;
        t.innerHTML = html;
        toasts.appendChild(t);
        const remove = () => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 250); };
        const timer = setTimeout(remove, ttl);
        t.addEventListener('mouseenter', () => clearTimeout(timer), { once: true });
        t.addEventListener('mouseleave', () => setTimeout(remove, 1500), { once: true });
    };
    const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

    const updateCartCount = (count) => {
        $$('[data-cart-count]').forEach((el) => {
            el.textContent = count;
            el.hidden = !count;
            el.classList.remove('bump');
            void el.offsetWidth;
            el.classList.add('bump');
        });
    };

    /* ---------------------------------------------------------- add to cart */

    document.addEventListener('submit', async (e) => {
        const form = e.target.closest('[data-add-to-cart]');
        if (!form) return;
        const buyNow = e.submitter && e.submitter.name === 'buy_now';

        // Variant must be chosen.
        const variants = $$('input[name="variant_id"]', form);
        if (variants.length && !variants.some((v) => v.checked)) {
            e.preventDefault();
            const err = $('[data-variant-error]', form);
            if (err) { err.hidden = false; }
            $('.variant-picker', form)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        if (buyNow || !window.fetch) return; // regular POST → redirect to checkout

        e.preventDefault();
        const btn = e.submitter || $('button[type="submit"]', form);
        btn?.classList.add('is-loading');
        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || SHOP.i18n.error);
            updateCartCount(data.count);
            showToast(
                `<img src="${escapeHtml(data.item.image)}" alt="">
                 <div><p class="toast-title">${check}${escapeHtml(SHOP.i18n.added)}</p>
                 <p class="toast-name">${escapeHtml(data.item.qty)} × ${escapeHtml(data.item.name)} — ${escapeHtml(data.item.price)}</p></div>
                 <div class="toast-actions">
                    <a class="btn btn-outline btn-sm" href="${escapeHtml(SHOP.cartUrl)}">${escapeHtml(SHOP.i18n.viewCart)}</a>
                    <a class="btn btn-primary btn-sm" href="${escapeHtml(SHOP.checkoutUrl)}">${escapeHtml(SHOP.i18n.checkout)}</a>
                 </div>`
            );
            if (window.fbq) window.fbq('track', 'AddToCart');
            if (window.gtag) window.gtag('event', 'add_to_cart');
        } catch (err) {
            showToast(`<p>${escapeHtml(err.message || SHOP.i18n.error)}</p>`, 'toast-error', 4000);
        } finally {
            btn?.classList.remove('is-loading');
        }
    });

    /* ---------------------------------------------------------- variant picker */

    $$('form[data-variants]').forEach((form) => {
        let data = [];
        try { data = JSON.parse(form.dataset.variants || '[]'); } catch { /* ignore */ }
        if (!data.length) return;
        const low = Number(form.dataset.low || 3);
        const status = $('[data-stock-status]', form);
        const qty = $('input[name="qty"]', form);
        const label = $('[data-variant-label]', form);
        const prices = $$('[data-price]');

        const apply = (radio) => {
            const v = data.find((d) => String(d.id) === radio.value);
            if (!v) return;
            prices.forEach((p) => { p.textContent = v.price; });
            if (label) label.textContent = `: ${radio.dataset.name}`;
            const err = $('[data-variant-error]', form);
            if (err) err.hidden = true;
            if (qty) {
                qty.max = v.stock === null ? 99 : Math.max(1, Math.min(99, v.stock));
                if (Number(qty.value) > Number(qty.max)) qty.value = qty.max;
            }
            if (status && v.stock !== null && v.stock <= low) {
                status.innerHTML = `<span class="dot dot-low"></span>${escapeHtml((SHOP.i18n.onlyLeft || '').replace(':qty', v.stock))}`;
            } else if (status) {
                status.innerHTML = `<span class="dot dot-in"></span>${escapeHtml(SHOP.i18n.inStock || '')}`;
            }
        };
        $$('input[name="variant_id"]', form).forEach((r) => {
            r.addEventListener('change', () => apply(r));
            if (r.checked) apply(r);
        });
    });

    /* ---------------------------------------------------------- gallery */

    $$('[data-gallery]').forEach((g) => {
        const main = $('[data-gallery-main]', g);
        const thumbs = $$('[data-gallery-thumb]', g);
        thumbs.forEach((t) => t.addEventListener('click', () => {
            thumbs.forEach((x) => x.removeAttribute('aria-current'));
            t.setAttribute('aria-current', 'true');
            main.style.opacity = '.4';
            const img = new Image();
            img.onload = () => { main.src = t.dataset.galleryThumb; main.style.opacity = '1'; };
            img.src = t.dataset.galleryThumb;
        }));
        // Swipe between images on touch screens.
        let x0 = null;
        main.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
        main.addEventListener('touchend', (e) => {
            if (x0 === null || thumbs.length < 2) return;
            const dx = e.changedTouches[0].clientX - x0;
            x0 = null;
            if (Math.abs(dx) < 40) return;
            const rtl = document.documentElement.dir === 'rtl';
            const i = thumbs.findIndex((t) => t.hasAttribute('aria-current'));
            const dir = (dx < 0) !== rtl ? 1 : -1;
            thumbs[(i + dir + thumbs.length) % thumbs.length].click();
        });
    });

    /* ---------------------------------------------------------- sticky buy bar (mobile) */

    const sticky = $('[data-sticky-buy]');
    const buyBox = $('.buy-box');
    if (sticky && buyBox && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(([entry]) => {
            sticky.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0 || window.innerWidth > 860;
        });
        io.observe(buyBox);
        $('[data-sticky-submit]', sticky)?.addEventListener('click', () => {
            const submit = $('button[type="submit"]:not([name])', buyBox);
            if ($$('input[name="variant_id"]', buyBox).length && !$('input[name="variant_id"]:checked', buyBox)) {
                buyBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const err = $('[data-variant-error]', buyBox);
                if (err) err.hidden = false;
                return;
            }
            buyBox.requestSubmit ? buyBox.requestSubmit(submit) : submit.click();
        });
    }

    /* ---------------------------------------------------------- checkout */

    const checkout = $('[data-checkout]');
    if (checkout) {
        const total = $('[data-total]', checkout);
        const feeRow = $('[data-fee-row]', checkout);
        $$('input[name="payment_method"]', checkout).forEach((r) => r.addEventListener('change', () => {
            const fee = Number(r.dataset.fee || 0);
            if (feeRow) {
                feeRow.hidden = fee === 0;
                $('[data-fee]', feeRow).textContent = formatMoney(fee);
            }
            if (total) total.textContent = formatMoney(Number(total.dataset.base) + fee);
        }));
        $('[data-focus]', checkout)?.focus();
        const firstError = $('[aria-invalid="true"]', checkout);
        if (firstError) firstError.focus();
    }

    $$('[data-submit-once]').forEach((btn) => {
        btn.form?.addEventListener('submit', () => {
            setTimeout(() => btn.classList.add('is-loading'), 0);
        });
    });

    /* ---------------------------------------------------------- newsletter */

    $$('[data-newsletter]').forEach((form) => form.addEventListener('submit', async (e) => {
        if (!window.fetch) return;
        e.preventDefault();
        const msg = $('[data-newsletter-msg]', form.parentElement);
        try {
            const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            const data = await res.json();
            if (msg) { msg.textContent = data.message; msg.style.color = data.ok ? '' : 'var(--danger)'; }
            if (data.ok) form.reset();
        } catch {
            form.submit();
        }
    }));
})();
