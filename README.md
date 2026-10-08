# Demo · Siti per PT e palestre

Siti dimostrativi realizzati da **Alessio Fantini** per l'offerta freelance *Siti per PT e palestre*: esempi concreti di come può essere il sito di un personal trainer o di una palestra.

## Demo online

- Tutte le demo: https://jockeys97.github.io/demo-siti-fitness/
- **Marco Ferri Coaching**, sito per personal trainer: https://jockeys97.github.io/demo-siti-fitness/pt/
- **Forgia Fitness Club**, sito per palestra: https://jockeys97.github.io/demo-siti-fitness/palestra/

## Stack

- HTML, CSS e JavaScript vanilla: nessun framework, nessun build step, nessuna dipendenza npm.
- Google Fonts, icone SVG inline, mappa OpenStreetMap incorporata.
- Hosting statico su GitHub Pages (branch `main`, cartella root), con soli percorsi relativi.
- Mobile-first e responsive da 360 a 1920 px, con attenzione ad accessibilità (HTML semantico, ARIA, focus visibili, `prefers-reduced-motion`) e performance (lazy loading, dimensioni delle immagini dichiarate).

## Struttura

```
.
├── index.html     # landing con i link alle demo
├── pt/            # demo sito per personal trainer
├── palestra/      # demo sito per palestra
└── screenshots/   # anteprime delle demo
```

Per vederle in locale basta un server statico, ad esempio `python3 -m http.server`, poi aprire http://localhost:8000.

## Note

- Nomi, testi, prezzi, recensioni, indirizzi e contatti sono **di fantasia**. Numero WhatsApp segnaposto (+39 000 000 0000) ed email su domini `.example`.
- I moduli non inviano dati: c'è solo la validazione lato client.
- Le foto vengono da [Unsplash](https://unsplash.com) (licenza Unsplash) e sono caricate direttamente da `images.unsplash.com`.
- Nella cartella `screenshots/` ci sono le anteprime delle demo.
