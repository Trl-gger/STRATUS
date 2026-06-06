# STRATUS — Weather App

Aplikácia **STRATUS** je moderná a vizuálne úchvatná webová aplikácia na sledovanie počasia vytvorená od základov s dôrazom na čistý dizajn, plynulé animácie a prvotriedny používateľský zážitok (glassmorphism).

## Popis aplikácie
STRATUS umožňuje používateľom rýchlo a intuitívne vyhľadávať aktuálne počasie pre akékoľvek mesto na svete. 

Hlavné funkcie aplikácie zahŕňame:
- **Inteligentné vyhľadávanie**: Prepojenie s geokódovacou službou Open-Meteo na vyhľadanie miest.
- **Rýchly inline autocomplete**: Počas písania sa priamo v textovom poli zobrazuje "ghost text" s prvým navrhovaným mestom. Používateľ ho môže okamžite akceptovať stlačením klávesu `Tab` alebo šípky vpravo (`→`).
- **Sklenená karta počasia (Glassmorphism)**: Zobrazuje názov mesta, krajinu, WMO emotikon počasia, teplotu, pocitovú teplotu, vlhkosť, rýchlosť vetra a textový popis stavu počasia.
- **Prepínač jednotiek (°C / °F)**: Plynulý posuvný prepínač, ktorý vykonáva čisto klientsky prepočet teplôt bez nutnosti opätovného načítavania dát.
- **Nedávne vyhľadávania**: Pamätá si posledných 5 úspešne vyhľadaných miest v `localStorage`. Sú zobrazené ako klikateľné štítky pre bleskový prístup.
- **Prémiový dizajn**: Animované svetelné sféry (orby) na pozadí, rozmazanie pozadia (backdrop filter) a jemné prechody.

## Použité technológie
- **HTML5**: Semantická štruktúra stránky.
- **Vanilla CSS (CSS3)**: Responzívny dizajn s podporou pre mobilné zariadenia (375px), tablety (768px) a desktop (1920px), vlastné premenné, kľúčové snímky (`@keyframes`) a sklenený efekt.
- **Vanilla JavaScript (ES6)**: Kompletné riadenie stavu aplikácie, obsluha udalostí klávesnice, debouncing dopytov a manipulácia s DOM.
- **API Open-Meteo**:
  - **Geocoding API**: `https://geocoding-api.open-meteo.com/v1/search`
  - **Weather Forecast API**: `https://api.open-meteo.com/v1/forecast`

## Postup spustenia
Keďže ide o čisto statickú klientsku aplikáciu, na jej spustenie nepotrebujete žiadne zložité inštalácie ani build kroky:

1. Stiahnite alebo naklonujte tento repozitár:
   ```bash
   git clone <url-repozitara>
   ```
2. Otvorte súbor `index.html` priamo vo vašom webovom prehliadači (napr. dvojklikom na súbor).
3. Alternatívne spustite lokálny webový server (napríklad pomocou rozšírenia Live Server vo VS Code, alebo spustením `npx http-server` v koreňovom adresári aplikácie) na adrese `http://localhost:8080`.

## Poznámky k AI nástrojom použitým pri vývoji
Aplikácia bola vyvinutá v spolupráci s pokročilým AI programovacím asistentom **Antigravity** od tímu Google DeepMind. AI asistent pomohol navrhnúť optimálnu modulárnu štruktúru bez frameworkov, implementovať presný inline autocomplete algoritmus bez externých závislostí a doladiť plynulú animáciu prepínania jednotiek a orbu.
