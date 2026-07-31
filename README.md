# KINO for Samsung Tizen TV

Šajā repozitorijā ir divas daļas:

1. **TizenBrew modulis** (`package.json` + `index.js`) — pults navigācija, apakšizvēlnes un video atskaņotāja vadība.
2. **Atsevišķa KINO palaišanas aplikācija** (`tizen/KINO`) — Samsung sākuma joslā rāda KINO ikonu un palaiž TizenBrew.

## Prasības

- Samsung TV ar Tizen 3.0 vai jaunāku.
- Uzinstalēta pati TizenBrew aplikācija, nevis tikai TizenBrew Installer.
- TizenBrew moduļu sarakstā pievienots:

```text
a1oL/rezka-tv-remote
```

## Obligāti: ieslēdz Auto Launch

Lai pults vadība un daudzkrāsainais fokusa rāmis tiktu ielādēti, TizenBrew vienu reizi jāiestata automātiski palaist KINO moduli:

1. Atver TizenBrew manuāli.
2. Atver **Settings**.
3. Izvēlies pirmo kartīti **Auto Launch**.
4. Izvēlies **KINO** (`1.1.1` vai jaunāku).
5. Apstiprini izvēli.
6. Pilnībā aizver TizenBrew un pēc tam atver KINO ikonu.

Ja atveras vietne, bet pults vadība un krāsainais rāmis nav redzami, tas nozīmē, ka atvērta tikai parastā vietne un KINO modulis nav injicēts. Pārbaudi Auto Launch iestatījumu, izņem un pievieno moduli vēlreiz, pēc tam pārstartē TizenBrew.

## KINO aplikācijas uzstādīšana

1. Tizen Studio vai VS Code Tizen Extension izveido Samsung certificate profile, kurā ir pievienots tavs televizors.
2. Televizorā ieslēdz **Developer Mode** un norādi datora IP adresi.
3. Atver/importē mapi:

```text
tizen/KINO
```

4. Pieslēdz televizoru.
5. Palaid projektu ar **Run Project** vai **Run As → Tizen Web Application**.

Pēc uzstādīšanas Samsung sākuma joslā būs atsevišķa **KINO** ikona. KINO `1.0.2` palaiž pašu TizenBrew aplikāciju; TizenBrew iebūvētais Auto Launch tad ielādē `a1oL/rezka-tv-remote`, tāpēc pults kods un daudzkrāsainais fokusa rāmis darbojas.

## Vadība

- Bultiņas — navigācija.
- OK — atvērt/izvēlēties.
- Bultiņa uz leju augšējā izvēlnē — atvērt apakškategoriju.
- Video laukā OK — Player Mode.
- Media Play/Pause — atskaņot vai pauzēt.
- Media Fast Forward/Rewind — ±10 sekundes.
- RETURN — aizvērt Player Mode, izvēlni, pilnekrānu vai atgriezties.

## Piezīme

`KINO.wgt` jāparaksta ar tava Samsung/Tizen sertifikāta profilu. Sertifikāts nav glabājams GitHub repozitorijā.
