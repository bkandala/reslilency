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

## Team block folders (submodule-friendly)

- Shared/reusable blocks are available under `/blocks/foundation/<block-name>`.
- Team blocks can live in dedicated folders under `/blocks/<team-folder>/...` (for example as git submodules).
- Keep authored block names unchanged (for example `hero`, `cards`, `columns`), then configure which folders to search:
  - Metadata: `<meta name="block-folders" content="team-a, team-b">`
  - Runtime config: `window.hlx.blockFolders = ['team-a', 'team-b'];` (set this before `/scripts/scripts.js` loads, for example in `head.html`)
- Block resolution order for an authored `<block-name>` is:
  1. `/blocks/<configured-folder>/<block-name>/<block-name>.{js|css}` (in configured order)
  2. `/blocks/foundation/<block-name>/<block-name>.{js|css}`
  3. `/blocks/<block-name>/<block-name>.{js|css}` (legacy compatibility)
