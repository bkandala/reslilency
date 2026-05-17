import { readBlockConfig, toClassName } from '../../../scripts/aem.js';
import { loadFragment } from '../../fragment/fragment.js';

function toOptionValue(label) {
  return toClassName(label);
}

/**
 * Parses an option token authored as `Label|value` or `Label`.
 * @param {string} token option token
 * @returns {{label: string, value: string}|null} parsed option or null
 */
function parseOptionToken(token) {
  const [labelPart, valuePart] = token.split('|').map((part) => part.trim());
  if (!labelPart) return null;
  return {
    label: labelPart,
    value: valuePart || toOptionValue(labelPart),
  };
}

function splitTokens(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeKey(row) {
  return toClassName(row.key || row.name || '');
}

function extractOptions(rows, optionsKey) {
  const matchingRows = rows.filter((row) => normalizeKey(row) === optionsKey);
  const options = matchingRows.flatMap((row) => {
    const hasLabel = row.label !== undefined && row.label !== null;
    const hasValue = row.value !== undefined && row.value !== null;
    if (hasLabel && hasValue) {
      return [{
        label: String(row.label).trim(),
        value: String(row.value).trim(),
        path: String(row.path || '').trim(),
      }];
    }
    return splitTokens(row.value)
      .map(parseOptionToken)
      .filter(Boolean);
  });

  const uniqueValues = new Set();
  return options.filter((option) => {
    const key = option.value;
    if (uniqueValues.has(key)) return false;
    uniqueValues.add(key);
    return true;
  });
}

function normalizePath(pathValue) {
  if (!pathValue) return '';
  const path = String(pathValue).trim();
  if (!path) return '';

  try {
    return new URL(path, window.location.origin).pathname;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Region picker received an invalid fragment path', path);
    return '';
  }
}

async function getSiteConfigRows() {
  const response = await fetch('/config/regions.json');
  if (!response.ok) throw new Error(`Failed to fetch site configuration (status: ${response.status})`);
  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

/**
 * Loads and decorates the region picker block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const siteConfigKey = toClassName(config['options-key'] || 'regions');
  const labelText = String(config.label || 'Region');
  const placeholderText = String(config.placeholder || 'Select a region');

  const wrapper = document.createElement('div');
  wrapper.className = 'region-picker-wrapper';

  const label = document.createElement('label');
  label.className = 'region-picker-label';
  label.textContent = labelText;

  const select = document.createElement('select');
  select.className = 'region-picker-select';
  select.name = siteConfigKey;
  select.setAttribute('aria-label', labelText);

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholderText;
  placeholderOption.selected = true;
  select.append(placeholderOption);
  const content = document.createElement('div');
  content.className = 'region-picker-content';
  const clearContent = () => content.replaceChildren();

  const loadSelectedFragment = async (path) => {
    const fragmentPath = normalizePath(path);
    if (!fragmentPath) {
      clearContent();
      return;
    }
    try {
      const fragment = await loadFragment(fragmentPath);
      if (fragment) {
        content.replaceChildren(...Array.from(fragment.childNodes));
        return;
      }
      // eslint-disable-next-line no-console
      console.warn('Region picker could not load fragment content', fragmentPath);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Region picker failed to load selected fragment', error);
    }
    clearContent();
  };

  const onSelectionChange = async () => {
    const selectedOption = select.selectedOptions[0];
    if (!selectedOption || selectedOption.value === '') {
      clearContent();
      return;
    }
    await loadSelectedFragment(selectedOption.dataset.path);
  };

  try {
    const rows = await getSiteConfigRows();
    const options = extractOptions(rows, siteConfigKey);

    options.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.value;
      option.textContent = entry.label;
      if (entry.path) option.dataset.path = entry.path;
      select.append(option);
    });

    if (!options.length) {
      select.disabled = true;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Region picker failed to load options', error);
    select.disabled = true;
  }

  select.addEventListener('change', onSelectionChange);

  label.append(select);
  wrapper.append(label);
  wrapper.append(content);
  block.replaceChildren(wrapper);
}
