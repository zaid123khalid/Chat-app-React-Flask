from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from database import User, db, Room, Message
from flask import request
import datetime


socket = SocketIO()

@socket.on('join')
def join(data):
    join_room(data['room_code'], sid=request.sid)

@socket.on('leave')
def leave(data):
    leave_room(data['room_code'], sid=request.sid)

    user = User.query.filter_by(username=data['username']).first()
    room = Room.query.filter_by(room_code=data['room_code']).first()
    user.rooms.remove(room)
    db.session.commit()

@socket.on('message')
def handle_message(data):
    message = {"username": data['username'], "msg": data['msg']}
    try:
        emit('recieved_msg', message, broadcast=True, to=data['room_code'], include_self=False)
        room = Room.query.filter_by(room_code=data['room_code']).first()
        
        message_for_db = Message(username=data['username'], msg=data['msg'], room=room, time=datetime.datetime.now())
        db.session.add(message_for_db)
        db.session.commit()
    
        room.last_message = data['msg']
        room.last_messsage_user = data['username']
        db.session.commit()
        msg = {
            "room_code": data['room_code'], 
            "last_message": room.last_message,
            "last_message_user": room.last_messsage_user,
        }
        emit('latest_msg', msg, to=data['room_code'], include_self=True)
    except Exception as e:
        emit('error', {"error": "Something went wrong"}, to=request.sid)