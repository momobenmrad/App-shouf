<?php
declare(strict_types=1);

function active_categories(): array
{
    static $cats = null;
    return $cats ??= all(
        'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
         FROM categories c WHERE c.is_active = 1 ORDER BY c.position, c.name'
    );
}

function footer_pages(): array
{
    static $pages = null;
    return $pages ??= all('SELECT slug, title FROM pages WHERE is_active = 1 AND in_footer = 1 ORDER BY position, title');
}

function home_page(): void
{
    $featured = hydrate_products(all('SELECT * FROM products WHERE is_active = 1 AND is_featured = 1 ORDER BY updated_at DESC LIMIT 8'));
    $latest = hydrate_products(all('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC, id DESC LIMIT 8'));
    $bestsellers = hydrate_products(all('SELECT * FROM products WHERE is_active = 1 AND sales_count > 0 ORDER BY sales_count DESC LIMIT 4'));
    $categories = array_values(array_filter(active_categories(), fn($c) => $c['product_count'] > 0));
    foreach ($categories as &$c) {
        $c['cover'] = $c['image'] ?: val(
            'SELECT i.path FROM product_images i JOIN products p ON p.id = i.product_id
             WHERE p.category_id = :id AND p.is_active = 1 ORDER BY p.is_featured DESC, i.position LIMIT 1',
            ['id' => $c['id']]
        );
    }
    // Full rows only: 4 or 8 featured products, topped up with the latest ones.
    if (count($featured) % 4) {
        $ids = array_column($featured, 'id');
        foreach ($latest as $p) {
            if (count($featured) % 4 === 0) {
                break;
            }
            if (!in_array($p['id'], $ids, true)) {
                $featured[] = $p;
            }
        }
    }
    render('shop/home', [
        'title' => setting('meta_title') ?: setting('shop_name') . ' — ' . shop_text('shop_tagline'),
        'featured' => $featured,
        'latest' => $latest,
        'bestsellers' => $bestsellers,
        'categories' => array_slice($categories, 0, 6),
    ]);
}

/** Shared listing for the catalog, category and search pages. */
function product_listing(array $where, array $params): array
{
    $sorts = [
        'new' => 'p.created_at DESC, p.id DESC',
        'price_asc' => 'p.price ASC',
        'price_desc' => 'p.price DESC',
        'popular' => 'p.sales_count DESC, p.id DESC',
    ];
    $sort = isset($sorts[$_GET['sort'] ?? '']) ? $_GET['sort'] : 'new';
    $where[] = 'p.is_active = 1';
    if (!empty($_GET['promo'])) {
        $where[] = 'p.compare_price IS NOT NULL AND p.compare_price > p.price';
    }
    if (($min = parse_money($_GET['min'] ?? '')) > 0) {
        $where[] = 'p.price >= :min';
        $params['min'] = $min;
    }
    if (($max = parse_money($_GET['max'] ?? '')) > 0) {
        $where[] = 'p.price <= :max';
        $params['max'] = $max;
    }
    $sql = ' FROM products p WHERE ' . implode(' AND ', $where);
    $total = (int) val('SELECT COUNT(*)' . $sql, $params);
    $pager = paginate($total, max(4, (int) setting('products_per_page', 12)), (int) ($_GET['page'] ?? 1));
    $products = hydrate_products(all(
        'SELECT p.*' . $sql . ' ORDER BY ' . $sorts[$sort] . ' LIMIT ' . $pager['per_page'] . ' OFFSET ' . $pager['offset'],
        $params
    ));
    return ['products' => $products, 'pager' => $pager, 'sort' => $sort];
}

function catalog_page(): void
{
    render('shop/catalog', product_listing([], []) + [
        'title' => __('catalog.title') . ' — ' . setting('shop_name'),
        'heading' => __('catalog.title'),
        'category' => null,
    ]);
}

function category_page(string $slug): void
{
    $category = one('SELECT * FROM categories WHERE slug = :s AND is_active = 1', ['s' => $slug]);
    if (!$category) {
        abort(404);
    }
    $ids = [(int) $category['id']];
    foreach (all('SELECT id FROM categories WHERE parent_id = :id AND is_active = 1', ['id' => $category['id']]) as $child) {
        $ids[] = (int) $child['id'];
    }
    $params = [];
    $where = ['p.category_id IN ' . in_list($ids, $params, 'cat')];
    render('shop/catalog', product_listing($where, $params) + [
        'title' => $category['name'] . ' — ' . setting('shop_name'),
        'description' => str_limit((string) $category['description']),
        'heading' => $category['name'],
        'category' => $category,
    ]);
}

function search_page(): void
{
    $term = mb_substr(trim((string) ($_GET['q'] ?? '')), 0, 80);
    $where = [];
    $params = [];
    if ($term !== '') {
        $words = array_slice(preg_split('/\s+/u', $term) ?: [], 0, 5);
        foreach ($words as $i => $w) {
            $where[] = "(LOWER(p.name) LIKE :w{$i}a ESCAPE '!' OR LOWER(p.short_description) LIKE :w{$i}b ESCAPE '!' OR LOWER(p.sku) LIKE :w{$i}c ESCAPE '!')";
            $params["w{$i}a"] = $params["w{$i}b"] = $params["w{$i}c"] = like_param($w);
        }
    }
    render('shop/catalog', product_listing($where, $params) + [
        'title' => __('search.title', ['q' => $term]) . ' — ' . setting('shop_name'),
        'heading' => $term !== '' ? __('search.title', ['q' => $term]) : __('search.empty_heading'),
        'category' => null,
        'search' => $term,
        'robots' => 'noindex',
    ]);
}

function product_page(string $slug): void
{
    $product = one('SELECT * FROM products WHERE slug = :s AND is_active = 1', ['s' => $slug]);
    if (!$product) {
        abort(404);
    }
    [$product] = hydrate_products([$product]);
    $images = all('SELECT * FROM product_images WHERE product_id = :id ORDER BY position, id', ['id' => $product['id']]);
    $variants = all('SELECT * FROM product_variants WHERE product_id = :id ORDER BY position, id', ['id' => $product['id']]);
    $category = $product['category_id'] ? one('SELECT * FROM categories WHERE id = :id', ['id' => $product['category_id']]) : null;
    $related = hydrate_products(all(
        'SELECT * FROM products WHERE is_active = 1 AND id <> :id AND (category_id = :cat OR :cat2 IS NULL)
         ORDER BY is_featured DESC, sales_count DESC, id DESC LIMIT 4',
        ['id' => $product['id'], 'cat' => $product['category_id'], 'cat2' => $product['category_id']]
    ));
    render('shop/product', [
        'title' => ($product['meta_title'] ?: $product['name']) . ' — ' . setting('shop_name'),
        'description' => $product['meta_description'] ?: str_limit((string) ($product['short_description'] ?: $product['description'])),
        'og_image' => $product['cover'],
        'product' => $product,
        'images' => $images,
        'variants' => $variants,
        'category' => $category,
        'related' => $related,
    ]);
}

function cms_page(string $slug): void
{
    $page = one('SELECT * FROM pages WHERE slug = :s AND is_active = 1', ['s' => $slug]);
    if (!$page) {
        abort(404);
    }
    render('shop/page', ['title' => $page['title'] . ' — ' . setting('shop_name'), 'page' => $page, 'description' => str_limit((string) $page['content'])]);
}

function contact_page(): void
{
    $errors = [];
    if (is_post()) {
        $data = [
            'name' => mb_substr((string) input('name'), 0, 190),
            'email' => mb_substr((string) input('email'), 0, 190),
            'phone' => mb_substr((string) input('phone'), 0, 40),
            'subject' => mb_substr((string) input('subject'), 0, 190),
            'body' => mb_substr((string) input('message'), 0, 5000),
        ];
        if (input('website') !== '') { // honeypot
            redirect(url('/contact'));
        }
        if ($data['name'] === '') {
            $errors['name'] = __('form.required');
        }
        if (!valid_email($data['email'])) {
            $errors['email'] = __('form.invalid_email');
        }
        if (mb_strlen($data['body']) < 5) {
            $errors['message'] = __('form.required');
        }
        if (!$errors) {
            insert('messages', $data + ['created_at' => now()]);
            $notify = setting('notify_email') ?: setting('shop_email');
            if ($notify) {
                try {
                    send_mail($notify, 'Nouveau message : ' . ($data['subject'] ?: $data['name']), mail_view('emails/contact', ['m' => $data]), $data['email']);
                } catch (Throwable $e) {
                    error_log('Contact mail failed: ' . $e->getMessage());
                }
            }
            flash('success', __('contact.sent'));
            redirect(url('/contact'));
        }
        remember_input($_POST);
    }
    render('shop/contact', ['title' => __('contact.title') . ' — ' . setting('shop_name'), 'errors' => $errors]);
}

function newsletter_subscribe(): void
{
    $email = mb_strtolower((string) input('email'));
    if (valid_email($email) && !val('SELECT id FROM newsletter WHERE email = :e', ['e' => $email])) {
        insert('newsletter', ['email' => $email, 'created_at' => now()]);
    }
    if (wants_json()) {
        json_response(['ok' => valid_email($email), 'message' => valid_email($email) ? __('newsletter.thanks') : __('form.invalid_email')]);
    }
    flash(valid_email($email) ? 'success' : 'error', valid_email($email) ? __('newsletter.thanks') : __('form.invalid_email'));
    back();
}

function sitemap(): void
{
    header('Content-Type: application/xml; charset=utf-8');
    $urls = [[abs_url('/'), null], [abs_url('/boutique'), null]];
    foreach (active_categories() as $c) {
        $urls[] = [abs_url('/categorie/' . $c['slug']), null];
    }
    foreach (all('SELECT slug, updated_at FROM products WHERE is_active = 1') as $p) {
        $urls[] = [abs_url('/produit/' . $p['slug']), substr($p['updated_at'], 0, 10)];
    }
    foreach (all('SELECT slug, updated_at FROM pages WHERE is_active = 1') as $p) {
        $urls[] = [abs_url('/page/' . $p['slug']), substr($p['updated_at'], 0, 10)];
    }
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as [$loc, $mod]) {
        echo '  <url><loc>' . e($loc) . '</loc>' . ($mod ? '<lastmod>' . e($mod) . '</lastmod>' : '') . "</url>\n";
    }
    echo '</urlset>';
}

function robots(): void
{
    header('Content-Type: text/plain; charset=utf-8');
    echo "User-agent: *\nDisallow: /admin\nDisallow: /panier\nDisallow: /commande\nDisallow: /recherche\n\nSitemap: " . abs_url('/sitemap.xml') . "\n";
}
