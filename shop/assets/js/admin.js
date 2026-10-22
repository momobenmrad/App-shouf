/* Boutique — administration helpers */
(() => {
    'use strict';
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    // Mobile sidebar
    const sidebar = $('#sidebar');
    $('[data-sidebar-toggle]')?.addEventListener('click', (e) => {
        const open = sidebar.classList.toggle('is-open');
        e.currentTarget.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
        if (sidebar?.classList.contains('is-open') && !sidebar.contains(e.target) && !e.target.closest('[data-sidebar-toggle]')) {
            sidebar.classList.remove('is-open');
        }
    });

    // Confirmation for destructive actions
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-confirm]');
        if (btn && !window.confirm(btn.dataset.confirm)) e.preventDefault();
    });

    // Clickable table rows
    document.addEventListener('click', (e) => {
        const row = e.target.closest('tr[data-href]');
        if (row && !e.target.closest('a, button, input, select, label')) window.location = row.dataset.href;
    });

    // Select all
    $('[data-check-all]')?.addEventListener('change', (e) => {
        $$('input[name="ids[]"]').forEach((c) => { c.checked = e.target.checked; });
    });

    // Variants editor
    const tbody = $('[data-variants]');
    const tpl = $('[data-variant-template]');
    let index = tbody ? tbody.children.length + 1000 : 0;
    $('[data-add-variant]')?.addEventListener('click', () => {
        const html = tpl.innerHTML.replaceAll('__i__', String(index++));
        tbody.insertAdjacentHTML('beforeend', html);
        tbody.lastElementChild.querySelector('input:not([type=hidden])')?.focus();
    });
    tbody?.addEventListener('click', (e) => {
        if (e.target.closest('[data-remove-row]')) e.target.closest('tr').remove();
    });

    // Slug preview from the product name (only while the slug field is empty)
    const slugSource = $('[data-slug-source]');
    const slugTarget = $('[data-slug-target]');
    if (slugSource && slugTarget && !slugTarget.value) {
        slugTarget.placeholder = 'généré automatiquement';
        slugSource.addEventListener('input', () => {
            slugTarget.placeholder = slugSource.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
                .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'généré automatiquement';
        });
    }

    // Image previews before upload
    const fileInput = $('[data-preview]');
    const previewTarget = $('[data-preview-target]');
    fileInput?.addEventListener('change', () => {
        previewTarget.innerHTML = '';
        Array.from(fileInput.files).forEach((f) => {
            if (!f.type.startsWith('image/')) return;
            const div = document.createElement('div');
            div.className = 'preview-item';
            const img = document.createElement('img');
            img.src = URL.createObjectURL(f);
            img.alt = '';
            div.appendChild(img);
            previewTarget.appendChild(div);
        });
    });
    const dropzone = fileInput?.closest('.dropzone');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('is-over'); }));
        ['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, () => dropzone.classList.remove('is-over')));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer?.files.length) {
                fileInput.files = e.dataTransfer.files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }

    // Drag to reorder existing images
    const sortable = $('[data-sortable]');
    if (sortable) {
        let dragged = null;
        sortable.addEventListener('dragstart', (e) => {
            dragged = e.target.closest('li');
            dragged?.classList.add('is-dragging');
        });
        sortable.addEventListener('dragend', () => { dragged?.classList.remove('is-dragging'); dragged = null; });
        sortable.addEventListener('dragover', (e) => {
            e.preventDefault();
            const over = e.target.closest('li');
            if (!dragged || !over || over === dragged) return;
            const rect = over.getBoundingClientRect();
            const after = (e.clientX - rect.left) > rect.width / 2;
            over.parentNode.insertBefore(dragged, after ? over.nextSibling : over);
        });
    }

    // Warn before leaving a modified form
    $$('form#product-form, form.settings-form').forEach((form) => {
        let dirty = false;
        form.addEventListener('input', () => { dirty = true; });
        form.addEventListener('submit', () => { dirty = false; });
        window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    });
})();
