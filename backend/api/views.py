from rest_framework import viewsets, generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import Device, SensorData, Alert
from .serializers import (
    UserSerializer,
    UserRegisterSerializer,
    DeviceSerializer,
    SensorDataSerializer,
    AlertSerializer
)
from .filters import SensorDataFilter
from .email_service import send_registration_email, send_login_email

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Send welcome email notification
        send_registration_email(user)
        return Response({
            "user": UserSerializer(user).data,
            "message": "User registered successfully."
        }, status=status.HTTP_201_CREATED)

class LoginView(TokenObtainPairView):
    """Custom login view that sends an email notification on successful login."""
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Extract user and send login notification
            username = request.data.get('username', '')
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                # Try email lookup
                try:
                    user = User.objects.get(email=username)
                except User.DoesNotExist:
                    user = None
            if user:
                # Get client IP address
                ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'Unknown'))
                if ip and ',' in ip:
                    ip = ip.split(',')[0].strip()
                send_login_email(user, ip_address=ip)
        return response

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DeviceViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Users can only see and manage their own devices
        return Device.objects.filter(owner=self.request.user).order_by('name')

    def perform_create(self, serializer):
        # Automatically assign the current user as owner
        serializer.save(owner=self.request.user)

class SensorDataViewSet(viewsets.ModelViewSet):
    serializer_class = SensorDataSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filterset_class = SensorDataFilter

    def get_queryset(self):
        # Users can only see sensor data of their own devices
        return SensorData.objects.filter(device__owner=self.request.user).order_by('-timestamp')

    def perform_create(self, serializer):
        # Validation inside serializer makes sure user owns the device.
        # Just save normally.
        serializer.save()

class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filterset_fields = ('status', 'alert_type', 'device')

    def get_queryset(self):
        # Users can only see alerts associated with their own devices
        return Alert.objects.filter(device__owner=self.request.user).order_by('-timestamp')

    def perform_create(self, serializer):
        # Validation inside serializer makes sure user owns the device.
        serializer.save()

