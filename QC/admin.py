from django.contrib import admin
from .models import QCRequest


@admin.register(QCRequest)
class QCRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'operator', 'date')
    list_filter = ('date', 'sender', 'operator')
    search_fields = ('sender__username', 'operator__username')
    date_hierarchy = 'date'
    ordering = ('-date',)

