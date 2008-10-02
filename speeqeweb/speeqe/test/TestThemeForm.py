import unittest
from speeqeweb.speeqe.forms import ThemeForm


class TestThemeForm(unittest.TestCase):
    """ Test that the theme model works."""

    def testTheme(self):
        form = ThemeForm({'name':"test",
                          'content':"<html></html>"})
        self.assert_(form.is_valid())
