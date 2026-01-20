from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('signup/', views.signup, name='signup'),
    path('api/events/', views.api_events, name='api_events'),
    path('api/events/<int:event_id>/', views.api_events, name='api_event_detail'),
    path('api/copy-prev-week/', views.copy_previous_week, name='copy_prev_week'),
]
