# Jinsi ya Kulipa Mkopo

Mwongozo huu unaeleza jinsi ya kulipa mkopo unaofanya kazi kwenye StellarKraal — ikijumuisha malipo ya sehemu, malipo kamili, jinsi malipo yanavyoboresha kipengele chako cha afya, na kinachofanyika ukifika tarehe ya mwisho ya malipo.

> **Mahitaji ya awali**
> - Mkopo unaofanya kazi wenye Kitambulisho cha Mkopo (kinachoonekana kwenye ukurasa wa [Mikopo](/loans)).
> - [Freighter](https://www.freighter.app/) imesakinishwa, imefunguliwa, na imewekwa kwenye mtandao sahihi.
> - Stroops za kutosha kwenye mkoba wako kufunika kiasi cha malipo pamoja na ada za muamala.

---

## Mahali pa Kulipa

Nenda kwenye ukurasa wako wa [Mikopo](/loans). Kila mkopo unaofanya kazi una kitufe cha **Lipa** kinachofungua Jopo la Kulipa. Unaweza pia kupata JopolaKulipa moja kwa moja kwenye dashibodi kwa ufikiaji wa haraka.

---

## Sehemu za fomu

| Sehemu | Maelezo |
|--------|---------|
| Kitambulisho cha Mkopo | Nambari ya kitambulisho ya mkopo unaotaka kulipa. Inaonyeshwa kwenye ukurasa wa Mikopo na kwenye barua pepe yako ya uthibitisho. |
| Kiasi (stroops) | Stroops ngapi za kulipa. Lazima ziwe zaidi ya 0 na angalau kiasi kilichosalia. |

---

## Malipo ya Sehemu dhidi ya Malipo Kamili

### Malipo ya sehemu

Malipo ya sehemu yanapunguza kiasi chako kilichosalia bila kufunga mkopo. Yatumie unapotaka:

- Kuboresha kipengele chako cha afya ili kuepuka hatari ya usanidi.
- Kulipa mkuu mapema ili kupunguza riba ya baadaye.
- Kusambaza malipo kwenye miamala mingi.

**Mfano:**  
Kiasi kilichosalia: stroops 1,050,000 (mkuu wa stroops 1,000,000 + ada ya stroops 50,000).  
Unalipa stroops 500,000 → kilichosalia kipya: stroops 550,000. Mkopo unabaki **Unaofanya Kazi**.

### Malipo kamili

Malipo kamili yanafuta kiasi chote kilichosalia. Mkopo unabadilika kutoka **Unaofanya Kazi** hadi **Umelipwa** na dhamana yako inaachiwa huru.

**Mfano:**  
Kiasi kilichosalia: stroops 550,000.  
Unalipa stroops 550,000 → kilichosalia kinafika 0 → hali ya mkopo inakuwa **Umelipwa**. Dhamana inaachiwa huru.

> **Kidokezo:** Kila wakati angalia kiasi cha sasa kilichosalia kwenye ukurasa wa Mikopo kabla ya kuwasilisha. Kiasi kinajumuisha mkuu pamoja na ada zozote zilizokusanyika. Kuweka kiasi kikubwa zaidi kuliko kilichosalia kitakataliwa na mkataba.

---

## Jinsi Malipo Yanavyoboresha Kipengele Chako cha Afya

Kipengele cha afya kinapima usalama wa nafasi yako ya mkopo:

```
Kipengele cha Afya = (thamani ya dhamana × 0.80) / deni linalosimama
```

Unapolipa, deni linalosimama linapungua, kwa hivyo kipengele cha afya kinaongezeka.

### Mfano wa Kikokotoo cha Malipo

| Hali | Thamani ya Dhamana | Kilichosalia | Kipengele cha Afya |
|------|-------------------|--------------|-------------------|
| Kabla ya malipo ya sehemu | stroops 10,000,000 | stroops 7,000,000 | 1.14 ⚠️ |
| Baada ya kulipa stroops 2,000,000 | stroops 10,000,000 | stroops 5,000,000 | 1.60 ✅ |
| Baada ya malipo kamili | stroops 10,000,000 | 0 | ∞ (Umelipwa) |

Kipengele cha afya chini ya 1.0 kinamaanisha nafasi yako inastahili usanidi. Malipo ya sehemu ni njia ya haraka ya kuinua kipengele cha afya kinachoshuka kurudi kwenye eneo salama bila kufunga mkopo kabisa.

**Rejea ya fomula (kwenye mkoba):**

```
HF = (thamani_yote_ya_dhamana × 8000) / (kilichosalia × 10_000) × 10_000
```

HF inaonyeshwa kwa alama za msingi zilizopandishwa kwa 10,000 — thamani ya 10,000 ni sawa na 1.0. Angalia [Utaratibu wa Usanidi](../protocol/liquidation.md) kwa maelezo kamili ya kiufundi.

---

## Tarehe za Mwisho za Malipo

> **Kumbuka:** Utekelezaji wa kiotomatiki wa tarehe ya mwisho (yaani, kuashiria mkopo kushindwa ikiwa haulipwi kabla ya tarehe ya mwisho ya muda) umepangwa lakini haujatekelezwa bado katika toleo la sasa la mkataba. Sehemu hii itasasishwa wakati kipengele kitakapotumwa.

Unachoweza kutegemea leo:

- Kila mkopo una muda (siku 7, 30, 90, au 180) uliowekwa wakati wa kuanzisha.
- Mfumo wa nyuma unakumbuka tarehe ya malipo na inaonyeshwa kwenye ukurasa wa Mikopo.
- Usipoghauri kulipa kabla ya tarehe ya malipo, mkopo unabaki **Unaofanya Kazi** lakini unaweza kuwa na haki ya usanidi ikiwa kipengele cha afya kitashuka chini ya 1.0 katikati ya wakati huo.
- Ada ya uanzishaji inachajiwa wakati wa kuunda mkopo, si wakati wa malipo — tayari imewekwa kwenye kiasi kilichosalia.

**Mazoea bora:** Weka kumbukumbu siku chache kabla ya tarehe ya malipo ya mkopo wako na uhakikishe una fedha za kutosha kulipa kikamilifu.

---

## Hatua kwa Hatua: Kufanya Malipo

1. Nenda kwenye [Mikopo](/loans) na pata mkopo unaotaka kulipa.
2. Angalia **kiasi kilichosalia** kinachoonekana kwenye kadi ya mkopo.
3. Bonyeza **Lipa** kufungua Jopo la Kulipa.
4. Weka **Kitambulisho cha Mkopo** na **kiasi** (kwa stroops) unachotaka kulipa.
5. Bonyeza **Lipa**.
6. **Freighter inafunguka** — pitia muamala na bonyeza Kubali.
7. Programu inasambaza muamala uliosainishwa.
8. Ukifanikiwa, arifa ya kigumba inathibitisha malipo.
9. Kadi ya mkopo inasasishwa — kiasi kilichosalia kinapungua (sehemu) au mkopo unashirikiwa **Umelipwa** (kamili).

---

## Kinachofanyika kwenye Mkoba

Unapowasilisha malipo, mkataba mzuri wa Soroban unatekeleza yafuatayo:

1. Inahakikisha mkataba haupumzwi.
2. Inakagua mkopo upo na uko **Unaofanya Kazi**.
3. Inahakikisha `kiasi_cha_malipo > 0` na `kiasi_cha_malipo <= kilichosalia`.
4. Inahamisha `kiasi_cha_malipo` stroops kutoka mkoba wako hadi mkataba.
5. Inapunguza `kilichosalia` kwa `kiasi_cha_malipo`.
6. Ikiwa `kilichosalia == 0`, inabadilisha hali ya mkopo hadi **Umelipwa** na kuachia dhamana.
7. Inatoa tukio la `loan/repaid` ambalo mfumo wa nyuma unasikiliza na kusawazisha.

---

## Maswali na Matatizo ya Kawaida

**S: Kitufe cha Kulipa kinaonyesha onyo la kutofanana kwa mtandao.**  
Mkoba wako wa Freighter umeunganishwa kwenye mtandao tofauti wa Stellar kuliko unavyotarajiwa na programu. Badilisha Freighter kwenye mtandao sahihi (Testnet au Mainnet) na unganisha tena.

**S: Niliweka kiasi chote kilichosalia lakini nilipata hitilafu inayosema "inazidi salio".**  
Kiasi kiko katika stroops. Ukiweka thamani kwa XLM kwa bahati mbaya, zidisha kwa 10,000,000. Pia angalia mkoba wako una XLM ya kutosha kwa malipo pamoja na ada ya muamala wa Stellar (takriban stroops 100).

**S: Mkopo wangu bado unaonyesha kama Unaofanya Kazi baada ya malipo kamili.**  
Uthibitisho wa blockchain unaweza kuchukua sekunde chache. Subiri na upya ukurasa wa Mikopo. Ukiendelea baada ya sekunde 30, angalia hali ya muamala kwenye [mtafutaji wa Stellar Expert](https://stellar.expert/) ukitumia hash yako ya muamala.

**S: Ninaweza kulipa mkopo wa mtu mwingine?**  
Mkataba unahitaji `mkopaji` kulingana na msaini wa muamala. Unaweza kulipa mikopo yako tu kupitia kiolesura cha mtumiaji. Wito wa mkataba moja kwa moja kwa malipo ya mtu wa tatu haununuliwi na kiolesura cha sasa.

**S: Kinachofanyika kwa dhamana yangu baada ya malipo kamili?**  
Mara kilichosalia kinafika 0, mkopo unabadilika hadi **Umelipwa** na dhamana inaachiwa huru kutoka kwa mkataba. Utatuzi wa dhamana unashughulikiwa na msikilizaji wa tukio la mfumo wa nyuma ukipokea tukio la `loan/repaid` la mkoba.

**S: Nataka kulipa mapema. Je, kuna adhabu ya malipo ya mapema?**  
Hapana. Unaweza kulipa wakati wowote bila adhabu. Malipo kamili ya mapema yanaachilia dhamana yako mara moja.

---

## Nyaraka Zinazohusiana

- [Jinsi ya Kuomba Mkopo](request-loan-sw.md)
- [Kuelewa Usanidi](understanding-liquidation-sw.md)
- [Utaratibu wa Usanidi (kiufundi)](../protocol/liquidation.md)
- [Kiolesura cha Mkataba Mzuri](../contracts/stellarkraal-interface.md)
- [Utatuzi wa Matatizo](../troubleshooting.md)
