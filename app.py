from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient

app = Flask(__name__)

# Connessione MongoDB
client = MongoClient("mongodb://localhost:27017")

# usa il database già creato
db = client["Quizzy"]

utenti_collection = db["utenti"]


# Pagina di ingresso (Login/Registrazione)
@app.route("/")
def home():
    return render_template("index.html")


# Registra un nuovo utente nel database
@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    username = data["username"]
    password = data["password"]
    ruolo = data["ruolo"]

    user = utenti_collection.find_one({"username": username})

    if user:
        return jsonify({"error": "Username già esistente"}), 400

    nuovo_utente = {
        "username": username,
        "password": password,
        "ruolo": ruolo
    }


    utenti_collection.insert_one(nuovo_utente)

    return jsonify({"message": "Utente registrato con successo!"})  


# Verifica credenziali e avvia sessione
@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data["username"]
    password = data["password"]

    user = utenti_collection.find_one({
        "username": username,
        "password": password
    })

    if user:

        risposta = {
            "message": "Login riuscito!",
            "ruolo": user["ruolo"],
            "username": user["username"]
        }

        if user["ruolo"] == "studente":
            risposta["professore"] = user.get("professore", "")

        return jsonify(risposta)

    else:
        return jsonify({"error": "Credenziali non valide"}), 401


# Crea un nuovo quiz vuoto (solo titolo)
@app.route("/create_quiz", methods=["POST"])
def create_quiz():

    data = request.get_json()

    titolo = data["titolo"]
    creatore = data["creatore"]

    quiz = {
        "titolo": titolo,
        "creatore": creatore,
        "domande": []
    }

    db["quiz"].insert_one(quiz)

    return jsonify({"message": "Quiz creato"})


# Aggiunge una singola domanda a un quiz esistente
@app.route("/add_question", methods=["POST"])
def add_question():

    data = request.get_json()

    titolo = data["titolo"]
    testo = data["testo"]
    opzioni = data["opzioni"]
    corretta = data["corretta"]

    domanda = {
        "testo": testo,
        "opzioni": opzioni,
        "corretta": corretta
    }

    db["quiz"].update_one(
        {"titolo": titolo},
        {"$push": {"domande": domanda}}
    )

    return jsonify({"message": "Domanda aggiunta"})


# Calcola il punteggio e salva il risultato finale
@app.route("/submit_quiz", methods=["POST"])
def submit_quiz():

    data = request.get_json()

    titolo = data["titolo"]
    risposte = data["risposte"]
    studente = data["studente"]
    professore = data["professore"]

    quiz = db["quiz"].find_one({"titolo": titolo})

    domande = quiz["domande"]

    punteggio = 0

    for i in range(len(domande)):

        if risposte[i] == domande[i]["corretta"]:
            punteggio += 1

    totale = len(domande)

    risultato = {
        "quiz": titolo,
        "studente": studente,
        "professore": professore,
        "punteggio": punteggio,
        "totale": totale
    }

    db["risultati"].insert_one(risultato)

    return jsonify({
        "punteggio": punteggio,
        "totale": totale
    })


# Elimina definitivamente un quiz e i suoi risultati
@app.route("/delete_quiz", methods=["POST"])
def delete_quiz():
    data = request.get_json()
    titolo = data["titolo"]
    
    db["quiz"].delete_one({"titolo": titolo})
    db["risultati"].delete_many({"quiz": titolo})
    
    return jsonify({"message": "Quiz eliminato con successo"})


# Controlla se uno studente ha già svolto un certo quiz
@app.route("/check_quiz_done/<quiz>/<studente>")
def check_quiz_done(quiz, studente):

    res = db["risultati"].find_one({
        "quiz": quiz,
        "studente": studente
    })

    if res:
        return jsonify({"done": True})
    else:
        return jsonify({"done": False})


# Recupera tutti i voti degli studenti per un quiz
@app.route("/get_results/<titolo>")
def get_results(titolo):

    risultati = list(db["risultati"].find(
        {"quiz": titolo},
        {"_id":0}
    ))

    return jsonify(risultati)


# Lista di tutti i quiz creati da un docente specifico
@app.route("/get_quiz_docente/<docente>")
def get_quiz_docente(docente):

    quiz = list(db["quiz"].find(
        {"creatore": docente},
        {"_id":0}
    ))

    return jsonify(quiz)


# Recupera i dati completi (domande/opzioni) di un singolo quiz
@app.route("/get_quiz/<titolo>")
def get_quiz(titolo):

    quiz = db["quiz"].find_one({"titolo": titolo}, {"_id":0})

    return jsonify(quiz)


# Lista quiz filtrata per il professore scelto dallo studente
@app.route("/get_quiz_prof/<prof>")
def get_quiz_prof(prof):

    quiz = list(db["quiz"].find({"creatore": prof}, {"_id":0}))

    return jsonify(quiz)


# Recupera l'elenco di tutti gli utenti con ruolo docente
@app.route("/get_professori")
def get_professori():

    prof = list(db["utenti"].find(
        {"ruolo": "docente"},
        {"_id": 0, "username": 1}
    ))

    return jsonify(prof)


# Carica il template della dashboard studente
@app.route("/dashboard_studente")
def dashboard_studente():
    return render_template("dashboard_studente.html")


# Carica il template della dashboard docente
@app.route("/dashboard_docente")
def dashboard_docente():
    return render_template("dashboard_docente.html")


# Carica la pagina di svolgimento del quiz
@app.route("/quiz")
def quiz_page():
    return render_template("quiz.html")


if __name__ == "__main__":
    app.run(debug=True)