# Adding a New Locale to StellarKraal

This guide walks through every step required to add a new language to the StellarKraal frontend. After completing it, the new locale will be available in the language switcher, all UI strings will be translated, and CI will catch any missing keys automatically.

## Prerequisites

- Node.js 20+, `npm 10+` (see [local-setup.md](../development/local-setup.md))
- A working local development environment (`npm run dev` inside `frontend/`)
- A copy of every English string ready to translate

---

## 1. Locate the Translation Files

All locale files live under `frontend/public/locales/`:

```
frontend/public/locales/
├── en/
│   └── common.json        ← English source of truth
├── sw/
│   └── common.json        ← Kiswahili example
└── <new-locale>/
    └── common.json        ← your new file goes here
```

Each file is a flat or nested JSON object. English is the canonical source; all other locales must mirror its key structure exactly.

---

## 2. Create the New Locale JSON File

1. Copy the English file as a starting point:

   ```bash
   cp frontend/public/locales/en/common.json \
      frontend/public/locales/<locale-code>/common.json
   ```

   Replace `<locale-code>` with the [BCP 47](https://www.ietf.org/rfc/bcp/bcp47.txt) language tag (e.g. `fr` for French, `pt-BR` for Brazilian Portuguese).

2. Translate every string value. Do **not** rename or remove keys.

3. Example snippet (French):

   ```json
   {
     "nav.dashboard": "Tableau de bord",
     "nav.collateral": "Garantie",
     "loans.empty": "Aucun prêt pour l'instant",
     "loans.requestLoan": "Demander un prêt"
   }
   ```

---

## 3. Register the Locale in the i18n Config

Open `frontend/src/config/i18n.ts` (or wherever your i18n library is configured) and add the new locale to the `locales` array:

```typescript
// frontend/src/config/i18n.ts
export const i18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'sw', 'fr'],   // ← add your locale code here
};
```

If you are using Next.js built-in i18n routing, update `next.config.js` as well:

```javascript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'sw', 'fr'],  // ← add your locale code here
    defaultLocale: 'en',
  },
};
module.exports = nextConfig;
```

---

## 4. Handle Plurals

Use ICU message syntax (or the plural helper provided by your i18n library) so the correct grammatical form is used for quantities:

```json
{
  "collateral.count": "{count, plural, =0 {No animals} one {# animal} other {# animals}}"
}
```

Plural rules vary by language. For example, Arabic has six plural forms; Russian has three. Always consult [Unicode CLDR plural rules](https://cldr.unicode.org/index/cldr-spec/plural-rules) for the target language and add all required cases:

```json
{
  "collateral.count": "{count, plural, zero {Aucun animal} one {# animal} other {# animaux}}"
}
```

---

## 5. Handle Date Formatting

Do **not** hardcode date format strings. Use the `Intl.DateTimeFormat` API (already wrapped in the existing `formatDate` utility) so dates are rendered according to the active locale:

```typescript
// Already available in frontend/src/lib/utils.ts
import { formatDate } from '@/lib/utils';

// Pass the active locale from i18n context
const dateString = formatDate(new Date(tx.created_at), locale);
```

If the `formatDate` utility does not yet accept a locale parameter, extend it:

```typescript
export function formatDate(date: Date | string, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}
```

For currency amounts, use `Intl.NumberFormat` similarly:

```typescript
new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount);
```

---

## 6. Test the New Locale Locally

1. Start the dev server:

   ```bash
   cd frontend && npm run dev
   ```

2. Switch to the new locale in the browser. If the app exposes a language switcher, select your locale. You can also force it via the URL prefix (e.g. `http://localhost:3000/fr`) or by setting `Accept-Language: fr` in a browser extension.

3. Walk through the following pages and verify all visible strings are translated:
   - `/` — landing page
   - `/dashboard` — main dashboard
   - `/collateral` — collateral list
   - `/loans` — loans list
   - `/help` — help centre

4. Open the browser console. Any missing keys will appear as warnings from the i18n library (e.g. `i18next: key 'loans.empty' for language 'fr' not found`).

5. Check that dates and numbers render in the expected locale format.

---

## 7. CI Check — Missing Translation Keys

A GitHub Actions workflow validates that every key present in the English source file exists in all other locale files. The check runs automatically on every pull request that touches any file under `frontend/public/locales/`.

The workflow lives at `.github/workflows/frontend-ci.yml` and calls:

```bash
cd frontend && npm run i18n:check
```

The `i18n:check` script (defined in `frontend/package.json`) compares all locale JSON files against the English source and exits with a non-zero code if any key is missing:

```json
{
  "scripts": {
    "i18n:check": "node scripts/check-i18n-keys.js"
  }
}
```

To run the check locally before opening a PR:

```bash
cd frontend && npm run i18n:check
```

If the script reports missing keys, add the missing translations and re-run until it exits with code `0`.

> **Note:** If the `i18n:check` script does not yet exist, create `frontend/scripts/check-i18n-keys.js` (see the section below) and add the `npm` script entry.

### Creating the Key-Check Script

```javascript
// frontend/scripts/check-i18n-keys.js
const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '..', 'public', 'locales');
const source = JSON.parse(
  fs.readFileSync(path.join(localesDir, 'en', 'common.json'), 'utf8')
);
const sourceKeys = Object.keys(source);

let failed = false;

for (const locale of fs.readdirSync(localesDir)) {
  if (locale === 'en') continue;
  const filePath = path.join(localesDir, locale, 'common.json');
  if (!fs.existsSync(filePath)) {
    console.error(`Missing: ${filePath}`);
    failed = true;
    continue;
  }
  const target = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const key of sourceKeys) {
    if (!(key in target)) {
      console.error(`[${locale}] Missing key: "${key}"`);
      failed = true;
    }
  }
}

if (!failed) {
  console.log('All locales are complete.');
  process.exit(0);
} else {
  process.exit(1);
}
```

---

## 8. PR Checklist

Before opening a pull request for a new locale, confirm the following:

- [ ] Locale JSON file exists at `frontend/public/locales/<locale-code>/common.json`
- [ ] All keys from `en/common.json` are present in the new file
- [ ] Plural forms for the target language are correctly handled
- [ ] Dates and numbers display in the expected locale format
- [ ] `npm run i18n:check` exits with code `0`
- [ ] The new locale code is listed in `i18nConfig.locales` (and `next.config.js` if applicable)
- [ ] A native speaker (or reliable MT + review) has verified the translations
- [ ] Frontend CI passes

---

## Related Resources

- [Unicode CLDR Plural Rules](https://cldr.unicode.org/index/cldr-spec/plural-rules)
- [BCP 47 Language Tags](https://www.ietf.org/rfc/bcp/bcp47.txt)
- [MDN — Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Design Tokens Guide](./design-tokens.md)
- [Accessibility Guide](./accessibility.md)
- [Frontend CI workflow](.github/workflows/frontend-ci.yml)
