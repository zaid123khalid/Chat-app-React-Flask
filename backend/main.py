from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import db
from socket_config import socket
from routes import api
import pymysql


def create_mysql_connection():
    """
    Creates a MySQL connection and creates a database named 'chatapp' if it doesn't exist.
    """
    conn = pymysql.connections.Connection(
        host="localhost",
        user="root",
        password="root",
        port=3309,
        database="",
    )
    cursor = conn.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS chatapp")
    conn.commit()


# Create Flask app and add configurations, blueprints, and extensions
app = Flask(__name__)
app.secret_key = "secret"
app.config["SQLALCHEMY_DATABASE_URI"] = (
    "mysql+pymysql://root:root@localhost:3309/chatapp?charset=utf8mb4"
)
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "connect_args": {"init_command": "SET @@collation_connection='utf8mb4_general_ci'"}
}
socket.init_app(app)
db.init_app(app)
CORS(app)
jwt = JWTManager(app)

app.register_blueprint(api, url_prefix="/api")

if __name__ == "__main__":
    create_mysql_connection()
    with app.app_context():
        db.create_all()
    socket.run(app, debug=True, host="0.0.0.0", port=5000)
