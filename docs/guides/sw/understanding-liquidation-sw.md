# Kuelewa Usanidi

Mwongozo huu unaeleza usanidi kwa lugha ya kawaida — ni nini, unatokea lini, jinsi kipengele cha afya kinavyofanya kazi, na unachoweza kufanya kulinda nafasi yako.

---

## Usanidi ni Nini?

Usanidi ni mchakato ambao upande wa tatu ("msanidi") analipa sehemu au mkopo wako wote wakati dhamana yako haistahili tena kuunga mkono mkopo wako kwa usalama.

Fikiria kama wito wa pembezoni: ikiwa thamani ya ulichoweka kama dhamana itashuka sana ikilinganishwa na unachokirimu, mfumo unaruhusu wengine kuingia, kulipa deni lako, na kudai dhamana yako kama malipo.

**Usanidi haofanyiki kiotomatiki kulingana na wakati.** Unasababishwa tu wakati kipengele cha afya cha mkopo wako kitashuka chini ya 1.0.

---

## Kipengele cha Afya (Health Factor)

Kipengele cha afya (HF) ni nambari moja inayokwambia usalama wa mkopo wako sasa hivi. Nambari kubwa zaidi inamaanisha nafasi salama zaidi.

```
Kipengele cha Afya = (thamani ya dhamana × 80%) / deni linalosimama
```

| Kipengele cha Afya | Maana yake |
|-------------------|------------|
| ≥ 1.5 | Salama — mto wa starehe |
| 1.0 – 1.5 | Eneo la onyo — angalia kwa makini |
| < 1.0 | **Inastahili usanidi** — mtu yeyote anaweza kusanidi |
| haijafafanuliwa (deni = 0) | Imelipwa kikamilifu — haiwezi kusanidiwa |

**Kizuizi muhimu ni 1.0.** Kipengele chako cha afya kikishuka chini ya 1.0, mkopo wako unastahili usanidi wakati wowote.

---

## Usanidi Unafanyika Lini?

Usanidi unakuwa uwezekano wakati:

1. **Thamani ya tathmini ya dhamana yako itashuka**, kupunguza kiziada cha fomula ya kipengele cha afya.
2. **Deni linalosimama linaongezeka** (kupitia mkusanyiko wa riba), kuongeza mshindi.
3. Vyote viwili vinatokea kwa wakati mmoja.

Kipengele cha 80% katika fomula ni kizuizi cha usanidi — mfumo unahitaji dhamana yako kufunika angalau 80% ya deni linalosimama ili kipengele cha afya kubaki au kuzidi 1.0.

---

## Mfano wa Kina

### Nafasi ya kuanza

Una ng'ombe 5 wenye tathmini ya **XLM 200 kila mmoja** (jumla: **XLM 1,000**).  
Unakopa **XLM 600** (LTV ya 60%).

```
Kipengele cha Afya = (1,000 × 0.80) / 600
                   = 800 / 600
                   = 1.33  ✅ Salama
```

### Baada ya kushuka kwa bei ya 30%

Bei za ng'ombe zishuka. Kila mnyama ana thamani ya XLM 140 sasa (jumla: **XLM 700**).

```
Kipengele cha Afya = (700 × 0.80) / 600
                   = 560 / 600
                   = 0.93  ⚠️ INASTAHILI USANIDI
```

Kipengele chako cha afya kimeshuka chini ya 1.0. Msanidi anaweza sasa kuwasilisha `liquidate` kwenye mkopo wako.

### Msanidi anafanya nini

Msanidi analipa hadi **50%** ya deni lako linalosimama katika muamala mmoja (hii inaitwa "kipengele cha kufunga" — inapunguza kiasi kinachoweza kusanidiwa mara moja, ikikupa nafasi ya kupona).

```
Malipo ya juu = XLM 600 × 50% = XLM 300
```

Msanidi akilipa XLM 300:

```
Kipengele cha Afya = (700 × 0.80) / 300
                   = 560 / 300
                   = 1.87  ✅ Salama tena
```

Mkopo wako sasa una kilichosalia cha XLM 300 badala ya XLM 600. Unabaki **Unaofanya Kazi** — bado una deni la XLM 300 iliyosalia.

### Hali ya usanidi kamili

Dhamana ikishuka mbali sana hadi mizunguko miwili ya usanidi wa sehemu kuleta kilichosalia hadi sifuri, mkopo unabadilika hadi hali ya **Umesanidiwa** na dhamana yako inaachiwa huru kwa msanidi.

---

## Jinsi ya Kuepuka Usanidi

Kuna vitendo viwili unavyoweza kuchukua kabla kipengele chako cha afya kufika 1.0:

### 1. Lipa sehemu ya mkopo wako

Kupunguza deni lako linalosimama kunaongeza moja kwa moja kipengele cha afya.

**Mfano:** Ikiwa kipengele chako cha afya ni 1.05 na unataka kufikia 1.5:

```
Lengo: HF = 1.5
1.5 = (700 × 0.80) / kilichosalia_kipya
kilichosalia_kipya = 560 / 1.5 = XLM 373

Unahitaji kulipa: 600 - 373 = XLM 227
```

Angalia [Jinsi ya Kulipa Mkopo](repay-loan-sw.md) kwa maelekezo ya hatua kwa hatua ya malipo.

### 2. Ongeza dhamana zaidi

Kusajili dhamana ya ziada kunaongeza thamani ya dhamana katika kiziada, kuinua kipengele chako cha afya.

> Kuongeza dhamana kunafanywa kupitia hatua ya Dhamana katika [Mchawi wa Kuomba Mkopo](request-loan-sw.md) kwa mikopo mipya, au kupitia ukurasa wa usimamizi wa Dhamana kwa nafasi zilizopo (ramani ya barabara ya kipengele).

### Kufuatilia kipengele chako cha afya

- **Dashibodi** inaonyesha KipimoPamoja cha wakati halisi kwa kila mkopo unaofanya kazi.
- Kipima kinageuka njano chini ya 1.5 na nyekundu chini ya 1.0.
- Utapata arifa (ikiwa imesanidiwa) wakati kipengele chako cha afya kitashuka chini ya kizuizi cha onyo.

**Mazoea bora:** Weka kizuizi cha kibinafsi kwenye HF = 1.2 ili uwe na wakati wa kuchukua hatua kabla ya kufikia mipaka ya usanidi ya 1.0.

---

## Kamusi ya Maneno Muhimu

**Kipengele cha Afya (HF):** Uwiano unaopima usalama wa nafasi. Chini ya 1.0 unasababisha haki ya usanidi.

**Kizuizi cha Usanidi (80%):** Kigezo cha mfumo kinachosimamia mto wa usalama. Mkataba unatumia alama za msingi 8,000 (80%).

**Kipengele cha Kufunga (50%):** Asilimia ya juu ya deni linalosimama inayoweza kulipwa katika wito mmoja wa usanidi. Inapunguza athari na kuhifadhi nafasi kwa mkopaji kujitibua.

**LTV (Uwiano wa Mkopo-kwa-Thamani — Loan-to-Value):** Uwiano wa kiasi cha mkopo na thamani ya dhamana wakati wa kuanzisha. Mfumo unazuia mikopo ya awali kwa LTV ya 70%, kutoa mto wa pointi kumi za asilimia kabla ya kizuizi cha usanidi cha 80%.

**Msanidi (Liquidator):** Anwani yoyote inayowasilisha kazi ya `liquidate` kwenye mkataba wakati HF < 1.0. Wasanidi wanachochewa kupata dhamana kwa bei za chini ya soko.

---

## Maswali ya Kawaida

**S: Je, nitapata onyo kabla usanidi kutokea?**  
KipimaPamoja cha dashibodi kinaonyesha kipengele chako cha afya cha wakati halisi na kinacha nyekundu unapokaribia kizuizi. Arifa zinaweza kusanidiwa katika Mipangilio. Hata hivyo, usanidi wenyewe una ruhusa — anwani yoyote inaweza kuusababisha mara HF ikishuka chini ya 1.0, kwa hivyo kuangalia kipima ndiyo ulinzi wako mkuu.

**S: Je, ninaweza kusanidiwa kwa kiasi chote mara moja?**  
Hapana. Kipengele cha kufunga kinazuia wito wowote mmoja wa usanidi hadi 50% ya deni lako linalosimama. Baada ya usanidi wa sehemu, kipengele chako cha afya kinaweza kupona juu ya 1.0, kusimamisha usanidi zaidi kiotomatiki.

**S: Je, usanidi daima unaharibu dhamana yangu yote?**  
Si lazima. Ikiwa usanidi wa sehemu utarejesha kipengele chako cha afya juu ya 1.0, dhamana iliyobaki inabaki imefungwa kwa mkopo uliochaguliwa. Hasara kamili ya dhamana inatokea tu ikiwa deni linalosimama litafika sifuri kupitia usanidi mfululizo.

**S: Kinachofanyika kwa mkopo wangu baada ya usanidi?**  
- **Sehemu:** Mkopo unabaki Unaofanya Kazi na kilichosalia kilichopunguzwa.
- **Kamili (kilichosalia = 0):** Hali ya mkopo inabadilika hadi **Umesanidiwa**. Dhamana inaachiwa huru kwa msanidi. Unabaki na kiasi chochote ulichopokea tayari kama utoaji wa mkopo.

**S: Je, kuna zawadi ya usanidi?**  
Toleo la sasa la mkataba haliweki zawadi ya usanidi kwenye mkoba. Motisha ya msanidi ni upatikanaji wa dhamana wa chini ya soko, ulioamuliwa nje ya mkoba kupitia safu ya oracle/utatuzi.

**S: Haraka gani bei zinaweza kusogea na kusababisha usanidi?**  
Mfumo unatumia TWAP (Bei ya Wastani ya Uzito wa Wakati — Time-Weighted Average Price) kwa maamuzi ya usanidi — unakusanya bei kwa kipindi cha saa 1. Hii inazuia mgongano wa bei moja ya muamala kusababisha usanidi mara moja. Kushuka kwa bei ya kweli ya kudumu kwa kipindi cha wakati kunaweza bado kusukuma HF chini ya 1.0. Angalia [Utaratibu wa TWAP](../protocol/twap-mechanism.md) kwa maelezo.

---

## Nyaraka Zinazohusiana

- [Jinsi ya Kuomba Mkopo](request-loan-sw.md)
- [Jinsi ya Kulipa Mkopo](repay-loan-sw.md)
- [Utaratibu wa Usanidi (kiufundi)](../protocol/liquidation.md)
- [Utaratibu wa TWAP](../protocol/twap-mechanism.md)
- [Kiolesura cha Mkataba Mzuri](../contracts/stellarkraal-interface.md)
