<?php
declare(strict_types=1);

require APP_DIR . '/controllers/shop.php';
require APP_DIR . '/controllers/checkout.php';
require APP_DIR . '/controllers/admin.php';
require APP_DIR . '/controllers/admin_catalog.php';

/** Request path relative to the shop root, e.g. "/produit/sac-cuir". */
function current_path(): string
{
    static $path = null;
    if ($path !== null) {
        return $path;
    }
    if (isset($_GET['r']) && is_string($_GET['r'])) {
        $p = $_GET['r'];
    } else {
        $p = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
        $base = base_path();
        if ($base !== '' && str_starts_with($p, $base)) {
            $p = substr($p, strlen($base));
        }
        if (str_starts_with($p, '/index.php')) {
            $p = substr($p, strlen('/index.php'));
        }
    }
    $p = '/' . trim($p, '/');
    return $path = $p;
}

function routes(): array
{
    $slug = '([a-z0-9][a-z0-9-]*)';
    $num = '([A-Z0-9-]+)';
    $id = '(\d+)';
    return [
        // Boutique
        ['GET', '/', 'home_page'],
        ['GET', '/boutique', 'catalog_page'],
        ['GET', "/categorie/$slug", 'category_page'],
        ['GET', "/produit/$slug", 'product_page'],
        ['GET', '/recherche', 'search_page'],
        ['GET', "/page/$slug", 'cms_page'],
        ['GET|POST', '/contact', 'contact_page'],
        ['POST', '/newsletter', 'newsletter_subscribe'],
        ['GET', '/sitemap.xml', 'sitemap'],
        ['GET', '/robots.txt', 'robots'],

        // Panier & commande
        ['GET', '/panier', 'cart_page'],
        ['POST', '/panier/ajouter', 'cart_add'],
        ['POST', '/panier/modifier', 'cart_update'],
        ['POST', '/panier/coupon', 'cart_coupon_apply'],
        ['GET|POST', '/commande', 'checkout_page'],
        ['GET', "/commande/$num", 'order_page'],
        ['POST', "/commande/$num/payer", 'order_pay'],
        ['GET|POST', '/suivi', 'track_page'],

        // Paiements
        ['GET', '/paiement/stripe/retour', 'stripe_return'],
        ['GET', '/paiement/konnect/retour', 'konnect_return'],
        ['GET', '/paiement/flouci/retour', 'flouci_return'],
        ['POST', '/webhook/stripe', 'stripe_webhook'],
        ['GET|POST', '/webhook/konnect', 'konnect_webhook'],

        // Administration
        ['GET|POST', '/admin/connexion', 'admin_login'],
        ['POST', '/admin/deconnexion', 'admin_logout'],
        ['GET', '/admin', 'admin_dashboard'],
        ['GET', '/admin/commandes', 'admin_orders'],
        ['GET', '/admin/commandes/export', 'admin_orders_export'],
        ['GET|POST', "/admin/commandes/$id", 'admin_order'],
        ['GET', "/admin/commandes/$id/facture", 'admin_order_invoice'],
        ['GET', '/admin/produits', 'admin_products'],
        ['GET|POST', '/admin/produits/nouveau', 'admin_product_form'],
        ['GET|POST', "/admin/produits/$id", 'admin_product_form'],
        ['POST', "/admin/produits/$id/supprimer", 'admin_product_delete'],
        ['POST', "/admin/produits/$id/dupliquer", 'admin_product_duplicate'],
        ['GET|POST', '/admin/categories', 'admin_categories'],
        ['GET|POST', '/admin/coupons', 'admin_coupons'],
        ['GET|POST', '/admin/pages', 'admin_pages'],
        ['GET|POST', '/admin/messages', 'admin_messages'],
        ['GET', '/admin/clients', 'admin_customers'],
        ['GET|POST', '/admin/parametres', 'admin_settings'],
        ['GET|POST', '/admin/compte', 'admin_account'],
    ];
}

function dispatch(): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = current_path();
    if ($method === 'HEAD') {
        $method = 'GET';
    }
    $allowed = false;
    foreach (routes() as [$methods, $pattern, $handler]) {
        if (!preg_match('#^' . $pattern . '$#', $path, $m)) {
            continue;
        }
        if (!in_array($method, explode('|', $methods), true)) {
            $allowed = true;
            continue;
        }
        array_shift($m);
        $webhook = str_starts_with($path, '/webhook/');
        if ($method === 'POST' && !$webhook) {
            csrf_check();
        }
        if (str_starts_with($path, '/admin') && $handler !== 'admin_login') {
            require_admin();
        }
        $handler(...$m);
        return;
    }
    if ($allowed) {
        http_response_code(405);
        exit('Méthode non autorisée');
    }
    abort(404);
}
