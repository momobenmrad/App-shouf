<?php $status = $_GET['status'] ?? ''; $exportQuery = $_GET; unset($exportQuery['r'], $exportQuery['page']); ?>
<div class="tabs-row">
    <nav class="tabs" aria-label="Filtrer par statut">
        <a href="<?= e(url('/admin/commandes')) ?>" <?= $status === '' ? 'aria-current="page"' : '' ?>>Toutes <span><?= array_sum($counts) ?></span></a>
        <?php foreach (ORDER_STATUSES as $s): ?>
            <a href="<?= e(url('/admin/commandes', ['status' => $s])) ?>" <?= $status === $s ? 'aria-current="page"' : '' ?>><?= e(order_status_label($s)) ?> <span><?= (int) ($counts[$s] ?? 0) ?></span></a>
        <?php endforeach ?>
    </nav>
</div>

<form class="filter-bar" method="get" action="<?= e(url('/admin/commandes')) ?>">
    <?php if (!config('pretty_urls', true)): ?><input type="hidden" name="r" value="/admin/commandes"><?php endif ?>
    <input type="hidden" name="status" value="<?= e($status) ?>">
    <input type="search" name="q" placeholder="N°, nom, e-mail, téléphone…" value="<?= e($_GET['q'] ?? '') ?>" aria-label="Rechercher">
    <select name="payment" aria-label="État du paiement">
        <option value="">Tous paiements</option>
        <?php foreach (PAYMENT_STATUSES as $p): ?><option value="<?= $p ?>" <?= ($_GET['payment'] ?? '') === $p ? 'selected' : '' ?>><?= e(payment_status_label($p)) ?></option><?php endforeach ?>
    </select>
    <label class="inline-label">Du <input type="date" name="from" value="<?= e($_GET['from'] ?? '') ?>"></label>
    <label class="inline-label">au <input type="date" name="to" value="<?= e($_GET['to'] ?? '') ?>"></label>
    <button class="btn btn-outline" type="submit">Filtrer</button>
    <a class="btn btn-ghost" href="<?= e(url('/admin/commandes/export', $exportQuery)) ?>">Exporter CSV</a>
</form>

<section class="panel">
    <?php partial('admin/orders_table', ['orders' => $orders]) ?>
    <?php partial('admin/pagination', ['pager' => $pager]) ?>
</section>
