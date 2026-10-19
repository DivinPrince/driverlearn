<script lang="ts">
  import BadgeCheck from '@lucide/svelte/icons/badge-check'
  import Info from '@lucide/svelte/icons/info'
  import ShieldCheck from '@lucide/svelte/icons/shield-check'
  import Smartphone from '@lucide/svelte/icons/smartphone'
  import Sparkles from '@lucide/svelte/icons/sparkles'
  import SquarePlus from '@lucide/svelte/icons/square-plus'
  import WifiOff from '@lucide/svelte/icons/wifi-off'
  import { version } from '../../../package.json'
  import { celebrate } from '../../lib/celebrate'
  import { QUESTIONS, QUESTIONS_BY_TOPIC, SIGN_QUESTIONS } from '../../lib/data'
  import { PASS_RATIO } from '../../lib/engine/gamify'
  import { tr, T } from '../../lib/i18n'
  import { settings } from '../../lib/state/settings.svelte'
  import { TOPICS } from '../../lib/topics'
  import type { L10n } from '../../lib/types'
  import { install, promptInstall, type InstallPlatform } from './install.svelte'
  import { OFFICIAL_EXAM } from './options'
  import Section from './Section.svelte'

  const topicCount = TOPICS.filter((t) => (QUESTIONS_BY_TOPIC[t.id]?.length ?? 0) > 0).length
  const officialPass = Math.ceil(OFFICIAL_EXAM.size * PASS_RATIO)

  interface Fact {
    value: number
    /** Label for exactly one. */
    one: L10n
    label: L10n
    emoji: string
    tone: string
  }

  const facts: Fact[] = [
    { value: QUESTIONS.length, one: { en: 'question', rw: 'ikibazo' }, label: T.questions, emoji: '📝', tone: 'bg-brand-100 dark:bg-brand-900/50' },
    { value: SIGN_QUESTIONS.length, one: { en: 'road sign', rw: 'icyapa' }, label: { en: 'road signs', rw: 'ibyapa' }, emoji: '🛑', tone: 'bg-flame-100 dark:bg-flame-700/30' },
    { value: topicCount, one: { en: 'topic', rw: 'isomo' }, label: { en: 'topics', rw: 'amasomo' }, emoji: '📚', tone: 'bg-leaf-100 dark:bg-leaf-700/30' },
  ].filter((f) => f.value > 0)

  const HOW_TO: Record<InstallPlatform, L10n> = {
    ios: {
      en: 'On iPhone or iPad: open this page in Safari, tap Share, then “Add to Home Screen”.',
      rw: 'Kuri iPhone cyangwa iPad: fungura uru rupapuro muri Safari, kanda Share, hanyuma “Add to Home Screen”.',
    },
    android: {
      en: 'In Chrome, open the menu (⋮) and tap “Install app” or “Add to Home screen”.',
      rw: 'Muri Chrome, fungura urutonde (⋮) hanyuma ukande “Install app” cyangwa “Add to Home screen”.',
    },
    desktop: {
      en: 'In Chrome or Edge, click the install icon at the right of the address bar.',
      rw: 'Muri Chrome cyangwa Edge, kanda ku kamenyetso ko gushyiraho kari iburyo bw’aho wandika aderesi.',
    },
  }

  /** Show the first-run onboarding again (App renders it while onboarded is false). */
  function replayTour() {
    settings.onboarded = false
  }

  async function installNow() {
    if (await promptInstall()) celebrate(1000)
  }
</script>

<Section
  title={tr({ en: 'About DriverLearn', rw: 'Ibyerekeye DriverLearn' })}
  subtitle={tr({ en: 'Made for learner drivers in Rwanda 🇷🇼', rw: 'Yakorewe abiga gutwara mu Rwanda 🇷🇼' })}
  icon={Info}
  tone="bg-grape-100 text-grape-600 dark:bg-grape-600/25 dark:text-grape-400"
>
  <div class="py-4">
    <ul class="grid gap-2 {facts.length === 3 ? 'grid-cols-3' : facts.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}">
      {#each facts as f (f.emoji)}
        <li class="flex flex-col items-center gap-1 rounded-2xl bg-surface-2 px-2 py-3 text-center">
          <span class="grid size-9 place-items-center rounded-xl text-lg {f.tone}" aria-hidden="true">{f.emoji}</span>
          <span class="font-display text-2xl leading-none font-black tabular-nums">{f.value}</span>
          <span class="text-xs font-bold text-ink-muted">{tr(f.value === 1 ? f.one : f.label)}</span>
        </li>
      {/each}
    </ul>

    <div class="mt-4 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/50">
      <ShieldCheck size={20} class="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
      <p class="text-sm text-ink">
        {tr({
          en: 'Questions from the official Rwanda National Police provisional driving licence question bank, in Kinyarwanda. English translations and explanations are study aids — on exam day the official wording prevails.',
          rw: 'Ibibazo byavuye mu bubiko bw’ibibazo bwemewe bwa Polisi y’u Rwanda bw’uruhushya rwo gutwara rw’agateganyo, mu Kinyarwanda. Ubusemuzi mu Cyongereza n’ibisobanuro ni imfashanyigisho gusa — ku munsi w’ikizamini, amagambo yemewe ni yo agenderwaho.',
        })}
      </p>
    </div>

    <p class="mt-3 flex items-center gap-2 text-sm text-ink-muted">
      <BadgeCheck size={18} class="shrink-0 text-leaf-600 dark:text-leaf-400" aria-hidden="true" />
      {tr(
        {
          en: 'The real test: {n} questions · {m} minutes · pass with {p}/{n}.',
          rw: 'Ikizamini nyirizina: ibibazo {n} · iminota {m} · utsinda ugize {p}/{n}.',
        },
        { n: OFFICIAL_EXAM.size, m: OFFICIAL_EXAM.minutes, p: officialPass },
      )}
    </p>
  </div>

  <div class="py-4">
    <div class="flex items-start gap-3">
      <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300" aria-hidden="true">
        <Smartphone size={20} />
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="font-display font-bold">{tr({ en: 'Install the app', rw: 'Shyiraho porogaramu' })}</h3>
        <p class="mt-0.5 text-sm text-ink-muted">
          {tr({
            en: 'Add DriverLearn to your home screen. It opens like a normal app and keeps working offline after your first visit.',
            rw: 'Shyira DriverLearn ku rupapuro rw’ibanze rwa telefone yawe. Ifunguka nk’izindi porogaramu kandi ikomeza gukora nta murandasi nyuma yo kuyifungura bwa mbere.',
          })}
        </p>
        <p class="mt-2 inline-flex items-center gap-1.5 chip">
          <WifiOff size={14} aria-hidden="true" />{tr({ en: 'Works offline', rw: 'Ikora nta murandasi' })}
        </p>

        {#if install.installed}
          <p class="mt-3 flex items-center gap-2 text-sm font-bold text-leaf-700 dark:text-leaf-400">
            <BadgeCheck size={18} aria-hidden="true" />{tr({ en: 'Installed — you’re using the app.', rw: 'Yashyizweho — uri gukoresha porogaramu.' })}
          </p>
        {:else if install.canPrompt}
          <button class="btn btn-primary btn-sm mt-3" onclick={installNow}>
            <SquarePlus size={18} />{tr({ en: 'Install DriverLearn', rw: 'Shyiraho DriverLearn' })}
          </button>
        {:else}
          <p class="mt-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink">{tr(HOW_TO[install.platform])}</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="flex flex-col items-center gap-2 pt-4">
    <button class="btn btn-ghost btn-sm" onclick={replayTour}>
      <Sparkles size={16} />{tr({ en: 'Replay the welcome tour', rw: 'Ongera urebe ikaze' })}
    </button>
    <p class="text-xs font-semibold text-ink-faint">
      DriverLearn · {tr({ en: 'Version {v}', rw: 'Verisiyo {v}' }, { v: version })}
    </p>
  </div>
</Section>
