from . import db


class Friend(db.Model):
    __tablename__ = "friends"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    friend_username = db.Column(db.String(100), primary_key=True)