from datetime import timezone
from datetime import datetime

import bcrypt

from . import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    display_name = db.Column(db.String(200))
    avatar = db.Column(db.Text)
    bio = db.Column(db.Text)
    email = db.Column(db.String(200))
    password_hash = db.Column(db.String(255), nullable=True)
    joined_at = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "displayName": self.display_name,
            "avatar": self.avatar,
            "bio": self.bio,
            "email": self.email,
            "joinedAt": self.joined_at.isoformat() if self.joined_at else None,
        }