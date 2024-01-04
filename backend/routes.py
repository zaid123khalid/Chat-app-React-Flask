from flask import jsonify, request, session, Blueprint
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy import text

from database import db, Room, Message, User
from utils import generate_unique_code


api = Blueprint("api", __name__)


@login_required
@api.route("/chat", methods=["GET", "POST"])
def chat():
    if not current_user.is_authenticated:
        return jsonify({"status": "User not authenticated"}), 401
    rooms = User.query.filter_by(username=current_user.username).first().rooms
    for room in rooms:
        last_message = (
            Message.query.filter_by(room_id=room.id)
            .order_by(Message.time.desc())
            .first()
        )

        if last_message is not None:
            room.last_message = last_message.msg
            room.last_messsage_user = last_message.username
            db.session.commit()

    return jsonify(
        {
            "status": "success",
            "username": current_user.username,
            "rooms": [
                {
                    "room_code": room.room_code,
                    "room_name": room.room_name,
                    "last_message": room.last_message,
                    "last_message_user": room.last_messsage_user,
                }
                for room in rooms
            ],
        }
    )


@api.route("/signup", methods=["GET", "POST"])
def signup():
    error = None
    if request.method == "POST":
        username = request.get_json()["username"]
        password = request.get_json()["password"]
        email = request.get_json()["email"]
        if User.query.filter_by(username=username).first() is not None:
            error = "Username already exists"
        elif User.query.filter_by(email=email).first() is not None:
            error = "Email already exists"
        else:
            user_for_db = User(username=username, email=email)
            user_for_db.hash_password(password)
            db.session.add(user_for_db)
            db.session.commit()
            return jsonify({"status": "success"}), 200
        return jsonify({"status": "error", "message": error}), 401
    return jsonify({"status": "Something went wrong"}), 500


@api.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        username = request.get_json()["username"]
        password = request.get_json()["password"]
        remember = request.get_json()["rememberMe"]
        user = User.query.filter_by(username=username).first()
        if user is not None and user.verify_password(password):
            login_user(user, remember=remember)
            return jsonify({"status": "success"}), 200
        else:
            error = "Incorrect username or password"

    return jsonify({"status": "error", "message": error}), 500


@login_required
@api.route("/logout", methods=["GET", "POST"])
def logout():
    logout_user()
    return jsonify({"status": "success"}), 200


@login_required
@api.route("/join_room", methods=["GET", "POST"])
def join_room():
    room_data = []
    messages_data = []
    room_code = request.get_json()["room_code"]
    username = current_user.username
    room_query = Room.query.filter_by(room_code=room_code).first()
    if username != "":
        if room_query is not None:
            session["room"] = room_code
            user = User.query.filter_by(username=username).first()
            room = Room.query.filter_by(room_code=room_code).first()

            user_in_room = db.session.execute(
                text(
                    "SELECT * FROM rooms_users WHERE user_id = :user_id AND room_id = :room_id"
                )
                .bindparams(user_id=user.id, room_id=room.id)
                .columns(db.Integer, db.Integer)
            ).fetchall()

            if user_in_room is None or user_in_room == []:
                user.rooms.append(room)
                db.session.commit()

            messages = Message.query.filter_by(room_id=room.id).all()

            room_data.clear()
            messages_data.clear()
            for message in messages:
                messages_data.append(
                    {
                        "id": message.id,
                        "username": message.username,
                        "msg": message.msg,
                        "time": message.time,
                    }
                )
            room_data.append(
                {
                    "room_code": room.room_code,
                    "room_name": room.room_name,
                    "last_message": room.last_message,
                    "last_message_user": room.last_messsage_user,
                    "admin": room.admin,
                }
            )
            return (
                jsonify(
                    {
                        "status": "success",
                        "room": room_data,
                        "messages": messages_data,
                        "username": username,
                    }
                ),
                200,
            )
        else:
            return jsonify({"status": "Room doesn't exist"}), 500
    return {"status": "Something went wrong"}, 500


@login_required
@api.route("/create_room", methods=["GET", "POST"])
def create_room():
    room_name = request.get_json()["room_name"]
    admin = request.get_json()["username"]
    room_code = generate_unique_code()
    room_for_db = Room(room_code=room_code, room_name=room_name, admin=admin)
    db.session.add(room_for_db)
    db.session.commit()
    session["room"] = room_code
    return jsonify({"status": "success", "room_code": room_code}), 200


@login_required
@api.route("/delete_message/<int:id_>", methods=["GET", "POST", "DELETE"])
def delete_message(id_):
    message = Message.query.filter_by(id=id_).first()

    if request.method == "DELETE":
        try:
            db.session.delete(message)
            db.session.commit()
            room = Room.query.filter_by(id=message.room_id).first()
            last_message = (
                Message.query.filter_by(room_id=room.id)
                .order_by(Message.time.desc())
                .first()
            )

            room.last_message = last_message.msg if last_message is not None else ""
            room.last_messsage_user = (
                last_message.username if last_message is not None else ""
            )
            db.session.commit()

            return (
                jsonify(
                    {
                        "status": "success",
                        "room_code": room.room_code,
                        "last_message": room.last_message,
                        "last_message_user": room.last_messsage_user,
                    }
                ),
                200,
            )
        except:
            db.session.rollback()

            return jsonify({"status": "error"}), 500
