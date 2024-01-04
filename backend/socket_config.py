from flask_socketio import SocketIO, emit, join_room, leave_room
from database import User, db, Room, Message
from flask import request
from flask_login import current_user
import datetime

socket = SocketIO(
    cors_allowed_origins="*",
)


@socket.on("connect")
def connect():
    if current_user.is_authenticated:
        user_rooms = User.query.filter_by(username=current_user.username).first().rooms
        for room in user_rooms:
            join_room(room.room_code, sid=request.sid)


@socket.on("join_room")
def join_room__(data):
    rooms = User.query.filter_by(username=data["username"]).first().rooms
    for room in rooms:
        join_room(room.room_code, sid=request.sid)


@socket.on("leave")
def leave(data):
    emit(
        "user_left",
        {"username": data["username"]},
        to=data["room_code"],
        include_self=False,
    )
    leave_room(data["room_code"], sid=request.sid)

    user = User.query.filter_by(username=data["username"]).first()
    room = Room.query.filter_by(room_code=data["room_code"]).first()
    user.rooms.remove(room)
    db.session.commit()


@socket.on("message")
def handle_message(data):
    room = Room.query.filter_by(room_code=data["room_code"]).first()
    message_for_db = Message(
        username=data["username"],
        msg=data["msg"],
        room=room,
        time=datetime.datetime.now(),
    )
    db.session.add(message_for_db)
    db.session.commit()

    room.last_message = data["msg"]
    room.last_messsage_user = data["username"]
    db.session.commit()
    emit(
        "recieved_msg",
        {
            "id": message_for_db.id,
            "room_code": room.room_code,
            "msg": data["msg"],
            "username": data["username"],
            "time": f"{message_for_db.time}",
        },
        broadcast=True,
        to=data["room_code"],
        include_self=True,
    )
    emit(
        "latest_message",
        {
            "id": message_for_db.id,
            "room_code": room.room_code,
            "room_name": room.room_name,
            "last_message": room.last_message,
            "last_messsage_user": room.last_messsage_user,
        },
        to=data["room_code"],
        include_self=True,
        broadcast=True,
    )


@socket.on("delete_message")
def delete_message(data):
    room = Room.query.filter_by(room_code=data["room_code"]).first()
    emit(
        "message_deleted",
        {
            "id": data["id"],
            "room_name": room.room_name,
            "room_code": room.room_code,
            "last_message": room.last_message,
            "last_message_user": room.last_messsage_user,
        },
        to=data["room_code"],
        include_self=True,
        broadcast=True,
    )
