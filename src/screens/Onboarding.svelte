<script lang="ts">
  /**
   * First-run onboarding: a 3-step full-screen sheet (welcome → language → daily goal).
   * Rendered by App.svelte while settings.onboarded is false. Focus is trapped inside and
   * Escape does not close it; the learner leaves with "Let's go!", "Go to Home" or "Skip".
   */
  import ArrowLeft from '@lucide/svelte/icons/arrow-left'
  import ArrowRight from '@lucide/svelte/icons/arrow-right'
  import BookOpen from '@lucide/svelte/icons/book-open'
  import Check from '@lucide/svelte/icons/check'
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check'
  import Rocket from '@lucide/svelte/icons/rocket'
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
  import type { Component } from 'svelte'
  import { cubicOut } from 'svelte/easing'
  import { fly } from 'svelte/transition'
  import { burst } from '../lib/celebrate'
  import { QUESTIONS, SIGN_QUESTIONS } from '../lib/data'
  import { PASS_RATIO } from '../lib/engine/gamify'
  import { tr, T } from '../lib/i18n'
  import { navigate } from '../lib/router.svelte'
  import { sfx } from '../lib/sound'
  import { settings } from '../lib/state/settings.svelte'
  import type { L10n, Lang } from '../lib/types'
  import OnboardingScene from './settings/OnboardingScene.svelte'
  import { GOALS, OFFICIAL_EXAM } from './settings/options'
  import { radioKeydown, rovingTabindex } from './settings/radio'
  import Switch from './settings/Switch.svelte'

  const STEPS = 3
  let step = $state(0)
  /** +1 when moving forward, -1 when going back (direction of the slide-in). */
  let dir = $state(1)

  let dialog: HTMLDialogElement | undefined = $state()
  let heading: HTMLHeadingElement | undefined = $state()
  let langGroup: HTMLElement | undefined = $state()
  let goalGroup: HTMLElement | undefined = $state()

  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const BUBBLES: L10n[] = [
    { en: 'Hi! I’m Kago 👋', rw: 'Muraho! Nitwa Kago 👋' },
    { en: 'Muraho! Hello!', rw: 'Muraho! Hello!' },
    { en: 'Let’s set a goal!', rw: 'Twishyirireho intego!' },
  ]

  interface Perk {
    icon: Component<{ size?: number; strokeWidth?: number }>
    tone: string
    title: L10n
    body: L10n
  }

  const signCount = SIGN_QUESTIONS.length
  const PERKS: Perk[] = [
    {
      icon: BookOpen,
      tone: 'bg-brand-100 text-brand-600 dark:bg-brand-900/60 dark:text-brand-300',
      title: { en: 'All the official questions', rw: 'Ibibazo byose byemewe' },
      body: {
        en: `All ${QUESTIONS.length} questions from the Rwanda National Police question bank, with simple explanations.`,
        rw: `Ibibazo ${QUESTIONS.length} byose byo mu bubiko bw’ibibazo bwa Polisi y’u Rwanda, n’ibisobanuro byoroshye.`,
      },
    },
    {
      icon: ClipboardCheck,
      tone: 'bg-leaf-100 text-leaf-600 dark:bg-leaf-700/30 dark:text-leaf-400',
      title: { en: 'Mock exams like the real test', rw: 'Ibizamini by’igerageza nk’ibya nyabyo' },
      body: {
        en: `${OFFICIAL_EXAM.size} questions, ${OFFICIAL_EXAM.minutes} minutes, pass with ${Math.ceil(OFFICIAL_EXAM.size * PASS_RATIO)}. No surprises on exam day.`,
        rw: `Ibibazo ${OFFICIAL_EXAM.size}, iminota ${OFFICIAL_EXAM.minutes}, utsinda ugize ${Math.ceil(OFFICIAL_EXAM.size * PASS_RATIO)}. Nta gutungurwa ku munsi w’ikizamini.`,
      },
    },
    {
      icon: TriangleAlert,
      tone: 'bg-flame-100 text-flame-600 dark:bg-flame-700/30 dark:text-flame-400',
      title: { en: 'Road signs trainer', rw: 'Imyitozo y’ibyapa' },
      body: {
        en: signCount
          ? `Learn all ${signCount} road signs with flashcards and quick quizzes.`
          : 'Learn the road signs with flashcards and quick quizzes.',
        rw: signCount
          ? `Menya ibyapa ${signCount} byose ukoresheje amakarita n’utubazo tugufi.`
          : 'Menya ibyapa byo ku muhanda ukoresheje amakarita n’utubazo tugufi.',
      },
    },
  ]

  interface LangCard {
    value: Lang
    name: string
    hello: string
    tag: L10n
  }

  const LANGS: LangCard[] = [
    { value: 'rw', name: 'Ikinyarwanda', hello: 'Muraho!', tag: { en: 'Language of the exam', rw: 'Ururimi rw’ikizamini' } },
    { value: 'en', name: 'English', hello: 'Hello!', tag: { en: 'Translated study aid', rw: 'Ubusemuzi bwo kwiga' } },
  ]
  const LANG_VALUES = LANGS.map((l) => l.value)
  const GOAL_VALUES = GOALS.map((g) => g.value)

  // Open as a modal dialog: the page behind becomes inert and the sheet sits in the top layer.
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal()
  })

  // Freeze the page behind while the sheet is up.
  $effect(() => {
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prev
    }
  })

  // Move focus to the step title so screen readers announce each new step.
  $effect(() => {
    void step
    queueMicrotask(() => heading?.focus({ preventScroll: true }))
  })

  function go(to: number) {
    if (to < 0 || to >= STEPS || to === step) return
    dir = to > step ? 1 : -1
    step = to
    sfx.tap()
  }

  function finish(path?: string, query?: Record<string, string | number>) {
    settings.onboarded = true
    if (path) navigate(path, query)
  }

  function letsGo() {
    sfx.complete()
    burst(0.5, 0.75)
    finish('/practice', { mode: 'smart', n: 10 })
  }

  function setLang(v: Lang) {
    settings.lang = v
    sfx.tap()
  }

  function setGoal(v: number) {
    settings.dailyGoal = v
    sfx.tap()
  }

  const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

  function onkeydown(e: KeyboardEvent) {
    // Keep keys away from screen-level shortcuts (e.g. Enter in practice) behind the sheet.
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      return
    }
    if (e.key !== 'Tab' || !dialog) return
    const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || !dialog.contains(active) || active === heading)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const fx = $derived({ x: reducedMotion ? 0 : dir * 48, duration: reducedMotion ? 0 : 280, easing: cubicOut })
</script>

<dialog
  bind:this={dialog}
  class="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-ink backdrop:bg-transparent"
  aria-labelledby="onboarding-title"
  aria-describedby="onboarding-desc"
  oncancel={(e) => e.preventDefault()}
  onclose={() => {
    if (!settings.onboarded) dialog?.showModal()
  }}
  {onkeydown}
>
  <div class="flex h-full w-full items-stretch justify-center bg-brand-950/55 backdrop-blur-md sm:items-center sm:p-6">
    <div
      class="flex h-full w-full animate-pop flex-col overflow-hidden bg-surface sm:h-[min(100%,48rem)] sm:max-w-2xl sm:rounded-4xl sm:border sm:border-line sm:shadow-2xl"
    >
      <!-- Scene + top bar -->
      <div class="relative h-[calc(12.5rem+env(safe-area-inset-top))] shrink-0 sm:h-52 [@media(max-height:700px)]:h-[calc(11rem+env(safe-area-inset-top))]">
        <OnboardingScene {step} steps={STEPS} bubble={tr(BUBBLES[step])} mood={step === 2 ? 'wow' : 'happy'} />
        <div class="absolute inset-x-0 top-0 flex items-center gap-3 px-4 pt-[max(0.85rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
          <div class="flex flex-1 items-center gap-1.5">
            {#each { length: STEPS } as _, i (i)}
              <span
                class="h-2.5 rounded-full transition-all duration-300 {i === step
                  ? 'w-7 bg-white'
                  : i < step
                    ? 'w-2.5 bg-white/85'
                    : 'w-2.5 bg-white/40'}"
                aria-hidden="true"
              ></span>
            {/each}
            <span class="sr-only">{tr({ en: 'Step {i} of {n}', rw: 'Intambwe ya {i} kuri {n}' }, { i: step + 1, n: STEPS })}</span>
          </div>
          <button
            type="button"
            class="rounded-full bg-white/90 px-4 py-1.5 font-display text-sm font-bold text-brand-700 shadow-sm transition hover:bg-white dark:bg-white/15 dark:text-white dark:hover:bg-white/25"
            onclick={() => finish()}
          >
            {tr({ en: 'Skip', rw: 'Simbuka' })}
          </button>
        </div>
      </div>

      <!-- Step content -->
      <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pt-6 pb-5 sm:px-8 sm:pt-7">
        {#key step}
          <div in:fly={fx}>
            {#if step === 0}
              <h1 bind:this={heading} id="onboarding-title" tabindex="-1" class="text-center text-[1.75rem] leading-tight font-black outline-none sm:text-3xl">
                {tr({ en: 'Welcome to', rw: 'Murakaza neza kuri' })}
                <span class="whitespace-nowrap">Driver<span class="text-brand-500">Learn</span></span>
              </h1>
              <p id="onboarding-desc" class="mx-auto mt-2 max-w-sm text-center text-ink-muted">
                {tr({
                  en: 'Get ready for your provisional driving licence theory test — a few fun minutes a day.',
                  rw: 'Itegure ikizamini cy’amategeko y’umuhanda cy’uruhushya rw’agateganyo — iminota mike ishimishije buri munsi.',
                })}
              </p>
              <ul class="mt-6 flex flex-col gap-3">
                {#each PERKS as p, i (i)}
                  {@const Icon = p.icon}
                  <li class="flex animate-rise items-start gap-3.5 rounded-3xl bg-surface-2 p-3.5" style:animation-delay="{120 + i * 90}ms">
                    <span class="grid size-11 shrink-0 place-items-center rounded-2xl {p.tone}" aria-hidden="true"><Icon size={22} strokeWidth={2.3} /></span>
                    <span class="min-w-0">
                      <span class="block font-display font-bold">{tr(p.title)}</span>
                      <span class="mt-0.5 block text-sm text-ink-muted">{tr(p.body)}</span>
                    </span>
                  </li>
                {/each}
              </ul>
            {:else if step === 1}
              <h1 bind:this={heading} id="onboarding-title" tabindex="-1" class="text-center text-[1.75rem] leading-tight font-black outline-none sm:text-3xl">
                {tr({ en: 'Choose your language', rw: 'Hitamo ururimi' })}
              </h1>
              <p id="onboarding-desc" class="mx-auto mt-2 max-w-sm text-center text-ink-muted">
                {tr({ en: 'You can change it any time in Settings.', rw: 'Ushobora kuruhindura igihe cyose muri Igenamiterere.' })}
              </p>
              <div
                bind:this={langGroup}
                role="radiogroup"
                tabindex="-1"
                aria-labelledby="onboarding-title"
                class="mt-6 grid grid-cols-2 gap-3"
                onkeydown={(e) => radioKeydown(e, langGroup, LANG_VALUES, settings.lang, setLang)}
              >
                {#each LANGS as l (l.value)}
                  {@const checked = settings.lang === l.value}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    tabindex={rovingTabindex(LANG_VALUES, settings.lang, l.value)}
                    lang={l.value}
                    onclick={() => setLang(l.value)}
                    class="choice relative flex flex-col items-start rounded-3xl border-2 p-4 text-left transition-[background-color,border-color,transform,box-shadow] duration-150 sm:p-5 {checked
                      ? 'border-brand-400 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/60'
                      : 'border-line-strong bg-surface hover:bg-surface-2'}"
                    style:--edge={checked ? 'var(--color-brand-400)' : 'var(--line-strong)'}
                  >
                    <span
                      class="absolute top-3 right-3 grid size-6 place-items-center rounded-full border-2 transition {checked
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-line-strong text-transparent'}"
                      aria-hidden="true"><Check size={14} strokeWidth={3.4} /></span
                    >
                    <span class="font-display text-2xl font-black sm:text-3xl {checked ? 'text-brand-600 dark:text-brand-300' : ''}">{l.hello}</span>
                    <span class="mt-1 font-display text-base font-bold sm:text-lg">{l.name}</span>
                    <span class="mt-2 text-xs font-bold text-ink-muted" lang={settings.lang}>{tr(l.tag)}</span>
                  </button>
                {/each}
              </div>

              <div class="mt-5 flex items-center gap-4 rounded-3xl bg-surface-2 p-4">
                <div class="min-w-0 flex-1">
                  <p id="onboarding-translation" class="font-display font-bold">
                    {settings.lang === 'rw'
                      ? tr({ en: 'Also show English', rw: 'Erekana n’Icyongereza' })
                      : tr({ en: 'Also show Kinyarwanda', rw: 'Erekana n’Ikinyarwanda' })}
                  </p>
                  <p id="onboarding-translation-desc" class="mt-0.5 text-sm text-ink-muted">
                    {tr({
                      en: 'The translation appears under each question — great for learning both.',
                      rw: 'Ubusemuzi bugaragara munsi ya buri kibazo — bigufasha kwiga indimi zombi.',
                    })}
                  </p>
                </div>
                <Switch
                  bind:checked={settings.showTranslation}
                  labelledby="onboarding-translation"
                  describedby="onboarding-translation-desc"
                  onchange={() => sfx.tap()}
                />
              </div>
            {:else}
              <h1 bind:this={heading} id="onboarding-title" tabindex="-1" class="text-center text-[1.75rem] leading-tight font-black outline-none sm:text-3xl">
                {tr({ en: 'Pick a daily goal', rw: 'Hitamo intego y’umunsi' })}
              </h1>
              <p id="onboarding-desc" class="mx-auto mt-2 max-w-sm text-center text-ink-muted">
                {tr({
                  en: 'Small steps every day add up. You can change it later.',
                  rw: 'Intambwe nto za buri munsi zigeza kure. Ushobora kuyihindura nyuma.',
                })}
              </p>
              <div
                bind:this={goalGroup}
                role="radiogroup"
                tabindex="-1"
                aria-labelledby="onboarding-title"
                class="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3"
                onkeydown={(e) => radioKeydown(e, goalGroup, GOAL_VALUES, settings.dailyGoal, setGoal)}
              >
                {#each GOALS as g (g.value)}
                  {@const checked = settings.dailyGoal === g.value}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    tabindex={rovingTabindex(GOAL_VALUES, settings.dailyGoal, g.value)}
                    onclick={() => setGoal(g.value)}
                    class="choice flex items-center gap-3 rounded-3xl border-2 px-4 py-3 text-left transition-[background-color,border-color,transform,box-shadow] duration-150 {checked
                      ? 'border-leaf-500 bg-leaf-100 dark:border-leaf-500 dark:bg-leaf-700/25'
                      : 'border-line-strong bg-surface hover:bg-surface-2'}"
                    style:--edge={checked ? 'var(--color-leaf-500)' : 'var(--line-strong)'}
                  >
                    <span
                      class="grid size-11 shrink-0 place-items-center rounded-2xl text-2xl {checked ? 'bg-white/80 dark:bg-white/10' : 'bg-surface-2'}"
                      aria-hidden="true">{g.emoji}</span
                    >
                    <span class="min-w-0 flex-1">
                      <span class="block font-display text-lg leading-tight font-bold">{tr(g.name)}</span>
                      <span class="block text-sm text-ink-muted">
                        {tr({ en: '{n} questions a day', rw: 'Ibibazo {n} ku munsi' }, { n: g.value })}
                      </span>
                      <span class="hidden text-xs font-bold text-ink-faint sm:block">≈ {tr({ en: '{m} min', rw: 'iminota {m}' }, { m: g.minutes })}</span>
                    </span>
                    <span class="shrink-0 text-xs font-bold text-ink-faint max-[380px]:hidden sm:hidden">≈ {tr({ en: '{m} min', rw: 'iminota {m}' }, { m: g.minutes })}</span>
                    <span
                      class="grid size-6 shrink-0 place-items-center rounded-full border-2 transition {checked
                        ? 'border-leaf-600 bg-leaf-500 text-white'
                        : 'border-line-strong text-transparent'}"
                      aria-hidden="true"><Check size={14} strokeWidth={3.4} /></span
                    >
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/key}
      </div>

      <!-- Actions -->
      <footer class="shrink-0 border-t border-line bg-surface px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-6">
        <div class="flex items-center gap-3">
          {#if step > 0}
            <button type="button" class="btn btn-ghost btn-icon sm:aspect-auto sm:px-4" onclick={() => go(step - 1)} aria-label={tr(T.back)}>
              <ArrowLeft size={22} /><span class="hidden sm:inline">{tr(T.back)}</span>
            </button>
          {/if}
          {#if step < STEPS - 1}
            <button type="button" class="btn btn-primary btn-lg flex-1 sm:ml-auto sm:flex-none sm:min-w-52" onclick={() => go(step + 1)}>
              {step === 0 ? tr({ en: 'Let’s start', rw: 'Reka dutangire' }) : tr(T.continue)}
              <ArrowRight size={20} />
            </button>
          {:else}
            <button type="button" class="btn btn-ghost hidden sm:ml-auto sm:inline-flex" onclick={() => finish('/')}>
              {tr({ en: 'Go to Home', rw: 'Jya Ahabanza' })}
            </button>
            <button type="button" class="btn btn-success btn-lg flex-1 sm:flex-none sm:min-w-52" onclick={letsGo}>
              <Rocket size={20} />{tr({ en: 'Let’s go!', rw: 'Tugende!' })}
            </button>
          {/if}
        </div>
        {#if step === STEPS - 1}
          <div class="mt-2 flex items-center justify-center gap-2 text-center text-xs text-ink-faint sm:justify-end">
            <span>{tr({ en: 'Starts a 10-question practice', rw: 'Bitangiza imyitozo y’ibibazo 10' })}</span>
            <span aria-hidden="true" class="sm:hidden">·</span>
            <button type="button" class="-my-1.5 rounded-lg px-2 py-1.5 font-bold text-brand-600 underline-offset-2 hover:underline sm:hidden dark:text-brand-300" onclick={() => finish('/')}>
              {tr({ en: 'Go to Home', rw: 'Jya Ahabanza' })}
            </button>
          </div>
        {/if}
      </footer>
    </div>
  </div>
</dialog>

<style>
  /* Chunky, tappable choice cards with a bottom edge that collapses on press (like .btn). */
  .choice {
    box-shadow: 0 4px 0 var(--edge);
  }
  .choice:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--edge);
  }
</style>
