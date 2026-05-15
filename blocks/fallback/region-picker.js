const DEFAULT_REGIONS = ['North California', 'South California', 'Nevada', 'Washington'];
let siteConfigPromise;
let pickerCount = 0;

function parseRegionList(rawRegions) {
  if (!rawRegions || typeof rawRegions !== 'string') return DEFAULT_REGIONS;
  const regions = rawRegions
    .split(/[\n,]/)
    .map((region) => region.trim())
    .filter(Boolean);
  return regions.length ? regions : DEFAULT_REGIONS;
}

async function getSiteConfig() {
  // Cache the fetch promise so multiple region-picker instances on a page
  // don't trigger duplicate requests for /site-config.json.
  if (!siteConfigPromise) {
    siteConfigPromise = (async () => {
      try {
        const resp = await fetch('/site-config.json');
        if (!resp.ok) return {};
        const json = await resp.json();
        return (json?.data || []).reduce((config, row) => {
          const key = row?.key?.trim()?.toLowerCase();
          const value = row?.value?.trim();
          if (key && value) config[key] = value;
          return config;
        }, {});
      } catch {
        return {};
      }
    })();
  }

  return siteConfigPromise;
}

export default async function decorate(block) {
  const config = await getSiteConfig();
  // Supported Site Config keys:
  // - region-picker-values (preferred): comma/newline-separated regions
  // - region-picker-options: alias for region-picker-values
  // - regions: fallback alias
  // - region-picker-label: label text
  const regions = parseRegionList(
    config['region-picker-values'] || config['region-picker-options'] || config.regions,
  );
  pickerCount += 1;
  const id = `region-picker-select-${
    window.crypto?.randomUUID?.() || `fallback-${pickerCount}`
  }`;

  const wrapper = document.createElement('div');
  wrapper.className = 'picker-field';

  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = config['region-picker-label'] || 'Select Region';

  const select = document.createElement('select');
  select.id = id;
  select.name = 'region';
  select.setAttribute('aria-label', label.textContent);

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = '-- Select a Region --';
  select.append(placeholder);

  regions.forEach((region) => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    select.append(option);
  });

  wrapper.append(label, select);
  block.replaceChildren(wrapper);
}
