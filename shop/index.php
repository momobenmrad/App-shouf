<?php
declare(strict_types=1);

// Built-in dev server (php -S localhost:8000 index.php): serve static files directly.
if (PHP_SAPI === 'cli-server') {
    $file = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $servable = is_file($file) || (is_dir($file) && is_file(rtrim($file, '/') . '/index.php'));
    if ($file !== __FILE__ && $servable && !preg_match('#/(app|storage|bin)/#', $file)) {
        return false;
    }
}

require __DIR__ . '/app/bootstrap.php';
require APP_DIR . '/routes.php';

dispatch();
