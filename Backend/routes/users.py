from flask import Blueprint, jsonify, request, g

from models import db, User
from auth_utils import require_auth

users_bp = Blueprint("users", __name__)


@users_bp.route("/api/users", methods=["GET"])
def get_users():
    users = User.query.order_by(User.username).all()
    result = {u.username: u.to_dict() for u in users}
    return jsonify(result)


@users_bp.route("/api/users/search", methods=["GET"])
def search_users():
    q = request.args.get("q", "").strip()
    if not q or len(q) < 1:
        return jsonify([])

    users = User.query.filter(
        User.username.ilike(f"%{q}%") | User.display_name.ilike(f"%{q}%")
    ).order_by(User.username).limit(10).all()

    return jsonify([u.to_dict() for u in users])


@users_bp.route("/api/users/<username>", methods=["GET"])
def get_user(username):
    user = User.query.filter_by(username=username).first()
    if user is None:
        return jsonify({"error": "user not found"}), 404
    return jsonify(user.to_dict())


@users_bp.route("/api/users/<username>", methods=["PUT"])
@require_auth
def update_user(username):
    # Only the user themselves can update their profile
    if g.current_user.username != username:
        return jsonify({"error": "not authorized"}), 403

    data = request.get_json(force=True)
    user = User.query.filter_by(username=username).first()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    allowed_fields = {
        "displayName": "display_name",
        "email": "email",
        "bio": "bio",
        "avatar": "avatar",
    }
    for field, col in allowed_fields.items():
        if field in data:
            setattr(user, col, data[field])

    db.session.commit()
    return jsonify(user.to_dict())


@users_bp.route("/api/users/<username>/change-password", methods=["POST"])
@require_auth
def change_password(username):
    # Only the user themselves can change their password
    if g.current_user.username != username:
        return jsonify({"error": "not authorized"}), 403

    data = request.get_json(force=True)
    user = User.query.filter_by(username=username).first()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    current_password = data.get("currentPassword") or ""
    new_password = data.get("newPassword") or ""

    if not current_password or not new_password:
        return jsonify({"error": "Both current and new passwords are required"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"ok": True}), 200