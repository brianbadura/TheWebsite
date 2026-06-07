import os
from datetime import datetime, timezone, timedelta

import jwt
from flask import g

from models import User

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


def create_token(user: User) -> str:
    """Create a signed JWT for the given user."""
    payload = {
        "user_id": user.id,
        "username": user.username,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_auth(f):
    """Decorator that validates the JWT from the Authorization header.

    On success, sets ``g.current_user`` to the authenticated User.
    Returns 401 if the token is missing, invalid, or expired.
    """
    from functools import wraps
    from flask import request, jsonify

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header[len("Bearer "):]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        user = User.query.get(payload.get("user_id"))
        if user is None:
            return jsonify({"error": "User not found"}), 401

        g.current_user = user
        return f(*args, **kwargs)

    return decorated