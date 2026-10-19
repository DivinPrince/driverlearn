<script lang="ts">
  import ZoomIn from '@lucide/svelte/icons/zoom-in'
  import { imageUrl } from '../data'
  import { tr, T } from '../i18n'
  import Modal from './Modal.svelte'

  interface Props {
    id: string
    alt?: string
    /** Tailwind classes for the image box (sizing). */
    class?: string
    /** Allow tap-to-enlarge. */
    zoomable?: boolean
  }

  let { id, alt = '', class: klass = 'max-h-56', zoomable = true }: Props = $props()
  let open = $state(false)
</script>

{#if zoomable}
  <button
    type="button"
    class="group relative inline-block overflow-hidden rounded-2xl border border-line bg-white p-1.5 transition hover:shadow-lg"
    onclick={(e) => {
      e.stopPropagation()
      open = true
    }}
    aria-label={tr(T.zoom)}
  >
    <img src={imageUrl(id)} {alt} class="{klass} w-auto rounded-xl object-contain" loading="lazy" draggable="false" />
    <span
      class="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-brand-950/70 text-white opacity-80 transition group-hover:opacity-100"
    >
      <ZoomIn size={16} />
    </span>
  </button>
  <Modal {open} onclose={() => (open = false)} size="lg">
    <img src={imageUrl(id)} {alt} class="mx-auto max-h-[70dvh] w-auto rounded-2xl bg-white object-contain p-2" />
  </Modal>
{:else}
  <span class="inline-block overflow-hidden rounded-2xl border border-line bg-white p-1.5">
    <img src={imageUrl(id)} {alt} class="{klass} w-auto rounded-xl object-contain" loading="lazy" draggable="false" />
  </span>
{/if}
