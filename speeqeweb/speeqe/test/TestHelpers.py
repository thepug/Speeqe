import unittest
from speeqeweb.helpers import send_email,generate_code


class TestHelpers(unittest.TestCase):

    def testSendEmail(self):
        """test the send email function. This test only fails if there
        is an exception thrown.

        Requires that you have authsmtp configured as so.  I use
        speeqe domain name since I have authsmtp configured to
        allow that domain.


        SMTP_SERVER = 'mail.authsmtp.com'
        SMTP_USERNAME = 'ac32831'
        SMTP_PASSWORD = 'wbhd3kceb'
        SMTP_PORT = 2525

        
        """

        send_email('nathan.zorn@gmail.com',
                   'test',
                   'this is a test from speeqe code',
                   sender='test@speeqe.com',
                   frm='test@speeqe.com')
                   
        

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
