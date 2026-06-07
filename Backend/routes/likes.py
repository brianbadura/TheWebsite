from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, g

from models import db, User, Post, Comment, Like
from auth_utils import require_auth

likes_bp = Blueprint("likes", __name__)


def _like_state(obj, current_user: User):
    """Return (like_count, liked_by_current_user) for a Post or Comment."""
    if current_user is None:
        return (len(obj.likes) if obj.likes else 0, False)
    liked = any(l.user_id == current_user.id for l in (obj.likes or []))
    return (len(obj.likes) if obj.likes else 0, liked)


def _make_comment_like_lookup(current_user: User):
    """Build a callable: comment -> (like_count, liked_by_current_user)."""
    def lookup(comment):
        return _like_state(comment, current_user)
    return lookup


# ---------------------------------------------------------------------------
# Post likes
# ---------------------------------------------------------------------------

@likes_bp.route("/api/posts/<int:post_id>/like", methods=["POST"])
@require_auth
def like_post(post_id):
    post = Post.query.get(post_id)
    if post is None:
        return jsonify({"error": "post not found"}), 404

    existing = Like.query.filter_by(user_id=g.current_user.id, post_id=post_id).first()
    if existing is None:
        like = Like(
            user_id=g.current_user.id,
            post_id=post_id,
            created_at=datetime.now(timezone.utc),
        )
        db.session.add(like)
        db.session.commit()

    like_count, liked = _like_state(post, g.current_user)
    return jsonify({
        "postId": post_id,
        "likeCount": like_count,
        "likedByCurrentUser": liked,
    })


@likes_bp.route("/api/posts/<int:post_id>/like", methods=["DELETE"])
@require_auth
def unlike_post(post_id):
    post = Post.query.get(post_id)
    if post is None:
        return jsonify({"error": "post not found"}), 404

    existing = Like.query.filter_by(user_id=g.current_user.id, post_id=post_id).first()
    if existing is not None:
        db.session.delete(existing)
        db.session.commit()

    like_count, liked = _like_state(post, g.current_user)
    return jsonify({
        "postId": post_id,
        "likeCount": like_count,
        "likedByCurrentUser": liked,
    })


# ---------------------------------------------------------------------------
# Comment likes
# ---------------------------------------------------------------------------

@likes_bp.route("/api/comments/<int:comment_id>/like", methods=["POST"])
@require_auth
def like_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return jsonify({"error": "comment not found"}), 404

    existing = Like.query.filter_by(user_id=g.current_user.id, comment_id=comment_id).first()
    if existing is None:
        like = Like(
            user_id=g.current_user.id,
            comment_id=comment_id,
            created_at=datetime.now(timezone.utc),
        )
        db.session.add(like)
        db.session.commit()

    like_count, liked = _like_state(comment, g.current_user)
    return jsonify({
        "commentId": comment_id,
        "likeCount": like_count,
        "likedByCurrentUser": liked,
    })


@likes_bp.route("/api/comments/<int:comment_id>/like", methods=["DELETE"])
@require_auth
def unlike_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return jsonify({"error": "comment not found"}), 404

    existing = Like.query.filter_by(user_id=g.current_user.id, comment_id=comment_id).first()
    if existing is not None:
        db.session.delete(existing)
        db.session.commit()

    like_count, liked = _like_state(comment, g.current_user)
    return jsonify({
        "commentId": comment_id,
        "likeCount": like_count,
        "likedByCurrentUser": liked,
    })