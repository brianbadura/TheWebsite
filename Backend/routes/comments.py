from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from models import db, User, Post, Comment
from routes.likes import _make_comment_like_lookup, _like_state
from auth_utils import require_auth

comments_bp = Blueprint("comments", __name__)


@comments_bp.route("/api/posts/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    post = Post.query.get(post_id)
    if post is None:
        return jsonify({"error": "post not found"}), 404

    current_user = getattr(g, 'current_user', None)
    lookup = _make_comment_like_lookup(current_user)

    # Fetch only top-level comments (parent_id is NULL), ordered by newest first
    comments = (
        Comment.query
        .filter_by(post_id=post_id, parent_id=None)
        .order_by(Comment.created_at.desc())
        .all()
    )
    return jsonify([c.to_dict_with_replies(like_lookup=lookup) for c in comments])


@comments_bp.route("/api/posts/<int:post_id>/comments", methods=["POST"])
@require_auth
def create_comment(post_id):
    post = Post.query.get(post_id)
    if post is None:
        return jsonify({"error": "post not found"}), 404

    data = request.get_json(force=True)
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400

    comment = Comment(
        post_id=post_id,
        user_id=g.current_user.id,
        content=content,
        parent_id=None,
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(comment)
    db.session.commit()

    current_user = g.current_user
    return jsonify(comment.to_dict_with_replies(
        like_lookup=_make_comment_like_lookup(current_user)
    )), 201


@comments_bp.route("/api/comments/<int:comment_id>/replies", methods=["POST"])
@require_auth
def reply_to_comment(comment_id):
    parent = Comment.query.get(comment_id)
    if parent is None:
        return jsonify({"error": "comment not found"}), 404

    data = request.get_json(force=True)
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400

    reply = Comment(
        post_id=parent.post_id,
        user_id=g.current_user.id,
        content=content,
        parent_id=parent.id,
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(reply)
    db.session.commit()

    current_user = g.current_user
    return jsonify(reply.to_dict_with_replies(
        like_lookup=_make_comment_like_lookup(current_user)
    )), 201


@comments_bp.route("/api/comments/<int:comment_id>", methods=["PUT"])
@require_auth
def update_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return jsonify({"error": "comment not found"}), 404

    data = request.get_json(force=True)
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content is required"}), 400

    # Only the author can update
    if comment.user_id != g.current_user.id:
        return jsonify({"error": "not authorized"}), 403

    comment.content = content
    db.session.commit()

    current_user = g.current_user
    return jsonify(comment.to_dict_with_replies(
        like_lookup=_make_comment_like_lookup(current_user)
    ))


@comments_bp.route("/api/comments/<int:comment_id>", methods=["DELETE"])
@require_auth
def delete_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return jsonify({"error": "comment not found"}), 404

    # Only the author can delete
    if comment.user_id != g.current_user.id:
        return jsonify({"error": "not authorized"}), 403

    db.session.delete(comment)
    db.session.commit()

    return jsonify({"ok": True}), 200