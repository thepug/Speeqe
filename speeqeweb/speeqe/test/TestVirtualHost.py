import unittest
from django.test.client import Client

class TestVirtualHost(unittest.TestCase):

    def testRoomName(self):
        c = Client()
        response = c.get('/virtualhost/speeqers.speeqe.com/')
        self.failUnless(response.context['room'] == "speeqers")
        response = c.get('/virtualhost/www.something.speeqe.com/')
        self.failUnless(response.context['room'] == "www.something")
        response = c.get('/room/speeqe/')
        self.failUnless(response.context['room'] == "speeqe")
        response = c.get('/client/room/speeqe/')
        self.failUnless(response.context['room'] == "speeqe")

