# Adding a New Supported Animal Type

StellarKraal currently supports `cattle`, `goat`, and `sheep` as collateral animal types.
This guide walks through everywhere a new animal type needs to be added.

## 1. Backend

- `backend/src/validators/collateral.ts` — `animal_type` is validated as a generic
  non-empty string (`animalTypeSchema`), so no schema change is required for a new type.
  If you want to restrict to an explicit allow-list, change `animalTypeSchema` to a
  `z.enum([...])` and add the new value there.
- `backend/src/services/collateralService.ts` — confirm `animal_type` is forwarded
  unchanged to the contract call (`nativeToScVal(animal_type, { type: 'symbol' })`); no
  change needed unless you add server-side per-type logic (e.g. appraisal rules).
- Check `backend/src/db/store.ts` and any appraisal/valuation service for per-type
  business logic (e.g. minimum/maximum appraised value ranges) and extend it for the
  new type if applicable.

## 2. Smart contract

- `contracts/stellarkraal/src/lib.rs` stores `animal_type` as an opaque Soroban
  `Symbol` — the contract does not enforce a fixed set of animal types on-chain, so no
  contract change is required to support a new type.
- If per-type collateral rules are ever added on-chain (e.g. type-specific LTV), that
  logic would live in `lib.rs` and should be covered by new tests in
  `contracts/stellarkraal/src/tests.rs`.

## 3. Frontend

- `frontend/src/context/LoanWizardContext.tsx` — add the new value to the `AnimalType`
  union type.
- `frontend/src/components/wizard/steps/StepCollateral.tsx` — add an entry to the
  `ANIMAL_TYPES` array (`value`, `label`, `emoji`).
- `frontend/src/components/LoanForm.tsx` — add a matching `<option>` to the animal type
  select if this legacy form is still in use.
- Follow the existing design tokens for any new UI (colors, spacing) so the option
  renders correctly in both light and dark mode and meets WCAG AA contrast.
- Add/extend a React Testing Library test (see
  `frontend/src/__tests__/ui-components.test.tsx`) asserting the new option renders and
  is selectable.

## 4. Content

- `frontend/src/lib/faqData.ts` — update the "What animals can I register as
  collateral?" FAQ answer to include the new animal type.
- `docs/guides/register-collateral.md` — mention the new type where animal types are
  listed.

## 5. Verify

- Run the frontend test suite and the contract test suite locally.
- Manually walk through the loan request wizard in the browser to confirm the new
  animal type appears correctly and a loan can be requested against it end to end.
