# How to Register Livestock as Collateral

Step-by-step guide for registering your first livestock collateral on StellarKraal and requesting a loan against it.

> **Language / Lugha**
> | Language | Guide |
> |---|---|
> | English | [en/register-collateral.md](en/register-collateral.md) |
> | Kiswahili | [sw/register-collateral.md](sw/register-collateral.md) |

---

## Overview

StellarKraal lets you use your livestock as collateral to request a micro-loan on the Stellar network. The whole process has four stages:

1. **Connect your Freighter wallet** — prove ownership of your Stellar account.
2. **Fill in the registration form** — describe your animals.
3. **Submit and sign on-chain** — the registration is recorded on Stellar.
4. **Confirm on-chain and receive loan** — once confirmed, you can draw down your loan.

---

## What you will need

| Item | Details |
|---|---|
| Device | Smartphone or computer with an internet connection |
| Browser | Chrome or Firefox (other browsers may work) |
| Freighter wallet | Free extension — [freighter.app](https://www.freighter.app) |
| Animal details | Type, quantity, estimated weight (kg), health status, location, appraised value |
| Network | Freighter must be set to **Testnet** for testing; **Mainnet** for live loans |

---

## Step 1 — Connect your Freighter wallet

> **Screenshot placeholder:** `docs/guides/screenshots/step1-connect-wallet.png`
> *(Replace with an annotated screenshot showing the Connect Wallet button and the Freighter pop-up.)*

### 1a. Install Freighter (first-time only)

1. Open your browser and go to [freighter.app](https://www.freighter.app).
2. Click **Add to Chrome** (or the equivalent for your browser).
3. Confirm the browser permission dialog.
4. Click the Freighter icon in your toolbar and choose **Create a new wallet**.
5. Write your 12-word recovery phrase on paper and store it safely. **Never share it.**
6. Set a password and confirm.

> **Already have Freighter?** Skip to step 1b.

### 1b. Connect to StellarKraal

1. Navigate to the StellarKraal app.
2. Click the **Connect Wallet** button in the top-right corner.
3. Freighter shows a permission pop-up. Click **Connect**.
4. Your wallet address (e.g. `GABC…XYZ`) appears in the header. You are now connected.

> **Note:** Confirm the network badge next to your address reads **Testnet** (or **Mainnet** if you are transacting with real assets). To switch, open Freighter → Settings → Network.

---

## Step 2 — Fill in the collateral registration form

> **Screenshot placeholder:** `docs/guides/screenshots/step2-registration-form.png`
> *(Replace with an annotated screenshot of the form with each field labelled.)*

1. From the top navigation menu, click **Collateral**.
2. Click **Register New Collateral**. The registration form opens.
3. Complete every required field (marked **\***):

| Field | What to enter | Example |
|---|---|---|
| **Animal Type \*** | Choose from the drop-down: Cattle, Goat, or Sheep | `Cattle` |
| **Quantity \*** | Number of animals being registered | `5` |
| **Estimated Weight (kg) \*** | Average weight of one animal, in kilograms | `250` |
| **Health Status \*** | Excellent / Good / Fair / Poor | `Good` |
| **Location \*** | Farm name or region | `Narok County` |
| **Appraised Value \*** | Total estimated value in **stroops** (1 XLM = 10,000,000 stroops) | `50000000` |

> **What is a stroop?** The stroop is the smallest indivisible unit of XLM on Stellar. If your animals are worth 5 XLM, enter `50000000`.

> **Auto-save:** The form saves automatically every 5 seconds. If you close the tab by accident, the app will offer to restore your draft when you return.

---

## Step 3 — Submit and sign the transaction

> **Screenshot placeholder:** `docs/guides/screenshots/step3-confirm-dialog.png`
> *(Replace with an annotated screenshot of the confirmation dialog and the Freighter signing pop-up.)*

1. Once all fields are complete, click **Register Collateral**.
2. A confirmation dialog appears with a summary of your registration. Review it carefully.
3. Click **Register** to proceed.
4. Freighter opens and asks you to **sign** the Stellar transaction. Click **Approve**.
5. The app shows a spinner while the transaction is being submitted.

> **What happens on-chain?** StellarKraal calls the Soroban smart contract's `register_livestock` function. The transaction is broadcast to the Stellar network, included in a ledger, and the contract writes your collateral record to on-chain storage.

---

## Step 4 — Confirm on-chain

> **Screenshot placeholder:** `docs/guides/screenshots/step4-success.png`
> *(Replace with an annotated screenshot of the success banner showing the registration ID and collateral details.)*

1. After 5–10 seconds you will see a green success banner:
   > **Collateral registered successfully! Registration ID: #42**
2. Write down or copy the **Registration ID** — you will need it to request a loan.
3. Click **View Collateral** to see your new entry on the Collateral page.
4. The page shows an **Appraised Value** and **Loan-to-Value (LTV) ratio**. These determine the maximum loan amount you can request.

> **What is LTV?** The Loan-to-Value ratio is the percentage of your collateral's appraised value you can borrow. For example, with an LTV of 60 % and a collateral worth 1 000 000 stroops, you can borrow up to 600 000 stroops.

### Requesting a loan

Once your collateral is confirmed, click **Request Loan** on the Collateral page, or follow the [How to Request a Loan](request-loan.md) guide.

---

## Error cases

| Symptom | Cause | Resolution |
|---|---|---|
| **"Connect Wallet" does nothing** | Freighter extension is not installed or not logged in | Install Freighter, log in, then refresh the page |
| **Freighter pop-up does not appear** | Browser is blocking pop-ups from this site | Allow pop-ups for this site in browser settings, then retry |
| **Form shows red error messages** | One or more fields are invalid (e.g. quantity = 0, appraised value too high) | Read the error text next to the field and correct the value |
| **Invalid appraised value** | The value entered exceeds the per-animal cap set by the administrator | Check the allowed range displayed beneath the field and enter a valid value |
| **Transaction rejected by Freighter** | You cancelled the signing step, or Freighter timed out | Click **Register Collateral** again and approve the transaction in Freighter |
| **Transaction failed on-chain** | Network congestion, sequence number mismatch, or insufficient XLM for fees | Wait a few seconds and retry. Ensure your Freighter account holds at least 1 XLM for network fees |
| **"Network mismatch" banner appears** | The app is configured for Testnet but Freighter is on Mainnet (or vice versa) | Switch Freighter to the correct network (Settings → Network) and reconnect |
| **Registration ID not shown after success** | Browser closed before the response arrived | Open the Collateral page — your registration should already be listed |

---

## Screenshots reference

Annotated screenshots for each step should be placed in `docs/guides/screenshots/`:

```
docs/guides/screenshots/
├── step1-connect-wallet.png      # Freighter pop-up and Connect button
├── step2-registration-form.png   # Filled-in form with field annotations
├── step3-confirm-dialog.png      # Confirmation dialog + Freighter sign prompt
└── step4-success.png             # Success banner with Registration ID
```

Until real screenshots are available, use the placeholder descriptions above.

---

## Related guides

- [How to Request a Loan](request-loan.md)
- [How to Repay a Loan](repay-loan.md)
- [Understanding Liquidation](understanding-liquidation.md)

## Need more help?

- Read the [FAQ](/help/faq)
- [Open a support issue on GitHub](https://github.com/teslims2/StellarKraal-/issues)
