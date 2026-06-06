from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, LogoutView, DeviceViewSet, SensorDataViewSet, AlertViewSet
from .views_reports import DailyReportView, WeeklyReportView, MonthlyReportView

router = DefaultRouter()
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'sensor-data', SensorDataViewSet, basename='sensordata')
router.register(r'alerts', AlertViewSet, basename='alert')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    
    # Reports endpoints
    path('reports/daily/', DailyReportView.as_view(), name='daily_report'),
    path('reports/weekly/', WeeklyReportView.as_view(), name='weekly_report'),
    path('reports/monthly/', MonthlyReportView.as_view(), name='monthly_report'),
    
    # ViewSets
    path('', include(router.urls)),
]
