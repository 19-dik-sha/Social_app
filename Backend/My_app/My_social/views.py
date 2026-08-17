from django.shortcuts import render
from rest_framework.decorators import api_view , permission_classes
from rest_framework.response import Response
from .models import Post , Like
from .serializers import PostSerializer , SignupSerializer , CommentSerializer ,NotificationSerializer , UserUpdateSerializer , ChangePasswordSerializer ,ProfileSerializer
from rest_framework.permissions import IsAuthenticated , AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Follow , Comment
from django.db.models import Q  , Count , Prefetch
from .pagination import FeedPagination
from .models import Notification


# post api swagger schema

post_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    properties={
        'caption': openapi.Schema(type=openapi.TYPE_STRING),
        'image': openapi.Schema(type=openapi.TYPE_STRING, format='binary'),
    }
)

@swagger_auto_schema(
    method='POST',
    request_body=post_schema,
    operation_description="Create a new post"
)
@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def post_list(request):
    if request.method == 'GET':
        posts = Post.objects.all()
        serializer = PostSerializer(posts , many=True ,context = {'request' : request})
        return Response(serializer.data)
        
    elif request.method == 'POST':
        serializer  = PostSerializer(
            data=request.data,
            context= {'request':request}
            )
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors)


# creating sign-in for users

# signup api swagger schema 

signup_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=['username', 'password'],
    properties={
        'username': openapi.Schema(type=openapi.TYPE_STRING),
        'password': openapi.Schema(type=openapi.TYPE_STRING),
        'bio': openapi.Schema(type=openapi.TYPE_STRING),
    }
)

@swagger_auto_schema(
    method='post',
    request_body=signup_schema,
    operation_description="Create a new user account"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User created successfully"} , status =status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# search swagger schema



User = get_user_model()

search_param = openapi.Parameter(
    'search',
    openapi.IN_QUERY,
    description="Search users by username",
    type=openapi.TYPE_STRING
)

@swagger_auto_schema(
    method = "GET",
    manual_parameters=[search_param],
    operation_description="Search users by username"
)
@api_view(['GET'])
def search_users(request):
    query = request.GET.get('search', '').strip()
    if not query:
        return Response([])
    users = User.objects.filter(username__icontains=query)

    data = [
        {
            "id": user.id,
            "username": user.username,
            "bio": user.bio
        }
        for user in users
    ]

    return Response(data)


#follow swagger schema


follow_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=['username'],
    properties={
        'username': openapi.Schema(
            type=openapi.TYPE_STRING,
            description='Username of the user to follow'
        )
    }
)


@swagger_auto_schema(
    method='post',
    request_body=follow_schema,
    operation_description="Follow a user by username"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request):
    username = request.data.get('username')

    try:
        user_to_follow = User.objects.get(username = username)

    except User.DoesNotExist: 
        return Response ({"error" : "User not found"},status = 404)

    if request.user == user_to_follow:
        return Response({"error" : "You cannot follow yourself"}, status = 400)

    if Follow.objects.filter(
        follower=request.user,
        following=user_to_follow
    ).exists():
        return Response({"message": "Already following"}, status=200)
    
    Follow.objects.create(
        follower=request.user,
        following=user_to_follow
    )
    if user_to_follow != request.user:
        Notification.objects.create(
            sender = request.user , 
            receiver = user_to_follow , 
            notification_type = 'follow'
        )
 

    return Response(
        {"message" : f"You are now following {username}"},
        status = 201

   )



# for unfollow

@swagger_auto_schema(
    method='post',
    request_body=follow_schema,
    operation_description="Unfollow a user by username"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])

def unfollow_user(request):
    username = request.data.get('username')

    try:
        user_to_unfollow = User.objects.get(username = username)

    except User.DoesNotExist:
        return Response ({"error" : "user does not exist"} , status=404)

    follow = Follow.objects.filter(
        follower = request.user , 
        following = user_to_unfollow
    )

    if not follow.exists():
        return Response({"you are not following this person"}, status = 400)

    follow.delete()
    return Response({"message":f" {username} , unfollowed successfully"} ,status = 200)



# following list
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def following_list(request):

    follows =  Follow.objects.filter(follower =  request.user)

    data = [
        {
            "id": f.following.id,
            "username": f.following.username,
            "bio": f.following.bio
        }
        for f in follows
    ]

    return Response(data)


#followers list
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def followers_list(request):
    followerss = Follow.objects.filter(following = request.user)

    data = [
        {
            "id" : f.follower.id,
            "username": f.follower.username,
            "bio": f.follower.bio
        }
        for f in followerss
    ]
    return Response(data)


# feed


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def feed(request):
 
    follows = Follow.objects.filter(follower=request.user)
    following_ids = follows.values_list('following', flat=True)
 
    posts = Post.objects.filter(
        Q(user__in=following_ids) | Q(user=request.user)
    ).annotate(
        like_count=Count('like', distinct=True),
        comment_count=Count('comments', distinct=True)
    ).prefetch_related(
        Prefetch(
            'comments',
            queryset=Comment.objects.select_related('user').order_by('-created_at'),
            to_attr='prefetched_comments'
        )
    ).order_by('-created_at')
 
    liked_post_ids = Like.objects.filter(
        user=request.user
    ).values_list('post_id', flat=True)
 
    paginator = FeedPagination()
    paginated_posts = paginator.paginate_queryset(posts, request)
 
    if paginated_posts is not None:
        serializer = PostSerializer(
            paginated_posts,
            many=True,
            context={
                'request': request,
                'liked_post_ids': set(liked_post_ids)  
            }
        )
        return paginator.get_paginated_response(serializer.data)
 
    serializer = PostSerializer(
        posts,
        many=True,
        context={
            'request': request,
            'liked_post_ids': set(liked_post_ids)
        }
    )
    return Response(serializer.data)
 



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like(request):
    post_id = request.data.get('post_id')

    if not post_id:
        return Response({"error : post_id required"} , status = 404)
    
    try:
        post= Post.objects.get(id = post_id)

    except Post.DoesNotExist:
        return Response ({"message":"This post does not exist"} , status = 404) 

    if Like.objects.filter(
        user = request.user,
        post = post
    ).exists():
        return Response ({"message": "you've already liked this post"} , status = 200)
      
    Like.objects.create(
        user = request.user,
        post = post
    )

    if post.user != request.user:
        Notification.objects.create(
            sender = request.user , 
            receiver = post.user , 
            notification_type = 'like',
            post = post
        )
 

    return Response(
    {"message" : "Post liked successfully" },
    status = 201)

# 1. get post_id
# 2. validate
# 3. fetch post
# 4. try:
#       get Like object
#       delete it
# 5. except:
#       "not liked" 
    
# unlike

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlike(request):
    post_id = request.data.get('post_id')

    if not post_id:
        return Response({"message" : "post_id required"} , status =400 )

    try:
        post = Post.objects.get(id = post_id)
    except Post.DoesNotExist:
        return Response({"message":"post does not exist"} , status = 404)

    try:
        like = Like.objects.get(
            user  = request.user,
            post = post
        )
        like.delete()
        return Response({"message":"unliked post successfully"},status = 200)

    except Like.DoesNotExist:
        return Response({"message":"youve not liked this post"} , status = 400)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_comment(request , post_id):
    text = request.data.get('text')
    

    if not text:
        return Response({'error':"text is required"} , status = 400)

    try:
        post = Post.objects.get(id = post_id)
    except Post.DoesNotExist:
        return Response({'message':"post does not exist"} , status=404)

    comment = Comment.objects.create(
        user = request.user,
        post=post,
        text= text
    )
    serializer=CommentSerializer(comment)

    if post.user != request.user:
        Notification.objects.create(
            sender = request.user , 
            receiver = post.user , 
            notification_type = 'comment',
            post = post,
            comment=comment
        )
 

    return Response(serializer.data , status=201)

    # return Response({'message':"Comment added successfully"},status = 201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_comment(request , post_id):
    try:
        post = Post.objects.get(id = post_id)
    except Post.DoesNotExist:
        return Response({"error":"post does not exist"} , status = 404)

    comment_list = Comment.objects.filter(
        post = post
    ).order_by('-created_at')

    serializer= CommentSerializer(comment_list , many = True)
    return Response(serializer.data)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notification(request):
    notifications = Notification.objects.filter(
        receiver=request.user
    ).order_by("-created_at")

    serializer = NotificationSerializer(notifications , many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request , notification_id):
    try:
        notification = Notification.objects.get(
            id = notification_id,
            receiver = request.user
        )

        if not notification.is_read:
            notification.is_read=True
            notification.save()
            return Response({"message":"marked as read"} , status = 200)

    except Notification.DoesNotExist:
        return Response({"error":"Not found"} , status = 404)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_notifications(request):
    unread_count = Notification.objects.filter(
        receiver=request.user,
        is_read=False
    ).count()

    return Response({"unread_count": unread_count}, status=200)
    

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user(request):
    serializer = UserUpdateSerializer(
        instance = request.user,
        data = request.data,
        partial = True
    )

    if serializer.is_valid():
        serializer.save()
        return Response({"message":"Data updated successfully"} , status = 200)

    return Response(
        serializer.errors,
        status = status.HTTP_400_BAD_REQUEST
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(
        data = request.data,
        context = {"request":request}
    )
    if serializer.is_valid():
        serializer.save()

        return Response({"message":"Password updated successfully"} , status = 200)

    return Response(
        serializer.errors,
        status = status.HTTP_400_BAD_REQUEST
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request, username):

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {"error": "User does not exist"},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = ProfileSerializer(
        user,
        context={"request": request}
    )

    return Response(serializer.data, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    serializer = ProfileSerializer(
        request.user,
        context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_posts(request, username):

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    posts = Post.objects.filter(user=user).order_by('-created_at')

    serializer = PostSerializer(
        posts,
        many=True,
        context={'request': request}
    )

    return Response(serializer.data, status=200)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):

    serializer = UserUpdateSerializer(
        instance=request.user,
        data=request.data,
        partial=True,
        context={'request': request}
    )

    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Profile updated successfully"},
            status=200
        )

    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):

    print("REQUEST METHOD:", request.method)
    print("FILES:", request.FILES)

    user = request.user

    if 'profile_picture' not in request.FILES:
        return Response(
            {"error": "No image provided"},
            status=400
        )

    user.profile_picture = request.FILES['profile_picture']
    user.save()

    return Response(
        {"message": "Profile picture updated successfully"},
        status=200
    )

    
































