from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Posts(models.Model):
    content = models.TextField()
    time = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(User, on_delete = models.CASCADE, related_name = "posts")
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)

    def __str__(self):
        return f'{self.creator.username}, content: {self.content[:20]}'
    

class Followers(models.Model): #The followers of x are his followings 
    user = models.ForeignKey(User, on_delete = models.CASCADE, related_name='followings')#There is just one person followed 
    followers = models.ManyToManyField(User, related_name='followers', blank=True)#Multiple people can follow this person

    def __str__(self):
        return f'{self.user.username} is followed by: {[f.username for f in self.followers.all()]}'