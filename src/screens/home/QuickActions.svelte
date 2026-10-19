<script lang="ts">
  import Bookmark from '@lucide/svelte/icons/bookmark'
  import RefreshCcw from '@lucide/svelte/icons/refresh-ccw'
  import Sparkles from '@lucide/svelte/icons/sparkles'
  import Target from '@lucide/svelte/icons/target'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import type { Component } from 'svelte'
  import { getQuestion, QUESTIONS, SIGN_QUESTIONS } from '../../lib/data'
  import { selectMistakes } from '../../lib/engine/select'
  import { isDue } from '../../lib/engine/srs'
  import { tr } from '../../lib/i18n'
  import { href } from '../../lib/router.svelte'
  import { progress } from '../../lib/state/progress.svelte'
  import type { L10n } from '../../lib/types'
  import { num } from './format'

  interface Props {
    now: number
  }

  let { now }: Props = $props()

  type Tone = 'flame' | 'brand' | 'grape' | 'sun' | 'leaf'

  interface Tile {
    id: string
    label: L10n
    count: number
    hint: string
    url: string
    enabled: boolean
    tone: Tone
    icon: Component<{ size?: number; strokeWidth?: number }>
    /** Learned/total bar (signs trainer). */
    meter?: number
    wide?: boolean
  }

  /** Static class strings per tone so Tailwind can see them. */
  const TONES: Record<Tone, { badge: string; hover: string; count: string }> = {
    flame: {
      badge: 'bg-flame-100 text-flame-600 dark:bg-flame-700/30 dark:text-flame-400',
      hover: 'hover:border-flame-200 dark:hover:border-flame-700/60',
      count: 'text-flame-600 dark:text-flame-400',
    },
    brand: {
      badge: 'bg-brand-100 text-brand-600 dark:bg-brand-900/60 dark:text-brand-300',
      hover: 'hover:border-brand-200 dark:hover:border-brand-800',
      count: 'text-brand-600 dark:text-brand-300',
    },
    grape: {
      badge: 'bg-grape-100 text-grape-600 dark:bg-grape-600/25 dark:text-grape-400',
      hover: 'hover:border-grape-400/50',
      count: 'text-grape-600 dark:text-grape-400',
    },
    sun: {
      badge: 'bg-sun-100 text-sun-600 dark:bg-sun-600/25 dark:text-sun-300',
      hover: 'hover:border-sun-300 dark:hover:border-sun-600/60',
      count: 'text-sun-600 dark:text-sun-300',
    },
    leaf: {
      badge: 'bg-leaf-100 text-leaf-600 dark:bg-leaf-700/30 dark:text-leaf-400',
      hover: 'hover:border-leaf-200 dark:hover:border-leaf-700/60',
      count: 'text-leaf-600 dark:text-leaf-400',
    },
  }

  const signIds = new Set(SIGN_QUESTIONS.map((q) => q.id))

  const tiles = $derived.by((): Tile[] => {
    const mistakes = selectMistakes(QUESTIONS, progress.q).length
    const due = QUESTIONS.filter((q) => isDue(progress.q[q.id], now)).length
    const unseen = QUESTIONS.filter((q) => !progress.q[q.id]?.seen).length
    const bookmarks = progress.bookmarks.filter((id) => getQuestion(id)).length
    const signsTotal = SIGN_QUESTIONS.length
    const signsLearned = progress.signsLearned.filter((id) => signIds.has(id)).length
    const signsLeft = signsTotal - signsLearned

    return [
      {
        id: 'mistakes',
        label: { en: 'Fix mistakes', rw: 'Kosora amakosa' },
        count: mistakes,
        hint: mistakes
          ? tr({ en: 'Turn misses into wins', rw: 'Hindura amakosa intsinzi' })
          : tr({ en: 'No mistakes to fix', rw: 'Nta makosa yo gukosora' }),
        url: href('/practice', { mode: 'mistakes' }),
        enabled: mistakes > 0,
        tone: 'flame',
        icon: Target,
      },
      {
        id: 'due',
        label: { en: 'Due reviews', rw: 'Ibyo gusubiramo' },
        count: due,
        hint: due ? tr({ en: 'Ready to refresh', rw: 'Igihe cyo kubisubiramo' }) : tr({ en: 'All caught up', rw: 'Nta na kimwe gisigaye' }),
        url: href('/practice', { mode: 'smart' }),
        enabled: due > 0,
        tone: 'brand',
        icon: RefreshCcw,
      },
      {
        id: 'unseen',
        label: { en: 'New questions', rw: 'Ibibazo bishya' },
        count: unseen,
        hint: unseen ? tr({ en: 'Not seen yet', rw: 'Utarabona' }) : tr({ en: 'You’ve seen them all', rw: 'Wabibonye byose' }),
        url: href('/practice', { mode: 'unseen' }),
        enabled: unseen > 0,
        tone: 'grape',
        icon: Sparkles,
      },
      {
        id: 'bookmarks',
        label: { en: 'Bookmarks', rw: 'Ibyo nabitse' },
        count: bookmarks,
        hint: bookmarks ? tr({ en: 'Saved for later', rw: 'Uzabisubiramo nyuma' }) : tr({ en: 'None saved yet', rw: 'Nta kibazo urabika' }),
        url: href('/practice', { mode: 'bookmarks' }),
        enabled: bookmarks > 0,
        tone: 'sun',
        icon: Bookmark,
      },
      {
        id: 'signs',
        label: { en: 'Road signs', rw: 'Ibyapa' },
        count: signsLeft,
        hint: !signsTotal
          ? tr({ en: 'Coming soon', rw: 'Biraza vuba' })
          : signsLeft
            ? tr({ en: '{l} of {t} learned', rw: '{l} kuri {t} wabimenye' }, { l: signsLearned, t: signsTotal })
            : tr({ en: 'All signs learned!', rw: 'Wamenye ibyapa byose!' }),
        url: href('/signs'),
        enabled: signsTotal > 0,
        tone: 'leaf',
        icon: TriangleAlert,
        meter: signsTotal ? signsLearned / signsTotal : 0,
        wide: true,
      },
    ]
  })
</script>

<section aria-labelledby="home-quick-title">
  <h2 id="home-quick-title" class="mb-3 text-xl font-bold">{tr({ en: 'Quick practice', rw: 'Imyitozo yihuse' })}</h2>
  <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    {#each tiles as t (t.id)}
      {@const Icon = t.icon}
      {@const tone = TONES[t.tone]}
      <li class={t.wide ? 'col-span-2 lg:col-span-1' : ''}>
        {#snippet body()}
          <span class="flex items-start justify-between gap-2">
            <span class="grid size-11 shrink-0 place-items-center rounded-2xl {t.enabled ? tone.badge : 'bg-surface-3 text-ink-faint'}" aria-hidden="true">
              <Icon size={22} strokeWidth={2.4} />
            </span>
            <span class="font-display text-3xl leading-none font-black tabular-nums {t.enabled && t.count ? tone.count : 'text-ink-faint'}">
              {#if t.id === 'signs' && t.enabled && !t.count}✓{:else}{num(t.count)}{/if}
            </span>
          </span>
          <span class="mt-3 block font-display leading-tight font-bold">{tr(t.label)}</span>
          <span class="mt-0.5 block text-xs font-semibold text-ink-muted">{t.hint}</span>
          {#if t.meter !== undefined && t.enabled}
            <span class="bar mt-2.5 block h-2" aria-hidden="true">
              <span class="bg-leaf-500" style:width="{t.meter * 100}%"></span>
            </span>
          {/if}
        {/snippet}
        {#if t.enabled}
          <a
            href={t.url}
            class="card flex h-full flex-col p-4 transition hover:-translate-y-0.5 active:translate-y-0 {tone.hover}"
          >
            {@render body()}
          </a>
        {:else}
          <div class="card-flat flex h-full flex-col bg-surface-2/60 p-4 shadow-none">
            {@render body()}
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</section>
