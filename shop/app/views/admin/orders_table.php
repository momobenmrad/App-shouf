<?php if ($orders): ?>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>Commande</th><th>Date</th><th>Client</th><th>Statut</th><th>Paiement</th><th class="num">Total</th></tr></thead>
            <tbody>
            <?php foreach ($orders as $o): ?>
                <tr data-href="<?= e(url('/admin/commandes/' . $o['id'])) ?>">
                    <td><a href="<?= e(url('/admin/commandes/' . $o['id'])) ?>"><strong><?= e($o['number']) ?></strong></a></td>
                    <td class="nowrap"><?= e(date('d/m/Y H:i', strtotime($o['created_at']))) ?></td>
                    <td><?= e($o['customer_name']) ?><br><span class="muted small"><?= e($o['city']) ?> · <?= e($o['phone']) ?></span></td>
                    <td><?php partial('admin/status_badge', ['status' => $o['status'], 'kind' => 'order']) ?></td>
                    <td><span class="small"><?= e(payment_method_label($o['payment_method'])) ?></span><br><?php partial('admin/status_badge', ['status' => $o['payment_status'], 'kind' => 'payment']) ?></td>
                    <td class="num nowrap"><strong><?= e(format_money((int) $o['total'])) ?></strong></td>
                </tr>
            <?php endforeach ?>
            </tbody>
        </table>
    </div>
<?php else: ?>
    <p class="empty">Aucune commande pour le moment.</p>
<?php endif ?>
