from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from passlib.hash import pbkdf2_sha256

db = SQLAlchemy()


# association table
rooms_users = db.Table(
    "rooms_users",
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), primary_key=True),
    db.Column("room_id", db.Integer, db.ForeignKey("room.id"), primary_key=True),
)


# Database
class Room(db.Model):
    __tablename__ = "room"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    room_code = db.Column(db.String(10), nullable=False, unique=True)
    room_name = db.Column(db.String(20), nullable=False)
    messages = db.relationship(
        "Message", cascade="all, delete", backref="room", lazy=True
    )
    admin = db.Column(db.String(20), db.ForeignKey("user.username"), nullable=False)
    last_message = db.Column(db.String(200), nullable=True)
    last_messsage_user = db.Column(db.String(20), nullable=True)

    def __repr__(self):
        return {
            "id": self.id,
            "room_code": self.room_code,
            "room_name": self.room_name,
            "messages": [message.__repr__() for message in self.messages],
            "admin": self.admin,
            "last_message": self.last_message,
            "last_messsage_user": self.last_messsage_user,
        }


class Message(db.Model):
    __tablename__ = "message"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), db.ForeignKey("user.username"), nullable=False)
    msg = db.Column(db.String(200), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey("room.id"), nullable=False)
    time = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return {
            "id": self.id,
            "username": self.username,
            "msg": self.msg,
            "room_id": self.room_id,
            "time": self.time,
        }


class User(db.Model, UserMixin):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    password_hash = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(50), nullable=False)
    messages = db.relationship("Message", backref="user", lazy=True)
    rooms = db.relationship(
        "Room", secondary=rooms_users, backref=db.backref("users", lazy="dynamic")
    )

    def hash_password(self, password):
        self.password_hash = pbkdf2_sha256.hash(password)

    def verify_password(self, password):
        return pbkdf2_sha256.verify(password, self.password_hash)


class Friends(db.Model):
    __tablename__ = "friends"
    id = db.Column(db.Integer, primary_key=True)
    user1 = db.Column(db.String(20), db.ForeignKey("user.username"), nullable=False)
    user2 = db.Column(db.String(20), db.ForeignKey("user.username"), nullable=False)
    status = db.Column(db.Integer, nullable=False)
    messages = db.relationship(
        "FriendsMessage", cascade="all, delete", backref="friends", lazy=True
    )

    def __repr__(self):
        return {
            "id": self.id,
            "user1": self.user1,
            "user2": self.user2,
            "status": self.status,
            "messages": [message.__repr__() for message in self.messages],
        }


class FriendsMessage(db.Model):
    __tablename__ = "friends_message"
    id = db.Column(db.Integer, primary_key=True)
    sender = db.Column(db.String(20), db.ForeignKey("user.username"), nullable=False)
    receiver = db.Column(db.String(20), db.ForeignKey("user.username"), nullable=False)
    msg = db.Column(db.String(200), nullable=False)
    time = db.Column(db.DateTime, nullable=False)
    friend_id = db.Column(db.Integer, db.ForeignKey("friends.id"), nullable=False)

    def __repr__(self):
        return {
            "id": self.id,
            "sender": self.sender,
            "receiver": self.receiver,
            "msg": self.msg,
            "time": self.time,
            "friend_id": self.friend_id,
        }
