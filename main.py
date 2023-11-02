from flask import Flask, render_template, request, redirect, session, url_for
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.secret_key = 'secret'
socket = SocketIO(app)

rooms = {}

@socket.on('connect')
def connect(data):
    room_code = session['room']
    rooms[room_code]["clients"].append(request.sid)

@socket.on('disconnect')
def disconnect():
    room = session['room']
    rooms[room]["members"] -= 1
    rooms[room]["clients"].remove(request.sid)

@socket.on('message')
def handle_message(message):
    room = session['room']
    rooms[room]["messages"].append(message)
    clients = rooms[room]["clients"]
    emit('recieved_msg', message, broadcast=True, to=clients, include_self=False)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        name = request.form.get('name')
        room_code = request.form.get('room-code')
        join = request.form.get('Join', False)
        create = request.form.get('create', False)
        print(name, room_code, join, create)
        if name is None or name == '' or room_code is None or room_code == '':
            session['error'] = "All above fields are required"
            return redirect(url_for('index'))
      
        if room_code in rooms and join != False:
            rooms[room_code]["members"] += 1
            session['username'] = name
            session['room'] = room_code
            return redirect(url_for('chat'))
        
        if room_code not in rooms and create != False:
            rooms[room_code] = {"members":1, "messages":[], "clients":[]}
            session['username'] = name
            session['room'] = room_code
            return redirect(url_for('chat'))
        
        if room_code not in rooms and join != False:
            session['error'] = "Invalid room code"
            return redirect(url_for('index'))
        
        if room_code in rooms and create != False:
            session['error'] = "Room already exists"
            return redirect(url_for('index'))
        
    error = session.pop('error', None)
    return render_template('index.html', error=error)

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    usernmae = session.get('username', None)
    room = session.get('room', None)
    messages = rooms.get(room, {}).get("messages", [])
    return render_template('chat.html', username=usernmae, messages=messages)

if __name__ == '__main__':
    socket.run(app, debug=True, host='0.0.0.0', port=5000)
