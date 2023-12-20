import random
import string
from database import Room


def generate_unique_code():
    """
    Generates a unique code for a room.
    """
    length = 6
    is_unique = False
    while is_unique == False:
        code = ''.join(random.choices(string.ascii_uppercase, k=length))
        if Room.query.filter_by(room_code=code).first() is None:
            is_unique = True
    return code