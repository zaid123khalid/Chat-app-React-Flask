from flask_socketio import SocketIO, emit, join_room, leave_room
from sqlalchemy import and_, or_
from database import Friends, FriendsMessage, User, db, Room, Message
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
        friends = Friends.query.filter(
            or_(
                Friends.user1 == current_user.username,
                Friends.user2 == current_user.username,
            )
        ).all()
        if friends is not None:
            for friend in friends:
                join_room(friend.id, sid=request.sid)
                print(f"Joined room {friend.id}")


@socket.on("leave")
def leave(data):
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
    print(message_for_db.time)
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
            "room_name": room.room_name,
            "last_message": room.last_message,
            "last_messsage_user": room.last_messsage_user,
        },
        broadcast=True,
        to=data["room_code"],
        include_self=True,
    )


@socket.on("friend_message")
def friend_message(data):
    user1 = data["user1"]
    user2 = data["user2"]

    friends = Friends.query.filter(
        or_(
            and_(Friends.user1 == user1, Friends.user2 == user2),
            and_(Friends.user1 == user2, Friends.user2 == user1),
        )
    ).first()

    message = FriendsMessage(
        friend_id=friends.id,
        msg=data["msg"],
        time=datetime.datetime.now(),
        sender=user1,
        receiver=user2,
    )
    db.session.add(message)
    db.session.commit()

    emit(
        "friend_message_received",
        {
            "id": friends.id,
            "sender": message.sender,
            "receiver": message.receiver,
            "status": friends.status,
            "msg": data["msg"],
            "time": f"{message.time}",
        },
        to=friends.id,
        include_self=True,
        broadcast=True,
    )


@socket.on("delete_message")
def delete_message(data):
    message = Message.query.filter_by(id=data["id"]).first()

    db.session.delete(message)
    db.session.commit()

    room = Room.query.filter_by(room_code=data["room_code"]).first()
    last_message = (
        Message.query.filter_by(room_id=room.id).order_by(Message.time.desc()).first()
    )

    room.last_message = last_message.msg if last_message is not None else ""
    room.last_messsage_user = last_message.username if last_message is not None else ""
    db.session.commit()
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


@socket.on("delete_room")
def delete_room(data):
    room = Room.query.filter_by(room_code=data["room_code"]).first()
    emit(
        "room_deleted",
        {
            "room_code": data["room_code"],
        },
        to=data["room_code"],
        include_self=True,
        broadcast=True,
    )

    db.session.delete(room)
    db.session.commit()


@socket.on("delete_friend_message")
def delete_friend_message(data):
    print(data)
    friends = Friends.query.filter_by(id=data["friend_id"]).first()
    message = FriendsMessage.query.filter_by(id=data["id"]).first()

    emit(
        "friend_message_deleted",
        {
            "id": data["id"],
            "status": friends.status,
        },
        to=friends.id,
        include_self=True,
        broadcast=True,
    )

    db.session.delete(message)
    db.session.commit()
