<?php
$tones = ['pending' => 'warn', 'confirmed' => 'info', 'processing' => 'info', 'shipped' => 'brand', 'delivered' => 'success', 'cancelled' => 'muted',
    'unpaid' => 'muted', 'paid' => 'success', 'failed' => 'danger', 'refunded' => 'muted'];
?>
<span class="badge badge-<?= $tones[$status] ?? 'muted' ?>"><?= e($kind === 'payment' ? payment_status_label($status) : order_status_label($status)) ?></span>
