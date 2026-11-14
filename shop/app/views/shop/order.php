<?php
$steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
$currentIndex = array_search($order['status'], $steps, true);
$totals = ['subtotal' => (int) $order['subtotal'], 'discount' => (int) $order['discount'], 'shipping' => (int) $order['shipping'], 'fee' => 0, 'total' => (int) $order['total'], 'coupon' => $order['coupon_code'] ? ['code' => $order['coupon_code']] : null];
?>
<div class="container page-order">
    <?php if ($isNew): ?>
        <section class="order-success">
            <div class="success-icon" aria-hidden="true"><?php partial('shop/icons', ['icon' => 'check']) ?></div>
            <h1><?= e(__('order.thanks', ['name' => explode(' ', $order['customer_name'])[0]])) ?></h1>
            <p class="lead"><?= e(__('order.thanks_text', ['number' => $order['number']])) ?></p>
            <?php if ($order['payment_method'] === 'cod'): ?>
                <p><?= e(__('order.cod_text', ['total' => format_money((int) $order['total'])])) ?></p>
            <?php endif ?>
            <p class="muted small"><?= e(__('order.email_sent', ['email' => $order['email']])) ?></p>
        </section>
    <?php else: ?>
        <header class="page-head">
            <h1><?= e(__('order.title', ['number' => $order['number']])) ?></h1>
            <p class="muted"><?= e(__('order.placed_on', ['date' => date('d/m/Y H:i', strtotime($order['created_at']))])) ?></p>
        </header>
    <?php endif ?>

    <div class="order-layout">
        <div class="order-main">
            <section class="card">
                <h2><?= e(__('order.status')) ?></h2>
                <?php if ($order['status'] === 'cancelled'): ?>
                    <p class="alert alert-error"><?= e(order_status_label('cancelled')) ?></p>
                <?php else: ?>
                    <ol class="timeline">
                        <?php foreach ($steps as $i => $s): ?>
                            <li class="<?= $currentIndex !== false && $i <= $currentIndex ? 'is-done' : '' ?> <?= $i === $currentIndex ? 'is-current' : '' ?>"><?= e(order_status_label($s)) ?></li>
                        <?php endforeach ?>
                    </ol>
                <?php endif ?>
                <p class="pay-state">
                    <?= e(__('order.payment')) ?> : <strong><?= e(payment_method_label($order['payment_method'])) ?></strong> —
                    <span class="badge badge-<?= $order['payment_status'] === 'paid' ? 'success' : ($order['payment_status'] === 'failed' ? 'sale' : 'muted') ?>"><?= e(payment_status_label($order['payment_status'])) ?></span>
                </p>

                <?php if ($canPay && $methods): ?>
                    <form class="retry-pay" method="post" action="<?= e(url('/commande/' . $order['number'] . '/payer')) ?>">
                        <?= csrf_field() ?>
                        <input type="hidden" name="t" value="<?= e($order['token']) ?>">
                        <p><?= e(__('order.pay_now_text')) ?></p>
                        <div class="inline-form">
                            <label class="sr-only" for="pm"><?= e(__('checkout.payment')) ?></label>
                            <select id="pm" name="payment_method">
                                <?php foreach ($methods as $m): ?>
                                    <option value="<?= e($m) ?>" <?= $m === $order['payment_method'] ? 'selected' : '' ?>><?= e(payment_method_label($m)) ?></option>
                                <?php endforeach ?>
                            </select>
                            <button class="btn btn-primary" type="submit"><?= e(__('order.pay_now')) ?></button>
                        </div>
                    </form>
                <?php endif ?>
            </section>

            <section class="card">
                <h2><?= e(__('order.items')) ?></h2>
                <ul class="summary-lines" role="list">
                    <?php foreach ($items as $it): ?>
                        <li>
                            <span class="summary-thumb"><img src="<?= e(media($it['product_id'] ? product_cover((int) $it['product_id']) : null)) ?>" alt="" width="56" height="70"><span class="summary-qty"><?= (int) $it['quantity'] ?></span></span>
                            <span class="summary-name"><?= e($it['name']) ?><?php if ($it['variant_name']): ?><small><?= e($it['variant_name']) ?></small><?php endif ?></span>
                            <span><?= e(format_money((int) $it['total'])) ?></span>
                        </li>
                    <?php endforeach ?>
                </ul>
                <?php partial('shop/totals', ['totals' => $totals]) ?>
            </section>
        </div>

        <aside class="card order-address">
            <h2><?= e(__('order.delivery_to')) ?></h2>
            <address>
                <strong><?= e($order['customer_name']) ?></strong><br>
                <?= e($order['address']) ?><br>
                <?= e(trim($order['postal_code'] . ' ' . $order['city'])) ?><br>
                <?= e($order['country']) ?><br>
                <span dir="ltr"><?= e($order['phone']) ?></span>
            </address>
            <p class="muted small"><?= e(__('order.bookmark')) ?></p>
            <a class="btn btn-outline btn-block" href="<?= e(url('/boutique')) ?>"><?= e(__('cart.continue')) ?></a>
            <a class="btn btn-ghost btn-block" href="<?= e(url('/contact')) ?>"><?= e(__('order.question')) ?></a>
        </aside>
    </div>
</div>
