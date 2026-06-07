import os

from flask import Flask, jsonify, g

from models import db, migrate, User
from routes.auth import auth_bp
from routes.posts import posts_bp
from routes.comments import comments_bp
from routes.users import users_bp
from routes.friends import friends_bp
from routes.friend_requests import friend_requests_bp
from routes.messages import messages_bp
from routes.likes import likes_bp
from auth_utils import create_token, require_auth

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

def create_app():
    app = Flask(__name__)

    db_user = os.environ.get("DB_USER", "admin")
    db_pass = os.environ.get("DB_PASSWORD", "admin")
    db_host = os.environ.get("DB_HOST", "postgres")
    db_port = os.environ.get("DB_PORT", "5432")
    db_name = os.environ.get("DB_NAME", "thewebsite")

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    migrate.init_app(app, db)

    # -- Global error handler to show 500 tracebacks in dev ---------------
    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "detail": str(e),
            "traceback": traceback.format_exc(),
        }), 500

    # -- /api/me — return current user from JWT ---------------------------
    @app.route("/api/me", methods=["GET"])
    @require_auth
    def me():
        return jsonify(g.current_user.to_dict())

    # -- Register blueprints ----------------------------------------------
    app.register_blueprint(auth_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(friends_bp)
    app.register_blueprint(friend_requests_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(likes_bp)

    return app


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

app = create_app()

if __name__ == "__main__":
    app.run(port=5000, debug=True)