from flask import Flask
from flask_login import LoginManager

from database import db, User
from socket_config import socket
from routes import main

app = Flask(__name__)
app.secret_key = 'secret'
socket.init_app(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db.init_app(app)

login_manager=LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

app.register_blueprint(main)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socket.run(app, debug=True, host='0.0.0.0', port=5000)
