from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)


class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    caption = models.TextField()
    image = models.ImageField(upload_to='posts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.caption[:20]}"

class Like(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE)
    post = models.ForeignKey('Post', on_delete = models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields = ['user' , 'post'],
                name = 'unique_like',
            )
        ]

    def __str__(self):
        return f"{self.user.username} liked {self.post.id}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE)
    post = models.ForeignKey(Post, on_delete = models.CASCADE ,related_name = "comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add = True)

    def __str__(self):
        return f"{self.user.username} commented"

class Follow(models.Model):
    follower = models.ForeignKey(User , related_name="Following" , on_delete = models.CASCADE)
    following  = models.ForeignKey(User , related_name="Follower" , on_delete = models.CASCADE)

    def __file__(self):
        return f"{self.follower.username} follows {self.following.username}"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('like' , 'Like'),
        ('comment' , 'Comment'),
        ('follow' , 'Follow'),
    )
    sender = models.ForeignKey(User , related_name="notified" , on_delete = models.CASCADE)
    receiver = models.ForeignKey(User , related_name="notification" , on_delete = models.CASCADE)

    notification_type = models.CharField(max_length = 20 , null = True , blank = True)
 
    post = models.ForeignKey('Post' , on_delete = models.CASCADE , null = True , blank = True)
    comment = models.ForeignKey('Comment' , on_delete = models.CASCADE , null = True , blank = True)

    is_read = models.BooleanField(default= False)
    created_at = models.DateTimeField(auto_now_add = True)

    def __str__(self):
        return f"{self.sender} -> {self.receiver} ({self.notification_type})"