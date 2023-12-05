from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, emit, join_room, send, leave_room, close_room
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = 'secret'
socket = SocketIO(app)

# Database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)

# Database models
class Room(db.Model):
    __tablename__ = 'room'
    id = db.Column(db.Integer, primary_key=True)
    room_code = db.Column(db.String(10), nullable=False)
    messages = db.relationship('Message', backref='room', lazy=True)


class Message(db.Model):
    __tablename__ = 'message'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False)
    msg = db.Column(db.String(200), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=False)

rooms = {}

# SocketIO events
# Joining the room
@socket.on('join')
def join(data):
    join_room(data['room_code'], sid=request.sid)
    send({"username": data['username'],"msg": "has joined the room", "status": "joined"}, broadcast=True, to=data["room_code"], include_self=False)
    rooms[data['room_code']]["members"] += 1
    print(rooms)

# Leaving the room
@socket.on('leave')
def leave(data):
    send({"username": data['username'],"msg": "has left the room", "status": "left"}, broadcast=True, to=data['room_code'], include_self=False)
    leave_room(data['room_code'], sid=request.sid)
    rooms[data['room_code']]["members"] -= 1
    # Closing room if no members are left
    if rooms[data['room_code']]["members"] == 0:
        close_room(data['room_code'])
        del rooms[data['room_code']]

# Sending message
@socket.on('message')
def handle_message(data):
    message = {"username": data['username'], "msg": data['msg']}
    rooms[data['room_code']]["messages"].append(message)
    emit('recieved_msg', message, broadcast=True, to=data['room_code'], include_self=False)
    room = Room.query.filter_by(room_code=data['room_code']).first()
    message_for_db = Message(username=data['username'], msg=data['msg'], room=room)
    db.session.add(message_for_db)
    db.session.commit()

# Flask routes
# Index page
@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

# Chat page
@app.route('/chat', methods=['GET','POST'])
def chat():
    username = session.get('username', None)
    room = session.get('room', None)
    messages = Message.query.filter_by(room_id=Room.query.filter_by(room_code=room).first().id).all()
    return render_template('chat.html', username=username, messages=messages, room=room)

# Sending and recieving requests and responses for joining room
@app.route('/join_room', methods=['GET','POST'])
def join_room_():
    room = request.get_json()['room_code']
    username = request.get_json()['username']

    room_query = Room.query.filter_by(room_code=room).first()
    print(room_query)
    if username != "":
        if room_query is not None:
            # Joining room if it exists
            session['username'] = username
            session['room'] = room
            # Creating room in rooms dictionary for tracking members and messages
            if room not in rooms:
                rooms[room] = {"members":0, "messages":[]}
            return {"status": "success"}, 200
        else:
            # Creating room if it doesn't exist
            session['username'] = username
            session['room'] = room
            # Creating room in rooms dictionary for tracking members and messages
            if room not in rooms:
                rooms[room] = {"members":0, "messages":[]}
            # Adding room to database
            room_for_db = Room(room_code=room)
            db.session.add(room_for_db)
            db.session.commit()
            return {"status": "success"}, 200
    return {"status": "Something went wrong"}, 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socket.run(app, debug=True, host='0.0.0.0', port=5000)
