from django.db import models
from anbar.models import Project, Board


class Tree(models.Model):

    DEPARTMENT_CHOICES = [
        ('MEC', 'Mechanic'),
        ('ELC', 'Electronic'),
        ('SFT', 'Software')
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    department = models.CharField(max_length=3, choices=DEPARTMENT_CHOICES)
    partnumber = models.CharField(max_length=10)
    quantity = models.PositiveSmallIntegerField()


class Product(models.Model):

    productnumber = models.CharField(max_length=25)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)


class BoardPack(models.Model):

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    board = models.OneToOneField(Board, on_delete=models.CASCADE)




