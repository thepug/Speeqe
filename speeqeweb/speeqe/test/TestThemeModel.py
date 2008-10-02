import unittest
from speeqeweb.speeqe.models import Theme
from django.contrib.auth.models import User


class TestThemeModel(unittest.TestCase):
    """ Test that the theme model works."""

    def testTheme(self):
        user,created = User.objects.get_or_create(username='test@speeqe.com')
        
        theme,created = Theme.objects.get_or_create(name="test",
                                                    owner=user,
                                                    content="<html></html>")
        self.assert_(theme.name == "test")
