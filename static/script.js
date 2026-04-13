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

    if(!username || !password) { alert("Riempi tutti i campi!"); return; }

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
            var div = document.getElementById("risultati")
            div.innerHTML = ""

            for (var i = 0; i < data.length; i++) {
                var r = data[i]
                var card = document.createElement("div")
                card.className = "quiz_card"
                card.innerHTML =
                    "<b>Studente:</b> " + r.studente +
                    "<br>Punteggio: " + r.punteggio + " / " + r.totale
                div.appendChild(card)
            }
        })
}

// Mostra i quiz creati dal docente loggato
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
                card.innerHTML = `
                    <h4>${q.titolo}</h4>
                    <div class="btn-group">
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