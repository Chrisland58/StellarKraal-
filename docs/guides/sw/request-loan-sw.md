# Jinsi ya Kuomba Mkopo

Mwongozo huu utakupeleka hatua kwa hatua katika mchakato wa kuomba mkopo kwenye StellarKraal. Ombi la mkopo lina hatua nne: **Dhamana → Kiasi → Mapitio → Thibitisha**.

> **Mahitaji ya awali**
> - Programu ya kivinjari [Freighter](https://www.freighter.app/) imesakinishwa na imewekwa kwenye mtandao sahihi (Testnet au Mainnet).
> - Una mifugo angalau moja unayomiliki ambayo inaweza kutumika kama dhamana.
> - Mkoba wako umeunganishwa na StellarKraal (angalia kitufe cha Connect Wallet kwenye [ukurasa wa Kukopa](/borrow)).

---

## Hatua ya 1 — Dhamana

**Kinachofanyika hapa:** Unasajili wanyama moja au zaidi kama dhamana ya mkopo wako. Hii inawafunga kwenye mkopo wako na kuweka kumbukumbu yao kwenye mkataba mzuri wa Soroban.

### Sehemu za fomu

| Sehemu | Maelezo |
|--------|---------|
| Aina ya mnyama | Chagua **Ng'ombe**, **Mbuzi**, au **Kondoo** kutoka kwenye orodha. |
| Idadi ya wanyama | Wanyama wangapi wa aina hiyo unaowasilisha (angalau 1). |
| Thamani yote ya tathmini (stroops) | Thamani ya jumla ya wanyama wote wa safu hiyo, katika **stroops** (XLM 1 = stroops 10,000,000). Mfano: ng'ombe 5 kila mmoja na thamani ya XLM 200 = stroops 10,000,000,000. |

> **Kuelewa stroops:** StellarKraal inatumia stroops (kitengo kidogo zaidi cha XLM) kwa usahihi. Kubadilisha: zidisha XLM na 10,000,000. Makadirio ya thamani kwa kila mnyama kwa XLM yanaonyeshwa chini ya sehemu ya thamani unapoweka nambari.

### Kuongeza vitu vingi vya dhamana

Bonyeza **+ Ongeza kipengele** ili kutoa zaidi ya aina moja ya mnyama katika ombi moja. Unaweza buruta safu kuzipanga upya (au tumia vitufe vya mshale ↑ / ↓ kwenye kishikio cha buruta). Mpangilio unaathiri ni dhamana gani inayowekwa kwanza kwenye hifadhi ya mkataba.

### Kinachofanyika unapoponya "Sajili na Endelea →"

1. Programu inawasilisha `POST /api/collateral/register` na maelezo ya wanyama wako.
2. Mfumo wa nyuma unaunda XDR ya muamala wa Soroban.
3. **Freighter inafunguka** — kagua na thibitisha saini.
4. Muamala uliosainishwa unawasilishwa kwenye mtandao wa Stellar.
5. Ukifanikiwa, kitambulisho chako cha dhamana kinahifadhiwa na unaendelea hadi Hatua ya 2.

**Ikiwa usajili unashindwa:** Hakikisha Freighter imefunguliwa na imewekwa kwenye mtandao sahihi. Angalia [Utatuzi wa Matatizo](#maswali-na-matatizo-ya-kawaida).

---

## Hatua ya 2 — Kiasi

**Kinachofanyika hapa:** Unachagua kiasi unachotaka kukopa na muda wa mkopo. Mchawi unakokotoa Uwiano wa Mkopo-kwa-Thamani (LTV) na kipengele cha afya kwa wakati halisi.

### Sehemu za fomu

| Sehemu | Maelezo |
|--------|---------|
| Kiasi cha mkopo (stroops) | Kiasi unachotaka kukopa. Haiwezi kuzidi kiwango cha juu kinachoonekana (LTV ya 70%). |
| Muda wa mkopo | Chagua siku 7, 30, 90, au 180. Muda mrefu zaidi unabeba ada kubwa zaidi. |

### Dhana muhimu

#### Uwiano wa Mkopo-kwa-Thamani (LTV — Loan-to-Value)

LTV ni uwiano wa unachokopa na thamani ya tathmini ya dhamana yako, unaonyeshwa kwa asilimia.

```
LTV = (kiasi cha mkopo / thamani ya dhamana) × 100
```

**Mfano:** Dhamana yenye thamani ya stroops 10,000,000. Kopa stroops 7,000,000 → LTV = 70%.

Mfumo unazuia mkopo wa awali kwa **LTV ya 70%**. Hii ina maana unaweza kukopa angalau stroops 70 kwa kila stroops 100 za dhamana. Asilimia 30 iliyobaki ni mto wa usalama — ikiwa thamani ya dhamana itashuka, una nafasi kabla kufikia hatua ya usanidi.

Mstari wa LTV katika mchawi unageuka njano zaidi ya 50% na nyekundu zaidi ya 65% — onyo la kumacho la kudumisha mto wa usalama.

#### Kipengele cha Afya (Health Factor)

Kipengele cha afya (HF) kinapima usalama wa mkopo wako kwa wakati huu:

```
HF = (thamani ya dhamana × 0.80) / kiasi cha mkopo
```

- **HF ≥ 1.0** — mkopo wako uko salama.
- **HF < 1.0** — nafasi yako inastahili kusanifiwa.

Mchawi unaonyesha makadirio ya HF moja kwa moja unapoweka kiasi chako:
- Kijani (≥ 1.5) — mto wa starehe.
- Njano (1.0 – 1.5) — angalia kwa makini.
- Nyekundu (< 1.0) — tayari katika hatari; punguza kiasi.

> Fomula kamili ya kipengele cha afya inayotumiwa na mkataba ni: `HF = (thamani_dhamana × 8000) / (deni_linalosimama × 10_000) × 10_000`. Angalia [Utaratibu wa Usanidi](../protocol/liquidation.md) kwa maelezo ya kiufundi.

#### Ada ya Uanzishaji (Origination Fee)

Ada ya uanzishaji inakatwa kutoka kwa malipo yako na inategemea muda:

| Muda | Kiwango cha ada |
|------|-----------------|
| Siku 7 | 2% |
| Siku 30 | 5% |
| Siku 90 | 12% |
| Siku 180 | 20% |

**Mfano:** Kopa stroops 1,000,000 kwa siku 30 → ada = stroops 50,000 → utalipa stroops 1,050,000.

---

## Hatua ya 3 — Mapitio

**Kinachofanyika hapa:** Muhtasari wa kila kitu ulichoweka, unaosomeka tu. Hakuna muamala unaotumwa bado.

### Jedwali la muhtasari

| Safu | Inachonyesha |
|------|--------------|
| Aina ya dhamana | Aina ya mnyama na emoji |
| Idadi ya wanyama | Wanyama waliowasilishwa |
| Thamani ya tathmini | Thamani yote ya dhamana kwa stroops |
| Kiasi cha mkopo | Utakachopokea |
| Muda wa mkopo | Muda kwa siku |
| Kiwango cha ada | Asilimia ya ada kwa muda huu |
| Kiasi cha ada | Stroops zinazokatwa kama ada ya uanzishaji |
| **Jumla ya kulipa** | Mkopo + ada (unachostahili kulipa ukifika mwisho) |
| **Kipengele cha afya** | Uwiano wa usalama wa nafasi yako ya makadirio |

### Onyo la hatari

Sanduku la njano la onyo linaonekana ikiwa kipengele chako cha afya ni chini ya 1.5, kukukumbusha kwamba kushuka kwa bei ya dhamana kunaweza kusukuma HF yako chini ya 1.0 na kusababisha usanidi.

Ukitaka kubadilisha chochote, bonyeza **← Rudi** kurudi hatua ya Kiasi au Dhamana.

---

## Hatua ya 4 — Thibitisha

**Kinachofanyika hapa:** Hii ndiyo hatua ya mwisho. Kubonyeza **Wasilisha Ombi la Mkopo** inatuma muamala halisi wa mkoba.

### Kinachofanyika unapowasilisha

1. Programu inawasilisha `POST /api/loan/request` na anwani yako ya mkopaji, kitambulisho cha dhamana, kiasi, na muda.
2. Mfumo wa nyuma unaunda XDR ya muamala wa Soroban.
3. **Freighter inafunguka** — hii ndiyo nafasi yako ya mwisho ya kupitia kabla ya kusaini. Muhtasari wa muamala ndani ya Freighter unaonyesha wito wa mkataba.
4. Ukikubali, XDR iliyosainiwa inasambazwa kwenye mtandao.
5. Ukifanikiwa, skrini ya uthibitisho wa **Mkopo Umetolewa** inaonyesha Kitambulisho chako cha Mkopo na maelezo ya malipo.

### Baada ya kutoa mkopo

- Kiasi kilichokopwa kinawekwa kwenye mkoba wako wa Stellar.
- Kitambulisho chako cha Mkopo kinaonyeshwa kwenye skrini — hifadhi; utahitaji kulipa.
- Mkopo unaonekana kwenye orodha yako ya [Mikopo](/loans).
- Angalia kipengele chako cha afya kupitia dashibodi. Ikiwa bei za dhamana zitashuka, lipa au ongeza dhamana ili kukaa juu ya 1.0.

---

## Maswali na Matatizo ya Kawaida

**S: Freighter haikufunguka. Nifanye nini?**  
Hakikisha programu ya Freighter imesakinishwa, imefunguliwa, na akaunti inayofanya kazi inalingana na mkoba uliounganisha. Upya ukurasa na jaribu tena. Kwa matatizo yanayoendelea, angalia [docs/troubleshooting.md](../troubleshooting.md).

**S: Ninaona "Usajili umeshindwa. Tafadhali jaribu tena."**  
Hii kwa kawaida ina maana ombi la mtandao kwa mfumo wa nyuma limeshindwa au Freighter ilikataa saini. Angalia muunganiko wako wa mtandao, thibitisha uko kwenye mtandao sahihi wa Stellar (testnet dhidi ya mainnet), na jaribu tena.

**S: Kwa nini siwezi kukopa zaidi ya 70% ya thamani ya dhamana yangu?**  
Kizuizi cha LTV ya 70% kinatekelezwa na mkataba mzuri ili kuhakikisha kuna daima mto wa dhamana juu ya kiwango cha usanidi (80%). Bila mto huu, kushuka kidogo kwa bei kungeweza mara moja kusababisha usanidi.

**S: Tofauti kati ya LTV na kipengele cha afya ni nini?**  
LTV ni kipimo cha wakati mmoja wakati wa kuanzisha mkopo — inakuambia unakopa kiasi gani ikilinganishwa na dhamana wakati huo. Kipengele cha afya ni uwiano unaoendelea wa wakati halisi unaobadilika kadri bei za dhamana zinavyosogea na riba inavyoongezeka. LTV inaamua kizuizi cha mkopo; kipengele cha afya kinaaamua ikiwa uko katika hatari ya usanidi.

**S: Mchawi unaonyesha kipengele changu cha afya kwa nyekundu. Je, niendelee?**  
Hapana. Kipengele cha afya nyekundu kinamaanisha tayari uko chini ya 1.0 — nafasi yako ingestahili kusanifiwa mara moja. Punguza kiasi chako cha mkopo hadi kipengele cha afya kigeuke kijani.

**S: Nimekamilisha mchawi lakini siioni mkopo kwenye dashibodi yangu.**  
Orodha ya mikopo inasasishwa kiotomatiki, lakini uthibitisho wa blockchain unaweza kuchukua sekunde chache. Subiri kidogo na upya. Mkopo ukiendelea kutoonekana baada ya sekunde 30, angalia Kitambulisho cha Mkopo kilichoonyeshwa kwenye skrini ya uthibitisho dhidi ya `GET /api/loans?borrower=<anwani-yako>`.

**S: Ninaweza kufuta baada ya kubonyeza "Wasilisha Ombi la Mkopo"?**  
Ukikubali saini ndani ya Freighter na muamala kusambazwa, hauwezi kufutwa kwenye mkoba. Ikiwa haujasainiwa bado, futa Freighter ili kusimamisha.

**S: Je, thamani za tathmini zimewekwa na mimi au na oracle?**  
Kwa hatua ya usajili wa dhamana, unaweka thamani ya tathmini. Oracle ya mkoba inakagua kwa kujitegemea na inaweza kubatilisha bei za dhamana kwa mahesabu ya kipengele cha afya na usanidi. Angalia [ADR-006](../adr/ADR-006-oracle-design.md) kwa mfano wa oracle.

---

## Nyaraka Zinazohusiana

- [Jinsi ya Kulipa Mkopo](repay-loan-sw.md)
- [Kuelewa Usanidi](understanding-liquidation-sw.md)
- [Utaratibu wa Usanidi (kiufundi)](../protocol/liquidation.md)
- [Kiolesura cha Mkataba Mzuri](../contracts/stellarkraal-interface.md)
- [Utatuzi wa Matatizo](../troubleshooting.md)
