from rest_framework import serializers
from .models import User, Post, Like, Comment, Follow, Notification
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "bio",
            "profile_picture"
        ]

class PostSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    image = serializers.ImageField(required= False)

    like_count = serializers.IntegerField(read_only=True)

    is_liked = serializers.SerializerMethodField()

    comment_preview = serializers.SerializerMethodField()

    class Meta:
        model = Post

        fields = [
            'id',
            'user',
            'username',
            'caption',
            'image',
            'created_at',
            'like_count',
            'is_liked',
            'comment_preview'
        ]

        read_only_fields = [
            'user',
            'username',
            'created_at',
            'like_count',
            'is_liked',
            'comment_preview'
        ]

    def to_representation(self, instance):

        representation = super().to_representation(instance)

        if instance.image:
            representation["image"] = instance.image.url

        return representation

    def get_is_liked(self, obj):

        liked_post_ids = self.context.get(
            'liked_post_ids',
            []
        )

        return obj.id in liked_post_ids

    def get_comment_preview(self, obj):

        comments = getattr(
            obj,
            'prefetched_comments',
            []
        )[:2]

        return [
            {
                'user': comment.user.username,
                'text': comment.text
            }
            for comment in comments
        ]

class LikeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Like
        fields = '__all__'


class CommentSerializer(serializers.ModelSerializer):

    user = serializers.CharField(
        source='user.username',
        read_only=True
    )

    comment_count = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = Comment
        fields = '__all__'

        read_only_fields = [
            'user',
            'post'
        ]


class FollowSerializer(serializers.ModelSerializer):

    class Meta:
        model = Follow
        fields = '__all__'


class SignupSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            'username',
            'password',
            'bio'
        ]

        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "Username already exists"
            )

        return value

    def create(self, validated_data):

        validated_data['password'] = make_password(
            validated_data['password']
        )

        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):

    sender_username = serializers.CharField(
        source='sender.username'
    )

    class Meta:
        model = Notification

        fields = [
            'id',
            'sender_username',
            'notification_type',
            'post',
            'comment',
            'is_read',
            'created_at'
        ]


User = get_user_model()


class UserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "username",
            "bio",
            "email",
            "profile_picture"
        ]

        extra_kwargs = {
            "username": {
                "required": True
            },

            "bio": {
                "required": False
            },

            "email": {
                "required": True
            },

            "profile_picture": {
                "required": False
            }
        }

    def update(self, instance, validated_data):

        instance.username = validated_data.get(
            "username",
            instance.username
        )

        instance.bio = validated_data.get(
            "bio",
            instance.bio
        )

        instance.email = validated_data.get(
            "email",
            instance.email
        )

        instance.profile_picture = validated_data.get(
            "profile_picture",
            instance.profile_picture
        )

        instance.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField(
        required=True
    )

    new_password = serializers.CharField(
        required=True
    )

    def validate_old_password(self, value):

        user = self.context['request'].user

        if not user.check_password(value):

            raise serializers.ValidationError(
                "Old password is incorrect"
            )

        return value

    def save(self, **kwargs):

        user = self.context['request'].user

        user.set_password(
            self.validated_data['new_password']
        )

        user.save()

        return user


User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):

    followers_count = serializers.SerializerMethodField()

    following_count = serializers.SerializerMethodField()

    posts_count = serializers.SerializerMethodField()

    is_following = serializers.SerializerMethodField()

    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'bio',
            'profile_picture',
            'followers_count',
            'following_count',
            'posts_count',
            'is_following'
        ]

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            return request.build_absolute_uri(
                obj.profile_picture.url
            )
        return None    

    def get_followers_count(self, obj):

        return Follow.objects.filter(
            following=obj
        ).count()

    def get_following_count(self, obj):

        return Follow.objects.filter(
            follower=obj
        ).count()

    def get_posts_count(self, obj):

        return Post.objects.filter(
            user=obj
        ).count()

    def get_is_following(self, obj):

        request = self.context.get('request')

        if request and request.user.is_authenticated:

            return Follow.objects.filter(
                follower=request.user,
                following=obj
            ).exists()

        return False