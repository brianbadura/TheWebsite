from . import db


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("comments.id"), nullable=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime)

    user = db.relationship("User", lazy=True)
    replies = db.relationship(
        "Comment",
        backref=db.backref("parent", remote_side="Comment.id"),
        lazy=True,
        cascade="all, delete-orphan",
    )
    likes = db.relationship(
        "Like",
        backref=db.backref("liked_comment", lazy=True),
        lazy=True,
        cascade="all, delete-orphan",
    )

    def to_dict(self, like_count=None, liked_by_current_user=False):
        if like_count is None:
            like_count = len(self.likes) if self.likes else 0
        return {
            "id": self.id,
            "postId": self.post_id,
            "userId": self.user_id,
            "username": self.user.username if self.user else None,
            "displayName": self.user.display_name if self.user else None,
            "avatar": self.user.avatar if self.user else None,
            "content": self.content,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "parentId": self.parent_id,
            "likeCount": like_count,
            "likedByCurrentUser": liked_by_current_user,
        }

    def to_dict_with_replies(self, like_lookup=None):
        """
        like_lookup: optional callable comment -> (like_count, liked_by_current_user).
        If provided, used for this comment and all replies (recursively).
        """
        if like_lookup:
            lc, liked = like_lookup(self)
        else:
            lc, liked = None, False
        data = self.to_dict(like_count=lc, liked_by_current_user=liked)
        data["replies"] = [
            r.to_dict_with_replies(like_lookup=like_lookup) for r in (self.replies or [])
        ]
        return data
