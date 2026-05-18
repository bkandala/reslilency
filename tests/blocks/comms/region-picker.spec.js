/**
 * Playwright tests for blocks/comms/region-picker
 *
 * Each test:
 *  1. Routes /config/regions.json to control API responses.
 *  2. Navigates to a fixture HTML page that loads and decorates the block.
 *  3. Waits for decoration to complete via window.__decorated flag.
 *  4. Asserts the rendered DOM structure and behavior.
 */
import { test, expect } from '@playwright/test';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Wait until the async decorate() call inside the fixture has finished. */
async function waitForDecoration(page) {
  await page.waitForFunction(() => window.__decorated === true, { timeout: 5000 });
}

/**
 * Navigate to a fixture page while intercepting the regions JSON endpoint.
 * @param {import('@playwright/test').Page} page
 * @param {string} fixture   - relative path under /tests/fixtures/
 * @param {object|null} data - object for { data: [...] } or null to simulate a 404
 */
async function gotoFixture(page, fixture, data) {
  if (data !== null) {
    await page.route('/config/regions.json', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
  } else {
    await page.route('/config/regions.json', (route) => route.fulfill({ status: 404 }));
  }
  await page.goto(`/tests/fixtures/${fixture}`);
  await waitForDecoration(page);
}

// ─── sample data ──────────────────────────────────────────────────────────────

const REGIONS_DATA = {
  data: [
    { key: 'regions', value: 'North America|na' },
    { key: 'regions', value: 'Europe|eu' },
    { key: 'regions', value: 'Asia Pacific|apac' },
  ],
};

const COUNTRIES_DATA = {
  data: [
    { key: 'countries', value: 'United States|us' },
    { key: 'countries', value: 'Germany|de' },
  ],
};

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe('region-picker block', () => {
  // ── 1. DOM structure ────────────────────────────────────────────────────────

  test('renders the required wrapper, label, and select elements', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    await expect(page.locator('.region-picker-wrapper')).toBeVisible();
    await expect(page.locator('.region-picker-label')).toBeVisible();
    await expect(page.locator('.region-picker-select')).toBeVisible();
  });

  test('select is nested inside label which is nested inside wrapper', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    // .region-picker-wrapper > .region-picker-label > .region-picker-select
    const select = page.locator('.region-picker-wrapper .region-picker-label .region-picker-select');
    await expect(select).toBeVisible();
  });

  // ── 2. Label text ───────────────────────────────────────────────────────────

  test('renders the authored label text', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    const label = page.locator('.region-picker-label');
    // The label element wraps both text and the select; check it contains the right text.
    await expect(label).toContainText('Region');
  });

  test('falls back to default "Region" label when no config is authored', async ({ page }) => {
    await gotoFixture(page, 'region-picker-defaults.html', REGIONS_DATA);

    await expect(page.locator('.region-picker-label')).toContainText('Region');
  });

  test('renders a custom label when authored', async ({ page }) => {
    await gotoFixture(page, 'region-picker-custom.html', COUNTRIES_DATA);

    await expect(page.locator('.region-picker-label')).toContainText('Country');
  });

  // ── 3. aria-label ───────────────────────────────────────────────────────────

  test('select has aria-label matching the label text', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    const select = page.locator('.region-picker-select');
    await expect(select).toHaveAttribute('aria-label', 'Region');
  });

  test('custom fixture select has aria-label matching custom label', async ({ page }) => {
    await gotoFixture(page, 'region-picker-custom.html', COUNTRIES_DATA);

    await expect(page.locator('.region-picker-select')).toHaveAttribute('aria-label', 'Country');
  });

  // ── 4. Select name attribute ─────────────────────────────────────────────────

  test('select name matches the options-key config value', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    await expect(page.locator('.region-picker-select')).toHaveAttribute('name', 'regions');
  });

  test('select name uses custom options-key when authored', async ({ page }) => {
    await gotoFixture(page, 'region-picker-custom.html', COUNTRIES_DATA);

    await expect(page.locator('.region-picker-select')).toHaveAttribute('name', 'countries');
  });

  test('select name defaults to "regions" when no options-key is configured', async ({ page }) => {
    await gotoFixture(page, 'region-picker-defaults.html', REGIONS_DATA);

    await expect(page.locator('.region-picker-select')).toHaveAttribute('name', 'regions');
  });

  // ── 5. Placeholder option ────────────────────────────────────────────────────

  test('first option is the placeholder with an empty value', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    const firstOption = page.locator('.region-picker-select option').first();
    await expect(firstOption).toHaveAttribute('value', '');
    await expect(firstOption).toContainText('Select a region');
  });

  test('placeholder option is selected by default', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    const selectValue = await page.locator('.region-picker-select').inputValue();
    expect(selectValue).toBe('');
  });

  test('renders custom placeholder text when authored', async ({ page }) => {
    await gotoFixture(page, 'region-picker-custom.html', COUNTRIES_DATA);

    const firstOption = page.locator('.region-picker-select option').first();
    await expect(firstOption).toContainText('Choose your country');
  });

  test('placeholder text defaults to "Select a region" when not configured', async ({ page }) => {
    await gotoFixture(page, 'region-picker-defaults.html', REGIONS_DATA);

    const firstOption = page.locator('.region-picker-select option').first();
    await expect(firstOption).toContainText('Select a region');
  });

  // ── 6. Options populated from API ────────────────────────────────────────────

  test('populates options from the regions API response', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    const options = page.locator('.region-picker-select option:not([value=""])');
    await expect(options).toHaveCount(3);
  });

  test('option labels and values are set from Label|value tokens', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    const naOption = page.locator('.region-picker-select option[value="na"]');
    await expect(naOption).toHaveText('North America');

    const euOption = page.locator('.region-picker-select option[value="eu"]');
    await expect(euOption).toHaveText('Europe');

    const apacOption = page.locator('.region-picker-select option[value="apac"]');
    await expect(apacOption).toHaveText('Asia Pacific');
  });

  test('uses the label as value when no | separator is present', async ({ page }) => {
    await page.route('/config/regions.json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ key: 'regions', value: 'Americas' }] }),
      });
    });
    await page.goto('/tests/fixtures/region-picker.html');
    await waitForDecoration(page);

    // toClassName('Americas') → 'americas'
    const option = page.locator('.region-picker-select option[value="americas"]');
    await expect(option).toHaveText('Americas');
  });

  test('filters out duplicate option values', async ({ page }) => {
    await page.route('/config/regions.json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { key: 'regions', value: 'North America|na' },
            { key: 'regions', value: 'North America|na' }, // duplicate
          ],
        }),
      });
    });
    await page.goto('/tests/fixtures/region-picker.html');
    await waitForDecoration(page);

    const options = page.locator('.region-picker-select option[value="na"]');
    await expect(options).toHaveCount(1);
  });

  test('only shows options matching the configured options-key', async ({ page }) => {
    await page.route('/config/regions.json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { key: 'regions', value: 'Europe|eu' },
            { key: 'languages', value: 'English|en' }, // different key – must be excluded
          ],
        }),
      });
    });
    await page.goto('/tests/fixtures/region-picker.html');
    await waitForDecoration(page);

    const options = page.locator('.region-picker-select option:not([value=""])');
    await expect(options).toHaveCount(1);
    await expect(options.first()).toHaveAttribute('value', 'eu');
  });

  // ── 7. Disabled states ───────────────────────────────────────────────────────

  test('select is enabled when options are available', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    await expect(page.locator('.region-picker-select')).not.toBeDisabled();
  });

  test('select is disabled when the API returns an empty data array', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', { data: [] });

    await expect(page.locator('.region-picker-select')).toBeDisabled();
  });

  test('select is disabled when the API returns a 404', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', null /* triggers 404 route */);

    await expect(page.locator('.region-picker-select')).toBeDisabled();
  });

  test('select is disabled when the API returns matching rows for a different key only', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', {
      data: [{ key: 'languages', value: 'English|en' }],
    });

    await expect(page.locator('.region-picker-select')).toBeDisabled();
  });

  // ── 8. CSS classes present ───────────────────────────────────────────────────

  test('original block element is replaced by wrapper (original children removed)', async ({ page }) => {
    await gotoFixture(page, 'region-picker.html', REGIONS_DATA);

    // After decoration block.replaceChildren(wrapper) removes the config rows.
    const configRows = page.locator(
      '.region-picker.block > div:not(.region-picker-wrapper)',
    );
    await expect(configRows).toHaveCount(0);
  });

  // ── 9. Countries custom fixture ──────────────────────────────────────────────

  test('populates options for a custom options-key (countries)', async ({ page }) => {
    await gotoFixture(page, 'region-picker-custom.html', COUNTRIES_DATA);

    const options = page.locator('.region-picker-select option:not([value=""])');
    await expect(options).toHaveCount(2);

    await expect(page.locator('.region-picker-select option[value="us"]')).toHaveText('United States');
    await expect(page.locator('.region-picker-select option[value="de"]')).toHaveText('Germany');
  });

  // ── 10. Multi-value rows ────────────────────────────────────────────────────

  test('parses comma-separated options in a single row value', async ({ page }) => {
    await page.route('/config/regions.json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ key: 'regions', value: 'North America|na,Europe|eu' }],
        }),
      });
    });
    await page.goto('/tests/fixtures/region-picker.html');
    await waitForDecoration(page);

    const options = page.locator('.region-picker-select option:not([value=""])');
    await expect(options).toHaveCount(2);
    await expect(page.locator('.region-picker-select option[value="na"]')).toHaveText('North America');
    await expect(page.locator('.region-picker-select option[value="eu"]')).toHaveText('Europe');
  });
});
