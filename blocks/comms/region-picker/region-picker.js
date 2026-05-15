import { readBlockConfig, toClassName } from '../../../scripts/aem.js';

function toOptionValue(label) {
  const normalized = toClassName(label);
  return normalized || label;
}

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
  return toClassName(row.key || row.name || row.setting || row.title || '');
}

function extractOptions(rows, optionsKey) {
  const matchingRows = rows.filter((row) => normalizeKey(row) === optionsKey);
  const options = matchingRows.flatMap((row) => {
    if (row.label && row.value) {
      return [{
        label: String(row.label).trim(),
        value: String(row.value).trim() || toOptionValue(String(row.label).trim()),
      }];
    }
    return splitTokens(row.options || row.values || row.value)
      .map(parseOptionToken)
      .filter(Boolean);
  });

  const uniqueValues = new Set();
  return options.filter((option) => {
    const key = option.value.toLowerCase();
    if (uniqueValues.has(key)) return false;
    uniqueValues.add(key);
    return true;
  });
}

async function getSiteConfigRows() {
  const response = await fetch('/site-config.json');
  if (!response.ok) throw new Error('Unable to load site-config sheet');
  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const optionsKey = toClassName(config['options-key'] || config.options || config.key || 'regions');
  const labelText = String(config.label || 'Region');
  const placeholderText = String(config.placeholder || 'Select a region');

  const wrapper = document.createElement('div');
  wrapper.className = 'region-picker-wrapper';

  const label = document.createElement('label');
  label.className = 'region-picker-label';
  label.textContent = labelText;

  const select = document.createElement('select');
  select.className = 'region-picker-select';
  select.name = optionsKey || 'region';
  select.setAttribute('aria-label', labelText);

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholderText;
  placeholderOption.selected = true;
  select.append(placeholderOption);

  try {
    const rows = await getSiteConfigRows();
    const options = extractOptions(rows, optionsKey);

    options.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.value;
      option.textContent = entry.label;
      select.append(option);
    });

    if (!options.length) {
      select.disabled = true;
    }
  } catch (e) {
    select.disabled = true;
  }

  label.append(select);
  wrapper.append(label);
  block.replaceChildren(wrapper);
}
