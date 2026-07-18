from django.db import models
from anbar.models import Part, Board, Order


class DarkhastFinance(models.Model):

    board = models.ForeignKey(Board, on_delete=models.CASCADE)
    sets = models.PositiveSmallIntegerField()


class PaletFinance(models.Model):
    STATUS_CHOICES=[
        ('AC','Accepted'),
        ('RJ', 'Rejected'),
        ('CN', 'Conditional'),
        ('ND','Not Determined'),
        ('NA','Not Available'),
    ]

    part_number = models.CharField(max_length=30)
    quantity =  models.PositiveSmallIntegerField()
    req = models.ForeignKey(DarkhastFinance ,on_delete=models.CASCADE, blank=True, null=True)
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default='ND')
    description = models.TextField()
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, blank=True, null=True)  




class PaletPartFinance(models.Model):

    req = models.ForeignKey(DarkhastFinance ,on_delete=models.CASCADE)
    part = models.ForeignKey(Part ,on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)


class UsedOrders(models.Model):

    board = models.OneToOneField(Board, on_delete=models.CASCADE)
    orders = models.CharField(max_length=100)







