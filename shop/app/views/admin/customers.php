<div class="page-actions">
    <form class="filter-bar" method="get" action="<?= e(url('/admin/clients')) ?>">
        <?php if (!config('pretty_urls', true)): ?><input type="hidden" name="r" value="/admin/clients"><?php endif ?>
        <input type="search" name="q" placeholder="Nom, e-mail, téléphone…" value="<?= e($_GET['q'] ?? '') ?>" aria-label="Rechercher">
        <button class="btn btn-outline" type="submit">Rechercher</button>
    </form>
    <div class="spacer"></div>
    <span class="muted small"><?= (int) $newsletter ?> inscrit(s) à la newsletter</span>
    <a class="btn btn-ghost" href="<?= e(url('/admin/clients', ['export' => 'csv', 'q' => $_GET['q'] ?? null])) ?>">Exporter CSV</a>
</div>
<section class="panel">
    <?php if ($customers): ?>
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>Client</th><th>Téléphone</th><th>Ville</th><th class="num">Commandes</th><th class="num">Total dépensé</th><th>Dernière commande</th></tr></thead>
                <tbody>
                <?php foreach ($customers as $c): ?>
                    <tr>
                        <td><a href="<?= e(url('/admin/commandes', ['q' => $c['email']])) ?>"><strong><?= e($c['name']) ?></strong></a><br><span class="muted small"><?= e($c['email']) ?></span></td>
                        <td><?= e($c['phone']) ?></td>
                        <td><?= e($c['city']) ?></td>
                        <td class="num"><?= (int) $c['orders'] ?></td>
                        <td class="num nowrap"><?= e(format_money((int) $c['spent'])) ?></td>
                        <td class="small"><?= e(date('d/m/Y', strtotime($c['last_order']))) ?></td>
                    </tr>
                <?php endforeach ?>
                </tbody>
            </table>
        </div>
    <?php else: ?>
        <p class="empty">Les clients apparaissent ici dès leur première commande.</p>
    <?php endif ?>
</section>
