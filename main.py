from flask import Flask, render_template, request, redirect, session, url_for, flash
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.secret_key = 'secret'
socket = SocketIO(app)

clients = []


@socket.on('join')
def test_connect(data):
    clients.append(request.sid)
    print('Client connected ' + request.sid)
    print(clients)

@socket.on('disconnect')
def test_disconnect():
    clients.remove(request.sid)
    print('Client disconnected ' + request.sid)
    print(clients)


@socket.on('message')
def handle_message(message):
    print('received message: ' + message['msg'] + ' from ' + message['username'])
    emit('recieved_msg', message, broadcast=True, to=clients, include_self=False)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    if request.method == 'POST':
        name = request.form['name']
        print(name)
        session['username'] = name
        return render_template('chat.html', username=name)
    else:
        return render_template('chat.html')

if __name__ == '__main__':
    socket.run(app, debug=True, host='0.0.0.0', port=5000)