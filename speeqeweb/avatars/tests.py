
from speeqeweb.avatars.models import Avatar
from speeqeweb.avatars import views
from django.conf import settings
from django.test.client import Client
from django.http import HttpRequest
import datetime
import time
import unittest


DEFAULT_AVATAR = settings.DOCUMENT_ROOT + '/images/default_avatar.png'


class TestAvatars(unittest.TestCase):

    avatar_data = """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"""


    def setUp(self):
        self.vcard_text = """<vCard xmlns='blah'><PHOTO><TYPE>image/png</TYPE><BINVAL>%s</BINVAL></PHOTO></vCard>""" % (self.avatar_data,)

    def createAvatar(self):
        avatar = Avatar(mime='image/png',
                        base64=self.avatar_data,
                        sha1='55890c9b2e992ada2f05cb07792f3f49347db1b5')
        avatar.save()
        return avatar

    def testAvatarCreation(self):
        self.createAvatar()

    def testCreateDefaultAvatar(self):

        request = HttpRequest()
        request.FILES['avatar'] = open(DEFAULT_AVATAR)

        im_dimensions, image_data = views.read_avatar(request)
        views.create_or_get_avatar(image_data, im_dimensions)

        request.FILES['avatar'].close()




class TestAvatarViews(unittest.TestCase):

    def setUp(self):
        request = HttpRequest()
        request.FILES['avatar'] = open(DEFAULT_AVATAR)

        im_dimensions, image_data = views.read_avatar(request)
        mime, b64, sha1 = views.create_or_get_avatar(image_data, im_dimensions)
        self.default_mime = mime
        self.default_b64  = b64
        self.default_sha1 = sha1
        settings.AVATAR_DEFAULT_SHA1 = self.default_sha1
        settings.AVATAR_DEFAULT_IE6  = self.default_sha1
        request.FILES['avatar'].close()

    def testGetAvatar(self):
        c = Client()

        get_string = '/avatar-service/lookup/'
        resp = c.get(get_string)
        self.failUnless(resp.status_code==200, 'Wrong status code %d ' % resp.status_code)

        get_string = '/avatar-service/lookup/?vcard=&dimensions=230|230&url=o'
        resp = c.get(get_string)
