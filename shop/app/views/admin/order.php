<div class="page-actions">
    <a class="btn btn-ghost" href="<?= e(url('/admin/commandes')) ?>">← Commandes</a>
    <div class="spacer"></div>
    <a class="btn btn-outline" href="<?= e(url('/admin/commandes/' . $order['id'] . '/facture')) ?>" target="_blank">Facture / bon de livraison</a>
    <a class="btn btn-outline" href="<?= e(order_public_url($order)) ?>" target="_blank">Page client ↗</a>
</div>

<div class="grid-main">
    <div>
        <section class="panel">
            <div class="panel-head">
                <h2>Articles</h2>
                <span class="muted"><?= e(date('d/m/Y à H:i', strtotime($order['created_at']))) ?></span>
            </div>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>Produit</th><th>Réf.</th><th class="num">Prix</th><th class="num">Qté</th><th class="num">Total</th></tr></thead>
                    <tbody>
                    <?php foreach ($items as $it): ?>
                        <tr>
                            <td><?php if ($it['product_id']): ?><a href="<?= e(url('/admin/produits/' . $it['product_id'])) ?>"><?= e($it['name']) ?></a><?php else: ?><?= e($it['name']) ?><?php endif ?>
                                <?php if ($it['variant_name']): ?><br><span class="muted small"><?= e($it['variant_name']) ?></span><?php endif ?></td>
                            <td class="muted small"><?= e($it['sku']) ?></td>
                            <td class="num nowrap"><?= e(format_money((int) $it['unit_price'])) ?></td>
                            <td class="num"><?= (int) $it['quantity'] ?></td>
                            <td class="num nowrap"><?= e(format_money((int) $it['total'])) ?></td>
                        </tr>
                    <?php endforeach ?>
                    </tbody>
                    <tfoot>
                        <tr><td colspan="4">Sous-total</td><td class="num nowrap"><?= e(format_money((int) $order['subtotal'])) ?></td></tr>
                        <?php if ((int) $order['discount']): ?><tr><td colspan="4">Remise (<?= e($order['coupon_code']) ?>)</td><td class="num nowrap">−<?= e(format_money((int) $order['discount'])) ?></td></tr><?php endif ?>
                        <tr><td colspan="4">Livraison et frais</td><td class="num nowrap"><?= e(format_money((int) $order['shipping'])) ?></td></tr>
                        <tr class="total-row"><td colspan="4">Total</td><td class="num nowrap"><?= e(format_money((int) $order['total'])) ?></td></tr>
                    </tfoot>
                </table>
            </div>
        </section>

        <section class="panel">
            <div class="panel-head"><h2>Historique</h2></div>
            <ul class="events">
                <?php foreach ($events as $ev): ?>
                    <li><time><?= e(date('d/m/Y H:i', strtotime($ev['created_at']))) ?></time><span><?= e($ev['message']) ?></span></li>
                <?php endforeach ?>
            </ul>
        </section>
    </div>

    <div>
        <section class="panel">
            <div class="panel-head"><h2>Statut</h2><?php partial('admin/status_badge', ['status' => $order['status'], 'kind' => 'order']) ?></div>
            <form method="post" class="form-stack">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="status">
                <div class="field">
                    <label for="status">Nouveau statut</label>
                    <select id="status" name="status">
                        <?php foreach (ORDER_STATUSES as $s): ?><option value="<?= $s ?>" <?= $s === $order['status'] ? 'selected' : '' ?>><?= e(order_status_label($s)) ?></option><?php endforeach ?>
                    </select>
                </div>
                <div class="field">
                    <label for="tracking">N° de suivi colis (facultatif)</label>
                    <input id="tracking" name="tracking" placeholder="Transmis au client avec l’e-mail">
                </div>
                <label class="check"><input type="checkbox" name="notify" value="1" checked> Prévenir le client par e-mail</label>
                <button class="btn btn-primary btn-block" type="submit">Mettre à jour</button>
                <p class="muted small">Annuler une commande remet automatiquement ses articles en stock.</p>
            </form>
        </section>

        <section class="panel">
            <div class="panel-head"><h2>Paiement</h2><?php partial('admin/status_badge', ['status' => $order['payment_status'], 'kind' => 'payment']) ?></div>
            <p><?= e(payment_method_label($order['payment_method'])) ?><?php if ($order['payment_ref']): ?><br><span class="muted small">Réf. <?= e($order['payment_ref']) ?></span><?php endif ?></p>
            <form method="post" class="inline-form">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="payment">
                <select name="payment_status" aria-label="État du paiement">
                    <?php foreach (PAYMENT_STATUSES as $p): ?><option value="<?= $p ?>" <?= $p === $order['payment_status'] ? 'selected' : '' ?>><?= e(payment_status_label($p)) ?></option><?php endforeach ?>
                </select>
                <button class="btn btn-outline" type="submit">Enregistrer</button>
            </form>
        </section>

        <section class="panel">
            <div class="panel-head"><h2>Client</h2><?php if ($history): ?><a href="<?= e(url('/admin/commandes', ['q' => $order['email']])) ?>"><?= $history ?> autre(s) commande(s)</a><?php endif ?></div>
            <address class="address">
                <strong><?= e($order['customer_name']) ?></strong><br>
                <a href="tel:<?= e(preg_replace('/[^0-9+]/', '', $order['phone'])) ?>"><?= e($order['phone']) ?></a><br>
                <a href="mailto:<?= e($order['email']) ?>"><?= e($order['email']) ?></a><br><br>
                <?= e($order['address']) ?><br>
                <?= e(trim($order['postal_code'] . ' ' . $order['city'])) ?><br>
                <?= e($order['country']) ?>
            </address>
            <?php $wa = preg_replace('/\D/', '', $order['phone']); if ($wa): ?>
                <a class="btn btn-outline btn-sm" href="https://wa.me/<?= e($wa) ?>" target="_blank" rel="noopener">Contacter sur WhatsApp</a>
            <?php endif ?>
            <?php if ($order['notes']): ?><div class="note"><strong>Note du client :</strong> <?= e($order['notes']) ?></div><?php endif ?>
        </section>

        <section class="panel">
            <div class="panel-head"><h2>Note interne</h2></div>
            <form method="post" class="form-stack">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="notes">
                <textarea name="admin_notes" rows="3" aria-label="Note interne" placeholder="Visible uniquement par l’équipe"><?= e($order['admin_notes']) ?></textarea>
                <button class="btn btn-outline btn-sm" type="submit">Enregistrer la note</button>
            </form>
        </section>
    </div>
</div>
