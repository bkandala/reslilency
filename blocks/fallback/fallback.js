/**
 * Fallback block with a region picker dropdown.
 * Regions are loaded from the site config sheet at /site-config.json.
 * Authors can configure the regions by adding a "regions" key to the sheet,
 * with a comma-separated list of region names as the value.
 *
 * Default regions (used when the config sheet is unavailable or has no "regions" key):
 *   North California, South California, Nevada, Washington
 */

const DEFAULT_REGIONS = ['North California', 'South California', 'Nevada', 'Washington'];

/**
 * Fetches the site config sheet and returns its data as a key→value map.
 * The sheet is expected to be published at /site-config.json and follow
 * the standard AEM spreadsheet format: { "data": [{ "key": "...", "value": "..." }] }
 * @returns {Promise<Object>} Config key/value pairs
 */
async function getSiteConfig() {
  try {
    const resp = await fetch('/site-config.json');
    if (!resp.ok) return {};
    const json = await resp.json();
    const rows = json?.data ?? [];
    return Object.fromEntries(rows.map(({ key, value }) => [key?.trim(), value?.trim()]));
  } catch {
    return {};
  }
}

/**
 * Loads and decorates the fallback block with a region picker dropdown.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = await getSiteConfig();

  // Parse regions from config, falling back to defaults
  const regionList = config.regions
    ? config.regions.split(',').map((r) => r.trim()).filter(Boolean)
    : DEFAULT_REGIONS;

  // Build the dropdown
  const label = document.createElement('label');
  label.htmlFor = 'region-picker';
  label.textContent = 'Select Region';

  const select = document.createElement('select');
  select.id = 'region-picker';
  select.name = 'region';
  select.setAttribute('aria-label', 'Select a region');

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '-- Select a Region --';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.append(placeholder);

  regionList.forEach((region) => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    select.append(option);
  });

  const wrapper = document.createElement('div');
  wrapper.classList.add('region-picker');
  wrapper.append(label, select);

  block.textContent = '';
  block.append(wrapper);
}
