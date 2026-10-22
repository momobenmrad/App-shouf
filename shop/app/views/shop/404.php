<div class="container narrow">
    <div class="empty-state">
        <p class="big-code" aria-hidden="true">404</p>
        <h1><?= e(__('not_found.title')) ?></h1>
        <p><?= e(__('not_found.text')) ?></p>
        <div class="hero-actions center">
            <a class="btn btn-primary" href="<?= e(url('/')) ?>"><?= e(__('nav.home')) ?></a>
            <a class="btn btn-outline" href="<?= e(url('/boutique')) ?>"><?= e(__('nav.shop')) ?></a>
        </div>
    </div>
</div>
