# Quizzy

**Quizzy** è una piattaforma web didattica progettata per la creazione e lo svolgimento di quiz online, pensata per migliorare l’interazione tra docenti e studenti attraverso un sistema semplice, dinamico e moderno.

---

## Panoramica

Quizzy permette ai docenti di creare quiz personalizzati e monitorare i risultati degli studenti, mentre gli studenti possono selezionare il docente, svolgere i quiz disponibili e visualizzare immediatamente il proprio punteggio.

L’applicazione è sviluppata seguendo un’architettura client-server con comunicazione asincrona.

---

## Stack Tecnologico

- **Backend:** Python + Flask  
- **Database:** MongoDB (NoSQL)  
- **Frontend:**  
  - HTML5  
  - CSS3 (Bootstrap)  
  - JavaScript Vanilla  

---

## Funzionalità Docente

-  Registrazione e Login
-  Creazione di quiz
-  Aggiunta dinamica delle domande
-  Selezione della risposta corretta tramite radio button
-  Visualizzazione dei risultati degli studenti
-  Eliminazione dei quiz

---

## Funzionalità Studente

- Scelta del professore
- Visualizzazione della lista dei quiz disponibili
- Controllo automatico dei quiz già completati
- Svolgimento dei quiz
- Calcolo del punteggio in tempo reale
- Reindirizzamento automatico al termine del quiz

---

## Comunicazione Client-Server

L’applicazione utilizza richieste asincrone tramite l’API `fetch` per garantire un’interazione fluida tra frontend e backend.

- Scambio dati in formato **JSON**
- Aggiornamento dinamico delle pagine senza ricarica
- Interazioni rapide e responsive

---

## Struttura del Database

Il database MongoDB è organizzato in diverse collection:

- **utenti** → gestione account (docenti e studenti)
- **quiz** → quiz creati dai docenti con domande e opzioni
- **risultati** → punteggi degli studenti

---

## Obiettivi del Progetto

- Creare una piattaforma semplice e intuitiva per la didattica digitale  
- Implementare una gestione dinamica dei contenuti  
- Utilizzare tecnologie moderne lato web  
- Dimostrare competenze full-stack (frontend + backend + database)

---

## Autore

Progetto realizzato da **Federico Cravero**  
Classe 5B Informatica – I.I.S. Vallauri

---

## Note

Questo progetto è stato sviluppato come applicazione didattica per dimostrare competenze nello sviluppo web full-stack, con particolare attenzione alla gestione dinamica dei dati e all’esperienza utente.

---