<div class="container page-contact">
    <header class="page-head">
        <h1><?= e(__('contact.title')) ?></h1>
        <p class="lead"><?= e(__('contact.text')) ?></p>
    </header>
    <div class="contact-layout">
        <form class="card form-grid" method="post" action="<?= e(url('/contact')) ?>" novalidate>
            <?= csrf_field() ?>
            <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
            <?php partial('shop/field', ['name' => 'name', 'label' => __('form.full_name'), 'value' => old('name'), 'errors' => $errors, 'required' => true, 'attrs' => 'autocomplete="name"']) ?>
            <?php partial('shop/field', ['name' => 'email', 'label' => __('form.email'), 'type' => 'email', 'value' => old('email'), 'errors' => $errors, 'required' => true, 'attrs' => 'autocomplete="email" dir="ltr"']) ?>
            <?php partial('shop/field', ['name' => 'phone', 'label' => __('form.phone_optional'), 'type' => 'tel', 'value' => old('phone'), 'errors' => $errors, 'attrs' => 'autocomplete="tel" dir="ltr"']) ?>
            <?php partial('shop/field', ['name' => 'subject', 'label' => __('contact.subject'), 'value' => old('subject'), 'errors' => $errors]) ?>
            <?php partial('shop/field', ['name' => 'message', 'label' => __('contact.message'), 'type' => 'textarea', 'value' => old('message'), 'errors' => $errors, 'required' => true, 'attrs' => 'rows="6"', 'class' => 'span-2']) ?>
            <div class="span-2"><button class="btn btn-primary btn-lg" type="submit"><?= e(__('contact.send')) ?></button></div>
        </form>
        <aside class="contact-info">
            <?php if (setting('shop_phone')): ?>
                <div class="card"><h2><?= e(__('form.phone')) ?></h2><p><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', (string) setting('shop_phone'))) ?>" dir="ltr"><?= e(setting('shop_phone')) ?></a></p></div>
            <?php endif ?>
            <?php if (setting('whatsapp')): ?>
                <div class="card"><h2>WhatsApp</h2><p><a href="https://wa.me/<?= e(preg_replace('/\D/', '', (string) setting('whatsapp'))) ?>" target="_blank" rel="noopener" dir="ltr"><?= e(setting('whatsapp')) ?></a></p></div>
            <?php endif ?>
            <?php if (setting('shop_email')): ?>
                <div class="card"><h2><?= e(__('form.email')) ?></h2><p><a href="mailto:<?= e(setting('shop_email')) ?>"><?= e(setting('shop_email')) ?></a></p></div>
            <?php endif ?>
            <?php if (setting('shop_address')): ?>
                <div class="card"><h2><?= e(__('contact.address')) ?></h2><p><?= e(setting('shop_address')) ?></p></div>
            <?php endif ?>
        </aside>
    </div>
</div>
