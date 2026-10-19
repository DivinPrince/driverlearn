<script lang="ts">
  import CircleAlert from '@lucide/svelte/icons/circle-alert'
  import CircleCheck from '@lucide/svelte/icons/circle-check'
  import Database from '@lucide/svelte/icons/database'
  import Download from '@lucide/svelte/icons/download'
  import Trash from '@lucide/svelte/icons/trash'
  import Upload from '@lucide/svelte/icons/upload'
  import Mascot from '../../lib/components/Mascot.svelte'
  import Modal from '../../lib/components/Modal.svelte'
  import { dayKey } from '../../lib/engine/dates'
  import { tr } from '../../lib/i18n'
  import type { L10n } from '../../lib/types'
  import { sfx } from '../../lib/sound'
  import { abandon, exam } from '../../lib/state/exam.svelte'
  import { exportProgress, importProgress, progress, resetProgress } from '../../lib/state/progress.svelte'
  import { toast } from '../../lib/state/ui.svelte'
  import Section from './Section.svelte'
  import SettingRow from './SettingRow.svelte'

  /** Backups are tiny (a few hundred KB at most); anything bigger is not ours. */
  const MAX_IMPORT_BYTES = 10 * 1024 * 1024

  const practised = $derived(Object.values(progress.q).filter((s) => s.seen > 0).length)
  const hasProgress = $derived(
    progress.xp > 0 || practised > 0 || progress.exams.length > 0 || progress.bookmarks.length > 0 || progress.signsLearned.length > 0,
  )

  /** Singular / plural copy for a count, e.g. "1 mock exam" vs "3 mock exams". */
  function count(n: number, one: L10n, many: L10n, vars: Record<string, string | number> = {}): string {
    return tr(n === 1 ? one : many, { n, ...vars })
  }

  let fileInput: HTMLInputElement | undefined = $state()
  let result: { ok: true; xp: number; practised: number } | { ok: false } | null = $state(null)
  let confirmImport = $state(false)
  let confirmReset = $state(false)

  function exportBackup() {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `driverlearn-backup-${dayKey(Date.now())}.json`
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    toast({
      kind: 'info',
      emoji: '💾',
      title: tr({ en: 'Backup downloaded', rw: 'Kopi yakuwemo' }),
      body: tr({ en: 'Keep the file somewhere safe.', rw: 'Bika iyo dosiye ahantu hizewe.' }),
    })
  }

  function chooseFile() {
    confirmImport = false
    result = null
    fileInput?.click()
  }

  function startImport() {
    if (hasProgress) confirmImport = true
    else chooseFile()
  }

  async function onfile(e: Event & { currentTarget: HTMLInputElement }) {
    const input = e.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    let ok = false
    try {
      ok = file.size <= MAX_IMPORT_BYTES && importProgress(await file.text())
    } catch {
      ok = false
    }
    if (ok) {
      result = { ok: true, xp: progress.xp, practised: Object.values(progress.q).filter((s) => s.seen > 0).length }
      sfx.correct()
    } else {
      result = { ok: false }
      sfx.wrong()
    }
  }

  function reset() {
    resetProgress()
    if (exam.active) abandon()
    confirmReset = false
    result = null
    toast({
      kind: 'info',
      emoji: '🧹',
      title: tr({ en: 'Progress reset', rw: 'Aho wari ugeze harasibwe' }),
      body: tr({ en: 'A fresh start. You’ve got this!', rw: 'Intangiriro nshya. Urabishoboye!' }),
    })
  }
</script>

<Section
  title={tr({ en: 'Your data', rw: 'Amakuru yawe' })}
  subtitle={tr({ en: 'Saved only on this device — no account needed.', rw: 'Abikwa kuri iki gikoresho gusa — nta konti ikenewe.' })}
  icon={Database}
  tone="bg-sun-100 text-sun-600 dark:bg-sun-600/25 dark:text-sun-300"
>
  <div class="flex flex-wrap gap-2 pt-4 pb-1" aria-label={tr({ en: 'What is saved', rw: 'Ibibitswe' })}>
    <span class="chip text-sun-600 dark:text-sun-300">⚡ {tr({ en: '{n} XP', rw: 'XP {n}' }, { n: progress.xp })}</span>
    <span class="chip">
      📝 {count(practised, { en: '{n} question practised', rw: 'Ikibazo {n} wakoze' }, { en: '{n} questions practised', rw: 'Ibibazo {n} wakoze' })}
    </span>
    <span class="chip">
      📋 {count(progress.exams.length, { en: '{n} mock exam', rw: 'Ikizamini {n}' }, { en: '{n} mock exams', rw: 'Ibizamini {n}' })}
    </span>
  </div>

  <SettingRow
    label={tr({ en: 'Export progress', rw: 'Kuramo kopi y’aho ugeze' })}
    description={tr({
      en: 'Download a backup file you can move to another phone or computer.',
      rw: 'Kuramo dosiye y’ububiko ushobora kwimurira kuri telefone cyangwa mudasobwa indi.',
    })}
    layout="responsive"
  >
    {#snippet control({ descId })}
      <button class="btn btn-soft btn-sm shrink-0" onclick={exportBackup} aria-describedby={descId}>
        <Download size={18} />{tr({ en: 'Export', rw: 'Kuramo' })}
      </button>
    {/snippet}
  </SettingRow>

  <SettingRow
    label={tr({ en: 'Import progress', rw: 'Injiza kopi y’aho ugeze' })}
    description={tr({
      en: 'Restore a backup file. It replaces the progress on this device.',
      rw: 'Garura aho wari ugeze ukoresheje dosiye y’ububiko. Isimbura ibiri kuri iki gikoresho.',
    })}
    layout="responsive"
  >
    {#snippet control({ descId })}
      <button class="btn btn-soft btn-sm shrink-0" onclick={startImport} aria-describedby={descId}>
        <Upload size={18} />{tr({ en: 'Import', rw: 'Injiza' })}
      </button>
      <input
        bind:this={fileInput}
        type="file"
        accept="application/json,.json"
        class="sr-only"
        tabindex="-1"
        aria-hidden="true"
        onchange={onfile}
      />
    {/snippet}
    <div role="status" aria-live="polite">
      {#if result?.ok}
        <p class="mt-3 flex animate-rise items-start gap-2 rounded-2xl bg-leaf-100 px-4 py-3 text-sm font-semibold text-leaf-700 dark:bg-leaf-700/25 dark:text-leaf-200">
          <CircleCheck size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {count(
              result.practised,
              { en: 'Progress imported: {xp} XP and {n} question practised.', rw: 'Aho wari ugeze hagaruwe: XP {xp} n’ikibazo {n} wakoze.' },
              { en: 'Progress imported: {xp} XP and {n} questions practised.', rw: 'Aho wari ugeze hagaruwe: XP {xp} n’ibibazo {n} wakoze.' },
              { xp: result.xp },
            )}
          </span>
        </p>
      {:else if result}
        <p class="mt-3 flex animate-shake items-start gap-2 rounded-2xl bg-flame-100 px-4 py-3 text-sm font-semibold text-flame-700 dark:bg-flame-700/25 dark:text-flame-200">
          <CircleAlert size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {tr({
              en: 'That file isn’t a DriverLearn backup. Nothing was changed.',
              rw: 'Iyo dosiye si kopi ya DriverLearn. Nta kintu cyahindutse.',
            })}
          </span>
        </p>
      {/if}
    </div>
  </SettingRow>

  <SettingRow
    label={tr({ en: 'Reset all progress', rw: 'Siba aho ugeze hose' })}
    description={tr({
      en: 'Erase XP, streak, answers, exams and bookmarks on this device.',
      rw: 'Siba XP, iminsi ikurikiranye, ibisubizo, ibizamini n’ibyo wabitse kuri iki gikoresho.',
    })}
    layout="responsive"
  >
    {#snippet control({ descId })}
      <button class="btn btn-danger btn-sm shrink-0" onclick={() => (confirmReset = true)} aria-describedby={descId}>
        <Trash size={18} />{tr({ en: 'Reset', rw: 'Siba' })}
      </button>
    {/snippet}
  </SettingRow>
</Section>

<Modal open={confirmImport} onclose={() => (confirmImport = false)} size="sm">
  <div class="flex flex-col items-center text-center">
    <Mascot size={96} mood="think" class="text-ink" />
    <h2 class="mt-3 text-xl font-bold">{tr({ en: 'Replace your progress?', rw: 'Usimbure aho ugeze?' })}</h2>
    <p class="mt-1 text-ink-muted">
      {tr(
        {
          en: 'Importing a backup replaces your current progress ({xp} XP) on this device.',
          rw: 'Kwinjiza kopi bisimbura aho ugeze ubu (XP {xp}) kuri iki gikoresho.',
        },
        { xp: progress.xp },
      )}
    </p>
    <div class="mt-6 flex w-full flex-col gap-3">
      <button class="btn btn-primary" onclick={chooseFile}><Upload size={18} />{tr({ en: 'Choose a backup file', rw: 'Hitamo dosiye ya kopi' })}</button>
      <button class="btn btn-ghost" onclick={() => (confirmImport = false)}>{tr({ en: 'Cancel', rw: 'Reka' })}</button>
    </div>
  </div>
</Modal>

<Modal open={confirmReset} onclose={() => (confirmReset = false)} size="sm">
  <div class="flex flex-col items-center text-center">
    <Mascot size={96} mood="sad" class="text-ink" />
    <h2 class="mt-3 text-xl font-bold">{tr({ en: 'Reset all progress?', rw: 'Urashaka gusiba aho ugeze hose?' })}</h2>
    <p class="mt-1 text-ink-muted">
      {tr({
        en: 'Your XP, level, streak, answers, mock exams, bookmarks and learned signs will be deleted from this device. This can’t be undone.',
        rw: 'XP yawe, urwego, iminsi ikurikiranye, ibisubizo, ibizamini, ibyo wabitse n’ibyapa wamenye bizasibwa kuri iki gikoresho. Ntibishobora kugarurwa.',
      })}
    </p>
    <p class="mt-2 text-sm text-ink-faint">
      {tr({ en: 'Your settings are kept.', rw: 'Igenamiterere ryawe rizagumaho.' })}
    </p>
    <div class="mt-6 flex w-full flex-col gap-3">
      <button class="btn btn-danger" onclick={reset}><Trash size={18} />{tr({ en: 'Yes, reset everything', rw: 'Yego, siba byose' })}</button>
      {#if hasProgress}
        <button class="btn btn-soft" onclick={exportBackup}><Download size={18} />{tr({ en: 'Export a backup first', rw: 'Banza ukuremo kopi' })}</button>
      {/if}
      <button class="btn btn-ghost" onclick={() => (confirmReset = false)}>{tr({ en: 'Cancel', rw: 'Reka' })}</button>
    </div>
  </div>
</Modal>
