<script lang="ts">
  /** The learner's record for one question: answers, memory level and review timing. */
  import ProgressRing from '../../lib/components/ProgressRing.svelte'
  import { MAX_BOX, masteryOf } from '../../lib/engine/srs'
  import { tr } from '../../lib/i18n'
  import type { QState } from '../../lib/types'
  import StatusIcon from './StatusIcon.svelte'
  import { statusOf, timeAgo, timeUntil } from './status'

  interface Props {
    qstate: QState | undefined
  }

  let { qstate }: Props = $props()

  const status = $derived(statusOf(qstate))
  const mastery = $derived(masteryOf(qstate))
  /** Re-read the clock whenever the record changes (e.g. right after answering). */
  const now = $derived.by(() => {
    void qstate?.last
    return Date.now()
  })
  const accuracy = $derived(qstate?.seen ? Math.round((qstate.right / qstate.seen) * 100) : 0)
  const ringColor = $derived(
    status === 'mastered' ? 'var(--color-leaf-500)' : status === 'weak' ? 'var(--color-flame-500)' : 'var(--color-brand-500)',
  )
</script>

<section class="card p-5" aria-labelledby="q-history-title">
  <h2 id="q-history-title" class="eyebrow">{tr({ en: 'Your history', rw: 'Amateka yawe' })}</h2>

  {#if qstate?.seen}
    <div class="mt-4 flex items-center gap-4">
      <ProgressRing value={mastery} size={68} stroke={8} color={ringColor} label={tr({ en: 'Mastery', rw: 'Ubumenyi' })} />
      <div class="min-w-0">
        <StatusIcon {status} labelled class="font-display text-lg font-bold" size={20} />
        <p class="mt-1 text-sm font-bold text-ink-muted">
          {tr({ en: 'Memory level {b} of {m}', rw: 'Urwego rwo kwibuka: {b} kuri {m}' }, { b: qstate.box, m: MAX_BOX })}
        </p>
        <div class="mt-2 flex gap-1" aria-hidden="true">
          {#each Array.from({ length: MAX_BOX }, (_, i) => i) as i (i)}
            <span class="h-2 w-6 rounded-full {i < qstate.box ? 'bg-leaf-500' : 'bg-surface-3'}"></span>
          {/each}
        </div>
      </div>
    </div>

    <dl class="mt-5 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-2xl bg-surface-2 px-2 py-3">
        <dt class="text-xs font-bold text-ink-muted">{tr({ en: 'Answered', rw: 'Wagisubije' })}</dt>
        <dd class="font-display text-2xl font-black tabular-nums">{qstate.seen}×</dd>
      </div>
      <div class="rounded-2xl bg-leaf-100 px-2 py-3 dark:bg-leaf-700/20">
        <dt class="text-xs font-bold text-leaf-700 dark:text-leaf-400">{tr({ en: 'Right', rw: 'Wagitsinze' })}</dt>
        <dd class="font-display text-2xl font-black text-leaf-700 tabular-nums dark:text-leaf-400">{qstate.right}</dd>
      </div>
      <div class="rounded-2xl bg-flame-100 px-2 py-3 dark:bg-flame-700/20">
        <dt class="text-xs font-bold text-flame-600 dark:text-flame-400">{tr({ en: 'Wrong', rw: 'Wakishe' })}</dt>
        <dd class="font-display text-2xl font-black text-flame-600 tabular-nums dark:text-flame-400">{qstate.wrong}</dd>
      </div>
    </dl>

    <dl class="mt-4 space-y-2 text-sm">
      <div class="flex justify-between gap-3">
        <dt class="text-ink-muted">{tr({ en: 'Accuracy', rw: 'Igipimo cy’ukuri' })}</dt>
        <dd class="font-bold tabular-nums">{accuracy}%</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-ink-muted">{tr({ en: 'Last answered', rw: 'Uheruka kugisubiza' })}</dt>
        <dd class="text-right font-bold">{tr(timeAgo(qstate.last, now))}</dd>
      </div>
      <div class="flex justify-between gap-3">
        <dt class="text-ink-muted">{tr({ en: 'Next review', rw: 'Isubiramo rikurikira' })}</dt>
        <dd class="text-right font-bold {qstate.due <= now ? 'text-sun-600 dark:text-sun-300' : ''}">{tr(timeUntil(qstate.due, now))}</dd>
      </div>
    </dl>
  {:else}
    <div class="mt-3 flex items-center gap-3">
      <StatusIcon status="new" size={28} />
      <div class="min-w-0 text-sm">
        <p class="font-bold">{tr({ en: 'You haven’t answered this one yet.', rw: 'Ntabwo uragisubiza.' })}</p>
        <p class="mt-0.5 text-ink-muted">
          {tr({
            en: 'Your answers here and in practice will show up in this panel.',
            rw: 'Ibisubizo utanga hano no mu myitozo bizagaragara aha.',
          })}
        </p>
      </div>
    </div>
  {/if}
</section>
