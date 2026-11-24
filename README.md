# Draw Things images

A chat panel inside DeepSeek Harness that draws pictures with the local **Draw Things** app.

## How it works

- The Host half serves `/draw-things-chat/*` on the web GUI server and talks to Draw Things over its Automatic1111-compatible HTTP API (`POST /sdapi/v1/txt2img`).
- The panel is a tab type in the right sidebar (`kind: drawThings`), registered by `client.js` as a Module Loader bundle.
- The `draw_image` tool lets an agent generate through the same code path.

## Use

1. In Draw Things open **Settings → HTTP Server** and start it on `127.0.0.1:7860` (or change `baseUrl` in the plugin configuration).
2. In the right sidebar press **+** and choose **Generate images in Draw Things**.
3. Type a description, press **Enter**. The image appears with its prompt, size, steps and seed.
4. Under the prompt box pick a preset, size, style and model; **More** shows steps, CFG, sampler, seed mode and the negative prompt.
5. On an image use **Save to workspace** (goes to the Session working directory), **Put the prompt in the box**, **Copy prompt**, **Open full size** or **Delete**.

## Configuration (`cordis.patch.yml` row `draw-things-chat`)

| Field | Default | Meaning |
|---|---|---|
| `baseUrl` | `http://127.0.0.1:7860` | Draw Things API address |
| `model` | `sd_xl_base_1.0_f16.ckpt` | Model file name sent as `model`; empty means the Draw Things current model |
| `size` | `square` | `square` 768², `portrait` 768×1024, `landscape` 1024×768, `wide` 1024×576, `tall` 576×1024 |
| `steps` | `20` | Sampling steps |
| `sampler` | `DPM++ 2M Karras` | Sampler sent as `sampler_name` |
| `cfgScale` | `6.5` | Guidance scale |
| `seedMode` | `Scale Alike` | Seed mode |
| `negativePrompt` | empty | Default negative prompt |
| `models` | `sd_xl_base_1.0_f16.ckpt` | Model file names offered in the panel picker |
| `timeoutMs` | `900000` | A generation slower than this fails with a timeout |

## Limitations

- Draw Things does not expose its model list or sampler list over HTTP; names go in the configuration.
- Every request sets the seed explicitly (random unless a seed is passed to the tool), and Draw Things also updates its own window with the last prompt and seed.
- The panel keeps its last 30 images in this browser's `localStorage`; the Session log is not touched. Saving writes a PNG into the Session working directory.
- PNGs are held in Host memory (last 120) so the panel can display them; they disappear on Host restart, but saved files stay.
