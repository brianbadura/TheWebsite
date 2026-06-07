from flask import Blueprint, jsonify, request, g

from models import db, User, Friend
from auth_utils import require_auth

friends_bp = Blueprint("friends", __name__)


@friends_bp.route("/api/friends", methods=["GET"])
@require_auth
def get_friends():
    friends = (
        Friend.query.filter_by(user_id=g.current_user.id)
        .order_by(Friend.friend_username)
        .all()
    )
    return jsonify([f.friend_username for f in friends])


@friends_bp.route("/api/friends/<friend_username>", methods=["POST"])
@require_auth
def add_friend(friend_username):
    # Check the friend user exists
    friend_user = User.query.filter_by(username=friend_username).first()
    if friend_user is None:
        return jsonify({"error": "user not found"}), 404

    existing = Friend.query.filter_by(
        user_id=g.current_user.id, friend_username=friend_username
    ).first()
    if existing is None:
        friend = Friend(user_id=g.current_user.id, friend_username=friend_username)
        db.session.add(friend)

        # Also add the reciprocal relationship
        reciprocal = Friend.query.filter_by(
            user_id=friend_user.id, friend_username=g.current_user.username
        ).first()
        if reciprocal is None:
            reciprocal = Friend(user_id=friend_user.id, friend_username=g.current_user.username)
            db.session.add(reciprocal)

        db.session.commit()

    friends = (
        Friend.query.filter_by(user_id=g.current_user.id)
        .order_by(Friend.friend_username)
        .all()
    )
    return jsonify([f.friend_username for f in friends]), 201


@friends_bp.route("/api/friends/<friend_username>", methods=["DELETE"])
@require_auth
def remove_friend(friend_username):
    friend_user = User.query.filter_by(username=friend_username).first()

    Friend.query.filter_by(
        user_id=g.current_user.id, friend_username=friend_username
    ).delete()

    # Also remove the reciprocal relationship
    if friend_user:
        Friend.query.filter_by(
            user_id=friend_user.id, friend_username=g.current_user.username
        ).delete()

    db.session.commit()

    friends = (
        Friend.query.filter_by(user_id=g.current_user.id)
        .order_by(Friend.friend_username)
        .all()
    )
    return jsonify([f.friend_username for f in friends])