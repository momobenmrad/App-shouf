<h1 style="font-size:20px;margin:0 0 8px;">Nouveau message depuis le site</h1>
<p style="margin:0 0 12px;"><strong><?= e($m['name']) ?></strong> · <?= e($m['email']) ?><?= $m['phone'] ? ' · ' . e($m['phone']) : '' ?></p>
<?php if ($m['subject']): ?><p style="margin:0 0 12px;"><strong>Sujet :</strong> <?= e($m['subject']) ?></p><?php endif ?>
<p style="margin:0;white-space:pre-wrap;"><?= e($m['body']) ?></p>
