from django.db import models
from django.contrib.auth.models import User
from anbar.models import Project
from assembly.models import Product

class Material(models.Model):

    TYPE_CHOICE = [
        ('BILLET','billet'),
        ('SHEET','sheet'),
        ('SCRAP','scrap')
    ]
    STATUS_CHOICE = [
        ('EPT','empty'),
        ('PRT','has part'),
        ('SEP','separated')
    ]

    status = models.CharField(max_length=6, choices=STATUS_CHOICE, default='EPT')
    type = models.CharField(max_length=6, choices=TYPE_CHOICE)
    length = models.SmallIntegerField(blank=True, null=True)
    width = models.SmallIntegerField(blank=True, null=True)
    hight = models.SmallIntegerField(blank=True, null=True)
    alloy = models.CharField(max_length=25)
    order = models.CharField(max_length=25)


class Tools(models.Model):

    CONDITION_CHOICE = [
        ('REJ','rejected'),
        ('DMG','damaged'),
        ('INC','intact')
    ]

    index = models.CharField(max_length=40, unique=True)
    condition = models.CharField(max_length=3, choices=CONDITION_CHOICE)


class Part(models.Model):

    STATUS_CHOICE = [
        ('DUM','Dummy'),
        ('CON','Connected'),
        ('SEP','Separated'),
        ('ASM', 'Assembly'),
        ('FIN', 'Finished'),
    ]

    project_name = models.ForeignKey(Project, on_delete=models.CASCADE)
    status = models.CharField(max_length=3, default="CON" ,choices=STATUS_CHOICE)
    part_number = models.CharField(max_length=20)
    title = models.CharField(max_length=20)
    name = models.CharField(max_length=3)
    version = models.CharField(max_length=2)
    serial = models.CharField(max_length=5)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, blank=True, null=True)


class Operation(models.Model):

    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    operator = models.ForeignKey(User, on_delete=models.CASCADE)
    start = models.DateTimeField()
    end = models.DateTimeField()
    description = models.TextField()
    
    def duration(self):
        qnt = len(Part.objects.filter(material=self.material))
        if self.start and self.end:
            return (self.end - self.start)/qnt
        return None

class PartOperation(models.Model):

    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    operator = models.ForeignKey(User, on_delete=models.CASCADE)
    start = models.DateTimeField()
    end = models.DateTimeField()
    description = models.TextField()
    
    def duration(self):
        if self.start and self.end:
            return self.end - self.start
        return None


class PartPack(models.Model):

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    part = models.OneToOneField(Part, on_delete=models.CASCADE)


class DarkhastMech(models.Model):
    STATUS_CHOICE = [
        ('FIN','Finished'),
        ('PND','Pending')
    ]
    status = models.CharField(max_length=3, choices=STATUS_CHOICE, default='PND')
    date = models.DateField(auto_now_add=True)


class DarkhastMechPart(models.Model):

    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    req = models.ForeignKey(DarkhastMech, on_delete=models.CASCADE)
    quantity = models.SmallIntegerField()




    