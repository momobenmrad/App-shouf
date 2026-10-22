<?php
declare(strict_types=1);

function unique_slug(string $table, string $base, ?int $exceptId = null): string
{
    $slug = slugify($base);
    $candidate = $slug;
    for ($i = 2; ; $i++) {
        $exists = val("SELECT id FROM $table WHERE slug = :s" . ($exceptId ? ' AND id <> :id' : ''), $exceptId ? ['s' => $candidate, 'id' => $exceptId] : ['s' => $candidate]);
        if (!$exists) {
            return $candidate;
        }
        $candidate = $slug . '-' . $i;
    }
}

/** "" → null (stock not tracked), otherwise a non-negative integer. */
function nullable_int(mixed $v): ?int
{
    return $v === null || trim((string) $v) === '' ? null : max(0, (int) $v);
}

// ---------------------------------------------------------------- products

function admin_products(): void
{
    if (is_post() && input('bulk')) {
        $ids = array_map('intval', (array) ($_POST['ids'] ?? []));
        if ($ids) {
            $params = [];
            $in = in_list($ids, $params);
            match (input('bulk')) {
                'activate' => q("UPDATE products SET is_active = 1 WHERE id IN $in", $params),
                'deactivate' => q("UPDATE products SET is_active = 0 WHERE id IN $in", $params),
                'feature' => q("UPDATE products SET is_featured = 1 WHERE id IN $in", $params),
                'unfeature' => q("UPDATE products SET is_featured = 0 WHERE id IN $in", $params),
                default => null,
            };
            flash('success', count($ids) . ' produit(s) mis à jour.');
        }
        back('/admin/produits');
    }
    $where = ['1 = 1'];
    $params = [];
    if (($term = trim((string) ($_GET['q'] ?? ''))) !== '') {
        $where[] = "(LOWER(p.name) LIKE :q1 ESCAPE '!' OR LOWER(p.sku) LIKE :q2 ESCAPE '!')";
        $params['q1'] = $params['q2'] = like_param($term);
    }
    if (!empty($_GET['cat'])) {
        $where[] = 'p.category_id = :cat';
        $params['cat'] = (int) $_GET['cat'];
    }
    if (($_GET['state'] ?? '') === 'inactive') {
        $where[] = 'p.is_active = 0';
    } elseif (($_GET['state'] ?? '') === 'out') {
        $where[] = '((p.stock IS NOT NULL AND p.stock <= 0) OR EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.stock IS NOT NULL AND v.stock <= 0))';
    }
    $w = implode(' AND ', $where);
    $total = (int) val("SELECT COUNT(*) FROM products p WHERE $w", $params);
    $pager = paginate($total, 30, (int) ($_GET['page'] ?? 1));
    $products = hydrate_products(all(
        "SELECT p.*, c.name AS category_name,
                (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS variant_count,
                (SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = p.id) AS variant_stock
         FROM products p LEFT JOIN categories c ON c.id = p.category_id
         WHERE $w ORDER BY p.id DESC LIMIT {$pager['per_page']} OFFSET {$pager['offset']}",
        $params
    ));
    render('admin/products', [
        'title' => 'Produits',
        'products' => $products,
        'pager' => $pager,
        'categories' => all('SELECT id, name FROM categories ORDER BY position, name'),
    ]);
}

function admin_product_form(?string $id = null): void
{
    $product = $id ? (one('SELECT * FROM products WHERE id = :id', ['id' => (int) $id]) ?? abort(404)) : null;
    $errors = [];
    if (is_post()) {
        $data = [
            'name' => mb_substr((string) input('name'), 0, 190),
            'category_id' => (int) input('category_id') ?: null,
            'sku' => mb_substr((string) input('sku'), 0, 80) ?: null,
            'short_description' => mb_substr((string) input('short_description'), 0, 500) ?: null,
            'description' => (string) input('description') ?: null,
            'price' => parse_money(input('price')),
            'compare_price' => parse_money(input('compare_price')) ?: null,
            'stock' => nullable_int(input('stock')),
            'option_label' => mb_substr((string) input('option_label'), 0, 80) ?: null,
            'is_active' => input('is_active') ? 1 : 0,
            'is_featured' => input('is_featured') ? 1 : 0,
            'meta_title' => mb_substr((string) input('meta_title'), 0, 190) ?: null,
            'meta_description' => mb_substr((string) input('meta_description'), 0, 300) ?: null,
            'updated_at' => now(),
        ];
        if ($data['name'] === '') {
            $errors['name'] = 'Le nom est obligatoire.';
        }
        if ($data['price'] <= 0) {
            $errors['price'] = 'Indiquez un prix.';
        }
        $slugInput = trim((string) input('slug'));
        if (!$errors) {
            $data['slug'] = unique_slug('products', $slugInput !== '' ? $slugInput : $data['name'], $product ? (int) $product['id'] : null);
            $productId = transaction(function () use ($product, $data) {
                if ($product) {
                    update('products', $data, 'id = :id', ['id' => $product['id']]);
                    $pid = (int) $product['id'];
                } else {
                    $pid = insert('products', $data + ['created_at' => now()]);
                }
                save_variants($pid, (array) ($_POST['variants'] ?? []));
                return $pid;
            });
            try {
                save_product_images($productId);
            } catch (RuntimeException $e) {
                flash('error', $e->getMessage());
            }
            flash('success', $product ? 'Produit mis à jour.' : 'Produit créé.');
            redirect(url('/admin/produits/' . $productId));
        }
        remember_input($_POST);
    }
    render('admin/product_form', [
        'title' => $product ? $product['name'] : 'Nouveau produit',
        'product' => $product,
        'images' => $product ? all('SELECT * FROM product_images WHERE product_id = :id ORDER BY position, id', ['id' => $product['id']]) : [],
        'variants' => $product ? all('SELECT * FROM product_variants WHERE product_id = :id ORDER BY position, id', ['id' => $product['id']]) : [],
        'categories' => all('SELECT id, name, parent_id FROM categories ORDER BY position, name'),
        'errors' => $errors,
    ]);
}

/** Syncs variant rows posted as variants[i][id|name|sku|price|stock]; rows without a name are deleted. */
function save_variants(int $productId, array $rows): void
{
    $keep = [];
    $pos = 0;
    foreach ($rows as $row) {
        $name = mb_substr(trim((string) ($row['name'] ?? '')), 0, 120);
        if ($name === '') {
            continue;
        }
        $data = [
            'name' => $name,
            'sku' => mb_substr(trim((string) ($row['sku'] ?? '')), 0, 80) ?: null,
            'price' => trim((string) ($row['price'] ?? '')) === '' ? null : parse_money($row['price']),
            'stock' => nullable_int($row['stock'] ?? null),
            'position' => $pos++,
        ];
        $vid = (int) ($row['id'] ?? 0);
        if ($vid && val('SELECT id FROM product_variants WHERE id = :id AND product_id = :p', ['id' => $vid, 'p' => $productId])) {
            update('product_variants', $data, 'id = :id', ['id' => $vid]);
            $keep[] = $vid;
        } else {
            $keep[] = insert('product_variants', $data + ['product_id' => $productId]);
        }
    }
    $params = ['p' => $productId];
    $sql = 'DELETE FROM product_variants WHERE product_id = :p';
    if ($keep) {
        $sql .= ' AND id NOT IN ' . in_list($keep, $params, 'k');
    }
    q($sql, $params);
}

function save_product_images(int $productId): void
{
    foreach ((array) ($_POST['delete_images'] ?? []) as $imgId) {
        $img = one('SELECT * FROM product_images WHERE id = :id AND product_id = :p', ['id' => (int) $imgId, 'p' => $productId]);
        if ($img) {
            delete_upload($img['path']);
            q('DELETE FROM product_images WHERE id = :id', ['id' => $img['id']]);
        }
    }
    foreach ((array) ($_POST['image_order'] ?? []) as $pos => $imgId) {
        q('UPDATE product_images SET position = :pos WHERE id = :id AND product_id = :p', ['pos' => (int) $pos, 'id' => (int) $imgId, 'p' => $productId]);
    }
    $next = (int) val('SELECT COALESCE(MAX(position), -1) + 1 FROM product_images WHERE product_id = :p', ['p' => $productId]);
    foreach (uploaded_files('images') as $file) {
        if ($path = store_upload($file)) {
            insert('product_images', ['product_id' => $productId, 'path' => $path, 'position' => $next++]);
        }
    }
}

function admin_product_delete(string $id): void
{
    $pid = (int) $id;
    foreach (all('SELECT path FROM product_images WHERE product_id = :id', ['id' => $pid]) as $img) {
        delete_upload($img['path']);
    }
    transaction(function () use ($pid) {
        q('DELETE FROM product_images WHERE product_id = :id', ['id' => $pid]);
        q('DELETE FROM product_variants WHERE product_id = :id', ['id' => $pid]);
        q('DELETE FROM products WHERE id = :id', ['id' => $pid]);
    });
    flash('success', 'Produit supprimé.');
    redirect(url('/admin/produits'));
}

function admin_product_duplicate(string $id): void
{
    $p = one('SELECT * FROM products WHERE id = :id', ['id' => (int) $id]) ?? abort(404);
    $newId = transaction(function () use ($p) {
        $copy = $p;
        unset($copy['id']);
        $copy['name'] = $p['name'] . ' (copie)';
        $copy['slug'] = unique_slug('products', $p['slug'] . '-copie');
        $copy['is_active'] = 0;
        $copy['sales_count'] = 0;
        $copy['created_at'] = $copy['updated_at'] = now();
        $newId = insert('products', $copy);
        foreach (all('SELECT * FROM product_variants WHERE product_id = :id', ['id' => $p['id']]) as $v) {
            unset($v['id']);
            insert('product_variants', ['product_id' => $newId] + $v);
        }
        // Images are shared by path; deleting the copy only removes upload files no longer referenced.
        foreach (all('SELECT * FROM product_images WHERE product_id = :id', ['id' => $p['id']]) as $img) {
            if (str_starts_with($img['path'], 'uploads/')) {
                $ext = pathinfo($img['path'], PATHINFO_EXTENSION);
                $newPath = 'uploads/' . date('Y/m') . '/' . random_token(8) . '.' . $ext;
                @mkdir(UPLOAD_DIR . '/' . date('Y/m'), 0755, true);
                if (!@copy(ROOT_DIR . '/' . $img['path'], ROOT_DIR . '/' . $newPath)) {
                    continue;
                }
                $img['path'] = $newPath;
            }
            unset($img['id']);
            insert('product_images', ['product_id' => $newId] + $img);
        }
        return $newId;
    });
    flash('success', 'Produit dupliqué (désactivé en attendant votre relecture).');
    redirect(url('/admin/produits/' . $newId));
}

// ---------------------------------------------------------------- categories

function admin_categories(): void
{
    if (is_post()) {
        $action = (string) input('action');
        $id = (int) input('id');
        if ($action === 'delete') {
            q('UPDATE products SET category_id = NULL WHERE category_id = :id', ['id' => $id]);
            q('UPDATE categories SET parent_id = NULL WHERE parent_id = :id', ['id' => $id]);
            $img = val('SELECT image FROM categories WHERE id = :id', ['id' => $id]);
            delete_upload($img);
            q('DELETE FROM categories WHERE id = :id', ['id' => $id]);
            flash('success', 'Catégorie supprimée. Ses produits sont désormais « sans catégorie ».');
            redirect(url('/admin/categories'));
        }
        $name = mb_substr((string) input('name'), 0, 190);
        if ($name === '') {
            flash('error', 'Le nom est obligatoire.');
            redirect(url('/admin/categories', ['edit' => $id ?: null]));
        }
        $parent = (int) input('parent_id') ?: null;
        $data = [
            'name' => $name,
            'slug' => unique_slug('categories', (string) input('slug') ?: $name, $id ?: null),
            'description' => (string) input('description') ?: null,
            'parent_id' => $parent && $parent !== $id ? $parent : null,
            'position' => (int) input('position'),
            'is_active' => input('is_active') ? 1 : 0,
        ];
        try {
            if ($path = store_upload($_FILES['image'] ?? ['error' => UPLOAD_ERR_NO_FILE], 1200)) {
                if ($id) {
                    delete_upload(val('SELECT image FROM categories WHERE id = :id', ['id' => $id]));
                }
                $data['image'] = $path;
            }
        } catch (RuntimeException $e) {
            flash('error', $e->getMessage());
        }
        if ($id) {
            update('categories', $data, 'id = :id', ['id' => $id]);
        } else {
            insert('categories', $data + ['created_at' => now()]);
        }
        flash('success', 'Catégorie enregistrée.');
        redirect(url('/admin/categories'));
    }
    $edit = !empty($_GET['edit']) ? one('SELECT * FROM categories WHERE id = :id', ['id' => (int) $_GET['edit']]) : null;
    render('admin/categories', [
        'title' => 'Catégories',
        'categories' => all('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count FROM categories c ORDER BY c.position, c.name'),
        'edit' => $edit,
    ]);
}

// ---------------------------------------------------------------- coupons

function admin_coupons(): void
{
    if (is_post()) {
        $id = (int) input('id');
        if (input('action') === 'delete') {
            q('DELETE FROM coupons WHERE id = :id', ['id' => $id]);
            flash('success', 'Code promo supprimé.');
            redirect(url('/admin/coupons'));
        }
        $code = mb_strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string) input('code')) ?? '');
        $type = input('type') === 'fixed' ? 'fixed' : 'percent';
        $value = $type === 'percent' ? max(1, min(100, (int) input('value'))) : parse_money(input('value'));
        if ($code === '' || $value <= 0) {
            flash('error', 'Code et valeur obligatoires.');
            redirect(url('/admin/coupons'));
        }
        if (val('SELECT id FROM coupons WHERE UPPER(code) = :c AND id <> :id', ['c' => $code, 'id' => $id])) {
            flash('error', 'Ce code existe déjà.');
            redirect(url('/admin/coupons'));
        }
        $expires = trim((string) input('expires_at'));
        $data = [
            'code' => $code,
            'type' => $type,
            'value' => $value,
            'min_total' => parse_money(input('min_total')),
            'max_uses' => nullable_int(input('max_uses')),
            'expires_at' => preg_match('/^\d{4}-\d{2}-\d{2}$/', $expires) ? $expires . ' 23:59:59' : null,
            'is_active' => input('is_active') ? 1 : 0,
        ];
        if ($id) {
            update('coupons', $data, 'id = :id', ['id' => $id]);
        } else {
            insert('coupons', $data + ['created_at' => now()]);
        }
        flash('success', 'Code promo enregistré.');
        redirect(url('/admin/coupons'));
    }
    $edit = !empty($_GET['edit']) ? one('SELECT * FROM coupons WHERE id = :id', ['id' => (int) $_GET['edit']]) : null;
    render('admin/coupons', ['title' => 'Codes promo', 'coupons' => all('SELECT * FROM coupons ORDER BY id DESC'), 'edit' => $edit]);
}

// ---------------------------------------------------------------- pages

function admin_pages(): void
{
    if (is_post()) {
        $id = (int) input('id');
        if (input('action') === 'delete') {
            q('DELETE FROM pages WHERE id = :id', ['id' => $id]);
            flash('success', 'Page supprimée.');
            redirect(url('/admin/pages'));
        }
        $title = mb_substr((string) input('title'), 0, 190);
        if ($title === '') {
            flash('error', 'Le titre est obligatoire.');
            redirect(url('/admin/pages', ['edit' => $id ?: 'new']));
        }
        $data = [
            'title' => $title,
            'slug' => unique_slug('pages', (string) input('slug') ?: $title, $id ?: null),
            'content' => (string) input('content'),
            'in_footer' => input('in_footer') ? 1 : 0,
            'is_active' => input('is_active') ? 1 : 0,
            'position' => (int) input('position'),
            'updated_at' => now(),
        ];
        if ($id) {
            update('pages', $data, 'id = :id', ['id' => $id]);
        } else {
            $id = insert('pages', $data);
        }
        flash('success', 'Page enregistrée.');
        redirect(url('/admin/pages', ['edit' => $id]));
    }
    $editId = $_GET['edit'] ?? null;
    $edit = $editId === 'new' ? [] : ($editId ? one('SELECT * FROM pages WHERE id = :id', ['id' => (int) $editId]) : null);
    render('admin/pages', ['title' => 'Pages', 'pages' => all('SELECT * FROM pages ORDER BY position, title'), 'edit' => $edit]);
}
