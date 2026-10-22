<?php
// Text input with label and inline error. Expects $name, $label; optional $type, $value, $attrs, $errors, $hint, $class.
$id = 'f-' . $name;
$err = $errors[$name] ?? null;
?>
<div class="field <?= e($class ?? '') ?> <?= $err ? 'has-error' : '' ?>">
    <label for="<?= e($id) ?>"><?= e($label) ?><?php if (!empty($required)): ?> <span class="req" aria-hidden="true">*</span><?php endif ?></label>
    <?php if (($type ?? 'text') === 'textarea'): ?>
        <textarea id="<?= e($id) ?>" name="<?= e($name) ?>" <?= $attrs ?? '' ?> <?= !empty($required) ? 'required' : '' ?> <?= $err ? 'aria-invalid="true" aria-describedby="' . e($id) . '-err"' : '' ?>><?= e($value ?? '') ?></textarea>
    <?php else: ?>
        <input id="<?= e($id) ?>" type="<?= e($type ?? 'text') ?>" name="<?= e($name) ?>" value="<?= e($value ?? '') ?>" <?= $attrs ?? '' ?> <?= !empty($required) ? 'required' : '' ?> <?= $err ? 'aria-invalid="true" aria-describedby="' . e($id) . '-err"' : '' ?>>
    <?php endif ?>
    <?php if (!empty($hint)): ?><p class="hint"><?= e($hint) ?></p><?php endif ?>
    <?php if ($err && $err !== true): ?><p class="field-error" id="<?= e($id) ?>-err"><?= e($err) ?></p><?php endif ?>
</div>
