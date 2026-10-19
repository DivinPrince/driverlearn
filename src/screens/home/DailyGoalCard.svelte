<script lang="ts">
  import PartyPopper from '@lucide/svelte/icons/party-popper'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Target from '@lucide/svelte/icons/target'
  import ProgressRing from '../../lib/components/ProgressRing.svelte'
  import { tr, T } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { questionsCount } from './format'

  interface Props {
    answered: number
    goal: number
    xpToday: number
  }

  let { answered, goal, xpToday }: Props = $props()

  const met = $derived(answered >= goal)
  const remaining = $derived(Math.max(goal - answered, 0))
  const ratio = $derived(goal > 0 ? answered / goal : 0)
</script>

<section
  class="card relative flex h-full flex-col justify-center overflow-hidden p-5 {met
    ? 'border-leaf-200 bg-gradient-to-br from-leaf-100 via-surface to-surface dark:border-leaf-700/50 dark:from-leaf-700/25'
    : ''}"
  aria-labelledby="home-goal-title"
>
  <a
    class="btn btn-ghost btn-icon btn-sm absolute top-2.5 right-2.5 text-ink-faint"
    href={href('/settings')}
    aria-label={tr({ en: 'Change daily goal', rw: 'Hindura intego y’umunsi' })}
    title={tr({ en: 'Change daily goal', rw: 'Hindura intego y’umunsi' })}
  >
    <Pencil size={16} strokeWidth={2.4} />
  </a>
  <div class="flex items-center gap-4 sm:flex-col sm:text-center">
    <ProgressRing
      value={ratio}
      size={108}
      stroke={11}
      color={met ? 'var(--color-leaf-500)' : 'var(--color-brand-500)'}
      track={met
        ? 'color-mix(in oklab, var(--color-leaf-500) 20%, var(--surface))'
        : 'color-mix(in oklab, var(--color-brand-500) 16%, var(--surface))'}
      label={tr({ en: '{a} of {g} questions answered today', rw: 'Ibibazo {a} kuri {g} wasubije uyu munsi' }, { a: answered, g: goal })}
    >
      <span class="flex flex-col items-center gap-0.5">
        {#if met}<PartyPopper size={20} class="animate-pop text-leaf-600 dark:text-leaf-400" aria-hidden="true" />{/if}
        <span class="font-display text-3xl font-black tabular-nums">{answered}</span>
        <span class="text-xs font-bold text-ink-faint">/ {goal}</span>
      </span>
    </ProgressRing>

    <div class="min-w-0 flex-1">
      <h2 id="home-goal-title" class="eyebrow flex items-center gap-1.5 pr-8 font-sans sm:justify-center sm:px-8">
        <Target size={14} strokeWidth={2.6} aria-hidden="true" />{tr(T.dailyGoal)}
      </h2>
      {#if met}
        <p class="mt-1 font-display text-xl leading-tight font-black text-leaf-700 dark:text-leaf-400">
          {tr({ en: 'Goal reached!', rw: 'Wageze ku ntego!' })}
        </p>
        <p class="mt-1 text-sm text-ink-muted">
          {tr({ en: 'Extra practice still earns XP.', rw: 'Gukomeza kwitoza biracyaguha XP.' })}
        </p>
      {:else}
        <p class="mt-1 font-display text-xl leading-tight font-black">
          {answered === 0
            ? tr({ en: 'Let’s get started', rw: 'Reka dutangire' })
            : tr({ en: '{q} to go', rw: 'Hasigaye {q}' }, { q: questionsCount(remaining) })}
        </p>
        <p class="mt-1 text-sm text-ink-muted">
          {tr({ en: 'Answer {q} today.', rw: 'Subiza {q} uyu munsi.' }, { q: questionsCount(goal) })}
        </p>
      {/if}
      <p class="mt-2 flex items-center gap-1 text-sm font-bold text-sun-600 sm:justify-center dark:text-sun-300">
        ⚡ {tr({ en: '{xp} XP today', rw: 'XP {xp} uyu munsi' }, { xp: xpToday })}
      </p>
      <a class="btn btn-sm mt-3 {met ? 'btn-success' : 'btn-primary'}" href={href('/practice', { mode: 'smart' })}>
        {met ? tr({ en: 'Keep going', rw: 'Komeza' }) : tr({ en: 'Practise now', rw: 'Itoze nonaha' })}
      </a>
    </div>
  </div>
</section>
