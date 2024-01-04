from flask import Flask
from flask_session import Session
from flask_login import LoginManager
from flask_cors import CORS

from database import db, User
from socket_config import socket
from routes import api

app = Flask(__name__)
app.secret_key = "secret"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
socket.init_app(app)
db.init_app(app)
CORS(app)

login_manager = LoginManager(app)
login_manager.login_view = "login"


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


app.register_blueprint(api, url_prefix="/api")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socket.run(app, debug=True, host="0.0.0.0", port=5000)
