import unittest
from speeqeweb.helpers import send_email,generate_code


class TestHelpers(unittest.TestCase):


    def testGenerateCode(self):

        """test the code generation  """
        code_length = 10
        code = generate_code(code_length)

        self.failUnless(code.find("1")==-1)
        self.failUnless(code.find("L")==-1)
        self.failUnless(code.find("l")==-1)
        self.failUnless(code.find("0")==-1)
        self.failUnless(code.find("o")==-1)
        self.failUnless(code.find("O")==-1)
        

        self.failUnless(len(code)==code_length,
                        'not correct length.')
