<script lang="ts">
  import Lock from '@lucide/svelte/icons/lock'
  import { ACHIEVEMENTS } from '../../lib/engine/gamify'
  import { tr } from '../../lib/i18n'
  import { formatDateShort } from './format'

  interface Props {
    /** Achievement id -> epoch ms when unlocked. */
    unlocked: Record<string, number>
    /** Ids unlocked during this session (highlighted). */
    fresh: string[]
  }

  let { unlocked, fresh }: Props = $props()

  const items = $derived(
    ACHIEVEMENTS.map((a) => {
      const at: number | undefined = unlocked[a.id]
      return { def: a, at, isNew: !!at && fresh.includes(a.id) }
    }),
  )
  const count = $derived(items.filter((i) => i.at).length)
</script>

<section class="card p-5 sm:p-6" aria-labelledby="achievements-title">
  <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
    <h2 id="achievements-title" class="text-lg font-bold">{tr({ en: 'Achievements', rw: 'Ibihembo' })}</h2>
    <div class="flex min-w-40 flex-1 items-center gap-3 sm:max-w-64 sm:flex-none">
      <div
        class="bar h-2.5 flex-1"
        role="progressbar"
        aria-label={tr({ en: 'Achievements unlocked', rw: 'Ibihembo wabonye' })}
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={count}
      >
        <span class="bg-gradient-to-r from-sun-300 to-sun-500" style:width="{(count / items.length) * 100}%"></span>
      </div>
      <span class="shrink-0 font-display text-sm font-bold tabular-nums">{count}/{items.length}</span>
    </div>
  </div>

  <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {#each items as { def, at, isNew } (def.id)}
      <li
        class="relative flex flex-col items-center rounded-3xl border-2 px-3 pt-4 pb-3.5 text-center transition {at
          ? isNew
            ? 'animate-pop border-sun-400 bg-sun-100/70 shadow-lg shadow-sun-400/25 dark:border-sun-500 dark:bg-sun-600/15 dark:shadow-none'
            : 'border-sun-200 bg-gradient-to-b from-sun-100/60 to-surface dark:border-sun-600/40 dark:from-sun-600/10 dark:to-surface'
          : 'border-dashed border-line bg-surface-2/60'}"
      >
        {#if isNew}
          <span
            class="absolute -top-2.5 left-1/2 -translate-x-1/2 animate-shine rounded-full bg-[linear-gradient(110deg,var(--color-sun-400)_35%,#fff8c9_50%,var(--color-sun-400)_65%)] bg-[length:200%_100%] px-2.5 text-[11px] leading-5 font-black tracking-wide text-brand-950 uppercase shadow"
            >{tr({ en: 'New!', rw: 'Gishya!' })}</span
          >
        {/if}
        <span
          class="relative grid size-16 place-items-center rounded-full text-4xl {at
            ? 'bg-white shadow-md ring-4 ring-sun-300/60 dark:bg-surface-3 dark:ring-sun-500/30'
            : 'bg-surface-3'}"
          aria-hidden="true"
        >
          <span class={at ? '' : 'opacity-35 grayscale'}>{def.emoji}</span>
          {#if !at}
            <span class="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-surface bg-ink-faint text-surface">
              <Lock size={13} strokeWidth={3} />
            </span>
          {/if}
        </span>
        <h3 class="mt-3 font-display leading-tight font-bold {at ? '' : 'text-ink-muted'}">{tr(def.name)}</h3>
        <p class="mt-1 text-xs leading-snug text-balance {at ? 'text-ink-muted' : 'text-ink-faint'}">{tr(def.desc)}</p>
        <p class="mt-auto pt-2.5 text-[11px] font-bold {at ? 'text-sun-600 dark:text-sun-300' : 'text-ink-faint'}">
          {#if at}
            {tr({ en: 'Unlocked {d}', rw: 'Cyabonetse {d}' }, { d: formatDateShort(at) })}
          {:else}
            {tr({ en: 'Locked', rw: 'Kirafunze' })}
          {/if}
        </p>
      </li>
    {/each}
  </ul>
</section>
