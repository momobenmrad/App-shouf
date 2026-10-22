<?php
declare(strict_types=1);

function mail_view(string $view, array $data = []): string
{
    extract($data, EXTR_SKIP);
    ob_start();
    require view_path($view);
    $body = ob_get_clean();
    ob_start();
    require view_path('emails/layout');
    return ob_get_clean();
}

function mail_from_address(): string
{
    $from = setting('mail_from') ?: setting('shop_email');
    if (!$from) {
        $host = preg_replace('/^www\./', '', parse_url((string) config('base_url'), PHP_URL_HOST) ?: ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        $from = 'no-reply@' . preg_replace('/:\d+$/', '', (string) $host);
    }
    return $from;
}

function encode_header(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

/**
 * Sends an HTML e-mail through SMTP when configured (recommended for deliverability), PHP mail() otherwise.
 * In debug mode messages are also written to storage/mail.log.
 */
function send_mail(string $to, string $subject, string $html, ?string $replyTo = null): bool
{
    if (!valid_email($to)) {
        return false;
    }
    $from = mail_from_address();
    $fromName = (string) setting('shop_name', 'Boutique');
    $text = trim(html_entity_decode(strip_tags(preg_replace('#<(br|/p|/tr|/h\d)>#i', "\n", $html) ?? ''), ENT_QUOTES, 'UTF-8'));
    $boundary = 'b' . random_token(8);

    $headers = [
        'From' => encode_header($fromName) . " <$from>",
        'Reply-To' => $replyTo && valid_email($replyTo) ? $replyTo : $from,
        'MIME-Version' => '1.0',
        'Content-Type' => "multipart/alternative; boundary=\"$boundary\"",
        'X-Mailer' => 'Boutique/' . SHOP_VERSION,
    ];
    $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode(preg_replace("/\n{3,}/", "\n\n", $text) ?? $text))
        . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--$boundary--\r\n";

    if (config('debug')) {
        @file_put_contents(STORAGE_DIR . '/mail.log', '[' . now() . "] To: $to | $subject\n$text\n\n", FILE_APPEND);
    }

    if (setting('smtp_host')) {
        return smtp_send($to, encode_header($subject), $headers, $body, $from);
    }
    $headerLines = [];
    foreach ($headers as $k => $v) {
        $headerLines[] = "$k: $v";
    }
    return @mail($to, encode_header($subject), $body, implode("\r\n", $headerLines), '-f' . $from);
}

function smtp_send(string $to, string $subject, array $headers, string $body, string $from): bool
{
    $host = (string) setting('smtp_host');
    $port = (int) setting('smtp_port', 587);
    $secure = (string) setting('smtp_secure', 'tls');
    $remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 15);
    if (!$fp) {
        throw new RuntimeException("SMTP: connexion impossible à $host:$port ($errstr)");
    }
    stream_set_timeout($fp, 15);
    $read = function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 515)) !== false) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };
    $cmd = function (string $command, array $expect) use ($fp, $read): string {
        if ($command !== '') {
            fwrite($fp, $command . "\r\n");
        }
        $reply = $read();
        if (!in_array((int) substr($reply, 0, 3), $expect, true)) {
            throw new RuntimeException('SMTP: réponse inattendue « ' . trim($reply) . ' »');
        }
        return $reply;
    };
    $ehloHost = parse_url((string) config('base_url'), PHP_URL_HOST) ?: 'localhost';
    try {
        $cmd('', [220]);
        $cmd("EHLO $ehloHost", [250]);
        if ($secure === 'tls') {
            $cmd('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
                throw new RuntimeException('SMTP: échec de STARTTLS');
            }
            $cmd("EHLO $ehloHost", [250]);
        }
        if (setting('smtp_user')) {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode((string) setting('smtp_user')), [334]);
            $cmd(base64_encode((string) setting('smtp_pass')), [235]);
        }
        $cmd("MAIL FROM:<$from>", [250]);
        $cmd("RCPT TO:<$to>", [250, 251]);
        $cmd('DATA', [354]);
        $msg = 'To: ' . $to . "\r\nSubject: " . $subject . "\r\nDate: " . date('r') . "\r\nMessage-ID: <" . random_token(12) . '@' . $ehloHost . ">\r\n";
        foreach ($headers as $k => $v) {
            $msg .= "$k: $v\r\n";
        }
        $msg .= "\r\n" . preg_replace('/^\./m', '..', $body);
        $cmd($msg . "\r\n.", [250]);
        $cmd('QUIT', [221]);
        return true;
    } finally {
        fclose($fp);
    }
}
