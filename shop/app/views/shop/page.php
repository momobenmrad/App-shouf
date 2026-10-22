<div class="container narrow">
    <?php partial('shop/breadcrumbs', ['items' => [$page['title'] => null]]) ?>
    <article class="prose page-content">
        <h1><?= e($page['title']) ?></h1>
        <?= rich_text((string) $page['content']) ?>
    </article>
</div>
