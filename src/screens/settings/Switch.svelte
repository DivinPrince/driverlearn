<script lang="ts">
  /**
   * Accessible on/off switch (role="switch"). Space / Enter toggle it (native button behaviour).
   * Name it with `labelledby` (id of a visible label) or `label`.
   */
  import Check from '@lucide/svelte/icons/check'
  import X from '@lucide/svelte/icons/x'

  interface Props {
    checked: boolean
    label?: string
    labelledby?: string
    describedby?: string
    disabled?: boolean
    onchange?: (checked: boolean) => void
  }

  let { checked = $bindable(), label, labelledby, describedby, disabled = false, onchange }: Props = $props()

  function toggle() {
    checked = !checked
    onchange?.(checked)
  }
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  aria-labelledby={labelledby}
  aria-describedby={describedby}
  {disabled}
  onclick={toggle}
  class="group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors duration-200 disabled:opacity-50 {checked
    ? 'border-leaf-600 bg-leaf-500 dark:border-leaf-500'
    : 'border-line-strong bg-surface-3'}"
>
  <span
    class="pointer-events-none grid size-6 place-items-center rounded-full bg-white shadow-md transition-transform duration-200 ease-out {checked
      ? 'translate-x-[1.6rem] text-leaf-600'
      : 'translate-x-0.5 text-ink-faint'}"
    aria-hidden="true"
  >
    {#if checked}<Check size={14} strokeWidth={3.2} />{:else}<X size={13} strokeWidth={3} />{/if}
  </span>
</button>
