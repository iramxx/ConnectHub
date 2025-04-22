from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from .models import User, Posts, Followers
from django.contrib.auth.decorators import login_required


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
def new_post(request):
    if request.method == "POST":
        data = json.loads(request.body)
        content = data.get("content", "")

        if not content.strip():
            return JsonResponse({"error": "Post content cannot be empty."}, status=400)

        # Create the new post
        post = Posts(content=content, creator=request.user)
        post.save()

        return JsonResponse({"message": "Post created successfully."}, status=201)

    return JsonResponse({"error": "POST request required."}, status=400)


def all_posts(request):
    posts = Posts.objects.all().order_by('-time')

    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')#Django automatically create a page for each post when you use paginator
    posts_in_page = paginator.get_page(page_number)

    posts_data = []
    for post in posts_in_page:
        posts_data.append({
            "id": post.id,
            "creator": post.creator.username,
            "content": post.content,
            "time": post.time.strftime('%Y-%m-%d %H:%M:%S'),
            "likes": post.likes.count(),
            "liked": request.user in post.likes.all() if request.user.is_authenticated else False
        })
    
    return JsonResponse({
        "posts": posts_data,
        "has_next": posts_in_page.has_next(),
        "has_prev": posts_in_page.has_previous(),
    })


def profile(request, username):
    user = get_object_or_404(User, username=username)
    
    if request.method == 'GET':
        posts = Posts.objects.filter(creator=user).order_by('-time')
        
        # Paginate the posts (10 per page)
        paginator = Paginator(posts, 10)
        page_number = request.GET.get('page') 
        posts_in_page = paginator.get_page(page_number)


        posts_data = []
        for post in posts_in_page:
            posts_data.append({
                "id": post.id,
                "creator": post.creator.username,
                "content": post.content,
                "time": post.time.strftime('%Y-%m-%d %H:%M:%S'),
                "likes": post.likes.count(),
            })


        followers_entry = Followers.objects.filter(user=user).first()
        followers_number = followers_entry.followers.count() if followers_entry else 0

        followings_number = Followers.objects.filter(followers=user).count()

        is_following = False
        if request.user.is_authenticated:
            is_following = Followers.objects.filter(user=user, followers=request.user).exists()
        
        return JsonResponse({
            "username": user.username,
            "followers_number": followers_number,
            "followings_number": followings_number,
            "is_following": is_following,
            "posts": posts_data,
            "has_next": posts_in_page.has_next(),
            "has_prev": posts_in_page.has_previous(),
        })
    

@csrf_exempt
def follow_unfollow(request, username):
    if request.method != 'PUT':
        return JsonResponse({"error": "PUT method required"}, status=400)

    user_to_follow = get_object_or_404(User, username=username)
    
    data = json.loads(request.body)
    is_following = data.get("is_following")

    try:
        followers_entry, created = Followers.objects.get_or_create(user=user_to_follow)
        
        if is_following:
            followers_entry.followers.remove(request.user)
            message = f"Unfollowed {user_to_follow.username}"
        else:
            followers_entry.followers.add(request.user)
            message = f"Now following {user_to_follow.username}"
        
        return JsonResponse(
            {"message": message,
                "followers_count": followers_entry.followers.count(),
            }, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def edit_post(request, post_id):
    try:
        post = Posts.objects.get(pk = post_id)
    except Posts.DoesNotExist:
        return JsonResponse({"error" : "Post not found."}, status = 404)

    #ensures that it s the owner of the post
    if post.creator != request.user:
        return JsonResponse({"error": "You are not the owner of the post"})

    data = json.loads(request.body)
    content = data.get("content", "")

    if not content.strip():
        return JsonResponse({"error": "Content cannot be empty."})
    
    post.content = content
    post.save()

    return JsonResponse({"message": "Post updated successfully."}, status=200)

@login_required
@csrf_exempt
def like_unlike(request, post_id):
    try:
        post = Posts.objects.get(pk = post_id)
    except Posts.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status = 404)

    if request.user in post.likes.all():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True
    
    return JsonResponse({
        "message": "The like status has been changed",
        "liked": liked,
        "like_count": post.likes.count(),
    }, status=200)

@login_required
def followings_posts(request):

    #The followings of the user
    followed_users = Followers.objects.filter(followers=request.user).values_list('user', flat=True)

    posts = Posts.objects.filter(creator__in = followed_users).order_by('-time')

    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')#Django automatically create a page for each post when you use paginator
    posts_in_page = paginator.get_page(page_number)

    posts_data = []
    for post in posts_in_page:
        posts_data.append({
            "id": post.id,
            "creator": post.creator.username,
            "content": post.content,
            "time": post.time.strftime('%Y-%m-%d %H:%M:%S'),
            "likes": post.likes.count(),
            "liked": request.user in post.likes.all() if request.user.is_authenticated else False
        })
    
    return JsonResponse({
        "posts": posts_data,
        "has_next": posts_in_page.has_next(),
        "has_prev": posts_in_page.has_previous(),
    })