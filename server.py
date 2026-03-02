from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Quizzy server attivo!"

if __name__ == "__main__":
    app.run(debug=True)