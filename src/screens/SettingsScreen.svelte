<script lang="ts">
  import BadgeCheck from '@lucide/svelte/icons/badge-check'
  import Languages from '@lucide/svelte/icons/languages'
  import Monitor from '@lucide/svelte/icons/monitor'
  import Moon from '@lucide/svelte/icons/moon'
  import Palette from '@lucide/svelte/icons/palette'
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
  import Sun from '@lucide/svelte/icons/sun'
  import Target from '@lucide/svelte/icons/target'
  import Volume2 from '@lucide/svelte/icons/volume-2'
  import Bi from '../lib/components/Bi.svelte'
  import PageHeader from '../lib/components/PageHeader.svelte'
  import { PASS_RATIO } from '../lib/engine/gamify'
  import { tr, T } from '../lib/i18n'
  import { sfx } from '../lib/sound'
  import { exam } from '../lib/state/exam.svelte'
  import { settings } from '../lib/state/settings.svelte'
  import type { L10n, Lang, Theme } from '../lib/types'
  import AboutSection from './settings/AboutSection.svelte'
  import DataSection from './settings/DataSection.svelte'
  import { EXAM_MINUTES, EXAM_SIZES, GOALS, OFFICIAL_EXAM } from './settings/options'
  import Section from './settings/Section.svelte'
  import Segmented from './settings/Segmented.svelte'
  import SettingRow from './settings/SettingRow.svelte'
  import Switch from './settings/Switch.svelte'

  /** A real question from the bank, used to preview "show translation". */
  const SAMPLE: L10n = {
    rw: 'Mu gihe telefone yawe ihamagawe utwaye imodoka wakora iki?',
    en: 'Your phone rings while you are driving. What should you do?',
  }

  const official = $derived(settings.examSize === OFFICIAL_EXAM.size && settings.examMinutes === OFFICIAL_EXAM.minutes)
  const passMark = $derived(Math.ceil(settings.examSize * PASS_RATIO))
  const goal = $derived(GOALS.find((g) => g.value === settings.dailyGoal))

  /** Time per question in the chosen exam format, e.g. "1 min" or "40 s". */
  const perQuestion = $derived.by(() => {
    const sec = Math.round((settings.examMinutes * 60) / Math.max(1, settings.examSize))
    if (sec < 60 || sec % 30 !== 0) return tr({ en: '{s} s', rw: 'amasegonda {s}' }, { s: sec })
    const min = sec / 60
    return tr({ en: '{m} min', rw: 'iminota {m}' }, { m: Number.isInteger(min) ? min : min.toFixed(1) })
  })

  function useOfficial() {
    settings.examSize = OFFICIAL_EXAM.size
    settings.examMinutes = OFFICIAL_EXAM.minutes
    sfx.tap()
  }
</script>

<PageHeader
  title={tr(T.settings)}
  subtitle={tr({ en: 'Make DriverLearn work the way you like.', rw: 'Hindura DriverLearn uko ubyifuza.' })}
/>

<div class="grid items-start gap-4 lg:grid-cols-2 lg:gap-5">
  <div class="flex flex-col gap-4 lg:gap-5">
    <!-- Language -->
    <Section
      title={tr({ en: 'Language', rw: 'Ururimi' })}
      subtitle={tr({ en: 'The official test is in Kinyarwanda.', rw: 'Ikizamini nyirizina gikorwa mu Kinyarwanda.' })}
      icon={Languages}
      tone="bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300"
    >
      <SettingRow
        label={tr({ en: 'App language', rw: 'Ururimi rwa porogaramu' })}
        description={tr({ en: 'Used across the app, including questions and explanations.', rw: 'Rukoreshwa muri porogaramu yose, harimo ibibazo n’ibisobanuro.' })}
        layout="stacked"
      >
        {#snippet control({ labelId, descId })}
          <Segmented
            bind:value={settings.lang}
            labelledby={labelId}
            describedby={descId}
            options={[
              { value: 'rw' as Lang, label: 'Ikinyarwanda', hint: tr({ en: 'Exam language', rw: 'Ururimi rw’ikizamini' }) },
              { value: 'en' as Lang, label: 'English', hint: tr({ en: 'Study aid', rw: 'Imfashanyigisho' }) },
            ]}
          />
        {/snippet}
      </SettingRow>

      <SettingRow
        label={tr({ en: 'Show translation under questions', rw: 'Erekana ubusemuzi munsi y’ibibazo' })}
        description={tr({
          en: 'See every question in both Kinyarwanda and English — a great way to learn the exam wording in both languages.',
          rw: 'Reba buri kibazo mu Kinyarwanda no mu Cyongereza — bigufasha kumenya amagambo y’ikizamini mu ndimi zombi.',
        })}
      >
        {#snippet control({ labelId, descId })}
          <Switch bind:checked={settings.showTranslation} labelledby={labelId} describedby={descId} />
        {/snippet}
        <div class="mt-3 rounded-2xl border-2 border-dashed border-line bg-surface-2 px-4 py-3">
          <p class="eyebrow">{tr({ en: 'Preview', rw: 'Uko bigaragara' })}</p>
          <p class="mt-1 font-display leading-snug font-bold"><Bi text={SAMPLE} /></p>
        </div>
      </SettingRow>
    </Section>

    <!-- Appearance & sound -->
    <Section
      title={tr({ en: 'Look & sound', rw: 'Isura n’amajwi' })}
      icon={Palette}
      tone="bg-grape-100 text-grape-600 dark:bg-grape-600/25 dark:text-grape-400"
    >
      <SettingRow
        label={tr({ en: 'Theme', rw: 'Umucyo cyangwa umwijima' })}
        description={tr({ en: 'System follows your device’s light or dark mode.', rw: '“Byikora” bikurikiza uko igikoresho cyawe giteye.' })}
        layout="stacked"
      >
        {#snippet control({ labelId, descId })}
          <Segmented
            bind:value={settings.theme}
            labelledby={labelId}
            describedby={descId}
            stacked
            options={[
              { value: 'system' as Theme, label: tr({ en: 'System', rw: 'Byikora' }), icon: Monitor },
              { value: 'light' as Theme, label: tr({ en: 'Light', rw: 'Umucyo' }), icon: Sun },
              { value: 'dark' as Theme, label: tr({ en: 'Dark', rw: 'Umwijima' }), icon: Moon },
            ]}
          />
        {/snippet}
      </SettingRow>

      <SettingRow
        label={tr({ en: 'Sound effects', rw: 'Amajwi' })}
        description={tr({ en: 'Little sounds for right and wrong answers.', rw: 'Utujwi duto iyo usubije neza cyangwa nabi.' })}
      >
        {#snippet control({ labelId, descId })}
          <div class="flex shrink-0 items-center gap-2">
            <button
              class="btn btn-ghost btn-sm"
              disabled={!settings.sound}
              onclick={() => sfx.correct()}
              aria-label={tr({ en: 'Test sound effects', rw: 'Gerageza amajwi' })}
            >
              <Volume2 size={18} /><span class="hidden sm:inline">{tr({ en: 'Test', rw: 'Gerageza' })}</span>
            </button>
            <Switch
              bind:checked={settings.sound}
              labelledby={labelId}
              describedby={descId}
              onchange={(on) => {
                if (on) sfx.correct()
              }}
            />
          </div>
        {/snippet}
      </SettingRow>
    </Section>

    <!-- Learning -->
    <Section
      title={tr({ en: 'Learning', rw: 'Kwiga' })}
      icon={Target}
      tone="bg-leaf-100 text-leaf-600 dark:bg-leaf-700/30 dark:text-leaf-400"
    >
      <SettingRow
        label={tr(T.dailyGoal)}
        description={tr({ en: 'How many questions you want to answer each day.', rw: 'Umubare w’ibibazo ushaka gusubiza buri munsi.' })}
        layout="stacked"
      >
        {#snippet control({ labelId, descId })}
          <Segmented
            bind:value={settings.dailyGoal}
            labelledby={labelId}
            describedby={descId}
            stacked
            class="grid-cols-2 sm:grid-cols-4"
            options={GOALS.map((g) => ({ value: g.value, emoji: g.emoji, label: String(g.value), hint: tr(g.name) }))}
          />
        {/snippet}
        <p class="mt-2 text-sm font-semibold text-ink-muted">
          {#if goal}
            ⏱️ {tr({ en: 'About {m} minutes a day', rw: 'Hafi iminota {m} ku munsi' }, { m: goal.minutes })}
          {:else}
            {tr({ en: 'Current goal: {n} questions a day', rw: 'Intego y’ubu: ibibazo {n} ku munsi' }, { n: settings.dailyGoal })}
          {/if}
        </p>
      </SettingRow>

      <SettingRow
        label={tr({ en: 'Mock exam format', rw: 'Imiterere y’ikizamini cy’igerageza' })}
        description={tr({
          en: 'Practise with the official format to feel ready on exam day.',
          rw: 'Itoze ukoresheje imiterere y’ikizamini nyirizina kugira ngo uzumve witeguye ku munsi w’ikizamini.',
        })}
        layout="stacked"
      >
        {#snippet control({ descId })}
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <p id="exam-size-label" class="mb-1.5 text-xs font-bold text-ink-muted">{tr({ en: 'Questions', rw: 'Ibibazo' })}</p>
              <Segmented
                bind:value={settings.examSize}
                labelledby="exam-size-label"
                describedby={descId}
                options={EXAM_SIZES.map((n) => ({ value: n, label: String(n) }))}
              />
            </div>
            <div>
              <p id="exam-minutes-label" class="mb-1.5 text-xs font-bold text-ink-muted">{tr({ en: 'Minutes', rw: 'Iminota' })}</p>
              <Segmented
                bind:value={settings.examMinutes}
                labelledby="exam-minutes-label"
                describedby={descId}
                options={EXAM_MINUTES.map((n) => ({ value: n, label: String(n) }))}
              />
            </div>
          </div>
        {/snippet}

        <p class="mt-3 text-sm text-ink-muted">
          {tr(
            {
              en: 'Pass mark: {p}/{n} (60%) · {t} per question',
              rw: 'Amanota yo gutsinda: {p}/{n} (60%) · {t} kuri buri kibazo',
            },
            { p: passMark, n: settings.examSize, t: perQuestion },
          )}
        </p>

        {#if official}
          <p
            class="mt-3 flex items-center gap-2 rounded-2xl bg-leaf-100 px-4 py-2.5 text-sm font-bold text-leaf-700 dark:bg-leaf-700/25 dark:text-leaf-200"
          >
            <BadgeCheck size={18} class="shrink-0" aria-hidden="true" />
            {tr(
              { en: 'Official format: {n} questions · {m} minutes', rw: 'Imiterere y’ikizamini nyirizina: ibibazo {n} · iminota {m}' },
              { n: OFFICIAL_EXAM.size, m: OFFICIAL_EXAM.minutes },
            )}
          </p>
        {:else}
          <button class="btn btn-soft btn-sm mt-3 w-full sm:w-auto" onclick={useOfficial}>
            <RotateCcw size={16} />
            {tr(
              { en: 'Use the official format: {n} questions · {m} minutes', rw: 'Garura imiterere nyirizina: ibibazo {n} · iminota {m}' },
              { n: OFFICIAL_EXAM.size, m: OFFICIAL_EXAM.minutes },
            )}
          </button>
        {/if}

        {#if exam.active}
          <p class="mt-2 text-xs text-ink-faint">
            {tr({
              en: 'Changes apply to your next mock exam; the one in progress keeps its format.',
              rw: 'Impinduka zizakurikizwa ku kizamini gikurikiyeho; ikiri gukorwa kigumana imiterere yacyo.',
            })}
          </p>
        {/if}
      </SettingRow>
    </Section>
  </div>

  <div class="flex flex-col gap-4 lg:gap-5">
    <DataSection />
    <AboutSection />
  </div>
</div>
