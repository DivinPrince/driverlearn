<script lang="ts">
  /**
   * A sign picture centred on a white "well" (the source images have white backgrounds in both themes).
   * The well must get its size from `class` (e.g. `aspect-square w-full`, `h-56 w-full`, `size-12`).
   */
  import { imageUrl } from '../../lib/data'

  interface Props {
    id: string
    alt?: string
    /** Classes for the well: sizing, rounding, border. */
    class?: string
    /** Inset of the picture inside the well. */
    pad?: string
    /** Extra classes for the <img>. */
    imgClass?: string
    eager?: boolean
  }

  let { id, alt = '', class: klass = 'size-24 rounded-2xl', pad = 'p-3', imgClass = '', eager = false }: Props = $props()
</script>

<span class="relative block overflow-hidden bg-white {klass}">
  <img
    src={imageUrl(id)}
    {alt}
    class="absolute inset-0 h-full w-full object-contain select-none {pad} {imgClass}"
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
    draggable="false"
  />
</span>
