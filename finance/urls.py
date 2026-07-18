from django.urls import path
from .views import *

urlpatterns = [    
    path('finance_estimate/', finance_estimate, name ='finance_estimate'),
    path('finance_acc/', finance_acc, name ='finance_acc'),
    path('panel_finance/', panel_finance, name ='panel_finance'),
    path('panel_finance/<int:pk>', panel_finance_details, name ='panel_finance_details'),
    path('panel_finance/acc/<int:pk>', panel_finance_acc, name ='panel_finance_acc'),
    path('orders/', order_list, name ='order_list'),
    path('delete-order/<int:pk>', order_del, name ='order_del'),
    path('orders/<int:pk>', order_details, name ='order_details'),
    path('payment/<int:pk>', payment_details, name ='payment_details'),
    path('shipment/<int:pk>', shipment_details, name ='shipment_details'),
    path('board_orders/', board_order_list, name ='board_order_list'),
    path('draft/', draft, name ='draft'),
    path('update-part/<int:pk>', update_part, name="update-part"),
    path('export_order/<int:pk>', export_order, name="export_order"),
    path('templates/', templates, name="templates"),
]