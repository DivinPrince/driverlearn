<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right'
  import Lock from '@lucide/svelte/icons/lock'
  import { ACHIEVEMENTS, type AchievementDef } from '../../lib/engine/gamify'
  import { tr } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { progress } from '../../lib/state/progress.svelte'
  import { ui } from '../../lib/state/ui.svelte'
  import { relativeDay } from './format'

  interface Props {
    now: number
  }

  let { now }: Props = $props()

  const SLOTS = 4

  interface Badge {
    def: AchievementDef
    /** Epoch ms when unlocked, or null when still locked. */
    at: number | null
  }

  const unlockedCount = $derived(ACHIEVEMENTS.filter((a) => progress.achievements[a.id]).length)

  /** Most recently unlocked first; remaining slots preview what to unlock next. */
  const badges = $derived.by((): Badge[] => {
    const unlocked: Badge[] = ACHIEVEMENTS.filter((a) => progress.achievements[a.id])
      .map((def) => ({ def, at: progress.achievements[def.id] }))
      .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
      .slice(0, SLOTS)
    const locked: Badge[] = ACHIEVEMENTS.filter((a) => !progress.achievements[a.id])
      .slice(0, SLOTS - unlocked.length)
      .map((def) => ({ def, at: null }))
    return [...unlocked, ...locked]
  })
</script>

<section class="card p-5" aria-labelledby="home-achievements-title">
  <div class="flex items-center justify-between gap-3">
    <div class="flex min-w-0 items-center gap-2">
      <h2 id="home-achievements-title" class="truncate text-xl font-bold">{tr({ en: 'Achievements', rw: 'Ibihembo' })}</h2>
      <span class="chip tabular-nums">{unlockedCount}/{ACHIEVEMENTS.length}</span>
    </div>
    <a class="btn btn-ghost btn-sm -mr-2 shrink-0 text-brand-600 dark:text-brand-300" href={href('/progress')}>
      {tr({ en: 'See all', rw: 'Reba byose' })}<ChevronRight size={18} strokeWidth={2.6} aria-hidden="true" />
    </a>
  </div>

  {#if unlockedCount === 0}
    <p class="mt-1 text-sm text-ink-muted">
      {tr({ en: 'Earn your first badge by answering a question.', rw: 'Bona igihembo cya mbere usubiza ikibazo.' })}
    </p>
  {/if}

  <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
    {#each badges as b (b.def.id)}
      {@const fresh = ui.freshAchievements.includes(b.def.id)}
      <li>
        <a
          href={href('/progress')}
          class="relative flex h-full flex-col items-center gap-1.5 rounded-3xl border-2 p-3.5 text-center transition hover:-translate-y-0.5 {b.at
            ? 'border-sun-200 bg-sun-100/50 hover:border-sun-300 dark:border-sun-600/40 dark:bg-surface-2 dark:hover:border-sun-500/70'
            : 'border-dashed border-line bg-surface-2/50 hover:border-line-strong'}"
        >
          {#if fresh}
            <span class="chip absolute top-2 right-2 animate-pop bg-leaf-500 px-2 py-0.5 text-[0.65rem] text-white">
              {tr({ en: 'New', rw: 'Gishya' })}
            </span>
          {/if}
          <span
            class="relative grid size-14 place-items-center rounded-full text-3xl {b.at
              ? 'bg-gradient-to-br from-sun-200 to-sun-400 shadow-sm dark:from-sun-300 dark:to-sun-500'
              : 'bg-surface-3 grayscale'}"
            aria-hidden="true"
          >
            <span class={b.at ? '' : 'opacity-40'}>{b.def.emoji}</span>
            {#if !b.at}
              <span class="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border-2 border-surface bg-ink-faint text-surface">
                <Lock size={12} strokeWidth={3} />
              </span>
            {/if}
          </span>
          <span class="mt-1 font-display text-sm leading-tight font-bold {b.at ? '' : 'text-ink-muted'}">{tr(b.def.name)}</span>
          <span class="text-xs leading-snug {b.at ? 'font-semibold text-ink-muted' : 'text-ink-faint'}">
            {#if b.at}
              <span class="sr-only">{tr({ en: 'Unlocked', rw: 'Wakibonye' })}:</span>
              {relativeDay(b.at, now)}
            {:else}
              <span class="sr-only">{tr({ en: 'Locked', rw: 'Ntukirabona' })}:</span>
              {tr(b.def.desc)}
            {/if}
          </span>
        </a>
      </li>
    {/each}
  </ul>
</section>
