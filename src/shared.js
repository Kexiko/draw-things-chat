/**
 * Rules shared by the Host and the Client halves: option sanitizing, the
 * Draw Things HTTP payload, aspect-ratio presets and result normalization.
 * Plain JavaScript so the same file serves the Cordis Host and the browser
 * Module Loader bundle.
 */

/** Draw Things serves its Automatic1111-compatible API on this address by default. */
export const DEFAULT_BASE_URL = 'http://127.0.0.1:7860'

/** Sampler names accepted by the `/sdapi/v1/txt2img` `sampler_name` key. */
export const SAMPLERS = [
  'DPM++ 2M Karras',
  'Euler a',
  'DPM++ SDE Karras',
  'UniPC',
  'DDIM',
  'PLMS',
  'LCM',
  'TCD',
  'Euler A Trailing',
  'DPM++ 2M Trailing',
]

/** Seed modes accepted by the `seed_mode` key. */
export const SEED_MODES = ['Scale Alike', 'Legacy', 'Torch CPU Compatible', 'NVIDIA GPU Compatible']

/** One-size presets; the longer side is the first number. */
export const SIZES = [
  { id: 'square', width: 768, height: 768 },
  { id: 'portrait', width: 768, height: 1024 },
  { id: 'landscape', width: 1024, height: 768 },
  { id: 'wide', width: 1024, height: 576 },
  { id: 'tall', width: 576, height: 1024 },
]

/** Default stored settings; every field is optional in the stored patch. */
export const DEFAULT_SETTINGS = Object.freeze({
  baseUrl: DEFAULT_BASE_URL,
  model: 'sd_xl_base_1.0_f16.ckpt',
  size: 'square',
  steps: 20,
  sampler: 'DPM++ 2M Karras',
  cfgScale: 6.5,
  seedMode: 'Scale Alike',
  negativePrompt: '',
})

const INT_RANGES = {
  steps: [1, 150],
  cfgScale: [0, 25],
  width: [128, 8192],
  height: [128, 8192],
}

function clampInt(value, [min, max], fallback) {
  const n = typeof value === 'number' ? value : Number.parseFloat(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function text(value, fallback) {
  return typeof value === 'string' ? value : fallback
}

/** Normalize one base URL; empty means the Draw Things default. */
export function normalizeBaseUrl(value) {
  const raw = text(value, '').trim() || DEFAULT_BASE_URL
  return raw.replace(/\/+$/u, '')
}

/** Normalize a comma-separated model list, keeping the order and dropping blanks. */
export function modelList(value) {
  if (Array.isArray(value)) return value.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim())
  if (typeof value !== 'string') return []
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

/** Size preset for an id, falling back to the square preset. */
export function sizePreset(id) {
  return SIZES.find(size => size.id === id) ?? SIZES[0]
}

/** Settings plus optional stored model list, with every field in range. */
export function sanitizeSettings(input, fallback = DEFAULT_SETTINGS) {
  const source = input !== null && typeof input === 'object' ? input : {}
  const base = fallback ?? DEFAULT_SETTINGS
  const sampler = text(source.sampler, base.sampler)
  const seedMode = text(source.seedMode, base.seedMode)
  const size = SIZES.some(candidate => candidate.id === source.size) ? source.size : base.size
  return {
    baseUrl: normalizeBaseUrl(text(source.baseUrl, base.baseUrl)),
    model: text(source.model, base.model).trim(),
    size,
    steps: clampInt(source.steps, INT_RANGES.steps, base.steps),
    sampler: SAMPLERS.includes(sampler) ? sampler : base.sampler,
    cfgScale: clampInt(source.cfgScale, INT_RANGES.cfgScale, base.cfgScale),
    seedMode: SEED_MODES.includes(seedMode) ? seedMode : base.seedMode,
    negativePrompt: text(source.negativePrompt, base.negativePrompt),
    models: modelList(source.models ?? base.models),
  }
}

/** Request options for one generation: preset settings merged with per-request overrides. */
export function resolveOptions(settings, overrides = {}) {
  const merged = sanitizeSettings({ ...settings, ...(overrides ?? {}) })
  const size = sizePreset(merged.size)
  const seed = Number.isInteger(overrides?.seed) && overrides.seed >= 0 ? overrides.seed : -1
  return { ...merged, width: size.width, height: size.height, seed }
}

/**
 * Build the `/sdapi/v1/txt2img` body. Keys the plugin does not set are left to
 * Draw Things, except the ones the request must fix explicitly.
 */
export function buildPayload(prompt, options) {
  const payload = {
    prompt,
    negative_prompt: options.negativePrompt,
    width: options.width,
    height: options.height,
    steps: options.steps,
    seed: options.seed,
    seed_mode: options.seedMode,
    sampler_name: options.sampler,
    guidance_scale: options.cfgScale,
    batch_count: 1,
    batch_size: 1,
  }
  if (options.model) payload.model = options.model
  return payload
}

/** Error message carried by a failed Draw Things response, or a readable fallback. */
export function describeFailure(status, body) {
  const parsed = typeof body === 'string' ? parseJson(body) : body
  if (parsed && typeof parsed === 'object') {
    const detail = parsed.detail ?? parsed.error ?? parsed.message
    if (typeof detail === 'string' && detail.trim() !== '') return detail.trim()
  }
  if (typeof body === 'string' && body.trim() !== '') return body.trim().slice(0, 400)
  return `HTTP ${status}`
}

/** JSON parse that never throws. */
export function parseJson(value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/** First image of a successful `/sdapi/v1/txt2img` response, as a data URL. */
export function firstImage(body) {
  const parsed = parseJson(body)
  const image = Array.isArray(parsed?.images) ? parsed.images[0] : undefined
  if (typeof image !== 'string' || image === '') return undefined
  return image.startsWith('data:') ? image : `data:image/png;base64,${image}`
}

/** File-name stem from a prompt: the first words, filesystem-safe. */
export function promptStem(prompt) {
  const stem = prompt
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .toLowerCase()
    .split('-')
    .filter(Boolean)
    .slice(0, 6)
    .join('-')
  return (stem || 'image').slice(0, 60)
}
