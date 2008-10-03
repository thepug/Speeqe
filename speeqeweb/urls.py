from django.conf.urls.defaults import *
from django.conf import settings


urlpatterns = patterns('',
    (r'^avatar-service/',   include('speeqeweb.avatars.urls')),
    (r'^join/validate/username/','speeqeweb.speeqe.views.validate_username'),
    (r'^join/validate/email/','speeqeweb.speeqe.views.validate_email'),
    (r'^join/','speeqeweb.speeqe.views.join'),
    (r'^virtualhost/(?P<room_name>[\w|\@|\_|:|\+|&|\-]+)\..+/','speeqeweb.speeqe.views.client'),
    (r'^demo/(?P<theme_name>\w+)\..+/','speeqeweb.speeqe.views.demo_client'),
    (r'^room/(?P<room_name>[\w|\@|\.|\_|:|\+|&|\-]+)/','speeqeweb.speeqe.views.client'),
    (r'^client/room/(?P<room_name>[\w|\@|\.|\_|:|\+|&]+)/','speeqeweb.speeqe.views.client'),
    (r'^client/','speeqeweb.speeqe.views.client'),
    (r'^accounts/login/$', 'speeqeweb.speeqe.views.login'),
    (r'^accounts/ajax_login/$', 'speeqeweb.speeqe.views.ajax_login'),
    (r'^accounts/logout/$', 'django.contrib.auth.views.logout'),
    (r'^messagesearch/(?P<room>[\w|\@|\.|\_|:|\+|&]+)/', 'speeqeweb.speeqe.views.room_message_search'),   
    (r'^messagesearch/$', 'speeqeweb.speeqe.views.room_message_search'),
    (r'^themes/new/$', 'speeqeweb.speeqe.views.new_theme'),
    (r'^themes/edit/(?P<theme_id>\d+)/', 'speeqeweb.speeqe.views.edit_theme'),
    (r'^themes/link/', 'speeqeweb.speeqe.views.link_theme_to_room'),
    (r'^themes/$', 'speeqeweb.speeqe.views.list_themes'),
    (r'^demo_email/send/', 'speeqeweb.speeqe.views.send_confirmation'),
    (r'^demo_email/', 'speeqeweb.speeqe.views.confirm_email'),
    (r'^submit_log/', 'speeqeweb.speeqe.views.submit_log'),
    # Uncomment this for admin:
    (r'^admin/', include('django.contrib.admin.urls')),
                       
    (r'^$','speeqeweb.speeqe.views.index'),
    (r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.DOCUMENT_ROOT }),                      
)
