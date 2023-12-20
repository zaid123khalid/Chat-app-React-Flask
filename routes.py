from flask import jsonify, redirect, url_for, render_template, request, session, Blueprint
from flask_login import login_user, logout_user, login_required, current_user
from passlib.hash import pbkdf2_sha256
from sqlalchemy import text

from database import db, Room, Message, User
from utils import generate_unique_code


main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

@login_required
@main.route('/chat', methods=['GET', 'POST'])
def chat():
    if not current_user.is_authenticated:
        return redirect(url_for('main.login'))
    rooms = User.query.filter_by(username=current_user.username).first().rooms
    for room in rooms:
        last_message = Message.query.filter_by(room_id=room.id).order_by(Message.time.desc()).first()

        if last_message is not None:
            room.last_message = last_message.msg
            room.last_messsage_user = last_message.username
            db.session.commit()

    return render_template('chat.html', username=current_user.username, rooms=rooms)

@main.route('/signup', methods=['GET', 'POST'])
def signup():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email')
        if User.query.filter_by(username=username).first() is not None:
            error = 'Username already exists'
        elif User.query.filter_by(email=email).first() is not None:
            error = 'Email already exists'
        else:
            user_for_db = User(username=username, email=email)
            user_for_db.hash_password(password)
            db.session.add(user_for_db)
            db.session.commit()
            return redirect(url_for('main.login'))
    return render_template('signup.html', error=error)

@main.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember')
        user = User.query.filter_by(username=username).first()
        if user is not None and user.verify_password(password):
                login_user(user, remember=remember)
                return redirect(url_for('main.chat'))
        else:
            error = "Incorrect username or password"
            
    return render_template('login.html', error = error)

@login_required
@main.route('/logout', methods=['GET', 'POST'])
def logout():
    logout_user()
    return redirect(url_for('main.login'))


@login_required
@main.route('/join_room', methods=['GET', 'POST'])
def join_room_():
    room_data = []
    messages_data = []
    room = request.get_json()['room_code']
    username = current_user.username
    room_query = Room.query.filter_by(room_code=room).first()
    if username != "":
        if room_query is not None:
            session['room'] = room
            user = User.query.filter_by(username=username).first()
            room_ = Room.query.filter_by(room_code=room).first()

            user_in_room = db.session.execute(
                text("SELECT * FROM rooms_users WHERE user_id = :user_id AND room_id = :room_id").
                bindparams(user_id=user.id, room_id=room_.id).
                columns(db.Integer, db.Integer)
            ).fetchall()

            if user_in_room is None or user_in_room == []:
                user.rooms.append(room_)
                db.session.commit()

            messages = Message.query.filter_by(room_id=room_.id).all()
           
            room_data.clear()
            messages_data.clear()
            for message in messages:
                messages_data.append({'username': message.username, 'msg': message.msg, 'time': message.time})

            room_data.append({'room_code': room_.room_code, 'room_name': room_.room_name, 'last_message': room_.last_message, 'last_message_user': room_.last_messsage_user})
            return jsonify({"status": "success", "room": room_data, "messages": messages_data}), 200
        else:
            return jsonify({"status": "Room doesn't exist"}), 500
    return {"status": "Something went wrong"}, 500



@main.route('/create_room', methods=['GET', 'POST'])
def create_room():
    room_name = request.get_json()['room_name']
    room_code = generate_unique_code()
    room_for_db = Room(room_code=room_code,room_name=room_name)
    db.session.add(room_for_db)
    db.session.commit()
    session['room'] = room_code
    return jsonify({"status": "success", "Room Code":room_code}), 200
