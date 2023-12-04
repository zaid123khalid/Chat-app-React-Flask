from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, emit, join_room, send, leave_room, close_room

app = Flask(__name__)
app.secret_key = 'secret'
socket = SocketIO(app)

rooms = {}

# SocketIO events
# Joining the room
@socket.on('join')
def join(data):
    join_room(data['room_code'], sid=request.sid)
    send({"username": data['username'],"msg": "has joined the room", "status": "joined"}, broadcast=True, to=data["room_code"], include_self=False)
    rooms[data['room_code']]["members"] += 1

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
    messages = rooms.get(room, {}).get("messages", [])
    return render_template('chat.html', username=username, messages=messages, room=room)

# Sending and recieving requests and responses for joining room
@app.route('/join_room', methods=['GET','POST'])
def join_room_():
    room = request.get_json()['room_code']
    username = request.get_json()['username']
    if room in rooms and username != '':
        messages = rooms.get(room, {}).get("messages", [])
        session['username'] = username
        session['room'] = room
        return {"status": "success", "messages": messages}, 200
    if username == '' or room not in rooms:
        return {"status": "Invalid room code or username"}, 400
    if room not in rooms:
        return {"status": "Invalid room code"}, 400
    return {"status": "Something went wrong"}, 500

# Sending and recieving requests and responses for creating room
@app.route('/create_room', methods=['GET','POST'])
def create_room_():
    room = request.get_json()['room_code']
    username = request.get_json()['username']
    if room in rooms:
        return {"status": "Room already exists"}, 400
    if room is None or username == '':
        return {"status": "Invalid room code or username"}, 400
    if room not in rooms:
        rooms[room] = {"members":0, "messages":[]}
        session['username'] = username
        session['room'] = room
        return {"status": "success"}, 200
    return {"status": "Something went wrong"}, 500

if __name__ == '__main__':
    socket.run(app, debug=True, host='0.0.0.0', port=5000)
