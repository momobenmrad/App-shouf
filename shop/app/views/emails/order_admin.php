<h1 style="font-size:20px;margin:0 0 8px;">Nouvelle commande <?= e($order['number']) ?></h1>
<p style="margin:0 0 12px;">
    <strong><?= e($order['customer_name']) ?></strong> · <?= e($order['phone']) ?> · <?= e($order['email']) ?><br>
    <?= e($order['address']) ?>, <?= e(trim($order['postal_code'] . ' ' . $order['city'])) ?><br>
    Paiement : <?= e(payment_method_label($order['payment_method'])) ?> (<?= e(payment_status_label($order['payment_status'])) ?>)
</p>
<?php if ($order['notes']): ?><p style="margin:0 0 12px;padding:10px;background:#fef9c3;border-radius:6px;">Note du client : <?= e($order['notes']) ?></p><?php endif ?>
<?php partial('emails/items', ['order' => $order, 'items' => $items]) ?>
<p><a href="<?= e(abs_url('/admin/commandes/' . $order['id'])) ?>">Ouvrir la commande dans l’administration</a></p>
