<?php
$val = fn(string $k) => old($k, $customer[$k] ?? ($k === 'country' ? setting('default_country') : ''));
$f = fn(string $name, string $label, array $o = []) => partial('shop/field', ['name' => $name, 'label' => $label, 'value' => $val($name), 'errors' => $errors] + $o);
$icons = ['cod' => 'cash', 'stripe' => 'card', 'konnect' => 'card', 'flouci' => 'card'];
?>
<div class="container page-checkout">
    <header class="page-head checkout-head">
        <h1><?= e(__('checkout.title')) ?></h1>
        <ol class="steps" aria-label="<?= e(__('checkout.steps')) ?>">
            <li class="is-done"><a href="<?= e(url('/panier')) ?>"><?= e(__('cart.title')) ?></a></li>
            <li class="is-current" aria-current="step"><?= e(__('checkout.details')) ?></li>
            <li><?= e(__('checkout.confirmation')) ?></li>
        </ol>
    </header>

    <?php if (!$methods): ?>
        <div class="alert alert-error"><?= e(__('checkout.no_payment')) ?></div>
    <?php endif ?>

    <form class="checkout-layout" method="post" action="<?= e(url('/commande')) ?>" novalidate data-checkout>
        <?= csrf_field() ?>
        <div class="checkout-main">
            <?php if (array_diff_key($errors, ['_cart' => 1])): ?>
                <div class="alert alert-error" role="alert" tabindex="-1" data-focus><?= e(__('form.fix_errors')) ?></div>
            <?php endif ?>

            <section class="card checkout-section">
                <h2><span class="step-num">1</span><?= e(__('checkout.contact')) ?></h2>
                <div class="form-grid">
                    <?php $f('name', __('form.full_name'), ['required' => true, 'attrs' => 'autocomplete="name"', 'class' => 'span-2']) ?>
                    <?php $f('phone', __('form.phone'), ['required' => true, 'type' => 'tel', 'attrs' => 'autocomplete="tel" inputmode="tel" dir="ltr"']) ?>
                    <?php $f('email', __('form.email'), ['required' => true, 'type' => 'email', 'attrs' => 'autocomplete="email" dir="ltr"', 'hint' => __('checkout.email_hint')]) ?>
                </div>
            </section>

            <section class="card checkout-section">
                <h2><span class="step-num">2</span><?= e(__('checkout.delivery')) ?></h2>
                <div class="form-grid">
                    <?php $f('address', __('form.address'), ['required' => true, 'attrs' => 'autocomplete="street-address"', 'class' => 'span-2']) ?>
                    <?php $f('city', __('form.city'), ['required' => true, 'attrs' => 'autocomplete="address-level2"']) ?>
                    <?php $f('postal_code', __('form.postal_code'), ['required' => (bool) setting('require_postal_code'), 'attrs' => 'autocomplete="postal-code" inputmode="numeric"']) ?>
                    <?php $f('country', __('form.country'), ['attrs' => 'autocomplete="country-name"', 'class' => 'span-2']) ?>
                    <?php $f('notes', __('form.notes'), ['type' => 'textarea', 'attrs' => 'rows="2" maxlength="1000"', 'class' => 'span-2', 'hint' => __('checkout.notes_hint')]) ?>
                </div>
            </section>

            <section class="card checkout-section">
                <h2><span class="step-num">3</span><?= e(__('checkout.payment')) ?></h2>
                <div class="pay-options <?= isset($errors['payment_method']) ? 'has-error' : '' ?>" role="radiogroup" aria-label="<?= e(__('checkout.payment')) ?>">
                    <?php foreach ($methods as $m): ?>
                        <label class="pay-option">
                            <input type="radio" name="payment_method" value="<?= e($m) ?>" <?= $m === $method ? 'checked' : '' ?> data-fee="<?= $m === 'cod' ? (int) setting('cod_fee') : 0 ?>">
                            <span class="pay-option-icon"><?php partial('shop/icons', ['icon' => $icons[$m]]) ?></span>
                            <span class="pay-option-text">
                                <strong><?= e(payment_method_label($m)) ?></strong>
                                <span><?= e(__('payment.' . $m . '_hint')) ?><?= $m === 'cod' && (int) setting('cod_fee') > 0 ? ' (+' . e(format_money((int) setting('cod_fee'))) . ')' : '' ?></span>
                            </span>
                        </label>
                    <?php endforeach ?>
                </div>
                <?php if (isset($errors['payment_method'])): ?><p class="field-error"><?= e($errors['payment_method']) ?></p><?php endif ?>
            </section>
        </div>

        <aside class="summary card checkout-summary">
            <h2 class="summary-title"><?= e(__('cart.summary')) ?> <span class="muted">(<?= array_sum(array_column($lines, 'qty')) ?>)</span></h2>
            <ul class="summary-lines" role="list">
                <?php foreach ($lines as $line): ?>
                    <li>
                        <span class="summary-thumb"><img src="<?= e(media($line['image'])) ?>" alt="" width="56" height="70"><span class="summary-qty"><?= (int) $line['qty'] ?></span></span>
                        <span class="summary-name"><?= e($line['name']) ?><?php if ($line['variant_name']): ?><small><?= e($line['variant_name']) ?></small><?php endif ?></span>
                        <span><?= e(format_money($line['total'])) ?></span>
                    </li>
                <?php endforeach ?>
            </ul>
            <?php partial('shop/coupon', ['totals' => $totals, 'from' => 'checkout']) ?>
            <?php partial('shop/totals', ['totals' => $totals, 'feeRow' => (int) setting('cod_fee') > 0 && in_array('cod', $methods, true)]) ?>

            <?php if ($termsPage): ?>
                <label class="check terms <?= isset($errors['terms']) ? 'has-error' : '' ?>">
                    <input type="checkbox" name="terms" value="1" required <?= old('terms') ? 'checked' : '' ?>>
                    <span><?= e(__('checkout.accept_terms')) ?> <a href="<?= e(url('/page/' . $termsPage)) ?>" target="_blank"><?= e(__('checkout.terms')) ?></a></span>
                </label>
                <?php if (isset($errors['terms'])): ?><p class="field-error"><?= e($errors['terms']) ?></p><?php endif ?>
            <?php endif ?>

            <button class="btn btn-primary btn-lg btn-block" type="submit" <?= $methods ? '' : 'disabled' ?> data-submit-once>
                <?php partial('shop/icons', ['icon' => 'lock']) ?> <?= e(__('checkout.place_order')) ?>
            </button>
            <p class="secure-note"><?= e(__('checkout.secure_note')) ?></p>
        </aside>
    </form>
</div>
