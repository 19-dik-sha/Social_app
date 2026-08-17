# Dusk — Social Media Frontend

A dark, high-end React UI built for your Django backend.

## Stack
- React 18 + React Router v6
- Vite (dev server with Django proxy)
- Zero UI library — fully custom design system

## Setup

### 1. Install dependencies
```bash
cd dusk-app
npm install
```

### 2. Configure your Django backend

Make sure your Django backend has:

**CORS** — install and configure `django-cors-headers`:
```python
# settings.py
INSTALLED_APPS = [..., 'corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...]
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

**JWT Auth** — the frontend expects `POST http://localhost//token/` to return `{ access, refresh }`.
Install `djangorestframework-simplejwt` if not already:
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ]
}
```
```python
# urls.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    ...
]
```

**Media files** — make sure Django serves media in development:
```python
# urls.py
from django.conf import settings
from django.conf.urls.static import static
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 3. Map your URL routes

The frontend calls these endpoints — make sure your `urls.py` matches:

| Frontend call | Django URL |
|---|---|
| POST `http://localhost//signup/` | signup view |
| POST `http://localhost//token/` | JWT token obtain |
| GET `http://localhost//feed/` | feed view |
| GET/POST `http://localhost//posts/` | post_list view |
| GET `http://localhost//users/<username>/posts/` | user_posts view |
| POST `http://localhost//like/` | like view |
| POST `http://localhost//unlike/` | unlike view |
| GET `http://localhost//posts/<id>/comments/` | get_comment view |
| POST `http://localhost//posts/<id>/comments/create/` | create_comment view |
| POST `http://localhost//follow/` | follow_user view |
| POST `http://localhost//unfollow/` | unfollow_user view |
| GET `http://localhost//followers/` | followers_list view |
| GET `http://localhost//following/` | following_list view |
| GET `http://localhost//profile/<username>/` | profile view |
| GET `http://localhost//my-profile/` | my_profile view |
| PATCH `http://localhost//profile/update/` | update_profile view |
| POST `http://localhost//profile/picture/` | upload_profile_picture view |
| PUT `http://localhost//change-password/` | change_password view |
| GET `http://localhost//notifications/` | get_notification view |
| POST `http://localhost//notifications/<id>/read/` | mark_as_read view |
| GET `http://localhost//notifications/unread/` | unread_notifications view |
| GET `http://localhost//search/?search=` | search_users view |

### 4. Run

Start Django (port 8000):
```bash
python manage.py runserver
```

Start React (port 3000):
```bash
npm run dev
```

Visit `http://localhost:3000`

## Features
- Login / Signup with JWT
- Infinite scroll feed with pagination
- Create posts with image upload
- Like / unlike posts
- Comments (inline quick-comment + full modal)
- Explore page with user search + posts grid
- Profile pages with follow/unfollow, grid/list toggle, profile picture upload
- Notifications with unread count badge + mark as read
- Settings — edit profile, change password
- Fully responsive sidebar
- Dark moody aesthetic (Cormorant Garamond + DM Sans)
