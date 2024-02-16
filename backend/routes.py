import datetime
from flask import jsonify, request, Blueprint
from sqlalchemy import text, or_, and_
from flask_jwt_extended import (
    create_access_token,
    decode_token,
    jwt_required,
    get_jwt_identity,
)
from flask_socketio import emit, join_room, leave_room, rooms

from database import Friends, db, Room, User, AccessToken, FriendRequest
from utils import generate_unique_code, validate_token


api = Blueprint("api", __name__)


@api.route("/chat", methods=["GET", "POST"])
@validate_token
@jwt_required()
def chat():
    """
    Get all the rooms and friends of the current user
    """
    current_userId = get_jwt_identity()
    user = User.query.filter_by(id=current_userId).first()
    if request.method == "GET":
        friends = Friends.query.filter(
            or_(
                Friends.user1 == current_userId,
                Friends.user2 == current_userId,
            ),
            and_(Friends.status == "accepted"),
        ).all()
        friends_request = FriendRequest.query.filter(
            FriendRequest.receiver == current_userId
        ).all()
        rooms = user.rooms
        return (
            jsonify(
                {
                    "status": "success",
                    "rooms": [room.to_dict() for room in rooms],
                    "friends": [friend.to_dict() for friend in friends],
                    "friends_request": [
                        friend_request.to_dict() for friend_request in friends_request
                    ],
                }
            ),
            200,
        )
    return jsonify({"status": "Something went wrong"}), 500


@api.route("/signup", methods=["GET", "POST"])
def signup():
    """
    Signup the user.
    """
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
            user_for_db.commit_to_db()
            return jsonify({"status": "success"}), 200
        return jsonify({"status": "error", "message": error}), 500
    return jsonify({"status": "error", "message": "Something went wrong"}), 500


@api.route("/login", methods=["GET", "POST"])
def login():
    """
    Login the user.
    """
    error = None
    if request.method == "POST":
        username = request.get_json()["username"]
        password = request.get_json()["password"]
        remember = request.get_json()["rememberMe"]
        user = User.query.filter_by(username=username).first()
        if user is not None:
            if user.verify_password(password):
                access_token = create_access_token(
                    identity=user.id,
                    fresh=True,
                    expires_delta=(
                        datetime.timedelta(days=365)
                        if remember
                        else datetime.timedelta(days=1)
                    ),
                )
                AccessToken(
                    token=access_token,
                    user_id=user.id,
                    created_at=datetime.datetime.now(),
                    expired_at=(
                        datetime.datetime.now() + datetime.timedelta(days=365)
                        if remember
                        else datetime.datetime.now() + datetime.timedelta(days=1)
                    ),
                ).commit_to_db()
                return (
                    jsonify(
                        {
                            "status": "success",
                            "token": access_token,
                            "username": user.username,
                        }
                    ),
                    200,
                )
            else:
                error = "Invalid password"
        else:
            error = "Invalid username"

    return jsonify({"status": "error", "message": error}), 500


@api.route("/logout", methods=["GET", "POST"])
@validate_token
@jwt_required()
def logout():
    """
    Logout the user.
    """
    token = request.headers.get("Authorization").split(" ")[1]
    AccessToken.query.filter_by(token=token).first().revoked = True
    db.session.commit()
    return jsonify({"status": "success"}), 200


@api.route("/verify", methods=["GET", "POST"])
@validate_token
@jwt_required()
def verify():
    """
    Verify if the token is valid
    """
    return jsonify({"status": "success"}), 200


@api.route("/join_room", methods=["GET", "POST"])
@validate_token
@jwt_required()
def join_room():
    """
    Join the room.
    It will return the room and its messages to the user if the room exists.
    """
    current_userId = get_jwt_identity()
    room_code = request.get_json()["room_code"]
    room_query = Room.query.filter_by(room_code=room_code).first()
    if current_userId != "" and room_query is not None:
        user = User.query.filter_by(id=current_userId).first()
        user_in_room = db.session.execute(
            text(
                "SELECT * FROM rooms_users WHERE user_id = :user_id AND room_id = :room_id"
            )
            .bindparams(user_id=user.id, room_id=room_query.id)
            .columns(db.Integer, db.Integer)
        ).fetchall()

        if user_in_room is None or user_in_room == []:
            user.rooms.append(room_query)
            db.session.commit()

        return (
            jsonify({"room": room_query.to_dict(), "status": "success"}),
            200,
        )
    return {"status": "Something went wrong"}, 500


@api.route("/create_room", methods=["GET", "POST"])
@validate_token
@jwt_required()
def create_room():
    """
    Create a new room.
    """
    room_name = request.get_json()["room_name"]
    admin = get_jwt_identity()
    room_code = generate_unique_code()
    Room(room_code=room_code, room_name=room_name, admin=admin).commit_to_db()

    return jsonify({"status": "success", "room_code": room_code}), 200


@api.route("/join_friend", methods=["GET", "POST"])
@validate_token
@jwt_required()
def join_friend():
    """
    Join the friend.
    It will return the friend and messages to the user if the friend exists.
    """
    friend = Friends.query.filter_by(id=request.get_json()["friend_id"]).first()
    if friend is not None:
        return jsonify({"status": "success", "friend": friend.to_dict()}), 200
    return {"status": "Something went wrong"}, 500


@api.route("/send_friend_request", methods=["GET", "POST"])
@validate_token
@jwt_required()
def send_friend_request():
    """
    Send a friend request to the user.
    """
    current_userId = get_jwt_identity()
    receiver = User.query.filter_by(username=request.get_json()["receiver"]).first().id
    if request.method == "POST":
        friend_request = FriendRequest.query.filter_by(
            sender=current_userId, receiver=receiver
        ).first()
        if friend_request is None:
            friend_request = FriendRequest(sender=current_userId, receiver=receiver)
            friend_request.commit_to_db()
            return (
                jsonify(
                    {"status": "success", "friend_request": friend_request.to_dict()}
                ),
                200,
            )
        else:
            return (
                jsonify({"status": "error", "message": "Friend request already sent"}),
                500,
            )

    return {"status": "Something went wrong"}, 500


@api.route("/accept_friend_request", methods=["GET", "POST"])
@validate_token
@jwt_required()
def accept_friend_request():
    """
    Accept the friend request.
    """
    current_userId = get_jwt_identity()
    friend_request = FriendRequest.query.filter_by(
        id=request.get_json()["friend_request_id"]
    ).first()
    friend_request.delete_from_db()
    friend = Friends(
        user1=current_userId, user2=friend_request.sender, status="accepted"
    )
    friend.commit_to_db()
    return jsonify({"status": "success", "friend": friend.to_dict()}), 200
