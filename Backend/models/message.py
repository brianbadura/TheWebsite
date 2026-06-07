from datetime import datetime, timezone

from . import db


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer, db.ForeignKey("conversations.id"), nullable=False
    )
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    is_read = db.Column(db.Boolean, default=False, nullable=False)

    conversation = db.relationship("Conversation", backref="messages", lazy=True)
    sender = db.relationship("User", foreign_keys=[sender_id], lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "conversationId": self.conversation_id,
            "senderId": self.sender_id,
            "sender": self.sender.to_dict() if self.sender else None,
            "body": self.body,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "isRead": self.is_read,
        }
