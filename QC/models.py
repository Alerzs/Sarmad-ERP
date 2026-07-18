from django.db import models
from django.contrib.auth.models import User


class QCRequest(models.Model):

    TYPE_CHOICES= [
        ('RS', 'restock'),
        ('QC', 'qc')
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender')
    operator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='operator', blank=True, null=True)
    type = models.CharField(max_length=2 ,choices=TYPE_CHOICES)
    date = models.DateField(auto_now_add=True)






