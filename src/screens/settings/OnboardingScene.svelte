<script lang="ts">
  /**
   * Decorative header of the first-run onboarding: a sky over Rwanda's rolling hills and a road.
   * Kago (the mascot car) drives along the road as the learner moves through the steps,
   * and says `bubble` in a speech bubble.
   */
  import Mascot from '../../lib/components/Mascot.svelte'

  interface Props {
    step: number
    steps: number
    bubble: string
    mood?: 'happy' | 'wow' | 'sad' | 'think'
  }

  let { step, steps, bubble, mood = 'happy' }: Props = $props()

  const CAR = 92
  /** 0..1 position of the car along the road. */
  const pos = $derived(steps > 1 ? 0.04 + (0.92 * step) / (steps - 1) : 0.5)
  const align = $derived(pos < 0.3 ? 'left' : pos > 0.7 ? 'right' : 'center')

  const STARS: [number, number, number][] = [
    [8, 30, 2],
    [18, 58, 1.5],
    [30, 22, 1.5],
    [44, 44, 2],
    [57, 18, 1.5],
    [66, 52, 1.5],
    [90, 30, 2],
    [96, 60, 1.5],
  ]
</script>

<div
  class="relative h-full overflow-hidden bg-gradient-to-b from-brand-500 via-brand-400 to-brand-200 dark:from-[#06131f] dark:via-brand-950 dark:to-brand-800"
  aria-hidden="true"
>
  <!-- stars (night) -->
  <div class="absolute inset-0 hidden dark:block">
    {#each STARS as [x, y, r], i (i)}
      <span class="absolute rounded-full bg-white/80" style:left="{x}%" style:top="{y}%" style:width="{r * 2}px" style:height="{r * 2}px"></span>
    {/each}
  </div>

  <!-- sun / moon -->
  <div
    class="absolute top-[34%] right-[14%] size-12 rounded-full bg-sun-300 shadow-[0_0_0_10px_rgb(255_221_61/0.28),0_0_0_22px_rgb(255_221_61/0.14)] sm:size-14 dark:bg-sun-100 dark:shadow-[0_0_28px_6px_rgb(255_246_194/0.28)]"
  >
    <span class="absolute top-2 left-3 hidden size-2.5 rounded-full bg-sun-200 dark:block"></span>
    <span class="absolute right-3 bottom-3 hidden size-2 rounded-full bg-sun-200 dark:block"></span>
  </div>

  <!-- clouds -->
  {#each [{ x: '10%', y: '36%', w: 74, d: '0s', o: 0.95 }, { x: '52%', y: '24%', w: 54, d: '-1.6s', o: 0.8 }, { x: '78%', y: '58%', w: 44, d: '-2.8s', o: 0.7 }] as c, i (i)}
    <svg
      class="absolute animate-float dark:opacity-15"
      style:left={c.x}
      style:top={c.y}
      style:width="{c.w}px"
      style:animation-delay={c.d}
      style:opacity={c.o}
      viewBox="0 0 80 40"
    >
      <g fill="white">
        <circle cx="28" cy="22" r="13" />
        <circle cx="47" cy="17" r="16" />
        <circle cx="63" cy="25" r="10" />
        <rect x="12" y="23" width="62" height="13" rx="6.5" />
      </g>
    </svg>
  {/each}

  <!-- the land of a thousand hills -->
  <svg class="absolute inset-x-0 bottom-8 h-20 w-full sm:h-24" viewBox="0 0 400 80" preserveAspectRatio="none">
    <path
      d="M0 46 C 40 18, 84 16, 124 40 S 204 14, 254 34 S 344 10, 400 30 V80 H0 Z"
      class="fill-leaf-400 dark:fill-[#145c33]"
      opacity="0.85"
    />
    <path d="M0 64 C 60 38, 112 42, 162 58 S 262 36, 312 54 S 378 46, 400 50 V80 H0 Z" class="fill-leaf-500 dark:fill-[#0f4627]" />
    <!-- tea terraces -->
    <g class="stroke-leaf-400/70 dark:stroke-leaf-600/40" stroke-width="1.6" fill="none" stroke-linecap="round">
      <path d="M210 62 Q 240 54 268 58" />
      <path d="M204 70 Q 240 61 276 66" />
      <path d="M30 70 Q 60 60 92 64" />
    </g>
  </svg>

  <!-- road -->
  <div class="absolute inset-x-0 bottom-0 h-9 border-t-[3px] border-[#6b7f92] bg-[#34495d] dark:border-[#2b3e50] dark:bg-[#17232f]">
    <div class="road-stripes absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 opacity-90"></div>
  </div>

  <!-- Kago -->
  <div
    class="absolute bottom-1.5 transition-[left] duration-700 ease-in-out"
    style:left="calc({pos} * (100% - {CAR}px))"
    style:width="{CAR}px"
  >
    {#key bubble}
      <div
        class="absolute bottom-full mb-1.5 animate-pop {align === 'left'
          ? 'left-1'
          : align === 'right'
            ? 'right-1'
            : 'left-1/2 -translate-x-1/2'}"
      >
        <p class="relative rounded-2xl bg-white px-3.5 py-2 font-display text-sm font-bold whitespace-nowrap text-brand-950 shadow-lg">
          {bubble}
          <span
            class="absolute -bottom-1.5 size-3 rotate-45 bg-white {align === 'left' ? 'left-9' : align === 'right' ? 'right-9' : 'left-1/2 -ml-1.5'}"
          ></span>
        </p>
      </div>
    {/key}
    <Mascot size={CAR} {mood} class="text-brand-950" />
  </div>
</div>
