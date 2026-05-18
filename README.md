# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)

## Block location registry

- Block loading is resolved by an explicit registry in `/home/runner/work/reslilency/reslilency/scripts/scripts.js`.
- Authoring names remain unchanged (for example `hero`, `cards`, `columns`, `header`, `fragment`).
- Current layout:
  - Foundation blocks: `/blocks/foundation/<block-name>/<block-name>.{js|css}`
  - Comms blocks: `/blocks/comms/<block-name>/<block-name>.{js|css}`
  - Root blocks (kept intentionally): `/blocks/header/header.{js|css}` and `/blocks/fragment/fragment.{js|css}`
- There is no folder search fallback chain. Each block resolves to a single canonical location from the registry (with a deterministic default folder).
