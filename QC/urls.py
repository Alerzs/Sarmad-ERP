from django.urls import path
from .views import *

urlpatterns = [
    path('open-file-QC/', open_file_QC, name='open_file_QC'),
    path('qc_boards/', qc_boards, name='qc_boards'),
    path('request/', request_qc, name='request_qc'),
    path('panel_qc/', panel_qc, name='panel_qc'),
    path('panel_qc/<str:reqid>', panel_qc_details, name='panel_qc_details'),
    path('add_template_QC', add_template_QC, name='add_template_QC'),
    path('send_to_sepehr/', send_to_sepehr, name='send_to_sepehr'),
    path('sepehr_qc/', sepehr_qc, name='sepehr_qc'),
    path('sepehr_qc/<int:pk>', sepehr_qc_details, name='sepehr_qc_details'),
    path('get_stock/<int:pk>', get_stock, name='get_stock'),
    path('sepehr_history/<int:pk>', sep_history_details, name='sep_history_details'),
    path('sepehr_history/', sep_history, name='sep_history'),
    path('send_to_AS/', send_to_AS, name='send_to_AS'),
    
    ]