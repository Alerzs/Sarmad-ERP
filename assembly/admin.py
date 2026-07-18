from django.contrib import admin
from .models import *

@admin.register(Tree)
class TreeAdmin(admin.ModelAdmin):
    list_display = ('project', 'department', 'partnumber', 'quantity')
    search_fields = ('partnumber',)
    list_filter = ('department',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('productnumber', 'project')
    list_filter = ('project',)
    search_fields = ('productnumber', 'project__name')
    ordering = ('productnumber',)


@admin.register(BoardPack)
class BoardPackAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'board')
    list_filter = ('product',)
    search_fields = ('product__productnumber', 'board__title')

