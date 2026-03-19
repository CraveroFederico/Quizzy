from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient

app = Flask(__name__)

# Connessione MongoDB
client = MongoClient("mongodb://localhost:27017")

# usa il database già creato
db = client["Quizzy"]

utenti_collection = db["utenti"]


@app.route("/")
def home():
    return render_template("index.html")


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

@app.route("/get_results/<titolo>")
def get_results(titolo):

    risultati = list(db["risultati"].find(
        {"quiz": titolo},
        {"_id":0}
    ))

    return jsonify(risultati)

@app.route("/get_quiz_docente/<docente>")
def get_quiz_docente(docente):

    quiz = list(db["quiz"].find(
        {"creatore": docente},
        {"_id":0}
    ))

    return jsonify(quiz)

@app.route("/get_quiz/<titolo>")
def get_quiz(titolo):

    quiz = db["quiz"].find_one({"titolo": titolo}, {"_id":0})

    return jsonify(quiz)

@app.route("/get_quiz_prof/<prof>")
def get_quiz_prof(prof):

    quiz = list(db["quiz"].find({"creatore": prof}, {"_id":0}))

    return jsonify(quiz)

@app.route("/get_professori")
def get_professori():

    prof = list(db["utenti"].find(
        {"ruolo": "docente"},
        {"_id": 0, "username": 1}
    ))

    return jsonify(prof)

@app.route("/dashboard_studente")
def dashboard_studente():
    return render_template("dashboard_studente.html")


@app.route("/dashboard_docente")
def dashboard_docente():
    return render_template("dashboard_docente.html")

@app.route("/quiz")
def quiz_page():
    return render_template("quiz.html")


if __name__ == "__main__":
    app.run(debug=True) 