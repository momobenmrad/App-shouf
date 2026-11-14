<div class="container narrow">
    <header class="page-head">
        <h1><?= e(__('track.title')) ?></h1>
        <p class="lead"><?= e(__('track.text')) ?></p>
    </header>
    <form class="card form-stack" method="post" action="<?= e(url('/suivi')) ?>">
        <?= csrf_field() ?>
        <?php if ($error): ?><div class="alert alert-error" role="alert"><?= e($error) ?></div><?php endif ?>
        <?php partial('shop/field', ['name' => 'number', 'label' => __('track.number'), 'value' => old('number'), 'required' => true, 'attrs' => 'placeholder="' . e(setting('order_prefix', 'CMD')) . '-10001" autocapitalize="characters" dir="ltr"']) ?>
        <?php partial('shop/field', ['name' => 'email', 'label' => __('form.email'), 'type' => 'email', 'value' => old('email'), 'required' => true, 'attrs' => 'autocomplete="email" dir="ltr"']) ?>
        <button class="btn btn-primary btn-lg btn-block" type="submit"><?= e(__('track.submit')) ?></button>
    </form>
</div>
