import django_filters
from .models import SensorData

class SensorDataFilter(django_filters.FilterSet):
    start_time = django_filters.IsoDateTimeFilter(field_name="timestamp", lookup_expr="gte")
    end_time = django_filters.IsoDateTimeFilter(field_name="timestamp", lookup_expr="lte")
    min_temp = django_filters.NumberFilter(field_name="temperature", lookup_expr="gte")
    max_temp = django_filters.NumberFilter(field_name="temperature", lookup_expr="lte")

    class Meta:
        model = SensorData
        fields = ['device', 'start_time', 'end_time', 'min_temp', 'max_temp']
