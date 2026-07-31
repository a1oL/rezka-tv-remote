# KINO for Samsung Tizen TV

Šajā repozitorijā ir divas daļas:

1. **TizenBrew modulis** (`package.json` + `index.js`) — pults navigācija, apakšizvēlnes un video atskaņotāja vadība.
2. **Atsevišķa KINO palaišanas aplikācija** (`tizen/KINO`) — Samsung sākuma joslā rāda KINO ikonu un uzreiz atver moduli TizenBrew, neparādot TizenBrew izvēlni.

## Prasības

- Samsung TV ar Tizen 3.0 vai jaunāku.
- Uzinstalēts TizenBrew 2.x.
- TizenBrew moduļu sarakstā pievienots:

```text
a1oL/rezka-tv-remote
```

## KINO aplikācijas uzstādīšana

1. Uz datora uzinstalē **Tizen Studio** ar **Samsung TV Extension** un **Samsung Certificate Extension**.
2. Tizen Studio izveido Samsung certificate profile, kurā ir pievienots tavs televizors.
3. Televizorā ieslēdz **Developer Mode** un norādi datora IP adresi.
4. Tizen Studio izvēlies **File → Import → Tizen → Tizen Project**.
5. Importē mapi:

```text
tizen/KINO
```

6. Device Manager pieslēdz televizoru.
7. Uz projekta **KINO** spied labo peles pogu → **Run As → Tizen Web Application**.

Pēc uzstādīšanas Samsung sākuma joslā būs atsevišķa **KINO** ikona. Tā palaiž TizenBrew aplikāciju ar app-control datiem:

```text
moduleType: a1oL
moduleName: rezka-tv-remote
```

TizenBrew izvēlne netiek rādīta — modulis tiek atvērts uzreiz.

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
