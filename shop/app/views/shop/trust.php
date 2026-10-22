<ul class="trust">
    <li><span class="trust-icon"><?php partial('shop/icons', ['icon' => 'truck']) ?></span>
        <div><strong><?= e(__('trust.delivery')) ?></strong><span><?= e(__('trust.delivery_text', ['delay' => setting('delivery_delay')])) ?></span></div></li>
    <li><span class="trust-icon"><?php partial('shop/icons', ['icon' => in_array('cod', payment_methods(), true) ? 'cash' : 'lock']) ?></span>
        <div><strong><?= e(in_array('cod', payment_methods(), true) ? __('trust.cod') : __('trust.secure')) ?></strong><span><?= e(in_array('cod', payment_methods(), true) ? __('trust.cod_text') : __('trust.secure_text')) ?></span></div></li>
    <li><span class="trust-icon"><?php partial('shop/icons', ['icon' => 'return']) ?></span>
        <div><strong><?= e(__('trust.returns')) ?></strong><span><?= e(__('trust.returns_text')) ?></span></div></li>
    <li><span class="trust-icon"><?php partial('shop/icons', ['icon' => 'chat']) ?></span>
        <div><strong><?= e(__('trust.support')) ?></strong><span><?= e(__('trust.support_text')) ?></span></div></li>
</ul>
