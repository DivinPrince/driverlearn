<script lang="ts">
  /** "Kago", the friendly little car mascot. */
  interface Props {
    size?: number
    mood?: 'happy' | 'wow' | 'sad' | 'think'
    class?: string
  }
  let { size = 120, mood = 'happy', class: klass = '' }: Props = $props()
</script>

<svg width={size} height={size * 0.8} viewBox="0 0 150 120" class={klass} aria-hidden="true">
  <ellipse cx="75" cy="112" rx="56" ry="6" fill="currentColor" opacity="0.08" />
  <!-- body -->
  <path d="M22 78 Q20 56 40 52 L52 30 Q56 22 66 22 H96 Q106 22 111 30 L122 52 Q134 56 132 78 Z" fill="#1597dc" />
  <path d="M22 78 H132 V88 Q132 96 124 96 H30 Q22 96 22 88 Z" fill="#0a649c" />
  <!-- windows -->
  <path d="M58 32 Q60 28 66 28 H78 V52 H48 Z" fill="#d7eefc" />
  <path d="M84 28 H96 Q102 28 105 33 L114 52 H84 Z" fill="#d7eefc" />
  <!-- headlights -->
  <circle cx="34" cy="66" r="6" fill="#fad201" />
  <circle cx="120" cy="66" r="6" fill="#fad201" />
  <!-- face -->
  {#if mood === 'sad'}
    <path d="M62 64 q4 -4 8 0 M84 64 q4 -4 8 0" stroke="#0b2d47" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <path d="M68 80 q9 -7 18 0" stroke="#0b2d47" stroke-width="3.5" fill="none" stroke-linecap="round" />
  {:else if mood === 'wow'}
    <circle cx="66" cy="63" r="4.5" fill="#0b2d47" />
    <circle cx="88" cy="63" r="4.5" fill="#0b2d47" />
    <ellipse cx="77" cy="78" rx="5" ry="6" fill="#0b2d47" />
  {:else if mood === 'think'}
    <circle cx="66" cy="63" r="4" fill="#0b2d47" />
    <circle cx="88" cy="63" r="4" fill="#0b2d47" />
    <path d="M70 79 h14" stroke="#0b2d47" stroke-width="3.5" stroke-linecap="round" />
  {:else}
    <circle cx="66" cy="63" r="4" fill="#0b2d47" />
    <circle cx="88" cy="63" r="4" fill="#0b2d47" />
    <path d="M67 75 q10 9 20 0" stroke="#0b2d47" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <circle cx="58" cy="72" r="4" fill="#ff8fa3" opacity="0.6" />
    <circle cx="96" cy="72" r="4" fill="#ff8fa3" opacity="0.6" />
  {/if}
  <!-- wheels -->
  <circle cx="46" cy="96" r="13" fill="#12263a" />
  <circle cx="46" cy="96" r="5" fill="#c4d1dc" />
  <circle cx="108" cy="96" r="13" fill="#12263a" />
  <circle cx="108" cy="96" r="5" fill="#c4d1dc" />
</svg>
