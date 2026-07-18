from django.contrib import admin
from .models import *

@admin.register(DarkhastFinance)
class DarkhastFinanceAdmin(admin.ModelAdmin):
    list_display = ('board', 'sets')
    search_fields = ('board__name',)  


@admin.register(PaletFinance)
class PaletFinanceAdmin(admin.ModelAdmin):
    list_display = ('part_number', 'quantity', 'status', 'description', 'order')
    list_filter = ('status', 'order')  
    search_fields = ('part_number', 'order__id') 



@admin.register(PaletPartFinance)
class PaletPartFinanceAdmin(admin.ModelAdmin):
    list_display = ('req', 'part', 'quantity')
    search_fields = ('req__board__name', 'part__name')



@admin.register(UsedOrders)
class UsedOrdersAdmin(admin.ModelAdmin):
    list_display = ('board', 'orders')
    search_fields = ('board__name',)