from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

from .user import User
from .post import Post
from .comment import Comment
from .friend import Friend
from .friend_request import FriendRequest
from .conversation import Conversation
from .message import Message
from .like import Like
