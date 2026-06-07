from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint

from . import db


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=True)
    comment_id = db.Column(db.Integer, db.ForeignKey("comments.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    # NOTE: No explicit relationships to Post/Comment/User here.
    # They are declared from the OTHER side (Post.likes, Comment.likes)
    # with explicit backref constructors that create mirror attributes
    # on Like named "liked_post" / "liked_comment" to avoid name collisions.

    # Enforce one like per user per object (post or comment)
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_user_post_like"),
        UniqueConstraint("user_id", "comment_id", name="uq_user_comment_like"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "postId": self.post_id,
            "commentId": self.comment_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
