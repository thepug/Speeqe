#
# Copyright (c) 2005 - 2008 Nathan Zorn, OGG, LLC 
# See LICENSE.txt for details
#
from django.db import models

class Avatar(models.Model):
    date   = models.DateTimeField(auto_now=True)
    base64 = models.TextField()
    sha1   = models.CharField(max_length=60, primary_key=True)
    mime   = models.CharField(max_length=10)
    size   = models.CharField(max_length=20)

    def __str__(self):
        return "Avatar: %s|%s" % (self.sha1, self.size)

    def get_absolute_url(self):
        return "/avatar-service/lookup/?sha1=%s" % self.sha1

    class Admin:
        pass
