# Region Picker block authoring guide

Use the `region-picker` block to render a `<select>` with region options loaded from `/site-config.json`.

## 1) Author the block on the page

Create a block table with `region-picker` as the block name.

| region-picker | |
| --- | --- |
| Label | Region |
| Placeholder | Select a region |
| Options key | regions |

### Supported block fields

- `Label` (optional): text shown above the dropdown. Default: `Region`
- `Placeholder` (optional): first option text. Default: `Select a region`
- `Options key` (optional): key used to find options in `site-config`. Default: `regions`

> Field names are normalized, so `Options key` maps to `options-key`.

## 2) Configure options in site-config

The block reads options from `/site-config.json` and matches rows where `key` equals the block `options-key`.
`name` is also supported as a fallback alias, but authors should prefer `key` for consistency.

You can author options in either format below.

### Format A: one row per option (recommended)

| key | label | value |
| --- | --- | --- |
| regions | United States | us |
| regions | Canada | ca |
| regions | Mexico | mx |

### Format B: comma/newline list in `value`

Use a single `value` cell for the selected `key`, with comma-separated or newline-separated tokens:

- `United States|us, Canada|ca, Mexico|mx`
- or one token per line:
  - `United States|us`
  - `Canada|ca`
  - `Mexico|mx`

You can also omit explicit values (`United States, Canada`) and the block will auto-generate kebab-case values (e.g., `United States` → `united-states`, `Canada` → `canada`).

## Notes

- Duplicate option values are de-duplicated.
- If no options are found (or site-config fails to load), the dropdown is disabled.
