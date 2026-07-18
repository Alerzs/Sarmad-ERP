from django.urls import path
from .views import *

urlpatterns = [
    path('elec_parts/', elec_parts, name='assembly'),
    path('mech_parts/', mech_parts, name='mech_parts'),
    path('add_tree/', add_tree, name='add_tree'),
    path('download-tree-template/', add_template, name='download-tree-template'),
    path('all_tree/', all_tree, name='all_tree'),
    path('create_product/', create_product, name='create_product'),
    path('save_product_assembly/', save_product_assembly, name='save_product_assembly'),
    path('all_products/', all_products, name='all_products'),
    path('all_products/<int:pk>', product_details, name='product_details_as'),
    path('all_products/board/<str:PN>', board_product_details, name='board_product_details'),
    path('all_products/part/<str:PN>', part_product_details, name='part_product_details'),
    path('edit_product/<int:pk>', edit_product, name='edit_product'),
    path('bom_details/<int:pk>', bom_details, name='bom_details_as'),
    path('product_flow', product_flow, name='product_flow'),
    path('flow_details/<str:project>/<str:filter>', flow_details, name='flow_details'),
    ]