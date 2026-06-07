from datetime import datetime, timezone

from . import db


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    image = db.Column(db.Text)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime)

    user = db.relationship("User", backref="posts", lazy=True)
    comments = db.relationship("Comment", backref="post", lazy=True, cascade="all, delete-orphan")
    likes = db.relationship(
        "Like",
        backref=db.backref("liked_post", lazy=True),
        lazy=True,
        cascade="all, delete-orphan",
    )

    def to_dict(self, like_count=None, liked_by_current_user=False):
        user = self.user or User.query.get(self.user_id)
        if like_count is None:
            like_count = len(self.likes) if self.likes else 0
        return {
            "id": self.id,
            "userId": self.user_id,
            "username": user.username if user else None,
            "displayName": user.display_name if user else None,
            "avatar": user.avatar if user else None,
            "image": self.image,
            "description": self.description,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "commentCount": len(self.comments) if self.comments else 0,
            "likeCount": like_count,
            "likedByCurrentUser": liked_by_current_user,
        }


# Avoid circular import by importing User at bottom
from .user import User
