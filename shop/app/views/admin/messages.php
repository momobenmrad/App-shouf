<section class="panel">
    <?php if ($messages): ?>
        <ul class="messages">
            <?php foreach ($messages as $m): ?>
                <li class="<?= (int) $m['is_read'] ? '' : 'is-unread' ?>">
                    <details <?= (int) $m['is_read'] ? '' : 'open' ?>>
                        <summary>
                            <strong><?= e($m['name']) ?></strong>
                            <span class="muted"><?= e($m['subject'] ?: str_limit($m['body'], 60)) ?></span>
                            <time class="muted small"><?= e(date('d/m/Y H:i', strtotime($m['created_at']))) ?></time>
                        </summary>
                        <div class="message-body">
                            <p class="small"><a href="mailto:<?= e($m['email']) ?>?subject=<?= rawurlencode('Re: ' . ($m['subject'] ?: setting('shop_name'))) ?>"><?= e($m['email']) ?></a><?= $m['phone'] ? ' · ' . e($m['phone']) : '' ?></p>
                            <p class="pre"><?= e($m['body']) ?></p>
                            <div class="inline-form">
                                <a class="btn btn-primary btn-sm" href="mailto:<?= e($m['email']) ?>?subject=<?= rawurlencode('Re: ' . ($m['subject'] ?: setting('shop_name'))) ?>">Répondre</a>
                                <?php if (!(int) $m['is_read']): ?>
                                    <form method="post"><?= csrf_field() ?><input type="hidden" name="id" value="<?= (int) $m['id'] ?>"><button class="btn btn-outline btn-sm" type="submit">Marquer comme lu</button></form>
                                <?php endif ?>
                                <form method="post"><?= csrf_field() ?><input type="hidden" name="id" value="<?= (int) $m['id'] ?>"><input type="hidden" name="action" value="delete"><button class="btn btn-ghost btn-sm text-danger" type="submit" data-confirm="Supprimer ce message ?">Supprimer</button></form>
                            </div>
                        </div>
                    </details>
                </li>
            <?php endforeach ?>
        </ul>
    <?php else: ?>
        <p class="empty">Aucun message reçu via le formulaire de contact.</p>
    <?php endif ?>
</section>
