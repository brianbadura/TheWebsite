from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint

from . import db


class Conversation(db.Model):
    __tablename__ = "conversations"

    id = db.Column(db.Integer, primary_key=True)
    user_a_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user_b_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    last_message_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    user_a = db.relationship("User", foreign_keys=[user_a_id], lazy=True)
    user_b = db.relationship("User", foreign_keys=[user_b_id], lazy=True)

    __table_args__ = (
        UniqueConstraint("user_a_id", "user_b_id", name="uq_conversation_pair"),
    )

    def to_dict(self, other_user=None, last_message=None, unread_count=0):
        return {
            "id": self.id,
            "userAId": self.user_a_id,
            "userBId": self.user_b_id,
            "otherUser": other_user.to_dict() if other_user else None,
            "lastMessage": last_message.to_dict() if last_message else None,
            "lastMessageAt": self.last_message_at.isoformat() if self.last_message_at else None,
            "unreadCount": unread_count,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
