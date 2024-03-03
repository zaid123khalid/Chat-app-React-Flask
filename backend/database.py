from flask_sqlalchemy import SQLAlchemy
from passlib.hash import pbkdf2_sha256
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import class_mapper


Base = declarative_base()
db = SQLAlchemy()


# association table
rooms_users = db.Table(
    "rooms_users",
    db.Column("user_id", db.INTEGER, db.ForeignKey("user.id"), primary_key=True),
    db.Column("room_id", db.INTEGER, db.ForeignKey("room.id"), primary_key=True),
)


class BaseModel(Base):
    __abstract__ = True

    def commit_to_db(self):
        db.session.add(self)
        db.session.commit()

    def delete_from_db(self):
        db.session.delete(self)
        db.session.commit()

    def update_to_db(self):
        db.session.commit()

    def to_dict(self):
        dict_repr = {
            c.key: getattr(self, c.key) for c in class_mapper(self.__class__).columns
        }
        return dict_repr


# Database
class Room(db.Model, BaseModel):
    __tablename__ = "room"
    id = db.Column(db.INTEGER, primary_key=True, autoincrement=True)
    room_code = db.Column(db.String(10), nullable=False, unique=True)
    room_name = db.Column(db.String(20), nullable=False)
    messages = db.relationship(
        "Message", cascade="all, delete", backref="room", lazy=True
    )
    admin = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)
    last_message = db.Column(db.TEXT, nullable=True)
    last_message_user = db.Column(db.String(20), nullable=True)

    def to_dict(self):
        dict_self = super().to_dict()
        dict_self["admin"] = User.query.filter_by(id=self.admin).first().username
        dict_self["messages"] = [message.to_dict() for message in self.messages]
        return dict_self


class Message(db.Model, BaseModel):
    __tablename__ = "message"
    id = db.Column(db.INTEGER, primary_key=True, autoincrement=True)
    sender = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)
    msg = db.Column(db.Text, nullable=False)
    room_id = db.Column(db.INTEGER, db.ForeignKey("room.id"), nullable=False)
    time = db.Column(
        db.TIMESTAMP, server_default=db.text("CURRENT_TIMESTAMP"), nullable=False
    )

    def to_dict(self):
        dict_self = super().to_dict()
        dict_self["time"] = (
            f"{self.time.strftime('%b-%y %I:%M')} {self.time.strftime('%p')}"
        )
        dict_self["sender"] = User.query.filter_by(id=self.sender).first().username
        return dict_self


class User(db.Model, BaseModel):
    __tablename__ = "user"
    id = db.Column(db.INTEGER, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    password_hash = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(50), nullable=False, unique=True)
    messages = db.relationship("Message", backref="user", lazy=True)
    rooms = db.relationship(
        "Room", secondary=rooms_users, backref=db.backref("users", lazy="dynamic")
    )

    def hash_password(self, password):
        self.password_hash = pbkdf2_sha256.hash(password)

    def verify_password(self, password):
        return pbkdf2_sha256.verify(password, self.password_hash)

    def to_dict(self):
        dict_self = super().to_dict()
        dict_self["messages"] = [message.to_dict() for message in self.messages]
        dict_self["rooms"] = [room.to_dict() for room in self.rooms]
        return dict_self


class Friends(db.Model, BaseModel):
    __tablename__ = "friends"
    id = db.Column(db.INTEGER, primary_key=True)
    user1 = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)
    user2 = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    last_message = db.Column(db.TEXT, nullable=True)
    last_message_user = db.Column(db.String(20), nullable=True)
    messages = db.relationship(
        "FriendsMessage", cascade="all,delete", backref="friends", lazy=True
    )

    def to_dict(self):
        dict_repr = super().to_dict()
        dict_repr["user1"] = User.query.filter_by(id=self.user1).first().username
        dict_repr["user2"] = User.query.filter_by(id=self.user2).first().username
        dict_repr["messages"] = [message.to_dict() for message in self.messages]
        return dict_repr


class FriendsMessage(db.Model, BaseModel):
    __tablename__ = "friends_message"
    id = db.Column(db.INTEGER, primary_key=True)
    sender = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)
    receiver = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)
    msg = db.Column(db.TEXT, nullable=False)
    time = db.Column(
        db.TIMESTAMP, server_default=db.text("CURRENT_TIMESTAMP"), nullable=False
    )
    friend_id = db.Column(db.INTEGER, db.ForeignKey("friends.id"), nullable=False)

    def to_dict(self):
        dict_repr = super().to_dict()
        dict_repr["time"] = (
            f"{self.time.strftime('%b-%y %I:%M')} {self.time.strftime('%p')}"
        )
        dict_repr["sender"] = User.query.filter_by(id=self.sender).first().username
        dict_repr["receiver"] = User.query.filter_by(id=self.receiver).first().username
        return dict_repr


class FriendRequest(db.Model, BaseModel):
    __tablename__ = "friend_request"
    id = db.Column(db.INTEGER, primary_key=True)
    sender = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)
    receiver = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)

    def to_dict(self):
        dict_repr = super().to_dict()
        dict_repr["sender"] = User.query.filter_by(id=self.sender).first().username
        dict_repr["receiver"] = User.query.filter_by(id=self.receiver).first().username
        return dict_repr


class AccessToken(db.Model, BaseModel):
    __tablename__ = "access_token"
    id = db.Column(db.INTEGER, primary_key=True)
    token = db.Column(db.String(500), nullable=False)
    user_id = db.Column(db.INTEGER, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(
        db.TIMESTAMP, server_default=db.text("CURRENT_TIMESTAMP"), nullable=False
    )
    expired_at = db.Column(db.TIMESTAMP, nullable=False)
    revoked = db.Column(db.BOOLEAN, nullable=False, default=0)

    def to_dict(self):
        return super().to_dict()
