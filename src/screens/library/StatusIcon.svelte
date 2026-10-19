<script lang="ts">
  /** Shape + color + text status marker for one question (never color alone). */
  import CircleCheck from '@lucide/svelte/icons/circle-check'
  import CircleDashed from '@lucide/svelte/icons/circle-dashed'
  import CircleDot from '@lucide/svelte/icons/circle-dot'
  import CircleX from '@lucide/svelte/icons/circle-x'
  import { tr } from '../../lib/i18n'
  import { STATUS_LABEL, type QStatus } from './status'

  interface Props {
    status: QStatus
    size?: number
    /** Show the label next to the icon instead of only to screen readers. */
    labelled?: boolean
    class?: string
  }

  let { status, size = 18, labelled = false, class: klass = '' }: Props = $props()

  const ICONS = { new: CircleDashed, learning: CircleDot, weak: CircleX, mastered: CircleCheck }
  const TONES: Record<QStatus, string> = {
    new: 'text-ink-faint',
    learning: 'text-brand-500 dark:text-brand-300',
    weak: 'text-flame-500 dark:text-flame-400',
    mastered: 'text-leaf-600 dark:text-leaf-400',
  }

  const Icon = $derived(ICONS[status])
  const label = $derived(tr(STATUS_LABEL[status]))
</script>

<span class="inline-flex items-center gap-1.5 {TONES[status]} {klass}" title={labelled ? undefined : label}>
  <Icon {size} strokeWidth={2.4} aria-hidden="true" class="shrink-0" />
  {#if labelled}<span>{label}</span>{:else}<span class="sr-only">{label}</span>{/if}
</span>
