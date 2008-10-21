#
# Copyright (c) 2005 - 2008 Nathan Zorn, OGG, LLC 
# See LICENSE.txt for details
#

from django.conf import settings
from django.shortcuts import render_to_response
from django.template import RequestContext
import smtplib
from email.mime.text import MIMEText
import random
import string

def render_response(req, *args, **kwargs):
    kwargs['context_instance'] = RequestContext(req)
    return render_to_response(*args, **kwargs)


def send_email(to,
               subject,
               body,
               to_list=None,
               files=None,
               port=587,
               sender='noreply@'+settings.HTTP_DOMAIN,
               frm=None):

    sender_from = 'Speeqe <%s>' % sender
    message = MIMEText(body)
    message['From'] = sender_from
    if frm:
        message['Reply-To'] = frm
    message['To'] =  to
    message['Subject'] = subject
    message['Sender'] = sender
    if hasattr(settings, 'SMTP_PORT'):
        port = settings.SMTP_PORT
        
    s = smtplib.SMTP(settings.SMTP_SERVER, port)
    if hasattr(settings, 'SMTP_USERNAME') and hasattr(settings, 'SMTP_PASSWORD'):
        s.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
    if not to_list:
        s.sendmail(sender, [to], message.as_string())
    else:
        s.sendmail(sender, to_list, message.as_string())
    s.close()



def generate_code(length):
    """generate random/uniq string for confirmation codes. """
    
    we_dont_want = ['1','L','l','0','o','O']
    lowers = [a for a in string.ascii_lowercase if a not in we_dont_want]
    digits = [a for a in string.digits if a not in we_dont_want]
    password = ''
    for c in xrange(0, length):
        possible = lowers

        if c == 2 or c == 3:
            possible = digits

        password = password + random.choice(possible)
    return password

