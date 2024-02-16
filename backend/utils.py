import datetime
from functools import wraps
import random
import string

from flask import jsonify, request
from database import AccessToken, Room


def generate_unique_code():
    """
    Generates a unique code for a room.
    """
    length = 6
    is_unique = False
    while is_unique == False:
        code = "".join(random.choices(string.ascii_uppercase, k=length))
        if Room.query.filter_by(room_code=code).first() is None:
            is_unique = True
    return code


def validate_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get("Authorization")
        if token is None:
            return jsonify({"status": "Token is missing"}), 500
        else:
            token = token.split(" ")[1]
            token_from_db = AccessToken.query.filter_by(token=token).first()

            if token_from_db is None:
                return jsonify({"status": "Token is invalid"}), 500
            else:
                if (
                    token_from_db.expired_at > datetime.datetime.now()
                    and token_from_db.revoked == False
                ):
                    return f(*args, **kwargs)
                else:
                    return jsonify({"status": "Token is expired"}), 500

    return decorated_function
