from django.contrib import admin
from .models import *

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('status','type', 'length', 'width', 'hight', 'alloy', 'order')
    list_filter = ('type', 'alloy')
    search_fields = ('alloy', 'order')

@admin.register(Tools)
class ToolsAdmin(admin.ModelAdmin):
    list_display = ('index', 'condition')
    list_filter = ('condition',)
    search_fields = ('index',)

@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = ('project_name','part_number', 'name', 'version', 'serial', 'status', 'material')
    list_filter = ('status',)
    search_fields = ('part_number', 'serial')

@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ('material', 'operator', 'start', 'end', 'duration')
    list_filter = ('operator',)
    search_fields = ('material__alloy', 'description')


@admin.register(PartOperation)
class PartOperationAdmin(admin.ModelAdmin):
    list_display = ('part', 'operator', 'start', 'end', 'duration')
    list_filter = ('operator',)


@admin.register(PartPack)
class PartPackAdmin(admin.ModelAdmin):
    list_display = ('product', 'part')
    search_fields = ('productnumber',)


@admin.register(DarkhastMech)
class DarkhastMechAdmin(admin.ModelAdmin):
    list_display = ('status', 'date')
    list_filter = ('status',) 


@admin.register(DarkhastMechPart)
class DarkhastMechPartAdmin(admin.ModelAdmin):
    list_display = ('part', 'req', 'quantity')  
    list_filter = ('req__status',)