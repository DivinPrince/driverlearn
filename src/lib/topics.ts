import type { L10n, TopicId } from './types'

export interface TopicMeta {
  id: TopicId
  name: L10n
  blurb: L10n
  /** Emoji used as a friendly topic mascot. */
  emoji: string
  /** Tailwind gradient classes for the topic tile. */
  gradient: string
  /** Solid accent hex (charts, rings). */
  color: string
}

export const TOPICS: TopicMeta[] = [
  {
    id: 'signs',
    name: { en: 'Road signs', rw: 'Ibyapa byo ku muhanda' },
    blurb: { en: 'Warning, prohibition, mandatory and information signs', rw: 'Ibyapa biburira, bibuza, bitegeka n’ibitanga amakuru' },
    emoji: '🛑',
    gradient: 'from-flame-400 to-flame-600',
    color: '#ef4444',
  },
  {
    id: 'priority',
    name: { en: 'Right of way', rw: 'Uburenganzira bwo gutambuka' },
    blurb: { en: 'Intersections, roundabouts and who goes first', rw: 'Amasangano, aho bazenguruka n’ugomba gutambuka mbere' },
    emoji: '🔀',
    gradient: 'from-brand-400 to-brand-600',
    color: '#1597dc',
  },
  {
    id: 'speed',
    name: { en: 'Speed limits', rw: 'Umuvuduko ntarengwa' },
    blurb: { en: 'Limits by vehicle type, in and outside built-up areas', rw: 'Umuvuduko ukurikije ubwoko bw’ikinyabiziga n’aho kigenda' },
    emoji: '⏱️',
    gradient: 'from-sun-300 to-sun-500',
    color: '#e0b400',
  },
  {
    id: 'overtaking',
    name: { en: 'Overtaking & lanes', rw: 'Kunyuranaho n’ibisate' },
    blurb: { en: 'When and how to overtake, passing and lane use', rw: 'Igihe n’uburyo bwo kunyuranaho no gukoresha ibisate' },
    emoji: '🏎️',
    gradient: 'from-grape-400 to-grape-600',
    color: '#8b5cf6',
  },
  {
    id: 'parking',
    name: { en: 'Stopping & parking', rw: 'Guhagarara' },
    blurb: { en: 'Where you may and may not stop or park', rw: 'Aho wemerewe n’aho ubujijwe guhagarara' },
    emoji: '🅿️',
    gradient: 'from-sky-400 to-indigo-500',
    color: '#6366f1',
  },
  {
    id: 'markings',
    name: { en: 'Road markings', rw: 'Imirongo yo mu muhanda' },
    blurb: { en: 'Continuous and broken lines, arrows and crossings', rw: 'Imirongo icagaguye n’idacagaguye, imyambi n’ahambukirwa' },
    emoji: '🛣️',
    gradient: 'from-slate-400 to-slate-600',
    color: '#64748b',
  },
  {
    id: 'signals',
    name: { en: 'Traffic lights & signals', rw: 'Ibimenyetso bimurika' },
    blurb: { en: 'Traffic lights and police hand signals', rw: 'Amatara ayobora n’ibimenyetso by’umupolisi' },
    emoji: '🚦',
    gradient: 'from-leaf-400 to-leaf-600',
    color: '#1fb455',
  },
  {
    id: 'lights',
    name: { en: 'Vehicle lights & horn', rw: 'Amatara n’ihoni' },
    blurb: { en: 'Headlights, indicators, reflectors and the horn', rw: 'Amatara, ndangacyerekezo, utugarurarumuri n’ihoni' },
    emoji: '💡',
    gradient: 'from-amber-300 to-orange-500',
    color: '#f59e0b',
  },
  {
    id: 'vehicle',
    name: { en: 'Vehicle & loads', rw: 'Ikinyabiziga n’imizigo' },
    blurb: { en: 'Equipment, brakes, tyres, dimensions and trailers', rw: 'Ibikoresho, feri, amapine, ibipimo na romoruki' },
    emoji: '🚚',
    gradient: 'from-teal-400 to-cyan-600',
    color: '#0d9488',
  },
  {
    id: 'safety',
    name: { en: 'Safe driving', rw: 'Gutwara witonze' },
    blurb: { en: 'Defensive driving, fatigue, weather and emergencies', rw: 'Kwirinda impanuka, umunaniro, ikirere n’ubutabazi' },
    emoji: '🛡️',
    gradient: 'from-emerald-400 to-teal-600',
    color: '#10b981',
  },
  {
    id: 'vulnerable',
    name: { en: 'Pedestrians & cyclists', rw: 'Abanyamaguru n’amagare' },
    blurb: { en: 'Pedestrians, cyclists, animals and school buses', rw: 'Abanyamaguru, abatwara amagare, amatungo na bisi z’abanyeshuri' },
    emoji: '🚸',
    gradient: 'from-pink-400 to-rose-600',
    color: '#e11d48',
  },
  {
    id: 'rules',
    name: { en: 'Traffic law', rw: 'Amategeko y’umuhanda' },
    blurb: { en: 'Definitions, documents, inspection and obligations', rw: 'Ibisobanuro, ibyangombwa, isuzumwa n’inshingano' },
    emoji: '📘',
    gradient: 'from-brand-500 to-brand-800',
    color: '#0a649c',
  },
]

export const TOPIC_BY_ID: Record<TopicId, TopicMeta> = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<
  TopicId,
  TopicMeta
>
