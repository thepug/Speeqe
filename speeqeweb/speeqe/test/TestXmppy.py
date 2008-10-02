import unittest
import speeqeweb.speeqe.xmppy as xmppy


class TestXmppy(unittest.TestCase):

    def testRoomConfig(self):
        """ This assumes that you have chat.dev.speeqe.com configured
        as your chat server and the test@dev.speeqe.com user is
        created."""
        retval = xmppy.check_room_owner(username="test@dev.speeqe.com",
                                        password="c00lio",
                                        room="test")

        self.failUnless(retval==True)
