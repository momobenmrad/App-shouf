<?php
declare(strict_types=1);

function db_connect(array $cfg): PDO
{
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    if (($cfg['driver'] ?? 'mysql') === 'sqlite') {
        $path = $cfg['path'] ?? STORAGE_DIR . '/shop.sqlite';
        $pdo = new PDO('sqlite:' . $path, null, null, $options);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        return $pdo;
    }
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $cfg['host'] ?? 'localhost',
        (int) ($cfg['port'] ?? 3306),
        $cfg['name'] ?? ''
    );
    $pdo = new PDO($dsn, $cfg['user'] ?? '', $cfg['pass'] ?? '', $options);
    $pdo->exec("SET time_zone = '+00:00', sql_mode = 'STRICT_ALL_TABLES'");
    return $pdo;
}

function db(): PDO
{
    static $pdo = null;
    return $pdo ??= db_connect(config('db', []));
}

function db_driver(): string
{
    return db()->getAttribute(PDO::ATTR_DRIVER_NAME);
}

function q(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    foreach ($params as $k => $v) {
        $key = is_int($k) ? $k + 1 : (str_starts_with($k, ':') ? $k : ':' . $k);
        $type = match (true) {
            is_int($v), is_bool($v) => PDO::PARAM_INT,
            $v === null => PDO::PARAM_NULL,
            default => PDO::PARAM_STR,
        };
        $stmt->bindValue($key, is_bool($v) ? (int) $v : $v, $type);
    }
    $stmt->execute();
    return $stmt;
}

function one(string $sql, array $params = []): ?array
{
    $row = q($sql, $params)->fetch();
    return $row === false ? null : $row;
}

function all(string $sql, array $params = []): array
{
    return q($sql, $params)->fetchAll();
}

function val(string $sql, array $params = []): mixed
{
    $v = q($sql, $params)->fetchColumn();
    return $v === false ? null : $v;
}

function insert(string $table, array $data): int
{
    $cols = array_keys($data);
    $sql = sprintf(
        'INSERT INTO %s (%s) VALUES (%s)',
        $table,
        implode(', ', $cols),
        implode(', ', array_map(fn($c) => ':' . $c, $cols))
    );
    q($sql, $data);
    return (int) db()->lastInsertId();
}

function update(string $table, array $data, string $where, array $params = []): int
{
    $set = implode(', ', array_map(fn($c) => "$c = :$c", array_keys($data)));
    return q("UPDATE $table SET $set WHERE $where", $data + $params)->rowCount();
}

function transaction(callable $fn): mixed
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $result = $fn();
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/** Builds "(:p0, :p1, …)" placeholders for an IN clause and merges values into $params. */
function in_list(array $values, array &$params, string $prefix = 'in'): string
{
    $names = [];
    foreach (array_values($values) as $i => $v) {
        $params[$prefix . $i] = $v;
        $names[] = ':' . $prefix . $i;
    }
    return '(' . ($names ? implode(', ', $names) : 'NULL') . ')';
}

/** Pattern for `LOWER(col) LIKE :p ESCAPE '!'`, portable across MySQL and SQLite. */
function like_param(string $term): string
{
    return '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($term)) . '%';
}
