import { readBlockConfig } from '../../../scripts/aem.js';

const DEFAULT_TOKEN_REGEX = /\{\{\s*partner\s*\}\}|\[\s*partner\s*\]/gi;

function getPartnerFromPath() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (!segments.length) return '';
  try {
    return decodeURIComponent(segments[0]).trim();
  } catch (e) {
    return '';
  }
}

function replacePartnerToken(value, partner, configuredToken) {
  const input = String(value || '');
  if (!input || !partner) return input;

  let output = input.replace(DEFAULT_TOKEN_REGEX, partner);
  if (configuredToken) {
    output = output.split(configuredToken).join(partner);
  }
  return output;
}

function getSafeUrl(value) {
  try {
    const parsed = new URL(value, window.location.href);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.href;
  } catch (e) {
    return '';
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const partner = getPartnerFromPath();
  const token = String(config['partner-token'] || '').trim();

  const title = replacePartnerToken(config.title, partner, token);
  const description = replacePartnerToken(config.description, partner, token).trim();
  const buttonText = String(config['button-text'] || '').trim();
  const buttonUrlRaw = replacePartnerToken(config['button-url'], partner, token);
  const buttonUrl = getSafeUrl(String(buttonUrlRaw || '').trim());

  const wrapper = document.createElement('div');
  wrapper.className = 'promo-wrapper';

  if (title) {
    const heading = document.createElement('h1');
    heading.className = 'promo-title';
    heading.textContent = title;
    wrapper.append(heading);
  }

  if (description) {
    const text = document.createElement('p');
    text.className = 'promo-description';
    text.textContent = description;
    wrapper.append(text);
  }

  if (buttonText && buttonUrl) {
    const buttonWrapper = document.createElement('p');
    buttonWrapper.className = 'button-wrapper';

    const button = document.createElement('a');
    button.className = 'button primary';
    button.href = buttonUrl;
    button.textContent = buttonText;
    button.title = buttonText;

    buttonWrapper.append(button);
    wrapper.append(buttonWrapper);
  }

  block.replaceChildren(wrapper);
}
