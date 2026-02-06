# AGENTS.md

Guidance for agentic coding assistants working in this repository.

## Project Summary

Node Banana is a node-based visual workflow editor for AI image generation.
Users drag nodes onto a React Flow canvas, connect typed handles, and execute
pipelines that call AI APIs.

Core stack:
- Next.js 16 (App Router) + TypeScript
- @xyflow/react for the node canvas
- Konva / react-konva for annotation drawing
- Zustand for state (single store)

## Commands

Development:
- `npm run dev` start dev server (runs `node server.js`)
- `npm run build` build for production
- `npm run start` start production server
- `npm run lint` run Next.js lint

Testing (Vitest):
- `npm run test` watch mode for all tests
- `npm run test:run` run all tests once (CI)
- `npm run test:coverage` run once with coverage

Single test / focused runs:
- `npm run test -- path/to/test.ts`
- `npm run test -- -t "test name"`
- `npm run test:run -- path/to/test.tsx`
- `npm run test:run -- -t "test name"`

## Environment Setup

Create `.env.local` at repo root:
```
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key  # optional
KIE_API_KEY=your_kie_api_key        # optional
```

## Key Paths

- `src/store/workflowStore.ts` central workflow state + execution
- `src/types/index.ts` shared types and node data interfaces
- `src/components/WorkflowCanvas.tsx` canvas + connection validation
- `src/components/nodes/BaseNode.tsx` base UI for nodes
- `src/app/api/generate/route.ts` image generation
- `src/app/api/llm/route.ts` LLM text generation
- `src/utils/costCalculator.ts` cost calculation
- `src/utils/gridSplitter.ts` grid utility

## Code Style Guidelines

General:
- Prefer clear, explicit code over cleverness; keep functions small.
- Follow existing patterns; avoid refactors unless required.
- Use ASCII in source unless a file already contains Unicode.

Imports:
- Use path alias `@/` for app code (`@/components/...`).
- Group imports: external, then internal, then styles.
- Avoid deep relative paths when a stable alias is available.

Formatting:
- No formatter enforced here; match surrounding style.
- Use single quotes in JS/TS unless file uses double quotes.
- Prefer trailing commas where already used in the file.

TypeScript:
- `strict` is enabled; avoid `any` and `as` unless necessary.
- Type boundaries: API payloads, node data, Zustand store, and hooks.
- Prefer inference for locals; explicitly type public APIs.

React / Next.js:
- Use function components and hooks only.
- Prefer server routes for API operations in `src/app/api`.
- Keep components focused; extract logic into hooks or utils.

Naming:
- Components: `PascalCase`.
- Functions/vars: `camelCase`.
- Types/interfaces: `PascalCase`.
- Constants: `SCREAMING_SNAKE_CASE` when module-level and stable.

Error Handling:
- Validate inputs at boundaries (API routes, execution entry points).
- Return actionable error messages to UI; avoid silent failures.
- Prefer typed error objects and explicit branches.

State Management:
- All state lives in `workflowStore.ts` (Zustand single store pattern).
- Use store actions (`updateNodeData`, `executeWorkflow`, etc.).
- Keep node execution deterministic; avoid hidden async side effects.

## Node System (Reference)

Handle types:
- `image` -> base64 data URL
- `text` -> string

Connection rules:
- Only connect matching types (`image` to `image`, `text` to `text`).
- Source -> target direction only.
- Image inputs allow multiple connections; text inputs allow one.

Data flow in `getConnectedInputs` returns:
`{ images: string[], text: string | null }`.

Image data sources:
- `imageInput` -> `data.image`
- `annotation` -> `data.outputImage`
- `nanoBanana` -> `data.outputImage`

Text data sources:
- `prompt` -> `data.prompt`
- `llmGenerate` -> `data.outputText`

## Adding a New Node Type

1. Add data interface in `src/types/index.ts`.
2. Add to `NodeType` union in `src/types/index.ts`.
3. Add defaults in `createDefaultNodeData()` in `workflowStore.ts`.
4. Add dimensions in `defaultDimensions` in `workflowStore.ts`.
5. Create component in `src/components/nodes/`.
6. Export from `src/components/nodes/index.ts`.
7. Register in `nodeTypes` in `WorkflowCanvas.tsx`.
8. Add minimap color in `WorkflowCanvas.tsx`.
9. Update `getConnectedInputs()` if output is consumable.
10. Add execution logic in `executeWorkflow()` if needed.
11. Update `ConnectionDropMenu.tsx` for source/target lists.

Handle naming:
- Use `id="image"` for image data.
- Use `id="text"` for text data.

Validation:
- Connection validation: `isValidConnection()` in `WorkflowCanvas.tsx`.
- Workflow validation: `validateWorkflow()` in `workflowStore.ts`.

## Kie.ai Models (SOP)

Reference: https://docs.kie.ai/llms.txt

1. Gather model details (IDs, endpoints, params, polling, pricing).
2. Add entry to `KIE_MODELS` in `src/app/api/models/route.ts`.
3. Add schema in `getKieSchema()` in `src/app/api/models/[modelId]/route.ts`.
4. Add defaults in `getKieModelDefaults()` in `src/app/api/generate/route.ts`.
5. Map image input key in `getKieImageInputKey()` if non-default.
6. If endpoints differ, add detection + custom polling in generate flow.

## API Routes

- `/api/generate` (5 min) image generation
- `/api/llm` (1 min) text generation
- `/api/workflow` save/load workflows
- `/api/save-generation` auto-save images
- `/api/logs` session logging

## localStorage Keys

- `node-banana-workflow-configs` project metadata
- `node-banana-workflow-costs` cost tracking
- `node-banana-nanoBanana-defaults` sticky generation settings

## Commit Notes

- `.planning` is untracked; do not commit files inside it.

## Cursor/Copilot Rules

No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md`
files were found in this repo at the time of writing.
