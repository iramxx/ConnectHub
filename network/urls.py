
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("new_post", views.new_post, name="new_post"),
    path("all_posts", views.all_posts, name="all_posts"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("profile/<str:username>/follow_unfollow", views.follow_unfollow, name="follow_unfollow"),
    path('edit_post/<int:post_id>', views.edit_post, name='edit_post'),
    path("like_unlike/<int:post_id>", views.like_unlike, name="like_unlike"),
    path("following", views.followings_posts, name="following_posts"),
]
