from datetime import datetime, timezone

from . import db


class FriendRequest(db.Model):
    __tablename__ = "friend_requests"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending | accepted | rejected
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    sender = db.relationship("User", foreign_keys=[sender_id], lazy=True)
    receiver = db.relationship("User", foreign_keys=[receiver_id], lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "senderId": self.sender_id,
            "sender": self.sender.to_dict() if self.sender else None,
            "receiverId": self.receiver_id,
            "receiver": self.receiver.to_dict() if self.receiver else None,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }