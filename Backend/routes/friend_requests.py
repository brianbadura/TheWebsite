from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from models import db, User, Friend, FriendRequest
from auth_utils import require_auth

friend_requests_bp = Blueprint("friend_requests", __name__)


@friend_requests_bp.route("/api/friend-requests", methods=["POST"])
@require_auth
def send_friend_request():
    data = request.get_json(force=True)
    receiver_username = (data.get("receiver") or "").strip().lower()

    if not receiver_username:
        return jsonify({"error": "receiver is required"}), 400
    if receiver_username == g.current_user.username:
        return jsonify({"error": "cannot send request to yourself"}), 400

    receiver = User.query.filter_by(username=receiver_username).first()
    if receiver is None:
        return jsonify({"error": "user not found"}), 404

    # Check if already friends
    existing_friend = Friend.query.filter_by(
        user_id=g.current_user.id, friend_username=receiver_username
    ).first()
    if existing_friend:
        return jsonify({"error": "already friends"}), 409

    # Check for existing pending request
    existing_req = FriendRequest.query.filter(
        (
            (FriendRequest.sender_id == g.current_user.id) &
            (FriendRequest.receiver_id == receiver.id)
        ) | (
            (FriendRequest.sender_id == receiver.id) &
            (FriendRequest.receiver_id == g.current_user.id)
        )
    ).filter(FriendRequest.status == "pending").first()
    if existing_req:
        return jsonify({"error": "friend request already pending"}), 409

    req = FriendRequest(
        sender_id=g.current_user.id,
        receiver_id=receiver.id,
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(req)
    db.session.commit()

    return jsonify(req.to_dict()), 201


@friend_requests_bp.route("/api/friend-requests/incoming", methods=["GET"])
@require_auth
def get_incoming_requests():
    requests = (
        FriendRequest.query
        .filter_by(receiver_id=g.current_user.id, status="pending")
        .order_by(FriendRequest.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in requests])


@friend_requests_bp.route("/api/friend-requests/outgoing", methods=["GET"])
@require_auth
def get_outgoing_requests():
    requests = (
        FriendRequest.query
        .filter_by(sender_id=g.current_user.id, status="pending")
        .order_by(FriendRequest.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in requests])


@friend_requests_bp.route("/api/friend-requests/<int:request_id>/accept", methods=["POST"])
@require_auth
def accept_friend_request(request_id):
    req = FriendRequest.query.get(request_id)
    if req is None:
        return jsonify({"error": "friend request not found"}), 404
    if req.status != "pending":
        return jsonify({"error": "request is not pending"}), 400
    if req.receiver_id != g.current_user.id:
        return jsonify({"error": "not authorized"}), 403

    sender = User.query.get(req.sender_id)
    receiver = User.query.get(req.receiver_id)
    if sender is None or receiver is None:
        return jsonify({"error": "user not found"}), 404

    # Create Friend records for both directions
    f1 = Friend.query.filter_by(
        user_id=sender.id, friend_username=receiver.username
    ).first()
    if f1 is None:
        db.session.add(Friend(user_id=sender.id, friend_username=receiver.username))

    f2 = Friend.query.filter_by(
        user_id=receiver.id, friend_username=sender.username
    ).first()
    if f2 is None:
        db.session.add(Friend(user_id=receiver.id, friend_username=sender.username))

    req.status = "accepted"
    db.session.commit()

    return jsonify(req.to_dict()), 200


@friend_requests_bp.route("/api/friend-requests/<int:request_id>/reject", methods=["POST"])
@require_auth
def reject_friend_request(request_id):
    req = FriendRequest.query.get(request_id)
    if req is None:
        return jsonify({"error": "friend request not found"}), 404
    if req.status != "pending":
        return jsonify({"error": "request is not pending"}), 400
    if req.receiver_id != g.current_user.id:
        return jsonify({"error": "not authorized"}), 403

    req.status = "rejected"
    db.session.commit()

    return jsonify(req.to_dict()), 200