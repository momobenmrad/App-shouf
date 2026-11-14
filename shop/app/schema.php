<?php
declare(strict_types=1);

/**
 * Database schema, written once for MySQL/MariaDB and SQLite.
 * Amounts are integers in the currency's minor unit (millimes, centimes…); dates are 'Y-m-d H:i:s' strings.
 */
function schema_statements(string $driver): array
{
    $id = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY';
    $engine = $driver === 'sqlite' ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    $text = $driver === 'sqlite' ? 'TEXT' : 'MEDIUMTEXT';

    $tables = [
        "CREATE TABLE settings (
            name VARCHAR(100) NOT NULL PRIMARY KEY,
            value $text
        )",
        "CREATE TABLE admins (
            id $id,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(190) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            last_login_at VARCHAR(19) NULL,
            created_at VARCHAR(19) NOT NULL
        )",
        "CREATE TABLE login_attempts (
            id $id,
            ip VARCHAR(45) NOT NULL,
            attempted_at INT NOT NULL
        )",
        "CREATE TABLE categories (
            id $id,
            parent_id INT NULL,
            name VARCHAR(190) NOT NULL,
            slug VARCHAR(190) NOT NULL UNIQUE,
            description TEXT NULL,
            image VARCHAR(255) NULL,
            position INT NOT NULL DEFAULT 0,
            is_active TINYINT NOT NULL DEFAULT 1,
            created_at VARCHAR(19) NOT NULL
        )",
        "CREATE TABLE products (
            id $id,
            category_id INT NULL,
            name VARCHAR(190) NOT NULL,
            slug VARCHAR(190) NOT NULL UNIQUE,
            sku VARCHAR(80) NULL,
            short_description TEXT NULL,
            description $text NULL,
            price INT NOT NULL DEFAULT 0,
            compare_price INT NULL,
            stock INT NULL,
            option_label VARCHAR(80) NULL,
            is_active TINYINT NOT NULL DEFAULT 1,
            is_featured TINYINT NOT NULL DEFAULT 0,
            meta_title VARCHAR(190) NULL,
            meta_description VARCHAR(300) NULL,
            sales_count INT NOT NULL DEFAULT 0,
            created_at VARCHAR(19) NOT NULL,
            updated_at VARCHAR(19) NOT NULL
        )",
        "CREATE TABLE product_images (
            id $id,
            product_id INT NOT NULL,
            path VARCHAR(255) NOT NULL,
            alt VARCHAR(190) NULL,
            position INT NOT NULL DEFAULT 0
        )",
        "CREATE TABLE product_variants (
            id $id,
            product_id INT NOT NULL,
            name VARCHAR(120) NOT NULL,
            sku VARCHAR(80) NULL,
            price INT NULL,
            stock INT NULL,
            position INT NOT NULL DEFAULT 0
        )",
        "CREATE TABLE coupons (
            id $id,
            code VARCHAR(50) NOT NULL UNIQUE,
            type VARCHAR(10) NOT NULL DEFAULT 'percent',
            value INT NOT NULL,
            min_total INT NOT NULL DEFAULT 0,
            max_uses INT NULL,
            used_count INT NOT NULL DEFAULT 0,
            expires_at VARCHAR(19) NULL,
            is_active TINYINT NOT NULL DEFAULT 1,
            created_at VARCHAR(19) NOT NULL
        )",
        "CREATE TABLE orders (
            id $id,
            number VARCHAR(40) NULL UNIQUE,
            token VARCHAR(64) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            payment_method VARCHAR(20) NOT NULL,
            payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
            payment_ref VARCHAR(190) NULL,
            customer_name VARCHAR(190) NOT NULL,
            email VARCHAR(190) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            address VARCHAR(300) NOT NULL,
            city VARCHAR(120) NOT NULL,
            postal_code VARCHAR(20) NULL,
            country VARCHAR(80) NULL,
            notes TEXT NULL,
            admin_notes TEXT NULL,
            coupon_code VARCHAR(50) NULL,
            subtotal INT NOT NULL,
            discount INT NOT NULL DEFAULT 0,
            shipping INT NOT NULL DEFAULT 0,
            total INT NOT NULL,
            stock_restored TINYINT NOT NULL DEFAULT 0,
            locale VARCHAR(5) NULL,
            ip VARCHAR(45) NULL,
            paid_at VARCHAR(19) NULL,
            created_at VARCHAR(19) NOT NULL,
            updated_at VARCHAR(19) NOT NULL
        )",
        "CREATE TABLE order_items (
            id $id,
            order_id INT NOT NULL,
            product_id INT NULL,
            variant_id INT NULL,
            name VARCHAR(190) NOT NULL,
            variant_name VARCHAR(120) NULL,
            sku VARCHAR(80) NULL,
            unit_price INT NOT NULL,
            quantity INT NOT NULL,
            total INT NOT NULL
        )",
        "CREATE TABLE order_events (
            id $id,
            order_id INT NOT NULL,
            message VARCHAR(300) NOT NULL,
            created_at VARCHAR(19) NOT NULL
        )",
        "CREATE TABLE pages (
            id $id,
            slug VARCHAR(190) NOT NULL UNIQUE,
            title VARCHAR(190) NOT NULL,
            content $text NULL,
            in_footer TINYINT NOT NULL DEFAULT 1,
            is_active TINYINT NOT NULL DEFAULT 1,
            position INT NOT NULL DEFAULT 0,
            updated_at VARCHAR(19) NOT NULL
        )",
        "CREATE TABLE messages (
            id $id,
            name VARCHAR(190) NOT NULL,
            email VARCHAR(190) NOT NULL,
            phone VARCHAR(40) NULL,
            subject VARCHAR(190) NULL,
            body TEXT NOT NULL,
            is_read TINYINT NOT NULL DEFAULT 0,
            created_at VARCHAR(19) NOT NULL
        )",
        "CREATE TABLE newsletter (
            id $id,
            email VARCHAR(190) NOT NULL UNIQUE,
            created_at VARCHAR(19) NOT NULL
        )",
    ];

    $statements = array_map(fn($sql) => $sql . $engine, $tables);

    $indexes = [
        'CREATE INDEX idx_products_category ON products (category_id, is_active)',
        'CREATE INDEX idx_products_featured ON products (is_featured, is_active)',
        'CREATE INDEX idx_images_product ON product_images (product_id, position)',
        'CREATE INDEX idx_variants_product ON product_variants (product_id, position)',
        'CREATE INDEX idx_orders_status ON orders (status, created_at)',
        'CREATE INDEX idx_orders_email ON orders (email)',
        'CREATE INDEX idx_items_order ON order_items (order_id)',
        'CREATE INDEX idx_events_order ON order_events (order_id)',
        'CREATE INDEX idx_login_ip ON login_attempts (ip, attempted_at)',
    ];

    return array_merge($statements, $indexes);
}
