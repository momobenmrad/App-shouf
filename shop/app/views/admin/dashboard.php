<?php
$todo = array_filter($checklist, fn($c) => !$c[1]);
$max = max(1, max($series));
?>
<?php if ($todo): ?>
    <section class="panel checklist">
        <div class="panel-head">
            <h2>Mise en route</h2>
            <span class="muted"><?= count($checklist) - count($todo) ?>/<?= count($checklist) ?> terminé</span>
        </div>
        <ul>
            <?php foreach ($checklist as [$label, $done, $link]): ?>
                <li class="<?= $done ? 'is-done' : '' ?>">
                    <span class="check-dot" aria-hidden="true"><?= $done ? '✓' : '' ?></span>
                    <?php if (!$done && $link): ?><a href="<?= e($link) ?>"><?= e($label) ?></a><?php else: ?><span><?= e($label) ?></span><?php endif ?>
                </li>
            <?php endforeach ?>
        </ul>
    </section>
<?php endif ?>

<section class="stats">
    <div class="stat"><span>Ventes aujourd’hui</span><strong><?= e(format_money($stats['revenue_today'])) ?></strong></div>
    <div class="stat"><span>Ventes du mois</span><strong><?= e(format_money($stats['revenue_month'])) ?></strong></div>
    <div class="stat"><span>Commandes du mois</span><strong><?= (int) $stats['orders_month'] ?></strong></div>
    <div class="stat"><span>Panier moyen</span><strong><?= e(format_money($stats['avg_basket'])) ?></strong></div>
    <a class="stat stat-link <?= $stats['pending'] ? 'stat-alert' : '' ?>" href="<?= e(url('/admin/commandes', ['status' => 'pending'])) ?>"><span>À traiter</span><strong><?= (int) $stats['pending'] ?></strong></a>
    <a class="stat stat-link" href="<?= e(url('/admin/messages')) ?>"><span>Messages non lus</span><strong><?= (int) $stats['messages'] ?></strong></a>
</section>

<div class="grid-2">
    <section class="panel">
        <div class="panel-head"><h2>Chiffre d’affaires — 14 derniers jours</h2></div>
        <div class="bar-chart" role="img" aria-label="Chiffre d’affaires des 14 derniers jours">
            <?php foreach ($series as $day => $amount): ?>
                <div class="bar" title="<?= e(date('d/m', strtotime($day))) ?> : <?= e(format_money($amount)) ?>">
                    <span class="bar-fill" style="height: <?= $amount ? max(3, (int) round($amount * 100 / $max)) : 0 ?>%"></span>
                    <span class="bar-label"><?= e(date('d', strtotime($day))) ?></span>
                </div>
            <?php endforeach ?>
        </div>
        <p class="muted small">Commandes payées ou en paiement à la livraison, hors annulations.</p>
    </section>

    <section class="panel">
        <div class="panel-head"><h2>Stock faible</h2><a href="<?= e(url('/admin/produits', ['state' => 'out'])) ?>">Ruptures</a></div>
        <?php if ($lowStock): ?>
            <ul class="list">
                <?php foreach ($lowStock as $s): ?>
                    <li><a href="<?= e(url('/admin/produits/' . $s['id'])) ?>"><?= e($s['name']) ?><?= $s['variant'] ? ' — ' . e($s['variant']) : '' ?></a>
                        <span class="badge badge-<?= (int) $s['stock'] <= 0 ? 'danger' : 'warn' ?>"><?= (int) $s['stock'] ?></span></li>
                <?php endforeach ?>
            </ul>
        <?php else: ?>
            <p class="muted">Aucun produit en stock faible.</p>
        <?php endif ?>
        <?php if ($top): ?>
            <h3 class="panel-subtitle">Meilleures ventes</h3>
            <ul class="list">
                <?php foreach ($top as $t): ?>
                    <li><a href="<?= e(url('/admin/produits/' . $t['id'])) ?>"><?= e($t['name']) ?></a><span class="muted"><?= (int) $t['sales_count'] ?> vendus</span></li>
                <?php endforeach ?>
            </ul>
        <?php endif ?>
    </section>
</div>

<section class="panel">
    <div class="panel-head"><h2>Dernières commandes</h2><a href="<?= e(url('/admin/commandes')) ?>">Tout voir</a></div>
    <?php partial('admin/orders_table', ['orders' => $recent]) ?>
</section>
