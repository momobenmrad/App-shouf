<?php
declare(strict_types=1);

function current_admin(): ?array
{
    static $admin = false;
    if ($admin === false) {
        $admin = !empty($_SESSION['admin_id']) ? one('SELECT * FROM admins WHERE id = :id', ['id' => $_SESSION['admin_id']]) : null;
    }
    return $admin;
}

function require_admin(): void
{
    if (!current_admin()) {
        redirect(url('/admin/connexion', ['next' => current_path() !== '/admin' ? current_path() : null]));
    }
    header('X-Frame-Options: SAMEORIGIN');
    header('Cache-Control: no-store');
}

function admin_login(): void
{
    if (current_admin()) {
        redirect(url('/admin'));
    }
    $error = null;
    if (is_post()) {
        $ip = client_ip();
        q('DELETE FROM login_attempts WHERE attempted_at < :t', ['t' => time() - 3600]);
        $recent = (int) val('SELECT COUNT(*) FROM login_attempts WHERE ip = :ip AND attempted_at > :t', ['ip' => $ip, 't' => time() - 900]);
        if ($recent >= 8) {
            $error = 'Trop de tentatives. Réessayez dans 15 minutes.';
        } else {
            $admin = one('SELECT * FROM admins WHERE email = :e', ['e' => mb_strtolower((string) input('email'))]);
            if ($admin && password_verify((string) input('password'), $admin['password_hash'])) {
                session_regenerate_id(true);
                $_SESSION['admin_id'] = (int) $admin['id'];
                update('admins', ['last_login_at' => now()], 'id = :id', ['id' => $admin['id']]);
                if (password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
                    update('admins', ['password_hash' => password_hash((string) input('password'), PASSWORD_DEFAULT)], 'id = :id', ['id' => $admin['id']]);
                }
                q('DELETE FROM login_attempts WHERE ip = :ip', ['ip' => $ip]);
                $next = (string) input('next');
                redirect(url(preg_match('#^/admin(/[a-z0-9/-]*)?$#', $next) ? $next : '/admin'));
            }
            insert('login_attempts', ['ip' => $ip, 'attempted_at' => time()]);
            $error = 'E-mail ou mot de passe incorrect.';
        }
    }
    render('admin/login', ['title' => 'Connexion', 'error' => $error], 'admin/blank');
}

function admin_logout(): void
{
    unset($_SESSION['admin_id']);
    session_regenerate_id(true);
    redirect(url('/admin/connexion'));
}

function admin_dashboard(): void
{
    $paidOrCod = "(payment_status = 'paid' OR payment_method = 'cod') AND status <> 'cancelled'";
    $today = date('Y-m-d 00:00:00');
    $month = date('Y-m-01 00:00:00');
    $stats = [
        'revenue_today' => (int) val("SELECT COALESCE(SUM(total), 0) FROM orders WHERE $paidOrCod AND created_at >= :d", ['d' => $today]),
        'revenue_month' => (int) val("SELECT COALESCE(SUM(total), 0) FROM orders WHERE $paidOrCod AND created_at >= :d", ['d' => $month]),
        'orders_month' => (int) val("SELECT COUNT(*) FROM orders WHERE status <> 'cancelled' AND created_at >= :d", ['d' => $month]),
        'pending' => (int) val("SELECT COUNT(*) FROM orders WHERE status = 'pending'"),
        'messages' => (int) val('SELECT COUNT(*) FROM messages WHERE is_read = 0'),
        'products' => (int) val('SELECT COUNT(*) FROM products WHERE is_active = 1'),
    ];
    $stats['avg_basket'] = $stats['orders_month'] ? (int) round((int) val("SELECT COALESCE(SUM(total), 0) FROM orders WHERE $paidOrCod AND created_at >= :d", ['d' => $month]) / max(1, (int) val("SELECT COUNT(*) FROM orders WHERE $paidOrCod AND created_at >= :d", ['d' => $month]))) : 0;

    // 14-day revenue series for the chart.
    $series = [];
    for ($i = 13; $i >= 0; $i--) {
        $series[date('Y-m-d', strtotime("-$i days"))] = 0;
    }
    foreach (all("SELECT SUBSTR(created_at, 1, 10) d, SUM(total) t FROM orders WHERE $paidOrCod AND created_at >= :d GROUP BY SUBSTR(created_at, 1, 10)", ['d' => array_key_first($series) . ' 00:00:00']) as $r) {
        if (isset($series[$r['d']])) {
            $series[$r['d']] = (int) $r['t'];
        }
    }
    $threshold = (int) setting('low_stock_threshold', 3);
    $lowStock = all(
        'SELECT p.id, p.name, p.stock, NULL AS variant FROM products p WHERE p.is_active = 1 AND p.stock IS NOT NULL AND p.stock <= :t1
         UNION ALL
         SELECT p.id, p.name, v.stock, v.name AS variant FROM product_variants v JOIN products p ON p.id = v.product_id
         WHERE p.is_active = 1 AND v.stock IS NOT NULL AND v.stock <= :t2
         ORDER BY stock LIMIT 8',
        ['t1' => $threshold, 't2' => $threshold]
    );
    render('admin/dashboard', [
        'title' => 'Tableau de bord',
        'stats' => $stats,
        'series' => $series,
        'recent' => all('SELECT * FROM orders ORDER BY id DESC LIMIT 8'),
        'lowStock' => $lowStock,
        'top' => all('SELECT id, name, sales_count FROM products WHERE sales_count > 0 ORDER BY sales_count DESC LIMIT 5'),
        'checklist' => setup_checklist(),
    ]);
}

/** Launch checklist shown on the dashboard until everything is configured. */
function setup_checklist(): array
{
    return [
        ['Identité de la boutique (nom, logo, contact)', setting('logo') && setting('shop_email') && setting('shop_phone'), url('/admin/parametres', ['tab' => 'general'])],
        ['Au moins un moyen de paiement actif', count(payment_methods()) > 0, url('/admin/parametres', ['tab' => 'paiement'])],
        ['Envoi d’e-mails configuré (SMTP)', (bool) setting('smtp_host'), url('/admin/parametres', ['tab' => 'emails'])],
        ['Pages légales relues (CGV, mentions légales)', (bool) val("SELECT COUNT(*) FROM pages WHERE slug = 'mentions-legales' AND content NOT LIKE '%[%'"), url('/admin/pages')],
        ['Produits publiés', (int) val('SELECT COUNT(*) FROM products WHERE is_active = 1') > 0, url('/admin/produits')],
        ['Adresse du site en HTTPS', str_starts_with((string) config('base_url'), 'https://'), null],
    ];
}

// ---------------------------------------------------------------- orders

function admin_order_filters(): array
{
    $where = ['1 = 1'];
    $params = [];
    $status = (string) ($_GET['status'] ?? '');
    if (in_array($status, ORDER_STATUSES, true)) {
        $where[] = 'status = :status';
        $params['status'] = $status;
    }
    $payment = (string) ($_GET['payment'] ?? '');
    if (in_array($payment, PAYMENT_STATUSES, true)) {
        $where[] = 'payment_status = :pay';
        $params['pay'] = $payment;
    }
    if (($term = trim((string) ($_GET['q'] ?? ''))) !== '') {
        $where[] = "(LOWER(number) LIKE :q1 ESCAPE '!' OR LOWER(customer_name) LIKE :q2 ESCAPE '!' OR LOWER(email) LIKE :q3 ESCAPE '!' OR phone LIKE :q4 ESCAPE '!')";
        $params['q1'] = $params['q2'] = $params['q3'] = $params['q4'] = like_param($term);
    }
    if (!empty($_GET['from'])) {
        $where[] = 'created_at >= :from';
        $params['from'] = substr((string) $_GET['from'], 0, 10) . ' 00:00:00';
    }
    if (!empty($_GET['to'])) {
        $where[] = 'created_at <= :to';
        $params['to'] = substr((string) $_GET['to'], 0, 10) . ' 23:59:59';
    }
    return [implode(' AND ', $where), $params];
}

function admin_orders(): void
{
    [$where, $params] = admin_order_filters();
    $total = (int) val("SELECT COUNT(*) FROM orders WHERE $where", $params);
    $pager = paginate($total, 25, (int) ($_GET['page'] ?? 1));
    $counts = [];
    foreach (all('SELECT status, COUNT(*) n FROM orders GROUP BY status') as $r) {
        $counts[$r['status']] = (int) $r['n'];
    }
    render('admin/orders', [
        'title' => 'Commandes',
        'orders' => all("SELECT * FROM orders WHERE $where ORDER BY id DESC LIMIT {$pager['per_page']} OFFSET {$pager['offset']}", $params),
        'pager' => $pager,
        'counts' => $counts,
    ]);
}

function admin_orders_export(): void
{
    [$where, $params] = admin_order_filters();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="commandes-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // BOM so Excel opens UTF-8 correctly
    fputcsv($out, ['Numéro', 'Date', 'Statut', 'Paiement', 'État paiement', 'Client', 'E-mail', 'Téléphone', 'Adresse', 'Ville', 'Code postal', 'Articles', 'Sous-total', 'Remise', 'Livraison', 'Total'], ';');
    $dec = currency_decimals();
    foreach (all("SELECT * FROM orders WHERE $where ORDER BY id DESC", $params) as $o) {
        $items = implode(' | ', array_map(
            fn($i) => $i['quantity'] . ' x ' . $i['name'] . ($i['variant_name'] ? ' (' . $i['variant_name'] . ')' : ''),
            order_items((int) $o['id'])
        ));
        $m = fn($v) => number_format((int) $v / (10 ** $dec), $dec, ',', '');
        fputcsv($out, [
            $o['number'], $o['created_at'], order_status_label($o['status']), payment_method_label($o['payment_method']),
            payment_status_label($o['payment_status']), $o['customer_name'], $o['email'], $o['phone'], $o['address'], $o['city'],
            $o['postal_code'], $items, $m($o['subtotal']), $m($o['discount']), $m($o['shipping']), $m($o['total']),
        ], ';');
    }
    fclose($out);
}

function admin_order(string $id): void
{
    $order = find_order((int) $id) ?? abort(404);
    if (is_post()) {
        $action = (string) input('action');
        if ($action === 'status') {
            $status = (string) input('status');
            if (in_array($status, ORDER_STATUSES, true) && $status !== $order['status']) {
                update('orders', ['status' => $status, 'updated_at' => now()], 'id = :id', ['id' => $order['id']]);
                order_event((int) $order['id'], 'Statut : ' . order_status_label($order['status']) . ' → ' . order_status_label($status));
                if ($status === 'cancelled') {
                    restore_order_stock($order);
                }
                if (input('notify') && in_array($status, ['confirmed', 'shipped', 'delivered', 'cancelled'], true)) {
                    $order = find_order((int) $order['id']);
                    notify_status_change($order, (string) input('tracking'));
                }
                flash('success', 'Statut mis à jour.');
            }
        } elseif ($action === 'payment') {
            $ps = (string) input('payment_status');
            if (in_array($ps, PAYMENT_STATUSES, true) && $ps !== $order['payment_status']) {
                update('orders', ['payment_status' => $ps, 'paid_at' => $ps === 'paid' ? now() : $order['paid_at'], 'updated_at' => now()], 'id = :id', ['id' => $order['id']]);
                order_event((int) $order['id'], 'Paiement : ' . payment_status_label($order['payment_status']) . ' → ' . payment_status_label($ps));
                flash('success', 'État du paiement mis à jour.');
            }
        } elseif ($action === 'notes') {
            update('orders', ['admin_notes' => mb_substr((string) input('admin_notes'), 0, 2000), 'updated_at' => now()], 'id = :id', ['id' => $order['id']]);
            flash('success', 'Note enregistrée.');
        }
        redirect(url('/admin/commandes/' . $order['id']));
    }
    render('admin/order', [
        'title' => 'Commande ' . $order['number'],
        'order' => $order,
        'items' => order_items((int) $order['id']),
        'events' => all('SELECT * FROM order_events WHERE order_id = :id ORDER BY id DESC', ['id' => $order['id']]),
        'history' => (int) val('SELECT COUNT(*) FROM orders WHERE email = :e AND id <> :id', ['e' => $order['email'], 'id' => $order['id']]),
    ]);
}

function notify_status_change(array $order, string $tracking = ''): void
{
    $previous = locale();
    if ($order['locale'] && isset(SUPPORTED_LOCALES[$order['locale']])) {
        $GLOBALS['_locale'] = $order['locale'];
    }
    try {
        send_mail(
            $order['email'],
            __('mail.status_subject', ['number' => $order['number'], 'status' => order_status_label($order['status'])]),
            mail_view('emails/order_status', ['order' => $order, 'tracking' => $tracking])
        );
        order_event((int) $order['id'], 'Client notifié par e-mail');
    } catch (Throwable $e) {
        flash('error', 'E-mail non envoyé : ' . $e->getMessage());
    } finally {
        $GLOBALS['_locale'] = $previous;
    }
}

function admin_order_invoice(string $id): void
{
    $order = find_order((int) $id) ?? abort(404);
    render('admin/invoice', ['title' => 'Facture ' . $order['number'], 'order' => $order, 'items' => order_items((int) $order['id'])], 'admin/blank');
}

function admin_customers(): void
{
    $params = [];
    $where = '1 = 1';
    if (($term = trim((string) ($_GET['q'] ?? ''))) !== '') {
        $where = "(LOWER(customer_name) LIKE :q1 ESCAPE '!' OR LOWER(email) LIKE :q2 ESCAPE '!' OR phone LIKE :q3 ESCAPE '!')";
        $params = ['q1' => like_param($term), 'q2' => like_param($term), 'q3' => like_param($term)];
    }
    $customers = all(
        "SELECT email, MAX(customer_name) name, MAX(phone) phone, MAX(city) city, COUNT(*) orders,
                SUM(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END) spent, MAX(created_at) last_order
         FROM orders WHERE $where GROUP BY email ORDER BY last_order DESC LIMIT 500",
        $params
    );
    if (($_GET['export'] ?? '') === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="clients-' . date('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Nom', 'E-mail', 'Téléphone', 'Ville', 'Commandes', 'Dernière commande'], ';');
        foreach ($customers as $c) {
            fputcsv($out, [$c['name'], $c['email'], $c['phone'], $c['city'], $c['orders'], $c['last_order']], ';');
        }
        fclose($out);
        return;
    }
    render('admin/customers', [
        'title' => 'Clients',
        'customers' => $customers,
        'newsletter' => (int) val('SELECT COUNT(*) FROM newsletter'),
    ]);
}

function admin_messages(): void
{
    if (is_post()) {
        $id = (int) input('id');
        if (input('action') === 'delete') {
            q('DELETE FROM messages WHERE id = :id', ['id' => $id]);
            flash('success', 'Message supprimé.');
        } else {
            update('messages', ['is_read' => 1], 'id = :id', ['id' => $id]);
        }
        redirect(url('/admin/messages'));
    }
    render('admin/messages', ['title' => 'Messages', 'messages' => all('SELECT * FROM messages ORDER BY id DESC LIMIT 200')]);
}

// ---------------------------------------------------------------- settings & account

function admin_settings(): void
{
    $tab = (string) ($_GET['tab'] ?? 'general');
    if (is_post()) {
        $defaults = setting_defaults();
        $values = [];
        $checkboxes = ['cod_enabled', 'stripe_enabled', 'konnect_enabled', 'konnect_sandbox', 'flouci_enabled', 'require_postal_code'];
        $moneyFields = ['shipping_fee', 'free_shipping_threshold', 'cod_fee'];
        $fields = (array) ($_POST['fields'] ?? []);
        foreach ($fields as $key) {
            if (!array_key_exists($key, $defaults) || in_array($key, ['logo', 'favicon', 'hero_image'], true)) {
                continue;
            }
            $v = $_POST[$key] ?? null;
            if (in_array($key, $checkboxes, true)) {
                $values[$key] = $v ? '1' : '0';
            } elseif (in_array($key, secret_settings(), true)) {
                if (is_string($v) && trim($v) !== '') {
                    $values[$key] = trim($v);
                }
            } elseif ($key === 'locales') {
                $l = array_values(array_intersect((array) $v, array_keys(SUPPORTED_LOCALES)));
                $values[$key] = implode(',', $l ?: ['fr']);
            } elseif (is_string($v)) {
                $values[$key] = trim($v);
            }
        }
        // Money fields depend on the decimals being saved in the same request.
        if (isset($values['currency_decimals'])) {
            $values['currency_decimals'] = (string) max(0, min(3, (int) $values['currency_decimals']));
            $GLOBALS['_settings']['currency_decimals'] = $values['currency_decimals'];
        }
        foreach ($moneyFields as $f) {
            if (isset($values[$f])) {
                $values[$f] = (string) parse_money($values[$f]);
            }
        }
        if (isset($values['brand_color']) && !preg_match('/^#[0-9a-f]{6}$/i', $values['brand_color'])) {
            unset($values['brand_color']);
        }
        try {
            foreach (['logo', 'favicon', 'hero_image'] as $img) {
                if (!empty($_POST['remove_' . $img])) {
                    delete_upload(setting($img));
                    $values[$img] = '';
                }
                if ($path = store_upload($_FILES[$img] ?? ['error' => UPLOAD_ERR_NO_FILE], $img === 'hero_image' ? 2000 : 600)) {
                    delete_upload(setting($img));
                    $values[$img] = $path;
                }
            }
        } catch (RuntimeException $e) {
            flash('error', $e->getMessage());
        }
        save_settings($values);
        flash('success', 'Paramètres enregistrés.');
        redirect(url('/admin/parametres', ['tab' => $tab]));
    }
    render('admin/settings', ['title' => 'Paramètres', 'tab' => $tab]);
}

function admin_account(): void
{
    $admin = current_admin();
    $errors = [];
    if (is_post()) {
        if (input('action') === 'create') {
            $email = mb_strtolower((string) input('new_email'));
            $pass = (string) input('new_password');
            if (!valid_email($email) || mb_strlen($pass) < 10) {
                flash('error', 'E-mail valide et mot de passe de 10 caractères minimum requis.');
            } elseif (val('SELECT id FROM admins WHERE email = :e', ['e' => $email])) {
                flash('error', 'Cet e-mail est déjà utilisé.');
            } else {
                insert('admins', ['name' => (string) input('new_name') ?: $email, 'email' => $email, 'password_hash' => password_hash($pass, PASSWORD_DEFAULT), 'created_at' => now()]);
                flash('success', 'Administrateur ajouté.');
            }
            redirect(url('/admin/compte'));
        }
        if (input('action') === 'delete') {
            $id = (int) input('id');
            if ($id !== (int) $admin['id']) {
                q('DELETE FROM admins WHERE id = :id', ['id' => $id]);
                flash('success', 'Administrateur supprimé.');
            }
            redirect(url('/admin/compte'));
        }
        $name = (string) input('name');
        $email = mb_strtolower((string) input('email'));
        if (!password_verify((string) input('current_password'), $admin['password_hash'])) {
            $errors['current_password'] = 'Mot de passe actuel incorrect.';
        }
        if (!valid_email($email)) {
            $errors['email'] = 'E-mail invalide.';
        } elseif (val('SELECT id FROM admins WHERE email = :e AND id <> :id', ['e' => $email, 'id' => $admin['id']])) {
            $errors['email'] = 'Cet e-mail est déjà utilisé.';
        }
        $new = (string) input('password');
        if ($new !== '' && mb_strlen($new) < 10) {
            $errors['password'] = '10 caractères minimum.';
        } elseif ($new !== '' && $new !== (string) input('password_confirm')) {
            $errors['password'] = 'Les mots de passe ne correspondent pas.';
        }
        if (!$errors) {
            $data = ['name' => $name ?: $admin['name'], 'email' => $email];
            if ($new !== '') {
                $data['password_hash'] = password_hash($new, PASSWORD_DEFAULT);
            }
            update('admins', $data, 'id = :id', ['id' => $admin['id']]);
            flash('success', 'Compte mis à jour.');
            redirect(url('/admin/compte'));
        }
    }
    render('admin/account', ['title' => 'Mon compte', 'admin' => $admin, 'errors' => $errors, 'admins' => all('SELECT id, name, email, last_login_at FROM admins ORDER BY id')]);
}
