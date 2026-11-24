/**
 * Host half of the Draw Things chat bundle.
 *
 * One route group on the web server serves the panel (`/draw-things-chat/*`)
 * and the screenshots the browser renders (`/draw-things-chat/img/<id>`), and
 * a `draw_image` tool lets an agent generate through exactly the same code.
 * Draw Things itself is reached over its Automatic1111-compatible HTTP API.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  buildPayload,
  describeFailure,
  firstImage,
  modelList,
  promptStem,
  resolveOptions,
  sanitizeSettings,
} from './src/shared.js'

/** Package directories tried in order: explicit override, installation, workspace, development copy. */
const PACKAGES = [
  process.env.DRAW_THINGS_DSH_PACKAGES,
  "/Applications/DeepSeek Harness.app/Contents/Resources/app.asar.unpacked/dsh/node_modules/@deepseek-ai",
  "/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/node_modules/@deepseek-ai",
  join(fileURLToPath(import.meta.url), '..', 'node_modules/@deepseek-ai'),
].filter(value => typeof value === 'string' && value !== '')

/**
 * Load a package every Harness context shares. The running installation owns
 * its copy; a second copy from the profile would be a different module
 * instance. The workspace copy is the development fallback.
 * @param {string} name - package directory name under @deepseek-ai.
 * @returns {Promise<Record<string, unknown>>} its exports.
 */
async function loadShared(name) {
  const errors = []
  for (const base of PACKAGES) {
    try {
      return await import(new URL(`./${name}/lib/index.js`, pathToFileURL(`${base}/`)))
        .catch(error => error?.code === 'ERR_MODULE_NOT_FOUND' ? import(new URL(`./${name}/lib/index.mjs`, pathToFileURL(`${base}/`))) : Promise.reject(error))
    } catch (error) {
      errors.push(`${base}/${name}: ${error?.code ?? error?.message ?? error}`)
    }
  }
  throw new Error(`draw-things-chat: cannot load @deepseek-ai/${name} (${errors.join('; ')})`)
}

const { defineTool } = await loadShared('dsh-tools')
const z = await loadShared('schemastery').then(module => module.default)

/** Bundle identity; the Client module registers under the same name. */
export const PLUGIN_ID = '@local/draw-things-chat'

/** The web server, the tool registry, and (when composed) the session controller. */
export const inject = ['webServer', 'tools']

/** Plugin row configuration; every field falls back to the defaults below. */
export const Config = z.object({
  baseUrl: z.string().description('Draw Things API address, normally http://127.0.0.1:7860'),
  model: z.string().description('Model file name sent with every request; empty keeps the Draw Things current model'),
  size: z.string().description('Default canvas: square, portrait, landscape, wide or tall'),
  steps: z.number().step(1).min(1).max(150).default(20),
  sampler: z.string().description('Sampler sent as sampler_name'),
  cfgScale: z.number().min(0).max(25).default(6.5),
  seedMode: z.string().description('Scale Alike, Legacy, Torch CPU Compatible or NVIDIA GPU Compatible'),
  negativePrompt: z.string().default(''),
  models: z.array(z.string()).description('Model file names offered in the panel picker'),
  timeoutMs: z.number().step(1).min(1000).max(3_600_000).default(900_000),
})

const ROUTE_PREFIX = '/draw-things-chat'
const MAX_BODY_BYTES = 64 * 1024 * 1024
const CACHE_LIMIT = 120

export function apply(ctx, config) {
  const base = sanitizeSettings({
    baseUrl: config?.baseUrl,
    model: config?.model,
    size: config?.size,
    steps: config?.steps,
    sampler: config?.sampler,
    cfgScale: config?.cfgScale,
    seedMode: config?.seedMode,
    negativePrompt: config?.negativePrompt,
    models: config?.models,
  })
  // An empty model keeps whatever model the Draw Things window uses.
  const defaults = {
    ...base,
    model: typeof config?.model === 'string' ? config.model.trim() : '',
    models: base.models.length > 0 ? base.models : ['sd_xl_base_1.0_f16.ckpt'],
  }
  const timeoutMs = config?.timeoutMs ?? 900_000
  let counter = 0
  const images = new Map()

  function remember(id, record) {
    images.set(id, record)
    while (images.size > CACHE_LIMIT) images.delete(images.keys().next().value)
    return id
  }

  async function generate({ prompt, settings, overrides }) {
    const started = Date.now()
    const merged = sanitizeSettings({ ...defaults, ...(settings ?? {}), models: settings?.models ?? defaults.models })
    const options = resolveOptions(merged, overrides)
    const url = `${merged.baseUrl}/sdapi/v1/txt2img`
    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(prompt, options)),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      const reason = error?.name === 'TimeoutError'
        ? `Draw Things did not answer at ${url} within ${Math.round(timeoutMs / 1000)} s`
        : `Draw Things is unreachable at ${url} (${error?.cause?.code ?? error?.message ?? String(error)}). Start the app and enable its HTTP server.`
      throw Object.assign(new Error(reason), { code: 'draw-things/unreachable' })
    }
    const text = await response.text()
    if (!response.ok) {
      throw Object.assign(new Error(describeFailure(response.status, text)), { code: 'draw-things/rejected', status: response.status })
    }
    const image = firstImage(text)
    if (image === undefined) {
      throw Object.assign(new Error('Draw Things returned no image.'), { code: 'draw-things/empty' })
    }
    const record = {
      id: `${started.toString(36)}-${(counter++).toString(36)}`,
      prompt,
      image,
      model: options.model,
      size: options.size,
      width: options.width,
      height: options.height,
      steps: options.steps,
      sampler: options.sampler,
      cfgScale: options.cfgScale,
      seedMode: options.seedMode,
      seed: options.seed,
      createdAt: started,
      elapsedMs: Date.now() - started,
    }
    remember(record.id, record)
    return record
  }

  async function save({ id, image, prompt, createdAt }, directory) {
    let dataUrl = typeof image === 'string' && image.startsWith('data:image/') ? image : undefined
    if (dataUrl === undefined && typeof id === 'string') dataUrl = images.get(id)?.image
    if (dataUrl === undefined) {
      throw Object.assign(new Error('There is no image to save.'), { code: 'draw-things/not-image' })
    }
    const base = typeof directory === 'string' && directory.trim() !== '' ? directory.trim() : process.cwd()
    const stamp = new Date(Number.isFinite(createdAt) ? createdAt : Date.now())
    const pad = (n) => String(n).padStart(2, '0')
    const name = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}-${String(counter++).padStart(4, '0')}-${promptStem(prompt ?? '')}.png`
    await mkdir(base, { recursive: true })
    const file = join(base, name)
    await writeFile(file, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'))
    return { file, directory: base }
  }

  async function check() {
    const url = `${defaults.baseUrl}/sdapi/v1/options`
    const started = Date.now()
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) })
      await response.arrayBuffer()
      if (!response.ok) return { reachable: false, baseUrl: defaults.baseUrl, error: `Draw Things answered HTTP ${response.status}` }
      return { reachable: true, baseUrl: defaults.baseUrl, latencyMs: Date.now() - started }
    } catch (error) {
      return { reachable: false, baseUrl: defaults.baseUrl, error: error?.cause?.code ?? error?.message ?? String(error) }
    }
  }

  /** Directory the panel saves into for one request: the Session cwd when the Session is known. */
  function directoryFor(sessionId) {
    if (typeof sessionId !== 'string' || sessionId === '') return undefined
    try {
      const session = ctx.get?.('sessions')?.get?.(sessionId)
      const cwd = session?.cwd ?? session?.meta?.cwd
      return typeof cwd === 'string' && cwd !== '' ? cwd : undefined
    } catch {
      return undefined
    }
  }

  /** The image route serves generated PNGs by id for the panel and the agent. */
  function registerImages(server) {
    return server.register({
      kind: 'prefix',
      path: `${ROUTE_PREFIX}/img/`,
      handler: (req, res) => {
        const id = decodeURIComponent((req.url ?? '/').split('?')[0].slice(`${ROUTE_PREFIX}/img/`.length))
        const record = images.get(id)
        if (record === undefined) return sendJson(res, 404, { error: 'not-found', message: 'Unknown or expired image.' })
        return sendPng(res, record)
      },
    })
  }

  ctx.effect(() => {
    const disposers = [registerImages(ctx.webServer)]
    // The Desktop host reaches the GUI over its own web server; attach there when it appears.
    if (ctx.get('webServer') === undefined) {
      ctx.inject(['webServer'], (scope) => {
        scope.effect(() => registerImages(scope.webServer), 'draw-things-chat: desktop images')
      })
    }
    return () => {
      for (const dispose of disposers.splice(0)) dispose()
    }
  }, 'draw-things-chat: images')

  ctx.effect(() => {
    const server = ctx.webServer
    return server.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      handler: async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const path = url.pathname.slice(ROUTE_PREFIX.length) || '/'
        try {
          if (req.method === 'GET' && path === '/status') return sendJson(res, 200, await check())
          if (req.method === 'GET' && path === '/settings') {
            return sendJson(res, 200, { ...defaults, directory: directoryFor(url.searchParams.get('sessionId')) })
          }
          if (req.method === 'POST' && path === '/generate') {
            const body = await readJson(req)
            const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
            if (prompt === '') return sendJson(res, 400, { error: 'draw-things/empty-prompt', message: 'A prompt is required.' })
            const style = body.options !== null && typeof body.options === 'object' ? body.options : {}
            try {
              const record = await generate({
                prompt,
                settings: sanitizeSettings({ ...defaults, ...(body.settings ?? {}) }),
                overrides: {
                  size: style.size,
                  steps: style.steps,
                  sampler: style.sampler,
                  cfgScale: style.cfgScale,
                  seedMode: style.seedMode,
                  negativePrompt: style.negativePrompt,
                  model: typeof style.model === 'string' ? style.model : undefined,
                  seed: Number.isInteger(style.seed) ? style.seed : undefined,
                },
              })
              const { image: _image, ...meta } = record
              return sendJson(res, 200, { ...meta, url: `${ROUTE_PREFIX}/img/${encodeURIComponent(record.id)}`, directory: directoryFor(body.sessionId) })
            } catch (error) {
              return sendFailure(ctx, res, error)
            }
          }
          if (req.method === 'POST' && path === '/save') {
            const body = await readJson(req)
            try {
              const directory = typeof body.directory === 'string' && body.directory !== '' ? body.directory : directoryFor(body.sessionId)
              return sendJson(res, 200, await save(body, directory))
            } catch (error) {
              return sendFailure(ctx, res, error)
            }
          }
          return sendJson(res, 404, { error: 'not-found', message: `Unknown route ${path}` })
        } catch (error) {
          return sendFailure(ctx, res, error)
        }
      },
    })
  }, 'draw-things-chat: routes')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'draw_image',
    description:
      'Generate one image locally with Draw Things through its HTTP API (text-to-image) and save it as a PNG. '
      + 'Write the prompt in English: subject, style, lighting, composition. '
      + `Returns a short job id and the settings used. Defaults: model ${defaults.model || 'the current Draw Things model'}, ${defaults.steps} steps, ${defaults.sampler}.`,
    parameters: {
      prompt: { type: 'string', required: true, description: 'Image description in English.' },
      negative_prompt: { type: 'string', description: 'What to avoid; defaults to the configured negative prompt.' },
      model: { type: 'string', description: 'Draw Things model file name; defaults to the configured model.' },
      size: {
        type: 'string',
        enum: ['square', 'portrait', 'landscape', 'wide', 'tall'],
        description: 'square 768x768, portrait 768x1024, landscape 1024x768, wide 1024x576, tall 576x1024.',
      },
      steps: { type: 'integer', description: 'Sampling steps from 1 to 150.' },
      seed: { type: 'integer', description: 'Seed for a repeatable result; omit for a random one.' },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          prompt: { type: 'string' },
          model: { type: 'string' },
          width: { type: 'integer' },
          height: { type: 'integer' },
          steps: { type: 'integer' },
          sampler: { type: 'string' },
          seed: { type: 'integer' },
          elapsedSeconds: { type: 'number' },
        },
        additionalProperties: false,
      },
      render(_args, value) {
        return [{
          type: 'text',
          text: [
            `Generated image ${value.id}.`,
            `Model: ${value.model || 'current Draw Things model'} | ${value.width}x${value.height} | ${value.steps} steps | ${value.sampler} | seed ${value.seed} | ${value.elapsedSeconds} s`,
            `Prompt: ${value.prompt}`,
          ].join('\n'),
        }]
      },
    },
    async execute(args, exec) {
      exec.signal?.throwIfAborted?.()
      const record = await generate({
        prompt: args.prompt,
        settings: defaults,
        overrides: {
          model: args.model,
          size: args.size,
          steps: args.steps,
          negativePrompt: args.negative_prompt,
          ...(Number.isInteger(args.seed) ? { seed: args.seed } : {}),
        },
      })
      return {
        id: record.id,
        prompt: record.prompt,
        model: record.model,
        width: record.width,
        height: record.height,
        steps: record.steps,
        sampler: record.sampler,
        seed: record.seed,
        elapsedSeconds: Math.round(record.elapsedMs / 100) / 10,
      }
    },
    isConcurrencySafe: () => false,
  })), 'draw-things-chat: draw_image tool')

  return { generate, save, check }
}

function sendFailure(ctx, res, error) {
  const status = error?.code === 'draw-things/rejected' ? 422
    : error?.code === 'draw-things/unreachable' ? 502
      : error?.code === 'draw-things/not-image' ? 400
        : 500
  ctx.logger?.warn?.(`draw-things-chat: ${error?.code ?? 'failed'}: ${error?.message ?? error}`)
  return sendJson(res, status, { error: error?.code ?? 'draw-things/failed', message: error?.message ?? String(error) })
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendPng(res, record) {
  const data = Buffer.from(record.image.slice(record.image.indexOf(',') + 1), 'base64')
  res.writeHead(200, {
    'content-type': 'image/png',
    'cache-control': 'private, max-age=86400',
    'content-length': data.length,
  })
  res.end(data)
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      req.destroy?.()
      const error = new Error('Request body is too large.')
      error.code = 'draw-things/too-large'
      throw error
    }
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  return text === '' ? {} : JSON.parse(text)
}
