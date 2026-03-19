function register() {

    var username = document.getElementById("reg_username").value
    var password = document.getElementById("reg_password").value
    var ruolo = document.getElementById("reg_ruolo").value

    fetch("/register", {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username: username,
            password: password,
            ruolo: ruolo,
        })

    })
        .then(response => response.json())
        .then(data => {

            document.getElementById("message").innerText =
                data.message || data.error

        })

}


function login() {

    var username = document.getElementById("login_username").value
    var password = document.getElementById("login_password").value

    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(response => response.json())
        .then(data => {

            if (data.message) {

                localStorage.setItem("username", data.username)
                localStorage.setItem("ruolo", data.ruolo)

                if (data.professore) {
                    localStorage.setItem("professore", data.professore)
                }

                if (data.ruolo === "studente") {
                    window.location.href = "/dashboard_studente"
                } else {
                    window.location.href = "/dashboard_docente"
                }

            } else {
                document.getElementById("message").innerText = data.error
            }

        })
}

function createQuiz() {

    var titolo = document.getElementById("titolo_quiz").value
    var creatore = localStorage.getItem("username")

    fetch("/create_quiz", {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            titolo: titolo,
            creatore: creatore
        })

    })
    .then(response => response.json())
    .then(data => {

        document.getElementById("msg").innerText = data.message

        // aggiorna lista quiz subito
        caricaQuiz()

    })

}

function addQuestion() {

    var titolo = document.getElementById("quiz_nome").value
    var domanda = document.getElementById("domanda").value

    var op1 = document.getElementById("op1").value
    var op2 = document.getElementById("op2").value
    var op3 = document.getElementById("op3").value

    var corretta = parseInt(document.getElementById("corretta").value)

    fetch("/add_question", {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({

            titolo: titolo,
            testo: domanda,
            opzioni: [op1, op2, op3],
            corretta: corretta

        })

    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("msg").innerText = data.message
        })

}

function startQuiz(titolo) {

    localStorage.setItem("quiz", titolo)

    window.location.href = "/quiz"

}

function submitQuiz() {

    var titolo = localStorage.getItem("quiz")
    var studente = localStorage.getItem("username")
    var professore = localStorage.getItem("professore")

    var risposte = []

    var i = 0

    while (document.getElementsByName("q" + i).length > 0) {

        var radios = document.getElementsByName("q" + i)

        for (var j = 0; j < radios.length; j++) {

            if (radios[j].checked) {
                risposte.push(parseInt(radios[j].value))
            }

        }

        i++

    }

    fetch("/submit_quiz", {

        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            titolo: titolo,
            risposte: risposte,
            studente: studente,
            professore: professore

        })

    })
        .then(res => res.json())
        .then(data => {

            document.getElementById("result").innerText =
                "Punteggio: " + data.punteggio + " / " + data.totale

        })

}

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

    function caricaQuiz(){

    var docente = localStorage.getItem("username")

    fetch("/get_quiz_docente/"+docente)
    .then(res=>res.json())
    .then(data=>{

        var div=document.getElementById("quiz_docente")

        div.innerHTML=""

        for(var i=0;i<data.length;i++){

            var q=data[i]

            var card=document.createElement("div")
            card.className="quiz_card"

            card.innerHTML=
            "<h3>"+q.titolo+"</h3>"+
            "<button onclick='vediRisultati(\""+q.titolo+"\")'>Vedi risultati</button>"

            div.appendChild(card)

        }

    })

}

