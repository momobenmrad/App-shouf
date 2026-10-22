<div class="invoice">
    <div class="invoice-actions no-print">
        <button class="btn btn-primary" type="button" onclick="window.print()">Imprimer / PDF</button>
    </div>
    <header class="invoice-head">
        <div>
            <?php if (setting('logo')): ?><img src="<?= e(media(setting('logo'))) ?>" alt="" height="48"><?php else: ?><h1><?= e(setting('shop_name')) ?></h1><?php endif ?>
            <p><?= e(setting('legal_name') ?: setting('shop_name')) ?><br><?= nl2br(e(setting('shop_address'))) ?><br><?= e(setting('shop_phone')) ?> · <?= e(setting('shop_email')) ?>
                <?php if (setting('tax_id')): ?><br>Matricule fiscal / SIRET : <?= e(setting('tax_id')) ?><?php endif ?></p>
        </div>
        <div class="invoice-meta">
            <h2>Facture</h2>
            <p>N° <strong><?= e($order['number']) ?></strong><br>Date : <?= e(date('d/m/Y', strtotime($order['created_at']))) ?><br>Paiement : <?= e(payment_method_label($order['payment_method'])) ?> (<?= e(payment_status_label($order['payment_status'])) ?>)</p>
        </div>
    </header>
    <section class="invoice-to">
        <h3>Livrer à</h3>
        <p><strong><?= e($order['customer_name']) ?></strong><br><?= e($order['address']) ?><br><?= e(trim($order['postal_code'] . ' ' . $order['city'])) ?>, <?= e($order['country']) ?><br><?= e($order['phone']) ?> · <?= e($order['email']) ?></p>
    </section>
    <table class="table invoice-table">
        <thead><tr><th>Désignation</th><th class="num">Prix unitaire</th><th class="num">Qté</th><th class="num">Total</th></tr></thead>
        <tbody>
        <?php foreach ($items as $it): ?>
            <tr><td><?= e($it['name']) ?><?= $it['variant_name'] ? ' — ' . e($it['variant_name']) : '' ?><?= $it['sku'] ? ' <span class="muted">(' . e($it['sku']) . ')</span>' : '' ?></td>
                <td class="num"><?= e(format_money((int) $it['unit_price'])) ?></td><td class="num"><?= (int) $it['quantity'] ?></td><td class="num"><?= e(format_money((int) $it['total'])) ?></td></tr>
        <?php endforeach ?>
        </tbody>
        <tfoot>
            <tr><td colspan="3">Sous-total</td><td class="num"><?= e(format_money((int) $order['subtotal'])) ?></td></tr>
            <?php if ((int) $order['discount']): ?><tr><td colspan="3">Remise</td><td class="num">−<?= e(format_money((int) $order['discount'])) ?></td></tr><?php endif ?>
            <tr><td colspan="3">Livraison et frais</td><td class="num"><?= e(format_money((int) $order['shipping'])) ?></td></tr>
            <tr class="total-row"><td colspan="3">Total TTC</td><td class="num"><?= e(format_money((int) $order['total'])) ?></td></tr>
        </tfoot>
    </table>
    <?php if ($order['notes']): ?><p><strong>Note :</strong> <?= e($order['notes']) ?></p><?php endif ?>
    <p class="muted small">Merci pour votre commande !</p>
</div>
