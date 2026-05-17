import {
  buildBlock,
  sampleRUM,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadCSS,
} from './aem.js';

const BLOCK_FOLDER_MAPPING = {
  foundation: 'foundation',
  comms: 'comms',
  // Alias for "comms" to support alternative namespace usage.
  comm: 'comms',
};
const SUPPORTED_BLOCK_NAMESPACES = [...new Set(Object.values(BLOCK_FOLDER_MAPPING))].sort();
const BLOCK_NAMESPACE_ERROR_SUFFIX = '\'comm\' is accepted as an alias for \'comms\'.';

/**
 * Sanitizes authored block names used in map keys.
 * @param {string} name block name candidate
 * @returns {string} safe block name
 */
function toBlockName(name) {
  if (typeof name !== 'string') return '';
  const normalizedName = name.trim().toLowerCase();
  if (normalizedName.includes('..') || normalizedName.startsWith('/')) return '';
  return /^[a-z][0-9a-z-]*$/.test(normalizedName) ? normalizedName : '';
}

/**
 * Resolves a strict namespace/block-name authored block reference.
 * Deeper paths such as namespace/block/variant are intentionally rejected.
 * @param {string} blockName authored block name
 * @returns {{namespace: string, name: string}|null} parsed block reference
 */
function getMappedBlockReference(blockName) {
  if (typeof blockName !== 'string') return null;
  const rawParts = blockName.split('/');
  if (rawParts.length !== 2) return null;
  const namespace = toFolderName(rawParts[0]);
  const name = toFolderName(rawParts[1]);
  if (!namespace || !name) return null;
  const mappedFolder = BLOCK_FOLDER_MAPPING[namespace];
  if (!mappedFolder) return null;
  return { namespace: mappedFolder, name };
}

/**
 * Returns block asset candidates for namespace-based block layouts.
 * Returns an empty list when the authored block name is not a valid mapped namespace/block pair.
 * @param {string} blockName The block name
 * @returns {Array} list of js/css candidates
 */
function getBlockAssetCandidates(blockName) {
  const candidates = [];
  const safeBlockName = toBlockName(blockName);
  if (!safeBlockName) {
    // eslint-disable-next-line no-console
    console.warn('Skipping block resolution for invalid block name', blockName);
    return candidates;
  }
  const addCandidate = (path) => {
    if (!candidates.find((candidate) => candidate.path === path)) {
      candidates.push({
        path,
        js: `${window.hlx.codeBasePath}/blocks/${path}.js`,
        css: `${window.hlx.codeBasePath}/blocks/${path}.css`,
      });
    }
  };

  const mappedBlock = getMappedBlockReference(blockName);
  if (mappedBlock) {
    // AEM block convention is /blocks/<folder>/<block-name>/<block-name>.{js|css}
    addCandidate(`${mappedBlock.namespace}/${mappedBlock.name}/${mappedBlock.name}`);
    // Namespaced references resolve only through their mapped folder to avoid extra 404 probes.
    return candidates;
  }

  // Return empty list when the block name is not a valid mapped namespace/block pair.
  return candidates;
}

/**
 * Loads JS and CSS for a block using namespace-based resolution.
 * @param {Element} block The block element
 * @returns {Promise<Element>} loaded block
 */
async function loadBlock(block) {
  const status = block.dataset.blockStatus;
  if (status !== 'loading' && status !== 'loaded') {
    block.dataset.blockStatus = 'loading';
    const { blockName } = block.dataset;
    const assetCandidates = getBlockAssetCandidates(blockName);
    let assetLoaded = false;
    let fallbackError = assetCandidates.length === 0
      ? new Error(`Block "${blockName}" must use the supported namespace/block-name format. Supported namespaces: ${SUPPORTED_BLOCK_NAMESPACES.join(', ')}. ${BLOCK_NAMESPACE_ERROR_SUFFIX}`)
      : undefined;
    let cssFound = false;

    for (let i = 0; i < assetCandidates.length; i += 1) {
      const candidate = assetCandidates[i];
      let blockModule;
      let moduleLoaded = false;

      try {
        // eslint-disable-next-line no-await-in-loop
        blockModule = await import(candidate.js);
        moduleLoaded = true;
      } catch (error) {
        fallbackError = error;
        // JS is optional for CSS-only blocks
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await loadCSS(candidate.css);
        cssFound = true;
      } catch (error) {
        fallbackError = error;
      }

      if (moduleLoaded && blockModule.default) {
        // eslint-disable-next-line no-await-in-loop
        await blockModule.default(block);
      }

      if (moduleLoaded) {
        assetLoaded = true;
        break;
      }
    }

    if (!assetLoaded && cssFound) {
      assetLoaded = true;
    }

    if (!assetLoaded) {
      // eslint-disable-next-line no-console
      console.error(`failed to load module for ${blockName}`, fallbackError);
    }

    block.dataset.blockStatus = 'loaded';
  }
  return block;
}

/**
 * Loads all blocks in a section.
 * @param {Element} section The section element
 * @param {Function} loadCallback callback after section loads
 */
async function loadSectionWithFallback(section, loadCallback) {
  const status = section.dataset.sectionStatus;
  if (!status || status === 'initialized') {
    section.dataset.sectionStatus = 'loading';
    const blocks = [...section.querySelectorAll('div.block')];
    for (let i = 0; i < blocks.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await loadBlock(blocks[i]);
    }
    if (loadCallback) await loadCallback(section);
    section.dataset.sectionStatus = 'loaded';
    section.style.display = null;
  }
}

/**
 * Loads a named block into a target element.
 * @param {Element} target target element
 * @param {string} blockName block name
 * @returns {Promise<void>}
 */
async function loadNamedBlock(target, blockName) {
  if (!target) return;
  const block = buildBlock(blockName, '');
  target.append(block);
  decorateBlock(block);
  await loadBlock(block);
}

/**
 * Loads all sections.
 * @param {Element} element parent element of sections
 */
async function loadSectionsWithFallback(element) {
  const sections = [...element.querySelectorAll('div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadSectionWithFallback(sections[i]);
    if (i === 0 && sampleRUM.enhance) {
      sampleRUM.enhance();
    }
  }
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/foundation/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSectionWithFallback(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadNamedBlock(doc.querySelector('header'), 'header');

  const main = doc.querySelector('main');
  await loadSectionsWithFallback(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadNamedBlock(doc.querySelector('footer'), 'footer');

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
