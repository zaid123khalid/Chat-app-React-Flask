from flask_jwt_extended import decode_token
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from sqlalchemy import or_, text
from database import FriendRequest, Friends, FriendsMessage, User, db, Room, Message
from flask import request
import datetime
import time
import traceback


socket = SocketIO(cors_allowed_origins="*")

current_users = {}


@socket.on("connect")
def connect():
    token = decode_token(request.args.get("token"))
    current_userId = token["sub"]
    user = User.query.filter_by(id=current_userId).first()
    if current_userId is not None:
        user_rooms = user.rooms
        for room in user_rooms:
            join_room(room.room_code, sid=request.sid)
        friends = Friends.query.filter(
            or_(
                Friends.user1 == current_userId,
                Friends.user2 == current_userId,
            )
        ).all()
        if friends is not None:
            for friend in friends:
                join_room(friend.id, sid=request.sid)
    current_users[user.username] = request.sid


@socket.on("join")
def join(data):
    join_room(data["room_code"], sid=request.sid)
    user = User.query.filter_by(username=data["username"]).first()
    room = Room.query.filter_by(room_code=data["room_code"]).first()
    user.rooms.append(room)
    db.session.commit()


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
        sender=User.query.filter_by(username=data["username"]).first().id,
        msg=data["msg"],
        room=room,
        time=datetime.datetime.now(),
    )
    message_for_db.commit_to_db()
    room.last_message = data["msg"]
    room.last_message_user = data["username"]
    db.session.commit()
    emit(
        "recieved_msg",
        {
            "id": message_for_db.id,
            "room_code": room.room_code,
            "msg": data["msg"],
            "sender": data["username"],
            "time": f"{message_for_db.time.strftime('%a-%b-%y %I:%M')} {message_for_db.time.strftime('%p')}",
            "room_name": room.room_name,
            "last_message": room.last_message,
            "last_message_user": room.last_message_user,
        },
        broadcast=True,
        to=data["room_code"],
        include_self=True,
    )


@socket.on("friend_message")
def friend_message(data):
    friends = Friends.query.filter_by(id=data["friend_id"]).first()

    message = FriendsMessage(
        friend_id=friends.id,
        msg=data["msg"],
        time=datetime.datetime.now(),
        sender=User.query.filter_by(username=data["user1"]).first().id,
        receiver=User.query.filter_by(username=data["user2"]).first().id,
    )
    message.commit_to_db()

    friends.last_message = data["msg"]
    friends.last_message_user = data["user1"]
    db.session.commit()
    emit(
        "friend_message_received",
        {
            "id": message.id,
            "friend_id": friends.id,
            "sender": User.query.filter_by(id=message.sender).first().username,
            "receiver": User.query.filter_by(id=message.receiver).first().username,
            "status": friends.status,
            "msg": data["msg"],
            "time": f"{message.time.strftime('%b-%y %I:%M')} {message.time.strftime('%p')}",
            "last_message": friends.last_message,
            "last_message_user": friends.last_message_user,
        },
        to=friends.id,
        include_self=True,
        broadcast=True,
    )


@socket.on("delete_message")
def delete_message(data):
    message = Message.query.filter_by(id=data["id"]).first()

    message.delete_from_db()

    room = Room.query.filter_by(room_code=data["room_code"]).first()

    last_message = (
        Message.query.filter_by(room_id=room.id).order_by(Message.time.desc()).first()
    )
    db.session.execute(
        text(
            "UPDATE room SET last_message = :last_message, last_message_user = :last_message_user WHERE room_code = :room_code"
        )
        .bindparams(
            last_message=last_message.msg if last_message is not None else None,
            last_message_user=(
                User.query.filter_by(id=last_message.sender).first().username
                if last_message is not None
                else None
            ),
            room_code=room.room_code,
        )
        .execution_options(autocommit=True)
    )
    db.session.commit()
    emit(
        "message_deleted",
        {
            "id": data["id"],
            "room_name": room.room_name,
            "room_code": room.room_code,
            "last_message": room.last_message,
            "last_message_user": room.last_message_user,
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
    room.delete_from_db()


@socket.on("delete_friend_message")
def delete_friend_message(data):
    friends = Friends.query.filter_by(id=data["friend_id"]).first()
    message = FriendsMessage.query.filter_by(id=data["id"]).first()

    message.delete_from_db()

    last_message = (
        FriendsMessage.query.filter_by(friend_id=friends.id)
        .order_by(FriendsMessage.time.desc())
        .first()
    )

    db.session.execute(
        text(
            "UPDATE friends SET last_message = :last_message, last_message_user = :last_message_user WHERE id = :id"
        ).bindparams(
            last_message=last_message.msg if last_message is not None else None,
            last_message_user=(
                User.query.filter_by(id=last_message.sender).first().username
                if last_message is not None
                else None
            ),
            id=friends.id,
        )
    )
    db.session.commit()

    emit(
        "friend_message_deleted",
        {
            "id": data["id"],
            "friend_id": data["friend_id"],
            "last_message": friends.last_message,
            "last_message_user": friends.last_message_user,
            "status": friends.status,
        },
        to=friends.id,
        include_self=True,
        broadcast=True,
    )


@socket.on("friend_request_sent")
def friend_request_sent(data):
    friend_request = FriendRequest.query.filter_by(
        sender=User.query.filter_by(username=data["user1"]).first().id,
        receiver=User.query.filter_by(username=data["user2"]).first().id,
    ).first()
    if data["user2"] in current_users:
        emit(
            "friend_request_received",
            friend_request.to_dict(),
            to=current_users[data["user2"]],
        )


@socket.on("friend_request_accepted")
def friend_request_accepted(data):
    friend = Friends.query.filter_by(id=data["friend_id"]).first()
    user1_username = User.query.filter_by(id=friend.user1).first().username
    user2_username = User.query.filter_by(id=friend.user2).first().username
    if user1_username in current_users:
        join_room(friend.id, sid=current_users[user1_username])
        emit(
            "friend_request_accepted",
            friend.to_dict(),
            to=current_users[user1_username],
        )
    if user2_username in current_users:
        join_room(friend.id, sid=current_users[user2_username])
        emit(
            "friend_request_accepted",
            friend.to_dict(),
            to=current_users[user2_username],
        )
