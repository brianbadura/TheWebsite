from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g
from sqlalchemy import or_, and_, func

from models import db, User, Conversation, Message
from auth_utils import require_auth

messages_bp = Blueprint("messages", __name__)


def _normalize_pair(user1: User, user2: User):
    """Return (a, b) where a.id < b.id so we always store the pair the same way."""
    if user1.id < user2.id:
        return user1, user2
    return user2, user1


def _other_participant(conv: Conversation, user: User) -> User:
    if conv.user_a_id == user.id:
        return conv.user_b
    return conv.user_a


def _user_is_participant(conv: Conversation, user: User) -> bool:
    return conv.user_a_id == user.id or conv.user_b_id == user.id


# ---------------------------------------------------------------------------
# Conversations
# ---------------------------------------------------------------------------

@messages_bp.route("/api/conversations", methods=["POST"])
@require_auth
def create_or_get_conversation():
    """Create a conversation between two users, or return the existing one."""
    data = request.get_json(force=True)
    u2_username = (data.get("user2") or "").strip().lower()

    if not u2_username:
        return jsonify({"error": "user2 is required"}), 400
    if u2_username == g.current_user.username:
        return jsonify({"error": "cannot create a conversation with yourself"}), 400

    u2 = User.query.filter_by(username=u2_username).first()
    if u2 is None:
        return jsonify({"error": "user not found"}), 404

    a, b = _normalize_pair(g.current_user, u2)

    existing = Conversation.query.filter_by(user_a_id=a.id, user_b_id=b.id).first()
    if existing:
        return jsonify(existing.to_dict(other_user=u2)), 200

    conv = Conversation(
        user_a_id=a.id,
        user_b_id=b.id,
        created_at=datetime.now(timezone.utc),
        last_message_at=datetime.now(timezone.utc),
    )
    db.session.add(conv)
    db.session.commit()

    return jsonify(conv.to_dict(other_user=u2)), 201


@messages_bp.route("/api/conversations", methods=["GET"])
@require_auth
def list_conversations():
    """List all conversations for a user, with last message + unread count."""
    user = g.current_user

    convs = (
        Conversation.query
        .filter(or_(Conversation.user_a_id == user.id, Conversation.user_b_id == user.id))
        .order_by(Conversation.last_message_at.desc())
        .all()
    )

    results = []
    for conv in convs:
        other = _other_participant(conv, user)
        last_msg = (
            Message.query
            .filter_by(conversation_id=conv.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        unread = (
            Message.query
            .filter_by(conversation_id=conv.id, is_read=False)
            .filter(Message.sender_id != user.id)
            .count()
        )
        results.append(conv.to_dict(
            other_user=other,
            last_message=last_msg,
            unread_count=unread,
        ))
    return jsonify(results)


@messages_bp.route("/api/conversations/<int:conv_id>", methods=["GET"])
@require_auth
def get_conversation(conv_id):
    conv = Conversation.query.get(conv_id)
    if conv is None:
        return jsonify({"error": "conversation not found"}), 404

    user = g.current_user
    if not _user_is_participant(conv, user):
        return jsonify({"error": "not authorized"}), 403

    other = _other_participant(conv, user)
    return jsonify(conv.to_dict(other_user=other))


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@messages_bp.route("/api/conversations/<int:conv_id>/messages", methods=["GET"])
@require_auth
def list_messages(conv_id):
    conv = Conversation.query.get(conv_id)
    if conv is None:
        return jsonify({"error": "conversation not found"}), 404

    user = g.current_user
    if not _user_is_participant(conv, user):
        return jsonify({"error": "not authorized"}), 403

    msgs = (
        Message.query
        .filter_by(conversation_id=conv_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return jsonify([m.to_dict() for m in msgs])


@messages_bp.route("/api/conversations/<int:conv_id>/messages", methods=["POST"])
@require_auth
def send_message(conv_id):
    conv = Conversation.query.get(conv_id)
    if conv is None:
        return jsonify({"error": "conversation not found"}), 404

    data = request.get_json(force=True)
    body = (data.get("body") or "").strip()

    if not body:
        return jsonify({"error": "body is required"}), 400

    sender = g.current_user
    if not _user_is_participant(conv, sender):
        return jsonify({"error": "not authorized"}), 403

    msg = Message(
        conversation_id=conv_id,
        sender_id=sender.id,
        body=body,
        created_at=datetime.now(timezone.utc),
        is_read=False,
    )
    conv.last_message_at = msg.created_at
    db.session.add(msg)
    db.session.commit()

    return jsonify(msg.to_dict()), 201


@messages_bp.route("/api/conversations/<int:conv_id>/read", methods=["POST"])
@require_auth
def mark_read(conv_id):
    conv = Conversation.query.get(conv_id)
    if conv is None:
        return jsonify({"error": "conversation not found"}), 404

    user = g.current_user
    if not _user_is_participant(conv, user):
        return jsonify({"error": "not authorized"}), 403

    # Mark all messages from the OTHER participant as read.
    (
        Message.query
        .filter_by(conversation_id=conv_id, is_read=False)
        .filter(Message.sender_id != user.id)
        .update({"is_read": True})
    )
    db.session.commit()
    return jsonify({"ok": True}), 200


# ---------------------------------------------------------------------------
# Unread summary
# ---------------------------------------------------------------------------

@messages_bp.route("/api/messages/unread", methods=["GET"])
@require_auth
def unread_count():
    user = g.current_user

    # All conversations this user is part of
    conv_ids = [
        c.id for c in Conversation.query.filter(
            or_(Conversation.user_a_id == user.id, Conversation.user_b_id == user.id)
        ).all()
    ]
    if not conv_ids:
        return jsonify({"count": 0, "conversations": []})

    # Unread messages addressed to this user (sender is someone else)
    unread_msgs = (
        Message.query
        .filter(Message.conversation_id.in_(conv_ids))
        .filter(Message.sender_id != user.id)
        .filter(Message.is_read == False)  # noqa: E712
        .order_by(Message.created_at.desc())
        .all()
    )

    # Group by conversation for preview
    by_conv = {}
    for m in unread_msgs:
        by_conv.setdefault(m.conversation_id, []).append(m)

    previews = []
    for conv_id, msgs in by_conv.items():
        conv = Conversation.query.get(conv_id)
        other = _other_participant(conv, user)
        latest = msgs[0]  # already sorted desc
        previews.append({
            "conversationId": conv_id,
            "otherUser": other.to_dict() if other else None,
            "latestMessage": latest.to_dict(),
            "unreadCount": len(msgs),
        })

    # Sort preview list by latest message time desc
    previews.sort(key=lambda p: p["latestMessage"]["createdAt"] or "", reverse=True)

    return jsonify({
        "count": len(unread_msgs),
        "conversations": previews,
    })