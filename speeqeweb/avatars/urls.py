from django.conf.urls.defaults import *

urlpatterns = patterns('speeqeweb.avatars.views',
    (r'^upload/$', 'upload'),
    (r'^lookup/$', 'lookup'),
)
