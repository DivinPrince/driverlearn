<script lang="ts">
  /**
   * Bilingual text: the learner's language, plus the other language underneath
   * when "show translation" is on (or `forceTranslation`).
   */
  import { pick, translation } from '../data'
  import { settings } from '../state/settings.svelte'
  import type { L10n } from '../types'

  interface Props {
    text: L10n
    class?: string
    translationClass?: string
    forceTranslation?: boolean
  }

  let { text, class: klass = '', translationClass = '', forceTranslation = false }: Props = $props()
  const main = $derived(pick(text, settings.lang))
  const other = $derived(settings.showTranslation || forceTranslation ? translation(text, settings.lang) : '')
</script>

<span class={klass} lang={settings.lang}>{main}</span>
{#if other}
  <span class="mt-1 block text-[0.85em] font-normal text-ink-muted italic {translationClass}" lang={settings.lang === 'rw' ? 'en' : 'rw'}
    >{other}</span
  >
{/if}
