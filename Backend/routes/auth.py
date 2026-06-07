from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from models import db, User
from auth_utils import create_token

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip().lower()
    display_name = (data.get("displayName") or username).strip()
    email = (data.get("email") or "").strip().lower()
    bio = (data.get("bio") or "").strip()
    password = data.get("password") or ""

    if not username:
        return jsonify({"error": "Username is required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Check uniqueness
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username is already taken"}), 409
    if email and User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already in use"}), 409

    user = User(
        username=username,
        display_name=display_name,
        email=email if email else None,
        bio=bio,
        joined_at=datetime.now(timezone.utc),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    username_or_email = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    if not username_or_email:
        return jsonify({"error": "Username or email is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400

    # Look up by username or email
    user = User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if user is None:
        return jsonify({"error": "Invalid credentials"}), 401
    if not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(user)
    return jsonify({"token": token, "user": user.to_dict()}), 200