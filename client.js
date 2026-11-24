window.__ModuleLoader__.load({
  id: '@local/draw-things-chat',
  factory(require) {
    const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
    const React = require('react')

    const h = React.createElement
    const { useCallback, useEffect, useId, useMemo, useRef, useState } = React

    const PLUGIN_KEY = '@local/draw-things-chat'
    const KIND = 'drawThings'
    const NAMESPACE = 'drawThingsChat'
    const ROUTE = '/draw-things-chat'
    const SETTINGS_STORAGE_KEY = 'dsh.draw-things-chat.settings.v2'

    const SIZES = [
      { id: 'square', width: 768, height: 768 },
      { id: 'portrait', width: 768, height: 1024 },
      { id: 'landscape', width: 1024, height: 768 },
      { id: 'wide', width: 1024, height: 576 },
      { id: 'tall', width: 576, height: 1024 },
    ]
    const SAMPLERS = ['DPM++ 2M Karras', 'Euler a', 'DPM++ SDE Karras', 'UniPC', 'DDIM', 'PLMS', 'LCM', 'TCD', 'Euler A Trailing', 'DPM++ 2M Trailing']
    const SEED_MODES = ['Scale Alike', 'Legacy', 'Torch CPU Compatible', 'NVIDIA GPU Compatible']
    const PRESETS = [
      { id: 'balanced', steps: 20 },
      { id: 'fast', steps: 8 },
      { id: 'quality', steps: 35 },
    ]
    const STYLES = ['off', 'illustration', 'photo', 'oil', 'anime', '3d']
    const STYLE_APPENDIX = {
      illustration: 'hand-drawn illustration, clean lines, flat colors',
      photo: 'photograph, 50mm lens, natural lighting, sharp focus',
      oil: 'oil painting, visible brush strokes, rich texture',
      anime: 'anime style, cel shading, expressive',
      '3d': '3D render, soft global illumination, octane',
    }
    const DEFAULT_MODELS = ['sd_xl_base_1.0_f16.ckpt']
    const DEFAULT_OPTIONS = {
      model: 'sd_xl_base_1.0_f16.ckpt',
      size: 'square',
      steps: 20,
      sampler: 'DPM++ 2M Karras',
      cfgScale: 6.5,
      seedMode: 'Scale Alike',
      negativePrompt: '',
      presets: PRESETS.map(preset => preset.id),
    }
    const HISTORY_KEY = 'dsh.draw-things-chat.history.v1'
    const HISTORY_LIMIT = 30
    const EMPTY_LIST = []

    const FALLBACK = {
      "title": "Draw Things images",
      "guideTitle": "Generate images in Draw Things",
      "guideDescription": "Local models, text-to-image",
      "placeholder": "Describe the picture, Enter to generate",
      "generate": "Generate",
      "stop": "Stop",
      "rendering": "Rendering in Draw Things…",
      "empty": "Describe a picture to generate it in Draw Things.",
      "examples": "Try",
      "exampleSky": "star trails over a snow peak at sunset",
      "exampleStill": "watercolor still life on white paper",
      "exampleRobot": "cardboard robot on a rainy cyberpunk street",
      "model": "Model",
      "preset": "Preset",
      "size": "Size",
      "steps": "Steps",
      "sampler": "Sampler",
      "cfg": "CFG",
      "seedMode": "Seed mode",
      "negative": "Negative prompt",
      "settings": "Settings",
      "advanced": "More",
      "style": "Style",
      "styleOff": "None",
      "styleIllustration": "Illustration",
      "stylePhoto": "Photo",
      "styleOil": "Oil painting",
      "styleAnime": "Anime",
      "style3d": "3D render",
      "balanced": "Balanced",
      "fast": "Fast",
      "quality": "Quality",
      "square": "Square",
      "portrait": "Portrait",
      "landscape": "Landscape",
      "wide": "Wide",
      "tall": "Tall",
      "actionSave": "Save to workspace",
      "actionZoom": "Open full size",
      "actionCopy": "Copy prompt",
      "actionPrompt": "Put the prompt in the box",
      "actionDelete": "Delete",
      "clear": "Clear",
      "clearConfirm": "Delete every image in this panel?",
      "cancel": "Cancel",
      "confirm": "Clear",
      "saved": "Saved: {file}",
      "saveFailed": "Could not save: {message}",
      "copyFailed": "Copying is unavailable.",
      "statusChecking": "Connecting to Draw Things…",
      "statusReady": "Draw Things ready · {latency} ms",
      "statusDown": "No answer from {url} ({error}). Start Draw Things and enable Settings → HTTP Server.",
      "statusRetry": "Check again",
      "errorTitle": "Generation failed",
      "networkError": "The Draw Things plugin host is unreachable.",
      "preview": "Preview",
      "close": "Close",
      "params": "{width}×{height} · {steps} steps · {sampler}",
      "promptRequired": "Write a description first.",
      "savedDirectory": "Saves to {directory}",
      "savedDirectoryUnknown": "Saves to the session workspace",
      "truncated": "Older images are not listed; saving still works.",
      "meta.title": "Draw Things images",
      "meta.description": "Right-side panel that generates images with the local Draw Things app: describe the picture, press Enter, and the image appears with its prompt, size, steps and seed. Presets, size, style and model sit under the prompt box; More shows steps, CFG, sampler, seed mode and the negative prompt. Open it with + in the right sidebar (“Generate images in Draw Things”) or ask the agent for draw_image. Needs Draw Things with Settings → HTTP Server on (http://127.0.0.1:7860); only the prompt and settings go to that local address. Items are saved to the session folder from each image's Save button; the panel keeps the last 30 images in this browser.",
      "meta.detail": "docs/DETAIL.md"
    }
    /*
     * Dictionaries: English ships in the bundle, so the panel works at once.
     * The host's locale resource is fetched alongside and merged in.
     */
    const dictionaries = { value: { en: FALLBACK } }
    const localeReady = {}
    for (const id of ['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt']) {
      Object.defineProperty(localeReady, id, {
        enumerable: true,
        get() {
          return dictionaries.value?.[id] ?? (id === 'en' ? FALLBACK : {})
        },
      })
    }
    /** Every mounted translate seat; a language switch re-renders them. */
    const reloaders = new Set()
    localeReady.reload = () => {
      for (const reload of reloaders) reload()
    }
    /**
     * Translate callback bound to one mounted component.
     * @returns a stable t() that re-renders its component on language changes.
     */
    function useTranslate() {
      const [revision, setRevision] = useState(0)
      useEffect(() => {
        const reload = () => setRevision(value => value + 1)
        reloaders.add(reload)
        return () => {
          if (reloaders.delete(reload)) setRevision(0)
        }
      }, [])
      return useCallback((key, values) => {
        void revision
        return local(key, values)
      }, [revision])
    }

    const styleText = `
.dtc-root{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.45;box-sizing:border-box}
.dtc-scroll{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:18px;padding:14px 14px 8px}
.dtc-empty{display:flex;flex-direction:column;gap:10px;color:var(--dsw-alias-label-secondary)}
.dtc-emptyTitle{color:var(--dsw-alias-label-primary);font-size:14px}
.dtc-examplesLabel{color:var(--dsw-alias-label-tertiary);font-size:11px}
.dtc-examples{display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.dtc-example{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:999px;padding:3px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:left;max-width:100%}
.dtc-example:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dtc-item{display:flex;flex-direction:column;gap:8px}
.dtc-prompt{margin:0;white-space:pre-wrap;word-break:break-word;font-size:13px}
.dtc-frame{border-radius:var(--dsw-radius-md);overflow:hidden;background:var(--dsw-alias-bg-skeleton);align-self:stretch;border:.5px solid var(--dsw-alias-border-l2)}
.dtc-frame img{display:block;width:100%;height:auto;cursor:zoom-in}
.dtc-meta{color:var(--dsw-alias-label-tertiary);font-size:11px;word-break:break-all}
.dtc-actions{display:flex;flex-wrap:wrap;gap:2px;margin-inline:-6px}
.dtc-actions button{border:none;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:var(--dsw-radius-sm);padding:3px 8px;font:inherit;font-size:12px;line-height:18px;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.dtc-actions button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dtc-actions button:disabled{opacity:.5;cursor:default}
.dtc-notice{color:var(--dsw-alias-state-success-primary);font-size:12px;word-break:break-all}
.dtc-error{border:.5px solid var(--dsw-alias-state-error-secondary);border-radius:var(--dsw-radius-md);padding:8px 10px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.dtc-errorTitle{color:var(--dsw-alias-state-error-primary);font-size:12px;font-weight:500}
.dtc-errorText{white-space:pre-wrap;word-break:break-word;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dtc-pending{border:.5px dashed var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px;color:var(--dsw-alias-label-secondary);text-align:center}
.dtc-composer{border-top:.5px solid var(--dsw-alias-border-l2);padding:10px 12px 12px;display:flex;flex-direction:column;gap:8px;background:var(--dsw-alias-bg-base)}
.dtc-field{display:flex;flex-direction:column;gap:3px;min-width:0}
.dtc-fieldLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.dtc-input,.dtc-select,.dtc-textarea{width:100%;box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;padding:5px 7px}
.dtc-input:focus-visible,.dtc-select:focus-visible,.dtc-textarea:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}
.dtc-textarea{resize:none;min-height:62px;font-size:13px;line-height:20px}
.dtc-promptRow{display:flex;gap:8px;align-items:stretch}
.dtc-promptRow .dtc-textarea{flex:1}
.dtc-generate{flex:none;width:40px;border:none;border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);cursor:pointer;display:flex;align-items:center;justify-content:center}
.dtc-generate:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.dtc-generate:disabled{opacity:.4;cursor:default}
.dtc-chips{display:flex;gap:4px;flex-wrap:wrap}
.dtc-chip{border:.5px solid var(--dsw-alias-border-l3);background:transparent;border-radius:999px;padding:2px 9px;font:inherit;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dtc-chip[aria-pressed=true]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-interactive-bg-hover)}
.dtc-row{display:flex;gap:6px;flex-wrap:wrap}
.dtc-row>*{flex:1 1 96px;min-width:0}
.dtc-advanced{display:flex;flex-direction:column;gap:8px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);padding:8px}
.dtc-tools{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.dtc-tools button{border:none;background:transparent;color:var(--dsw-alias-label-secondary);border-radius:var(--dsw-radius-sm);padding:2px 6px;font:inherit;font-size:12px;line-height:18px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.dtc-tools button:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dtc-tools button[aria-pressed=true]{color:var(--dsw-alias-brand-primary)}
.dtc-tools button[aria-expanded=true]{color:var(--dsw-alias-brand-primary)}
.dtc-tools .dtc-spacer{flex:1}
.dtc-status{display:flex;gap:6px;align-items:center;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);min-width:0}
.dtc-status[data-state=down]{color:var(--dsw-alias-state-warn-label)}
.dtc-statusText{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dtc-status button{border:none;background:transparent;color:var(--dsw-alias-link);font:inherit;font-size:11px;cursor:pointer;padding:0}
.dtc-dot{width:7px;height:7px;border-radius:50%;flex:none;background:var(--dsw-alias-state-success-primary)}
.dtc-dot[data-state=down]{background:var(--dsw-alias-state-error-primary)}
.dtc-dot[data-state=checking]{background:var(--dsw-alias-state-idle-primary)}
.dtc-title{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;white-space:nowrap}
.dtc-title svg{flex:none;color:var(--dsw-alias-label-tertiary)}
.dtc-confirm{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);padding:8px;display:flex;flex-direction:column;gap:6px;font-size:12px}
.dtc-confirmRow{display:flex;gap:6px;justify-content:flex-end}
.dtc-confirmRow button{border:.5px solid var(--dsw-alias-border-l3);background:transparent;border-radius:var(--dsw-radius-sm);padding:2px 10px;font:inherit;font-size:12px;cursor:pointer;color:var(--dsw-alias-label-primary)}
.dtc-confirmRow button[data-primary=true]{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}
`

    function format(template, values) {
      return String(template).replace(/\{(\w+)\}/gu, (whole, key) => (values && key in values ? String(values[key]) : whole))
    }

    function localeTag() {
      const own = typeof document !== 'undefined' ? document.documentElement.lang : ''
      const nav = typeof navigator !== 'undefined' ? navigator.language : ''
      return String(own || nav || 'en').toLowerCase()
    }

    function local(key, values) {
      const tag = localeTag()
      for (const lang of [tag, tag.split('-')[0], 'en']) {
        const table = lang in localeReady ? localeReady[lang] : undefined
        if (table && typeof table[key] === 'string') return format(table[key], values)
      }
      return key
    }

    function storage() {
      try {
        return window.localStorage
      } catch {
        return undefined
      }
    }

    function readStorage(key, fallback) {
      try {
        const raw = storage()?.getItem(key)
        return raw === null || raw === undefined ? fallback : JSON.parse(raw)
      } catch {
        return fallback
      }
    }

    function writeStorage(key, value) {
      try {
        storage()?.setItem(key, JSON.stringify(value))
      } catch {
        /* Quota or disabled storage: the panel keeps working in memory. */
      }
    }

    function clampInt(value, min, max, fallback) {
      const n = Number.parseInt(value, 10)
      if (!Number.isFinite(n)) return fallback
      return Math.min(max, Math.max(min, n))
    }

    function normalizeOptions(source) {
      const input = source !== null && typeof source === 'object' ? source : {}
      const presets = Array.isArray(input.presets) ? input.presets.filter(id => PRESETS.some(preset => preset.id === id)) : []
      return {
        model: typeof input.model === 'string' && input.model.trim() !== '' ? input.model.trim() : DEFAULT_OPTIONS.model,
        size: SIZES.some(candidate => candidate.id === input.size) ? input.size : DEFAULT_OPTIONS.size,
        steps: clampInt(input.steps, 1, 150, DEFAULT_OPTIONS.steps),
        sampler: SAMPLERS.includes(input.sampler) ? input.sampler : DEFAULT_OPTIONS.sampler,
        cfgScale: clampInt(input.cfgScale, 0, 25, DEFAULT_OPTIONS.cfgScale),
        seedMode: SEED_MODES.includes(input.seedMode) ? input.seedMode : DEFAULT_OPTIONS.seedMode,
        negativePrompt: typeof input.negativePrompt === 'string' ? input.negativePrompt : '',
        presets: presets.length > 0 ? presets : DEFAULT_OPTIONS.presets,
      }
    }

    function sizeOf(id) {
      return SIZES.find(size => size.id === id) ?? SIZES[0]
    }

    function composePrompt(prompt, style) {
      const base = prompt.trim()
      const appendix = STYLE_APPENDIX[style]
      return appendix === undefined ? base : `${base}, ${appendix}`
    }

    async function requestJson(path, init) {
      let response
      try {
        response = await fetch(`${ROUTE}${path}`, {
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          ...init,
        })
      } catch {
        throw Object.assign(new Error(local('networkError')), { code: 'draw-things/network' })
      }
      const text = await response.text()
      let body
      try {
        body = text === '' ? undefined : JSON.parse(text)
      } catch {
        body = undefined
      }
      if (!response.ok) {
        throw Object.assign(new Error(body?.message ?? `HTTP ${response.status}`), { code: body?.error ?? 'http', status: response.status })
      }
      return body
    }

    function readHistory() {
      const list = readStorage(HISTORY_KEY, EMPTY_LIST)
      if (!Array.isArray(list)) return []
      return list.filter(item => item !== null && typeof item === 'object' && typeof item.url === 'string')
    }

    function writeHistory(list) {
      writeStorage(HISTORY_KEY, list.slice(0, HISTORY_LIMIT))
    }

    /* ---------------------------------------------------------------- icons */

    function glyph(children, size) {
      return h('svg', {
        width: size ?? 14, height: size ?? 14, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
      }, children)
    }

    function IconAperture({ size }) {
      return glyph([h('circle', { key: 'c', cx: 8, cy: 8, r: 6 }), h('path', { key: 'p', d: 'M8 2v5.2M12.9 5.6L8.6 9.6M12.9 10.4H7.2M8 14l3.3-4M3.1 10.4l3.3-4M3.1 5.6h5.7' })], size)
    }
    function IconSend({ size }) {
      return glyph([h('path', { key: 'p', d: 'M2.5 8h10.5M9 3.8L13.2 8 9 12.2' })], size)
    }
    function IconStop({ size }) {
      return h('svg', { width: size ?? 14, height: size ?? 14, viewBox: '0 0 16 16', 'aria-hidden': true }, h('rect', { x: 4.5, y: 4.5, width: 7, height: 7, rx: 1.2, fill: 'currentColor' }))
    }
    function IconRefresh({ size }) {
      return glyph([h('path', { key: 'a', d: 'M13.2 7.2A5.2 5.2 0 1 0 12.4 11' }), h('path', { key: 'b', d: 'M13.4 3.4v3.8h-3.8' })], size)
    }
    function IconSave({ size }) {
      return glyph([h('path', { key: 'a', d: 'M8 2.5v7.2M5.2 7l2.8 2.8L10.8 7' }), h('path', { key: 'b', d: 'M2.8 11.2v1.6a.8.8 0 0 0 .8.8h8.8a.8.8 0 0 0 .8-.8v-1.6' })], size)
    }
    function IconExpand({ size }) {
      return glyph([h('path', { key: 'p', d: 'M9.6 2.6h3.8v3.8M6.4 13.4H2.6V9.6M13.4 2.6L9.2 6.8M2.6 13.4l4.2-4.2' })], size)
    }
    function IconCopy({ size }) {
      return glyph([h('rect', { key: 'r', x: 5.5, y: 5.5, width: 7.5, height: 7.5, rx: 1.4 }), h('path', { key: 'p', d: 'M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5' })], size)
    }
    function IconQuote({ size }) {
      return glyph([h('path', { key: 'p', d: 'M6 3H3v4h3v3H4M13 3H10v4h3v3h-2' })], size)
    }
    function IconTrash({ size }) {
      return glyph([h('path', { key: 'p', d: 'M3 4.5h10M6.2 4.5V3.2h3.6v1.3M4.4 4.5l.6 8.2h6l.6-8.2' })], size)
    }
    function IconSliders({ size }) {
      return glyph([h('path', { key: 'a', d: 'M2.5 5h11M2.5 11h11' }), h('circle', { key: 'b', cx: 6, cy: 5, r: 1.7, fill: 'var(--dsw-alias-bg-base)' }), h('circle', { key: 'c', cx: 10.5, cy: 11, r: 1.7, fill: 'var(--dsw-alias-bg-base)' })], size)
    }
    function ArtworkDraw({ size }) {
      const s = size ?? 26
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 2.5, y: 3.5, width: 19, height: 14, rx: 2.4, stroke: '#247bbf', strokeWidth: 1.6 }),
        h('circle', { cx: 8, cy: 8.2, r: 1.6, fill: '#f2b33d' }),
        h('path', { d: 'M3.6 16.2l5-5.2 3.6 3.6 3.2-3.1 4.6 4.7', stroke: '#3aa76d', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M17.2 19.2l3.6 2.4-4 .8', stroke: '#247bbf', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }))
    }

    /* ------------------------------------------------------------- controls */

    function Field({ label, children, full }) {
      return h('label', { className: 'dtc-field', style: full ? { flex: '1 1 100%' } : undefined },
        h('span', { className: 'dtc-fieldLabel' }, label),
        children)
    }

    function Select({ value, options, labels, onChange, label, disabled }) {
      return h('select', { className: 'dtc-select', value, 'aria-label': label, disabled, onChange: event => onChange(event.currentTarget.value) },
        options.map(option => {
          const optionValue = typeof option === 'string' ? option : option.value
          const text = labels && labels[optionValue] !== undefined ? labels[optionValue] : (typeof option === 'string' ? option : option.label)
          return h('option', { key: optionValue, value: optionValue }, text)
        }))
    }

    /* ---------------------------------------------------------- image rows */

    function ImageRow({ entry, t, onZoom, onReuse, onDelete }) {
      const [saving, setSaving] = useState(false)
      const [savedFile, setSavedFile] = useState(undefined)
      const [failure, setFailure] = useState(undefined)
      const [notice, setNotice] = useState(undefined)

      useEffect(() => {
        if (!notice && !failure) return undefined
        const timer = window.setTimeout(() => {
          setNotice(undefined)
          setFailure(undefined)
        }, 7000)
        return () => window.clearTimeout(timer)
      }, [notice, failure])

      const save = useCallback(async () => {
        if (saving) return
        setSaving(true)
        setFailure(undefined)
        try {
          const result = await requestJson('/save', {
            method: 'POST',
            body: JSON.stringify({ id: entry.id, prompt: entry.prompt, createdAt: entry.createdAt }),
          })
          setSavedFile(result?.file)
          setNotice(t('saved', { file: result?.file ?? '' }))
        } catch (reason) {
          setFailure(reason?.message ?? String(reason))
        } finally {
          setSaving(false)
        }
      }, [entry, saving, t])

      const copyPrompt = useCallback(() => {
        const text = entry.prompt ?? ''
        Promise.resolve()
          .then(() => navigator.clipboard.writeText(text))
          .then(() => setNotice(text), () => setFailure(t('copyFailed')))
      }, [entry, t])

      return h('div', { className: 'dtc-item' },
        h('p', { className: 'dtc-prompt' }, entry.prompt),
        h('div', { className: 'dtc-frame' },
          h('img', {
            src: entry.url,
            alt: entry.prompt ?? '',
            loading: 'lazy',
            onClick: () => onZoom(entry),
            draggable: false,
          })),
        h('span', { className: 'dtc-meta' }, t('params', {
          width: entry.width ?? 0,
          height: entry.height ?? 0,
          steps: entry.steps ?? 0,
          sampler: entry.sampler ?? '',
        })),
        h('div', { className: 'dtc-actions' },
          h('button', { type: 'button', disabled: saving, onClick: save }, h(IconSave, { size: 12 }), t('actionSave')),
          h('button', { type: 'button', onClick: () => onReuse(entry) }, h(IconQuote, { size: 12 }), t('actionPrompt')),
          h('button', { type: 'button', onClick: copyPrompt }, h(IconCopy, { size: 12 }), t('actionCopy')),
          h('button', { type: 'button', onClick: () => onZoom(entry) }, h(IconExpand, { size: 12 }), t('actionZoom')),
          h('button', { type: 'button', onClick: () => onDelete(entry) }, h(IconTrash, { size: 12 }), t('actionDelete'))),
        savedFile !== undefined ? h('span', { className: 'dtc-meta' }, savedFile) : null,
        notice !== undefined ? h('span', { className: 'dtc-notice' }, notice) : null,
        failure !== undefined ? h('div', { className: 'dtc-error' }, h('span', { className: 'dtc-errorText' }, failure)) : null)
    }

    function PendingRow({ prompt, sizeLabel, startedAt, t, onStop }) {
      const [now, setNow] = useState(() => Date.now())
      useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
      }, [])
      const seconds = Math.max(0, Math.round((now - startedAt) / 1000))
      return h('div', { className: 'dtc-item' },
        h('p', { className: 'dtc-prompt' }, prompt),
        h('div', { className: 'dtc-pending' },
          h(primitives.TextShimmer, { active: true }, t('rendering')),
          h('span', { className: 'dtc-meta' }, `${sizeLabel} · ${seconds}s`),
          h('button', {
            type: 'button',
            style: { border: 'none', background: 'transparent', color: 'var(--dsw-alias-link)', cursor: 'pointer', fontSize: 12 },
            onClick: onStop,
          }, t('stop'))))
    }

    /* --------------------------------------------------------------- panel */

    function DrawThingsPanel(props) {
      const { useTabInfo } = props
      const sessionId = useTabInfo()?.tab?.sessionId

      const [options, setOptions] = useState(() => normalizeOptions(readStorage(SETTINGS_STORAGE_KEY, DEFAULT_OPTIONS)))
      const [history, setHistory] = useState(readHistory)
      const [draft, setDraft] = useState('')
      const [style, setStyle] = useState('off')
      const [preset, setPreset] = useState('balanced')
      const [showSettings, setShowSettings] = useState(false)
      const [showAdvanced, setShowAdvanced] = useState(false)
      const [confirmingClear, setConfirmingClear] = useState(false)
      const [status, setStatus] = useState({ state: 'checking' })
      const [pending, setPending] = useState(undefined)
      const [failure, setFailure] = useState(undefined)
      const [draftError, setDraftError] = useState(undefined)
      const [languageRevision, setLanguageRevision] = useState(0)
      const [directory, setDirectory] = useState(undefined)
      const [preview, setPreview] = useState(undefined)
      const textareaRef = useRef(null)
      const abortRef = useRef(undefined)
      const listRef = useRef(null)
      const negativeId = useId()

      void languageRevision
      const t = useTranslate()

      useEffect(() => {
        writeStorage(SETTINGS_STORAGE_KEY, options)
      }, [options])

      useEffect(() => {
        const bump = () => setLanguageRevision(revision => revision + 1)
        const observer = new MutationObserver(bump)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
        return () => observer.disconnect()
      }, [])

      const checkStatus = useCallback(() => {
        setStatus({ state: 'checking' })
        requestJson('/status').then(
          result => setStatus(result?.reachable ? { state: 'ready', result } : { state: 'down', result }),
          () => setStatus({ state: 'down', result: {} }),
        )
      }, [])

      useEffect(() => {
        checkStatus()
      }, [checkStatus])

      useEffect(() => {
        if (typeof sessionId !== 'string' || sessionId === '') return undefined
        let live = true
        requestJson(`/settings?sessionId=${encodeURIComponent(sessionId)}`).then(
          result => live && setDirectory(typeof result?.directory === 'string' ? result.directory : undefined),
          () => undefined,
        )
        return () => {
          live = false
        }
      }, [sessionId])

      useEffect(() => {
        const node = listRef.current
        if (node !== null && history.length > 0) node.scrollTop = 0
      }, [history.length])

      const update = useCallback(patch => {
        setOptions(current => normalizeOptions({ ...current, ...patch }))
      }, [])

      const applyPreset = useCallback(id => {
        setPreset(id)
        const entry = PRESETS.find(candidate => candidate.id === id)
        if (entry !== undefined) update({ steps: entry.steps })
      }, [update])

      const pushEntry = useCallback(entry => {
        setHistory(current => {
          const next = [entry, ...current].slice(0, HISTORY_LIMIT)
          writeHistory(next)
          return next
        })
      }, [])

      const run = useCallback(async (rawPrompt, rawStyle) => {
        const finalPrompt = composePrompt(rawPrompt, rawStyle ?? style)
        if (finalPrompt === '') {
          setDraftError(t('promptRequired'))
          textareaRef.current?.focus?.()
          return
        }
        setPending({ prompt: finalPrompt, startedAt: Date.now(), size: sizeOf(options.size) })
        setFailure(undefined)
        setDraftError(undefined)
        const controller = typeof AbortController === 'function' ? new AbortController() : undefined
        abortRef.current = controller
        try {
          const record = await requestJson('/generate', {
            method: 'POST',
            signal: controller?.signal,
            body: JSON.stringify({
              prompt: finalPrompt,
              sessionId,
              options: {
                model: options.model,
                size: options.size,
                steps: options.steps,
                sampler: options.sampler,
                cfgScale: options.cfgScale,
                seedMode: options.seedMode,
                negativePrompt: options.negativePrompt,
              },
            }),
          })
          pushEntry({
            id: record?.id,
            url: record?.url,
            prompt: record?.prompt ?? finalPrompt,
            width: record?.width,
            height: record?.height,
            steps: record?.steps,
            sampler: record?.sampler,
            seed: record?.seed,
            model: record?.model,
            createdAt: record?.createdAt ?? Date.now(),
          })
          setDraft(current => (current.trim() === rawPrompt.trim() ? '' : current))
        } catch (reason) {
          if (reason?.name !== 'AbortError' && reason?.code !== 'draw-things/network') {
            setFailure(reason?.message ?? String(reason))
          } else if (reason?.name !== 'AbortError') {
            setFailure(local('networkError'))
          }
        } finally {
          abortRef.current = undefined
          setPending(undefined)
        }
      }, [options, pushEntry, sessionId, style, t])

      const stop = useCallback(() => {
        abortRef.current?.abort?.()
        setPending(undefined)
      }, [])

      const submit = useCallback(event => {
        event?.preventDefault?.()
        const text = draft.trim()
        if (text === '') {
          setDraftError(t('promptRequired'))
          textareaRef.current?.focus?.()
          return
        }
        if (pending === undefined) void run(text, style)
      }, [draft, pending, run, style, t])

      const onKeyDown = useCallback(event => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent?.isComposing && !event.isComposing) {
          event.preventDefault()
          submit(event)
        }
      }, [submit])

      const reuse = useCallback(entry => {
        setDraft(entry.prompt ?? '')
        setStyle('off')
        textareaRef.current?.focus?.()
      }, [])

      const remove = useCallback(entry => {
        setHistory(current => {
          const next = current.filter(item => item.id !== entry.id)
          writeHistory(next)
          return next
        })
      }, [])

      const clearAll = useCallback(() => {
        setHistory(EMPTY_LIST)
        writeHistory([])
        setConfirmingClear(false)
      }, [])

      const zoom = useCallback(entry => {
        setPreview(entry)
      }, [])

      const modelOptions = useMemo(() => {
        const known = [...new Set([...(options.models ?? []), ...DEFAULT_MODELS, options.model].filter(Boolean))]
        return known.map(name => ({ value: name, label: name }))
      }, [options.model, options.models])

      const sizeLabels = useMemo(() => Object.fromEntries(SIZES.map(entry => [entry.id, `${t(entry.id)} · ${entry.width}×${entry.height}`])), [t])
      const presetLabels = useMemo(() => Object.fromEntries(PRESETS.map(entry => [entry.id, t(entry.id)])), [t])
      const pendingSize = pending === undefined ? '' : `${pending.size.width}×${pending.size.height}`

      const statusText = status.state === 'ready'
        ? t('statusReady', { latency: status.result?.latencyMs ?? 0 })
        : status.state === 'down'
          ? t('statusDown', { url: status.result?.baseUrl ?? 'http://127.0.0.1:7860', error: status.result?.detail ?? status.result?.error ?? status.result?.message ?? '?' })
          : t('statusChecking')

      return h('div', { className: 'dtc-root' },
        h('div', { className: 'dtc-scroll', ref: listRef },
          history.length === 0 && pending === undefined
            ? h('div', { className: 'dtc-empty' },
                h('span', { className: 'dtc-emptyTitle' }, t('empty')),
                h('span', { className: 'dtc-examplesLabel' }, t('examples')),
                h('div', { className: 'dtc-examples' }, ['exampleSky', 'exampleStill', 'exampleRobot'].map(key => h('button', {
                  key,
                  type: 'button',
                  className: 'dtc-example',
                  onClick: () => {
                    setDraft(t(key))
                    textareaRef.current?.focus?.()
                  },
                }, t(key)))))
            : null,
          history.map(entry => h(ImageRow, { key: entry.id, entry, t, onZoom: zoom, onReuse: reuse, onDelete: remove })),
          pending !== undefined ? h(PendingRow, { prompt: pending.prompt, sizeLabel: pendingSize, startedAt: pending.startedAt, t, onStop: stop }) : null,
          failure !== undefined
            ? h('div', { className: 'dtc-error' },
                h('span', { className: 'dtc-errorTitle' }, t('errorTitle')),
                h('span', { className: 'dtc-errorText' }, failure),
                h('button', { type: 'button', className: 'dtc-example', onClick: checkStatus }, t('statusRetry')))
            : null),

        h('form', { className: 'dtc-composer', onSubmit: submit },
          h('div', { className: 'dtc-promptRow' },
            h('textarea', {
              ref: textareaRef,
              className: 'dtc-textarea',
              value: draft,
              placeholder: t('placeholder'),
              'aria-label': t('placeholder'),
              onChange: event => {
                setDraft(event.currentTarget.value)
                setDraftError(undefined)
              },
              onKeyDown,
              rows: 2,
            }),
            h('button', {
              type: pending === undefined ? 'submit' : 'button',
              className: 'dtc-generate',
              'aria-label': pending === undefined ? t('generate') : t('stop'),
              title: pending === undefined ? t('generate') : t('stop'),
              disabled: pending === undefined && draft.trim() === '',
              onClick: pending === undefined ? undefined : stop,
            }, pending === undefined ? h(IconSend, { size: 18 }) : h(IconStop, { size: 16 }))),
          draftError !== undefined ? h('span', { className: 'dtc-meta' }, draftError) : null,
          h('div', { className: 'dtc-chips', role: 'group', 'aria-label': t('style') },
            STYLES.map(id => h('button', {
              key: id,
              type: 'button',
              className: 'dtc-chip',
              'aria-pressed': style === id,
              onClick: () => setStyle(id),
            }, t(id === 'off' ? 'styleOff' : `style${id.charAt(0).toUpperCase()}${id.slice(1)}`)))),
          h('div', { className: 'dtc-tools' },
            h('button', { type: 'button', 'aria-pressed': showSettings, onClick: () => setShowSettings(value => !value) }, h(IconSliders, { size: 12 }), t('settings')),
            h('button', { type: 'button', 'aria-pressed': showAdvanced, onClick: () => setShowAdvanced(value => !value) }, h(IconSliders, { size: 12 }), t('advanced')),
            history.length > 0 ? h('button', { type: 'button', onClick: () => setConfirmingClear(true) }, h(IconTrash, { size: 12 }), t('clear')) : null,
            h('span', { className: 'dtc-spacer' }),
            h('span', { className: 'dtc-status', 'data-state': status.state, title: statusText },
              h('span', { className: 'dtc-dot', 'data-state': status.state }),
              h('span', { className: 'dtc-statusText' }, statusText),
              status.state === 'ready' ? null : h('button', { type: 'button', onClick: checkStatus, 'aria-label': t('statusRetry') }, h(IconRefresh, { size: 12 })))),
          confirmingClear
            ? h('div', { className: 'dtc-confirm' },
                h('span', null, t('clearConfirm')),
                h('div', { className: 'dtc-confirmRow' },
                  h('button', { type: 'button', onClick: () => setConfirmingClear(false) }, t('cancel')),
                  h('button', { type: 'button', 'data-primary': true, onClick: clearAll }, t('confirm'))))
            : null,
          showSettings
            ? h(React.Fragment, null,
                h('div', { className: 'dtc-row' },
                  h(Field, { label: t('preset') },
                    h(Select, { value: preset, label: t('preset'), options: options.presets, labels: presetLabels, onChange: applyPreset })),
                  h(Field, { label: t('size') },
                    h(Select, { value: options.size, label: t('size'), options: SIZES.map(entry => entry.id), labels: sizeLabels, onChange: value => update({ size: value }) }))),
                h(Field, { label: t('model'), full: true },
                  h(Select, { value: options.model, label: t('model'), options: modelOptions, onChange: value => update({ model: value }) })))
            : null,
          showAdvanced
            ? h('div', { className: 'dtc-advanced' },
                h('div', { className: 'dtc-row' },
                  h(Field, { label: t('steps') },
                    h('input', { className: 'dtc-input', type: 'number', min: 1, max: 150, value: options.steps, onChange: event => update({ steps: event.currentTarget.value }) })),
                  h(Field, { label: t('cfg') },
                    h('input', { className: 'dtc-input', type: 'number', min: 0, max: 25, step: 0.5, value: options.cfgScale, onChange: event => update({ cfgScale: event.currentTarget.value }) }))),
                h('div', { className: 'dtc-row' },
                  h(Field, { label: t('sampler') },
                    h(Select, { value: options.sampler, label: t('sampler'), options: SAMPLERS, onChange: value => update({ sampler: value }) })),
                  h(Field, { label: t('seedMode') },
                    h(Select, { value: options.seedMode, label: t('seedMode'), options: SEED_MODES, onChange: value => update({ seedMode: value }) }))),
                h('label', { className: 'dtc-field', htmlFor: negativeId },
                  h('span', { className: 'dtc-fieldLabel' }, t('negative')),
                  h('textarea', {
                    id: negativeId,
                    className: 'dtc-textarea',
                    rows: 2,
                    value: options.negativePrompt,
                    placeholder: t('negative'),
                    onChange: event => update({ negativePrompt: event.currentTarget.value }),
                  })))
            : null,
          h('span', { className: 'dtc-meta' }, directory !== undefined ? t('savedDirectory', { directory }) : t('savedDirectoryUnknown'))),
        preview !== undefined
          ? h(primitives.ImageLightbox, {
              src: preview.url,
              alt: preview.prompt ?? '',
              labels: { dialog: t('preview'), close: t('close') },
              onClose: () => setPreview(undefined),
            })
          : null)
    }

    function DrawThingsTitle() {
      const t = useTranslate()
      return h('span', { className: 'dtc-title' }, h(IconAperture, { size: 14 }), t('title'))
    }

    const mod = {
      inject: ['slots', 'locale'],
      apply(ctx) {
        // A throwing apply must not leave a silent blank panel: report and keep
        // the last good registration.
        try {
          this.applyInner(ctx)
        } catch (error) {
          console.error('[draw-things-chat] apply failed; retrying as a queued module', error)
          globalThis.__ModuleLoader__?.queue?.([mod])
        }
        return mod
      },
      applyInner(ctx) {
        const t = ctx.locale.bind(NAMESPACE)
        ctx.effect(() => ctx.locale.register(NAMESPACE, localeReady), 'draw-things-chat: dictionaries')
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = PLUGIN_KEY
          tag.textContent = styleText
          document.head.appendChild(tag)
          return () => tag.remove()
        }, 'draw-things-chat: styles')

        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: PLUGIN_KEY,
          locale: NAMESPACE,
        }, DrawThingsPanel)), 'draw-things-chat: panel body')

        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: PLUGIN_KEY,
          locale: NAMESPACE,
        }, DrawThingsTitle)), 'draw-things-chat: panel title')

        ctx.effect(() => ctx.sidebarRightTabs.register({
          id: PLUGIN_KEY,
          kind: KIND,
          priority: 'extension',
          title: () => t('title'),
          guide: [{
            id: 'open',
            order: 40,
            title: () => t('guideTitle'),
            description: () => t('guideDescription'),
            icon: ArtworkDraw,
          }],
        }), 'draw-things-chat: tab type')
      },
    }
    return mod
  },
})
