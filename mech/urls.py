from django.urls import path
from .views import *

urlpatterns = [
    path('open-file/', open_file, name='open_file'),
    path('save-file/', save_file, name='save_file'),
    path('materials/', materials , name='materials'),
    path('materials/edit/', materials_edit , name='materials_edit'),
    path('parts/', parts , name='part_mech_list'),
    path('part_add/', part_add , name='part_mech_add'),
    path('projects/', projects , name='project_mech'),
    path('projects/<str:project_name>/', project_details , name='project_mech_details'),
    path('projects/<str:project_name>/<str:name_version>', project_details_part , name='project_mech_details_part'),
    path('material_select/', material_select , name='material_select'),
    path('material_select/<int:mat_id>/', operation_create , name='operation_create'),
    path('operation_mat/', operation_mat , name='operation_mat'),
    path('operation_part/', operation_part , name='operation_part'),
    path('send_assemble/', send_assemble , name='send_assemble'),
    path('parting/', parting , name='parting'),
    path('add_file/', add_file_mech , name='add_file_mech'),
    path('save_file/', save_file_mech , name='save_file_mech'),
    path('add_product/', add_product , name='add_product'),
    path('save_product', save_product, name='save_product'),
    path('all_products/', all_products , name='all_products_mech'),
    path('all_products/<int:pk>', product_details , name='product_details'),
    path('send_request', send_request , name='send_request'),
    path('panel_mech', panel_mech , name='panel_mech'),
    path('panel_mech/<int:pk>', panel_mech_details , name='panel_mech_details'),
    ]
