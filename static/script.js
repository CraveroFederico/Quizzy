// Inizializzazione: aggiunge 3 opzioni vuote al caricamento della pagina
window.onload = function () {
    aggiungiOpzione()
    aggiungiOpzione()
    aggiungiOpzione()
}

// Invia i dati di registrazione al server
// Invia i dati di registrazione al server
function register() {
    var username = document.getElementById("reg_username").value;
    var password = document.getElementById("reg_password").value;
    var ruolo = document.getElementById("reg_ruolo").value;

    if (!username || !password) { alert("Riempi tutti i campi!"); return; }

    fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, ruolo })
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById("message").innerText = data.message || data.error;
        });
}

function login() {
    var username = document.getElementById("login_username").value;
    var password = document.getElementById("login_password").value;

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                // Salviamo solo per scopi estetici (es. "Benvenuto Username")
                localStorage.setItem("username", data.username);
                localStorage.setItem("ruolo", data.ruolo);

                window.location.href = (data.ruolo === "studente") ? "/dashboard_studente" : "/dashboard_docente";
            } else {
                document.getElementById("message").innerText = data.error;
            }
        });
}

function logout() {
    localStorage.clear();
    window.location.href = "/logout"; // Chiama la rotta server che pulisce la sessione
}

// Tutte le altre funzioni (createQuiz, addQuestion, etc.) rimangono uguali, 
// ma ora sono protette dal server che controlla la sessione automaticamente.

// Crea un nuovo contenitore quiz nel database
function createQuiz() {
    var titolo = document.getElementById("titolo_quiz").value
    var creatore = localStorage.getItem("username")

    fetch("/create_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            titolo: titolo,
            creatore: creatore
        })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("msg").innerText = data.message
            caricaQuiz()
        })
}

// Raccoglie i dati della domanda e la salva nel quiz selezionato
function addQuestion() {
    var titolo = document.getElementById("quiz_nome").value;
    var domanda = document.getElementById("domanda").value;
    var opzioni = [];

    for (var i = 0; i < contatoreOpzioni; i++) {
        var val = document.getElementById("op" + i).value;
        if (val !== "") opzioni.push(val);
    }

    var radios = document.getElementsByName("corretta_choice");
    var correttaIndex = -1;
    for (var r of radios) {
        if (r.checked) correttaIndex = parseInt(r.value);
    }

    if (correttaIndex === -1) {
        alert("Clicca sul pallino a sinistra della risposta corretta!");
        return;
    }

    fetch("/add_question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            titolo: titolo,
            testo: domanda,
            opzioni: opzioni,
            corretta: correttaIndex
        })
    }).then(res => res.json()).then(data => {
        alert(data.message);
        document.getElementById("domanda").value = "";
        document.getElementById("opzioni_container").innerHTML = "";
        contatoreOpzioni = 0;
        aggiungiOpzione(); aggiungiOpzione();
    });
}

var contatoreOpzioni = 0

// Aggiunge dinamicamente un campo di testo e un radio button per le risposte
function aggiungiOpzione() {
    var container = document.getElementById("opzioni_container");
    var div = document.createElement("div");
    div.className = "d-flex align-items-center mb-2";

    div.innerHTML = `
        <input type="radio" name="corretta_choice" value="${contatoreOpzioni}" class="me-2" style="width:20px; height:20px;">
        <input id="op${contatoreOpzioni}" class="form-control" placeholder="Testo opzione">
    `;
    container.appendChild(div);
    contatoreOpzioni++;
}

// Salva il quiz scelto e reindirizza alla pagina di svolgimento
function startQuiz(titolo) {
    localStorage.setItem("quiz", titolo)
    window.location.href = "/quiz"
}

// Invia le risposte dello studente, mostra il voto e torna in dashboard
function submitQuiz() {
    var titolo = localStorage.getItem("quiz")
    var studente = localStorage.getItem("username")
    var professore = localStorage.getItem("professore")

    var risposte = []
    var i = 0

    while (document.getElementsByName("q" + i).length > 0) {
        var radios = document.getElementsByName("q" + i)
        var rispostaData = -1
        for (var j = 0; j < radios.length; j++) {
            if (radios[j].checked) {
                rispostaData = parseInt(radios[j].value)
            }
        }
        risposte.push(rispostaData)
        i++
    }

    fetch("/submit_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            titolo: titolo,
            risposte: risposte,
            studente: studente,
            professore: professore
        })
    })
        .then(res => res.json())
        // Cerca questa parte dentro submitQuiz()
        .then(data => {
            document.getElementById("result").innerText =
                "Complimenti! Voto: " + data.voto + "/10 (Punti: " + data.punteggio + "/" + data.totale + ")";

            setTimeout(function () {
                window.location.href = "/dashboard_studente";
            }, 2000);
        })
}

// Recupera e visualizza i voti di tutti gli studenti per un quiz
function vediRisultati(titolo) {
    fetch("/get_results/" + titolo)
        .then(res => res.json())
        .then(data => {
            var div = document.getElementById("risultati");
            div.innerHTML = `<h3 class="mb-3">Risultati per: ${titolo}</h3>`;

            if (data.length === 0) {
                div.innerHTML += "<p class='text-muted'>Nessuno studente ha ancora completato questo quiz.</p>";
                return;
            }

            for (var i = 0; i < data.length; i++) {
                var r = data[i];
                var card = document.createElement("div");
                card.className = "quiz_card mb-2 p-3 border rounded d-flex justify-content-between align-items-center bg-white shadow-sm";
                
                // Determina il colore del voto (Verde se >= 6, Rosso se < 6)
                let coloreVoto = r.voto >= 6 ? "text-success" : "text-danger";

                card.innerHTML = `
                    <div>
                        <i class="bi bi-person-circle me-2"></i>
                        <strong>${r.studente}</strong>
                    </div>
                    <div class="text-end">
                        <span class="me-3 text-muted">Punti: ${r.punteggio} / ${r.totale}</span>
                        <span class="fw-bold ${coloreVoto}" style="font-size: 1.2rem;">
                            Voto: ${r.voto}
                        </span>
                    </div>
                `;
                div.appendChild(card);
            }
            
            // Scroll automatico ai risultati per comodità
            div.scrollIntoView({ behavior: 'smooth' });
        });
}

// Mostra i quiz creati dal docente loggato
// Modifica questa funzione nel tuo script.js
function caricaQuiz() {
    var docente = localStorage.getItem("username")

    fetch("/get_quiz_docente/" + docente)
        .then(res => res.json())
        .then(data => {
            var div = document.getElementById("quiz_docente")
            div.innerHTML = ""

            data.forEach(q => {
                var card = document.createElement("div");
                card.className = "quiz_card mb-3 p-3 border rounded shadow-sm bg-white";

                // Gestione testo e colore del bottone Somministra
                var btnClass = q.attivo ? "btn-success" : "btn-outline-success";
                var btnText = q.attivo ? "Attivo (Nascondi)" : "Somministra";
                var icon = q.attivo ? "bi-eye-slash" : "bi-megaphone";

                card.innerHTML = `
                    <h4>${q.titolo}</h4>
                    <div class="btn-group">
                        <button class="btn btn-sm ${btnClass}" onclick='toggleSomministrazione("${q.titolo}", ${q.attivo})'>
                            <i class="bi ${icon}"></i> ${btnText}
                        </button>
                        <button class="btn btn-sm btn-warning" onclick='apriModifica("${q.titolo}")'>
                            <i class="bi bi-pencil"></i> Modifica
                        </button>
                        <button class="btn btn-sm btn-info" onclick='vediRisultati("${q.titolo}")'>
                            <i class="bi bi-bar-chart"></i> Risultati
                        </button>
                        <button class="btn btn-sm btn-danger" onclick='eliminaQuiz("${q.titolo}")'>
                            <i class="bi bi-trash"></i> Elimina
                        </button>
                    </div>
                `;
                div.appendChild(card);
            });
        })
}

function apriModifica(titoloAttuale) {
    // 1. Chiedi se si vuole cambiare il titolo
    var nuovoTitolo = prompt("Modifica il titolo del quiz:", titoloAttuale);
    
    if (nuovoTitolo !== null && nuovoTitolo !== "" && nuovoTitolo !== titoloAttuale) {
        fetch("/edit_quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vecchio_titolo: titoloAttuale,
                nuovo_titolo: nuovoTitolo
            })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            caricaQuiz(); // Ricarica la lista col nuovo titolo
        });
    }

    // 2. Prepara automaticamente la sezione "Aggiungi Domanda" per questo quiz
    // Usiamo la funzione preparaModifica che avevi già nel codice
    preparaModifica(nuovoTitolo || titoloAttuale);
    
    // Mostra la sezione se è chiusa (usando Bootstrap)
    var section = document.getElementById('aggiungiDomandaSection');
    var bsCollapse = new bootstrap.Collapse(section, { toggle: false });
    bsCollapse.show();
}

let modalModifica;

document.addEventListener("DOMContentLoaded", function() {
    modalModifica = new bootstrap.Modal(document.getElementById('modalModifica'));
});

// Funzione di supporto per generare l'HTML di una domanda nella modal
function generaHtmlDomanda(testo = "", opzioni = ["", ""], corretta = 0, index) {
    const div = document.createElement("div");
    div.className = "card p-3 mb-3 bg-light edit-domanda-item";
    div.dataset.index = index; // Identificativo per i radio button

    div.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <label class="fw-bold">Domanda:</label>
            <button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        <input type="text" class="form-control mb-3 val-domanda" value="${testo}" placeholder="Testo della domanda">
        
        <div class="opzioni-edit-list">
            <label class="small text-muted">Opzioni (seleziona la corretta):</label>
            ${opzioni.map((op, i) => `
                <div class="input-group mb-1">
                    <span class="input-group-text">
                        <input type="radio" name="correct_${index}" value="${i}" ${i === corretta ? 'checked' : ''}>
                    </span>
                    <input type="text" class="form-control val-opzione" value="${op}">
                    <button class="btn btn-outline-secondary" onclick="this.parentElement.remove()">×</button>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-sm btn-link p-0 mt-1" onclick="aggiungiOpzioneInEdit(this, ${index})">
            + Aggiungi opzione
        </button>
    `;
    return div;
}

// Funzione per aggiungere un campo opzione a una domanda specifica nella modal
function aggiungiOpzioneInEdit(btn, index) {
    const container = btn.previousElementSibling; // il div .opzioni-edit-list
    const nuovoIndice = container.querySelectorAll(".input-group").length;
    
    const div = document.createElement("div");
    div.className = "input-group mb-1";
    div.innerHTML = `
        <span class="input-group-text">
            <input type="radio" name="correct_${index}" value="${nuovoIndice}">
        </span>
        <input type="text" class="form-control val-opzione" placeholder="Nuova opzione">
        <button class="btn btn-outline-secondary" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

// Funzione per aggiungere una domanda vuota in fondo alla modal
function aggiungiNuovaDomandaInEdit() {
    const container = document.getElementById("edit_domande_container");
    const nuovoIndex = Date.now(); // Usiamo il timestamp per avere nomi radio univoci
    container.appendChild(generaHtmlDomanda("", ["", ""], 0, nuovoIndex));
}

// Aggiorna la funzione apriModifica per usare il generatore
function apriModifica(titolo) {
    fetch("/get_quiz/" + titolo)
        .then(res => res.json())
        .then(quiz => {
            document.getElementById("edit_titolo_originale").value = quiz.titolo;
            document.getElementById("edit_titolo_nuovo").value = quiz.titolo;
            
            const container = document.getElementById("edit_domande_container");
            container.innerHTML = "";

            quiz.domande.forEach((d, index) => {
                container.appendChild(generaHtmlDomanda(d.testo, d.opzioni, d.corretta, index));
            });

            modalModifica.show();
        });
}

function salvaModificheQuiz() {
    const titoloOriginale = document.getElementById("edit_titolo_originale").value;
    const nuovoTitolo = document.getElementById("edit_titolo_nuovo").value;
    const domandeCards = document.querySelectorAll(".edit-domanda-item");
    
    let nuoveDomande = [];

    domandeCards.forEach((card, index) => {
        const testo = card.querySelector(".val-domanda").value;
        const opzioniInputs = card.querySelectorAll(".val-opzione");
        const correttaInput = card.querySelector(`input[name="correct_${index}"]:checked`);
        
        let opzioni = [];
        opzioniInputs.forEach(input => opzioni.push(input.value));

        nuoveDomande.push({
            testo: testo,
            opzioni: opzioni,
            corretta: correttaInput ? parseInt(correttaInput.value) : 0
        });
    });

    fetch("/update_quiz_full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            titolo_originale: titoloOriginale,
            nuovo_titolo: nuovoTitolo,
            domande: nuoveDomande
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        modalModifica.hide();
        caricaQuiz(); // Aggiorna la lista nella dashboard
    });
}

// Nuova funzione per gestire l'invio
function toggleSomministrazione(titolo, statoAttuale) {
    fetch("/toggle_quiz_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titolo: titolo, attivo: statoAttuale })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            caricaQuiz(); // Ricarica la lista per aggiornare i bottoni
        });
}

// Chiede conferma e rimuove il quiz dal database
function eliminaQuiz(titolo) {
    if (confirm("Sei sicuro di voler eliminare il quiz '" + titolo + "'?")) {
        fetch("/delete_quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titolo: titolo })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                caricaQuiz();
            })
    }
}

// Prepara il modulo in basso per aggiungere domande a un quiz specifico
function preparaModifica(titolo) {
    document.getElementById("quiz_nome").value = titolo;
    document.getElementById("aggiungiDomandaSection").scrollIntoView();
}