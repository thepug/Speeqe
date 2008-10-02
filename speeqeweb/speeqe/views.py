#
# Copyright (c) 2005 - 2008 Nathan Zorn, OGG, LLC 
# See LICENSE.txt for details
#

from speeqeweb.speeqe.models import Theme,EmailMessageTemplate,EmailConfirmation
from speeqeweb.speeqe.forms import RegisterForm, ThemeForm
import speeqeweb.speeqe.forms
from speeqeweb.helpers import send_email, render_response, generate_code
from speeqeweb.httpbclient import PunjabClient
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib import auth
from django.conf import settings
import datetime
import socket,random,string
from django.core.paginator import ObjectPaginator, InvalidPage
from django.template.loader import get_template
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from django.template import Context, Template
import speeqeweb.speeqe.xmppy as xmpp

class NoSession(Exception):
	pass

def index(request):
	context = {}

	index_template = "index.html"
	
	if request.user.is_anonymous():
		request.session.set_test_cookie()
		if settings.PRIVATE_BETA:
			index_template = "demo_index.html"
	
	
	return render_response(request, index_template,context)

def validate_username(request):
	"""Used to validate a username via ajax."""
	
	username = request.GET.get('username',None)
	response_string = "<username msg=''>invalid</username>"
	valid = False
	try:
		if username:
			speeqeweb.speeqe.forms.validate_username(username)
			valid = True
	except Exception,ex:
		response_string = "<username msg=\""+str(ex)+"\">invalid</username>"
	if valid:
		response_string = "<username msg=''>valid</username>"
	return HttpResponse(response_string)

def validate_email(request):
	"""Used to validate an email via ajax."""
	
	email = request.GET.get('email',None)
	response_string = "<email msg=''>invalid</email>"
	valid = False
	try:
		if email:
			speeqeweb.speeqe.forms.validate_email(email)
			valid = True
	except Exception,ex:
		response_string = "<email msg=\""+str(ex)+"\">invalid</email>"
	if valid:
		response_string = "<email msg=''>valid</email>"
	return HttpResponse(response_string)		


def join(request):
	if settings.PRIVATE_BETA:
		raise Http404
	
	"""create a speeqe account"""
	context = {}
	if request.method == "POST":
		#create a register form to handle validation and errors
		register_form = RegisterForm(request.POST)
		context={'form':register_form}
		if register_form.is_valid():
			#create the account
			new_member = register_form.save()

			username = new_member.username + "@" + new_member.realm
			user = auth.authenticate(username=username,
						       password=new_member.password)
			request.session['user_password']= register_form.clean_data['password']
			if user is not None:
				auth.login(request,user)

				ret_response = render_response(request,
							       'index.html',
							       context)
			else:
				context['message'] = "Error authenticating user"
				ret_response = render_response(request,
							       'registration/join.html',
							       context)
		else:
			context['message'] = "Error creating account."
			context['form'] = register_form
			ret_response = render_response(request,
						       'registration/join.html',
						       context)
	else:
		ret_response = render_response(request,
					       'registration/join.html',
					       context)
	return ret_response

def xmpp_auth(request):
	errors = {}
	"""auth with xmpp server."""
	username = request.POST.get('username')
	fullusername = username
	if username.find("@") == -1:
		fullusername = username + "@" + settings.DOMAIN

	password = request.POST.get('password')
	if not request.session.test_cookie_worked():
		#set the cookie again to see if it works
		request.session.set_test_cookie()
		if not request.session.test_cookie_worked():
			errors['general'] = ['You do not seem to be accepting cookies. Please enable them and try again.']


	ip_address = request.META.get('HTTP_X_FORWARDED_FOR',
				      request.META.get('REMOTE_ADDR',
						       '')).split(', ')[-1]
	#Validate username and password via PunJab
	try:
		pc = PunjabClient(fullusername+random_resource(),
				  password,
				  host=settings.PUNJAB_HOST)
		headers =  {'Content-type': 'text/xml',
			    'X-Forwarded-For': ip_address,
			    'User-Agent': request.META.get('HTTP_USER_AGENT'),
			    'Accept': 'text/xml'}
			
		pc.startSessionAndAuth(hold='1',
				       wait='60',
				       headers = headers)
		if not pc.logged_in:
			raise NoSession
		if not pc.sid:
			raise NoSession
		ret_str = pc.sid+'_'+unicode(pc.rid)+'_'+pc.jid+'_'+pc.resource
		pcjid = pc.jid
		pcresource = pc.resource
	except (NoSession,socket.gaierror,socket.error), ex:
		errors['username'] = ['Unable to authenticate with username or password. '+str(ex)]

	return errors


def create_django_session(request):
	""" create django session."""
	username = request.POST.get('username')
	fullusername = username
	if username.find("@") == -1:
		fullusername = username + "@" + settings.DOMAIN
	password = request.POST.get('password');
	request.session['user_password'] = password
				
	user,created = User.objects.get_or_create(username=fullusername)
	#set the given password
	user.set_password(password)
	user.save()
	user = auth.authenticate(username=user.username,
				 password=password)
	
	
	auth.login(request, user)
	

def ajax_login(request):
	"""Used to login via ajax."""
	
	username = request.POST.get('username',None)
	response_string = "<login msg=''>invalid</login>"
	valid = False
	try:
		if username:
			errors = xmpp_auth(request)
			if not errors:
				create_django_session(request)
				valid = True
			else:
				response_string="<login msg=\""+str(errors.values()[0][0])+"\">invalid</login>"
	except Exception,ex:
		response_string = "<login msg=\"Error:"+str(ex)+"\">invalid</login>"
	if valid:
		response_string = "<login msg=''>valid</login>"
	return HttpResponse(response_string,mimetype="text/xml")
	
def login(request):
	
	redirect_to = request.REQUEST.get('next', '/')
	redirect_to = redirect_to.replace("%3A",":")
	errors = {}
	ret_response = None
	ret_str = None
	pcjid = None
	pcresource = None

	if request.method == "POST":
		
		errors = xmpp_auth(request)
		
		#authenticate to django and update user object
		if not errors:
			try:
				create_django_session(request)
				
				ret_response = HttpResponseRedirect(redirect_to)
				
			except Exception, ex:
				errors['username'] = ['Error with username or password. ']
				ret_response = render_response(request,
							       'registration/login.html',
							       {'errors': errors,
								'next': redirect_to})				
		else:
			ret_response = render_response(request,
						       'registration/login.html',
						       {'errors': errors,
							'next': redirect_to})
	else:
		
		request.session.set_test_cookie()
		ret_response = render_response(request,
					     'registration/login.html',
					     {'errors': errors,
					      'next': redirect_to})
	return ret_response

def demo_client(request,theme_name):
	"""Special view for demo. """

	return client(request,room_name="speeqers",theme_name=theme_name)

def client(request,room_name=None,theme_name=None):
	"""Start up the chat client with the requested room """
	room = room_name
	if not room:
		#default room is speeqers
		room = request.GET.get('room',"speeqers")
		
	if not theme_name:
		theme = request.GET.get('theme',room)
	else:
		theme = request.GET.get('theme',theme_name)


	#detect iphone and force use of iphone theme
	user_agent = request.META.get('HTTP_USER_AGENT','')
	if (user_agent.lower().find("ipod") != -1) or \
	       (user_agent.lower().find("iphone") != -1):
		theme = "iphone"
	
	userpassword = None
	pcjid = None
	pcresource = None
	fullusername = request.user.username
	ip_address = request.META.get('HTTP_X_FORWARDED_FOR',
				      request.META.get('REMOTE_ADDR', '')).split(', ')[-1]
	if not 'nologin' in request.GET and request.user.is_authenticated(): 

		userpassword = request.session.get('user_password',None)
		
		if 'cred' in request.GET and userpassword:
			
			resp = HttpResponse(userpassword)
			resp['Expires'] = datetime.datetime.now().strftime('%a, %d %b %Y %T GMT')
			return resp
	room_theme = "client.html"
	try:
	
		room_theme = get_template("themes/"+theme+"_client.html")
	except:
		room_theme = get_template("client.html")
	
	return render_response(request,
			       'autologinclient.html',
			       {'username': fullusername,
				'userpassword': userpassword,
				'pcjid':pcjid,
				'pcresource':pcresource,
				'ip_address': ip_address,
				'room':room,
				'theme':theme,
				'room_theme':room_theme})


def random_resource():
	"""return random client resource """
	retval = "/spc"

	for i in range(5):
		retval += random.choice(string.letters)
	return retval

def room_message_search(request,room=None):
	"""Search rooms for chat history. """
	if not room:
		room = request.GET.get('room',None)
	user = request.GET.get('user',None)
	q = request.GET.get('q',None)
	message_type = request.GET.get('message_type',3)
	start_date = request.GET.get('start_date',None)
	end_date = request.GET.get('end_date',None)
	
	
	return render_response(request,
			       'messagesearch.html',
			       {'room':room})

@login_required
def list_themes(request):
	"""List a user's themes. """


	themes = Theme.objects.filter(owner=request.user)
	
	return render_response(request,
			       'listthemes.html',
			       {'themes':themes})

@login_required
def new_theme(request):
	"""Create a new theme, using the client.html template as the default. """
	context = {}
	theme_form = None
	if request.method == "POST":
		#Validate and save the theme
		theme_form = ThemeForm(request.POST)
		if theme_form.is_valid():
			name = theme_form.clean_data['name']
			content = theme_form.clean_data['content']
			owner = request.user
			theme = Theme(name=name,
				      content=content,
				      owner=owner)
			theme.save()
			#Return edit theme template on successful
			#theme creation
			context['message'] = "Successfully Created Theme."
			context['form'] = theme_form
			
			return_response = render_response(request,
							  'edittheme.html',
							  context)
		else:
			context['form'] = theme_form
			return_response = render_response(request,
							  'newtheme.html',
							  context)   
		
	else:
		#set initial context as client.html
		rendered = render_to_string('client.html', {})
		theme_form = ThemeForm(initial={'content':rendered})
		context['form'] = theme_form
		return_response = render_response(request,
						  'newtheme.html',
						  context)
	return return_response

@login_required
def edit_theme(request,theme_id=None):
	
	context = {}
	theme = get_object_or_404(Theme,id=theme_id)
	if request.method == "POST":
		#Validate and save the theme
		theme_form = ThemeForm(request.POST)
		if theme_form.is_valid():			
			theme.name=theme_form.clean_data['name']
			theme.content=theme_form.clean_data['content']
			theme.owner=request.user
			theme.save()

		context['form'] = theme_form
	else:
		theme_form = ThemeForm({'name':theme.name,
				       'content':theme.content})
		context['form'] = theme_form
		
	return render_response(request,
			       'edittheme.html',
			       context)

@login_required
def link_theme_to_room(request):
	"""Link a theme to a room that is owned by the user. """
	retval = "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>"
	
	if request.method == "POST":
		theme_id = request.POST.get('theme',None)
		room = request.POST.get('room',None)
		user = request.user.username

		#test if user is room owner
		try:
			password = request.session.get('user_password',None)
			username = request.user.username
			if not xmpp.check_room_owner(username=username,
						     password=password,
						     room=room):
			        #return error that user is not room owner
				retval += "<themelink msg='not room owner'>invalid</themelink>"
			else:
			        #copy theme content to room template

				users_theme = Theme.objects.get(id=int(theme_id),
								owner=request.user)
				file_content = users_theme.content
				
				f = open(settings.THEME_ROOT+"/"+room+"_client.html",'w')
				f.write(file_content)
				f.close()
				retval += "<themelink>success</themelink>"
		
		except Exception, ex:
			retval += "<themelink msg=\""+str(ex)+"\">invalid</themelink>"
	else:
		retval += "<themelink>invalid</themelink>"
	return HttpResponse(retval,mimetype="text/xml")


def send_confirmation(request):
	"""Sends a confirmation email to those signing up to learn
	more about speeqe.  Used for the first demo version of speeqe."""

	
	email = request.GET.get('email',None)
	retval = "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>"

	try:
		message_t = EmailMessageTemplate.objects.get(name="demo_confirmation_email")
		#generate uniq url
		url = "http://"+settings.DOMAIN+"/demo_email/?url="
		code = generate_code(6)
		url += code 
		t = Template(message_t.template)
		c = Context({'email':email,
			     'url':url})
		message = t.render(c)
		email_confirmation,created = EmailConfirmation.objects.get_or_create(email=email)

		if created:
			send_email(email,
				   'Speeqe Email Confirmation',
				   message,
				   sender=settings.HELP_EMAIL,
				   frm=settings.HELP_EMAIL)
			email_confirmation.code = code
			email_confirmation.save()
		
		retval += "<emailconfirmation>valid</emailconfirmation>"
	except Exception, ex:
		retval += "<emailconfirmation msg='"+str("Error sending email.")+"'>invalid</emailconfirmation>"
		  
	return HttpResponse(retval,mimetype="text/xml")


def confirm_email(request):
	"""Confirm a users email with the generated code."""
	context = {}
	code = request.GET.get('url')
	try:
		email_confirmation = EmailConfirmation.objects.get(code=code)
		email_confirmation.confirmed=True
		email_confirmation.save()
		context['message'] = "Email confirmed."
	except EmailConfirmation.DoesNotExist:
		context['message'] = "Unknown code."
		       
	

	return render_response(request,
			       'confirmemail.html',
			       context)


def submit_log(request):

	description = request.POST.get('description',"No description.")
	log = request.POST.get('debuglog',None)
	response_string = "<submitlog msg=\"Error\">invalid</submitlog>"
	valid = False
	try:
		if log:
			#translate log data
			log = log.replace('&','&amp;')
			log = log.replace('<','&lt;')
			log = log.replace('>','&gt;')
			file_date = datetime.datetime.now().strftime('%a_%d_%b_%Y_%T')
			file_name = "/"+file_date+"_log.html"
			f = open(settings.LOG_ROOT+file_name,'w')
			f.write("<html><head><link rel=\"stylesheet\" type=\"text/css\" src=\"/speeqewebclient/scripts/firebug/firebug.css\"></link></head><body>"+log+"</body></html>")
			f.close()
			log_url = "http://" + settings.DOMAIN + "/debuglogs/" + file_name
			message = description + "\n\n" + log_url
			
			send_email(settings.HELP_EMAIL,
				   'Speeqe Problem Report',
				   message,
				   sender=settings.HELP_EMAIL,
				   frm=settings.HELP_EMAIL)
			valid = True
		else:
			response_string="<submitlog msg=\"No log submitted.\">invalid</submitlog>"
	except Exception,ex:
		response_string = "<submitlog msg=\"Error:"+str(ex)+"\">invalid</submitlog>"
	if valid:
		response_string = "<submitlog msg=''>valid</submitlog>"
	return HttpResponse(response_string,mimetype="text/xml")	
