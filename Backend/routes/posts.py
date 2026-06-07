from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from models import db, User, Post
from routes.likes import _like_state
from auth_utils import require_auth

posts_bp = Blueprint("posts", __name__)


@posts_bp.route("/api/posts", methods=["GET"])
def get_posts():
    current_user = getattr(g, 'current_user', None)
    posts = Post.query.order_by(Post.created_at.desc()).all()
    result = []
    for p in posts:
        like_count, liked = _like_state(p, current_user)
        result.append(p.to_dict(like_count=like_count, liked_by_current_user=liked))
    return jsonify(result)


@posts_bp.route("/api/posts", methods=["POST"])
@require_auth
def create_post():
    data = request.get_json(force=True)
    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"error": "description is required"}), 400

    post = Post(
        user_id=g.current_user.id,
        image=data.get("image"),
        description=description,
        created_at=datetime.now(timezone.utc)
    )
    db.session.add(post)
    db.session.commit()

    return jsonify(post.to_dict(like_count=0, liked_by_current_user=False)), 201


@posts_bp.route("/api/posts/<int:post_id>", methods=["PUT"])
@require_auth
def update_post(post_id):
    data = request.get_json(force=True)
    description = (data.get("description") or "").strip()
    if not description:
        return jsonify({"error": "description is required"}), 400

    post = Post.query.get(post_id)
    if post is None:
        return jsonify({"error": "post not found"}), 404

    # Only the author can update
    if post.user_id != g.current_user.id:
        return jsonify({"error": "not authorized"}), 403

    post.description = description
    post.image = data.get("image")
    db.session.commit()

    like_count, liked = _like_state(post, g.current_user)
    return jsonify(post.to_dict(like_count=like_count, liked_by_current_user=liked))


@posts_bp.route("/api/posts/<int:post_id>", methods=["DELETE"])
@require_auth
def delete_post(post_id):
    post = Post.query.get(post_id)
    if post is None:
        return jsonify({"error": "post not found"}), 404

    # Only the author can delete
    if post.user_id != g.current_user.id:
        return jsonify({"error": "not authorized"}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({"ok": True}), 200