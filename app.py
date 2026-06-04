from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import timedelta

##QUIZZY##
app = Flask(__name__)

# Imposta la durata a 30 minuti (o quanto preferisci)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# CHIAVE SEGRETA: Indispensabile per le sessioni
app.secret_key = os.environ.get("SECRET_KEY")

# Configurazione DB
<<<<<<< HEAD
client = MongoClient("mongodb+srv://admin:admin@cluster.pfxqbgg.mongodb.net/?appName=Cluster")
=======
client = MongoClient(os.environ.get("MONGO_URI"))
>>>>>>> 0333e3b2da690746c13efd53240e8402efdd07e2
db = client["Quizzy"]
utenti_collection = db["utenti"]

# --- ROTTE DI PAGINA ---
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dashboard_studente")
def dashboard_studente():
    if "username" not in session: return redirect(url_for("home"))
    return render_template("dashboard_studente.html")

@app.route("/dashboard_docente")
def dashboard_docente():
    if "username" not in session or session["ruolo"] != "docente": return redirect(url_for("home"))
    return render_template("dashboard_docente.html")

@app.route("/quiz")
def quiz_page():
    if "username" not in session: return redirect(url_for("home"))
    return render_template("quiz.html")

# --- AUTENTICAZIONE ---

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data["username"]
    password = data["password"]
    ruolo = data["ruolo"]

    if utenti_collection.find_one({"username": username}):
        return jsonify({"error": "Username già esistente"}), 400

    # Cifriamo la password prima di salvarla
    hashed_password = generate_password_hash(password)

    nuovo_utente = {
        "username": username,
        "password": hashed_password,
        "ruolo": ruolo
    }
    utenti_collection.insert_one(nuovo_utente)
    return jsonify({"message": "Utente registrato con successo!"})

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    user = utenti_collection.find_one({"username": username})

    if user and check_password_hash(user["password"], password):
        session.clear()
        session["username"] = user["username"]
        session["ruolo"] = user["ruolo"]
        
        risposta = {
            "message": "Login riuscito!",
            "ruolo": user["ruolo"],
            "username": user["username"]
        }
        return jsonify(risposta)
    
    return jsonify({"error": "Credenziali non valide"}), 401

@app.route("/logout")
def logout_route():
    session.clear()
    return redirect(url_for("home"))

# --- GESTIONE QUIZ (DOCENTE) ---

@app.route("/create_quiz", methods=["POST"])
def create_quiz():
    if "username" not in session or session["ruolo"] != "docente":
        return jsonify({"error": "Azione non autorizzata"}), 403

    data = request.get_json()
    quiz = {
        "titolo": data["titolo"],
        "creatore": session["username"],
        "domande": [],
        "attivo": False  # Il quiz nasce "chiuso"
    }
    db["quiz"].insert_one(quiz)
    return jsonify({"message": "Quiz creato (non ancora visibile agli studenti)"})

@app.route("/toggle_quiz_status", methods=["POST"])
def toggle_quiz_status():
    if "username" not in session or session["ruolo"] != "docente":
        return jsonify({"error": "Non autorizzato"}), 403
    
    data = request.get_json()
    titolo = data["titolo"]
    stato_attuale = data["attivo"]
    
    # Invertiamo lo stato
    nuovo_stato = not stato_attuale
    db["quiz"].update_one({"titolo": titolo}, {"$set": {"attivo": nuovo_stato}})
    
    msg = "Quiz somministrato agli studenti" if nuovo_stato else "Quiz rimosso dalla vista studenti"
    return jsonify({"message": msg, "nuovo_stato": nuovo_stato})

@app.route("/add_question", methods=["POST"])
def add_question():
    if "username" not in session or session["ruolo"] != "docente":
        return jsonify({"error": "Azione non autorizzata"}), 403

    data = request.get_json()
    domanda = {
        "testo": data["testo"],
        "opzioni": data["opzioni"],
        "corretta": data["corretta"]
    }
    db["quiz"].update_one({"titolo": data["titolo"]}, {"$push": {"domande": domanda}})
    return jsonify({"message": "Domanda aggiunta"})

@app.route("/delete_quiz", methods=["POST"])
def delete_quiz():
    if "username" not in session or session["ruolo"] != "docente":
        return jsonify({"error": "Non autorizzato"}), 403
    
    data = request.get_json()
    titolo = data["titolo"]
    db["quiz"].delete_one({"titolo": titolo})
    db["risultati"].delete_many({"quiz": titolo})
    return jsonify({"message": "Quiz eliminato con successo"})


@app.route("/update_quiz_full", methods=["POST"])
def update_quiz_full():
    if "username" not in session or session["ruolo"] != "docente":
        return jsonify({"error": "Non autorizzato"}), 403
    
    data = request.get_json()
    titolo_originale = data["titolo_originale"]
    nuovo_titolo = data["nuovo_titolo"]
    nuove_domande = data["domande"]

    # 1. Aggiorna il quiz (Titolo e Domande)
    db["quiz"].update_one(
        {"titolo": titolo_originale},
        {"$set": {"titolo": nuovo_titolo, "domande": nuove_domande}}
    )
    
    # 2. Se il titolo è cambiato, aggiorna i riferimenti nei risultati
    if titolo_originale != nuovo_titolo:
        db["risultati"].update_many({"quiz": titolo_originale}, {"$set": {"quiz": nuovo_titolo}})
    
    return jsonify({"message": "Quiz aggiornato con successo!"})

# --- SVOLGIMENTO E RISULTATI (STUDENTE/DOCENTE) ---

@app.route("/submit_quiz", methods=["POST"])
def submit_quiz():
    if "username" not in session: return jsonify({"error": "Sessione scaduta"}), 401
    
    data = request.get_json()
    quiz = db["quiz"].find_one({"titolo": data["titolo"]})
    domande = quiz["domande"]

    punteggio = 0
    for i in range(len(domande)):
        if i < len(data["risposte"]) and data["risposte"][i] == domande[i]["corretta"]:
            punteggio += 1

    voto = round((punteggio * 10) / len(domande), 2) if len(domande) > 0 else 0
    
    risultato = {
        "quiz": data["titolo"],
        "studente": session["username"], # Sicurezza: usa sessione, non localStorage
        "professore": quiz["creatore"],
        "punteggio": punteggio,
        "totale": len(domande),
        "voto": voto
    }
    db["risultati"].insert_one(risultato)
    return jsonify({"punteggio": punteggio, "totale": len(domande), "voto": voto})

# Esempio di come dovresti filtrare nella rotta che usa lo studente
@app.route("/get_available_quizzes")
def get_available_quizzes():
    # Trova solo i quiz dove attivo è True
    quiz_pubblici = list(db["quiz"].find({"attivo": True}, {"_id": 0, "titolo": 1, "creatore": 1}))
    return jsonify(quiz_pubblici)

@app.route("/get_student_stats/<studente>")
def get_student_stats(studente):
    stats = list(db["risultati"].find({"studente": studente}, {"_id": 0, "quiz": 1, "voto": 1}))
    return jsonify(stats)

@app.route("/check_quiz_done/<quiz>/<studente>")
def check_quiz_done(quiz, studente):
    res = db["risultati"].find_one({"quiz": quiz, "studente": studente})
    return jsonify({"done": bool(res)})

@app.route("/get_results/<titolo>")
def get_results(titolo):
    risultati = list(db["risultati"].find({"quiz": titolo}, {"_id":0}))
    return jsonify(risultati)

@app.route("/get_quiz_docente/<docente>")
def get_quiz_docente(docente):
    quiz = list(db["quiz"].find({"creatore": docente}, {"_id":0}))
    return jsonify(quiz)

@app.route("/get_quiz/<titolo>")
def get_quiz(titolo):
    quiz = db["quiz"].find_one({"titolo": titolo}, {"_id":0})
    return jsonify(quiz)

@app.route("/get_quiz_prof/<prof>")
def get_quiz_prof(prof):
    # Filtriamo: cerchiamo i quiz di quel professore MA solo se 'attivo' è True
    quiz_attivi = list(db["quiz"].find({"creatore": prof, "attivo": True}, {"_id": 0}))
    return jsonify(quiz_attivi)

@app.route("/get_professori")
def get_professori():
    prof = list(db["utenti"].find({"ruolo": "docente"}, {"_id": 0, "username": 1}))
    return jsonify(prof)

if __name__ == "__main__":
    app.run()