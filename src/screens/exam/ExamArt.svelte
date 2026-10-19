<script lang="ts">
  /** Friendly hero illustration: Kago the car in front of an exam clipboard and a stopwatch. */
  import Mascot from '../../lib/components/Mascot.svelte'

  interface Props {
    class?: string
  }
  let { class: klass = '' }: Props = $props()
</script>

<div class="relative aspect-[11/9] {klass}" aria-hidden="true">
  <svg viewBox="0 0 220 180" class="absolute inset-0 size-full overflow-visible">
    <!-- clipboard -->
    <g class="animate-float" style:animation-delay="-1.2s">
      <rect x="58" y="18" width="118" height="146" rx="16" fill="#0a649c" opacity="0.35" transform="translate(5 6)" />
      <rect x="58" y="18" width="118" height="146" rx="16" fill="#ffffff" />
      <rect x="92" y="8" width="50" height="22" rx="9" fill="#0b2d47" />
      <circle cx="117" cy="15" r="3.5" fill="#7fcbf4" />
      <!-- rows -->
      {#each [52, 84, 116] as y, i (y)}
        <rect x="72" {y} width="20" height="20" rx="6" fill={i < 2 ? '#1fb455' : '#eef8fe'} stroke={i < 2 ? 'none' : '#7fcbf4'} stroke-width="2.5" />
        {#if i < 2}
          <path d="M77 {y + 10.5} l4 4 l7 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        {/if}
        <rect x="100" y={y + 3} width="62" height="6" rx="3" fill="#d7eefc" />
        <rect x="100" y={y + 12} width={i === 1 ? 30 : 42} height="5" rx="2.5" fill="#eef3f7" />
      {/each}
      <rect x="72" y="146" width="40" height="6" rx="3" fill="#fad201" />
    </g>
    <!-- stopwatch -->
    <g class="animate-float" style:animation-delay="-2.6s">
      <rect x="176" y="10" width="14" height="9" rx="3" fill="#0b2d47" />
      <rect x="198" y="20" width="9" height="7" rx="2.5" fill="#0b2d47" transform="rotate(40 202 24)" />
      <circle cx="183" cy="48" r="29" fill="#fad201" />
      <circle cx="183" cy="48" r="21" fill="#ffffff" />
      <path d="M183 48 V33" stroke="#0b2d47" stroke-width="3.5" stroke-linecap="round" />
      <path d="M183 48 L194 54" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
      <circle cx="183" cy="48" r="3" fill="#0b2d47" />
      <path d="M183 48 L183 27 A21 21 0 0 1 201.2 37.5 Z" fill="#fad201" opacity="0.35" />
    </g>
    <!-- sparkles -->
    <path d="M30 34 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" fill="#fff6c2" opacity="0.9" />
    <circle cx="44" cy="70" r="3" fill="#ffffff" opacity="0.7" />
    <circle cx="206" cy="102" r="4" fill="#ffffff" opacity="0.55" />
  </svg>
  <Mascot size={118} mood="happy" class="absolute -bottom-1 -left-2 text-brand-950 drop-shadow-lg" />
</div>
