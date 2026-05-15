const DEFAULT_REGIONS = ['North California', 'South California', 'Nevada', 'Washington'];

function parseRegionList(rawRegions) {
  if (!rawRegions || typeof rawRegions !== 'string') return DEFAULT_REGIONS;
  const regions = rawRegions
    .split(/[\n,]/)
    .map((region) => region.trim())
    .filter(Boolean);
  return regions.length ? regions : DEFAULT_REGIONS;
}

async function getSiteConfig() {
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
}

export default async function decorate(block) {
  const config = await getSiteConfig();
  const regions = parseRegionList(
    config['region-picker-values'] || config['region-picker-options'] || config.regions,
  );
  const id = `region-picker-select-${Math.random().toString(16).slice(2, 10)}`;

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
