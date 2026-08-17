from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    # Posts
    path('posts/', views.post_list),

    # Auth
    path('signup/', views.signup),

    # Search  (was 'users/' — frontend calls 'search/')
    path('search/', views.search_users),

    # Follow
    path('follow/', views.follow_user),
    path('unfollow/', views.unfollow_user),
    path('followers/', views.followers_list),
    path('following/', views.following_list),

    # Feed
    path('feed/', views.feed),

    # Likes
    path('like/', views.like),
    path('unlike/', views.unlike),

    # Comments  (was 'comment/<id>/' — frontend calls 'posts/<id>/comments/')
    path('posts/<int:post_id>/comments/create/', views.create_comment),
    path('posts/<int:post_id>/comments/', views.get_comment),

    # Notifications  (was 'notification/' — frontend calls 'notifications/')
    path('notifications/', views.get_notification),
    path('notifications/unread/', views.unread_notifications),
    path('notifications/<int:notification_id>/read/', views.mark_as_read),

    # Profile & account
    path('update/', views.update_user),
    path('change-password/', views.change_password),      # was 'password/'
    path('my-profile/', views.my_profile),                # was 'my_profile/'
    path('profile/picture/', views.upload_profile_picture), # was 'profile/upload-picture/'
    path('profile/update/', views.update_profile),
    path('profile/<str:username>/', views.profile),       # was 'profile/' with no username
    path('users/<str:username>/posts/', views.user_posts),  # was 'profile/<username>/posts/'
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)