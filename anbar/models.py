from django.db import models
from django.contrib.auth.models import User
from django.db.models import Sum
from simple_history.models import HistoricalRecords
from datetime import timedelta
from QC.models import QCRequest


class Order(models.Model):

    STATUS_CHOICE = [
        ('PRE','PreOrder'),
        ('ORD','Ordered'),
        ('RCV', 'Received')
    ]
    status = models.CharField(max_length=3, choices=STATUS_CHOICE, default='PRE')
    order_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    order_date = models.DateField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.order_number
    

class Part(models.Model):

    FAILURE_CHOICE = [
        ('REJECT','rejected'),
        ('ACCEPT','accepted'),
        ('COND1','conditional type_1'),
        ('COND2','conditional type_2'),
        ('COND3','conditional type_3')
    ]
    id = models.IntegerField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    part_number = models.CharField(max_length=50)
    package = models.CharField(max_length=15, blank=True, null=True)
    part_value = models.CharField(max_length=10, blank=True, null=True)
    failure = models.CharField(max_length=6, choices=FAILURE_CHOICE, default='ACCEPT')
    description = models.TextField(blank=True, null=True)
    count = models.PositiveIntegerField()
    reserve = models.IntegerField(default=0)
    price = models.PositiveSmallIntegerField(default=0)
    freeze = models.SmallIntegerField(default=0)
    changed_request = models.CharField(max_length=20, default='System')
    history = HistoricalRecords()

    def get_history_changes(self):
        history_qs = self.history.all().order_by('history_date')
        if history_qs.count() <= 1:
            return []
        changes = []
        previous = None
        for instance in history_qs:
            if previous:
                diff = instance.diff_against(previous)
                if diff.changes:
                    changes.append({
                        'history_instance': instance,
                        'previous_instance': previous,
                        'changes': diff
                    })
            previous = instance
        return changes
    
    def __str__(self):
        return self.part_number


class Project(models.Model):
    name = models.CharField(max_length=20)
    history = HistoricalRecords()

    def __str__(self):
        return self.name


class Board(models.Model):

    STATUS_CHOICE = [
        ('NR','Not Received'),
        ('OR', 'Ordered'),
        ('RC', 'Received'),
        ('RB','Raw Board'),
        ('PD', 'Pending'),
        ('PA','Partial Assemble'),
        ('CA','Complete Assemble'),
        ('QC','Sent to QC'),
        ('SP','Sepehr QC'),
        ('AS','Assembly'),
        ('FN','Finished'),
    ]

    title = models.CharField(max_length=20, blank=True, null=True)
    part_number = models.CharField(max_length=30, unique=True, blank=True, null=True)
    project_name = models.ForeignKey(Project, on_delete=models.CASCADE, blank=True, null=True)
    status = models.CharField(max_length=2, default="NR" ,choices=STATUS_CHOICE)
    name = models.CharField(max_length=5, blank=True, null=True)
    version = models.CharField(max_length=5, blank=True, null=True)
    serial = models.CharField(max_length=5, blank=True, null=True)
    qc_req = models.ForeignKey(QCRequest, on_delete=models.CASCADE, blank=True, null=True)
    history = HistoricalRecords()

    def is_complete(self):
        if self.status in ['QC','RC','OR','NR','SP','AS','FN']:
            return self.status
        has_ept, has_asm = False, False
        for b in self.bom_set.all():
            if b.status in ("AS", "TV"):
                has_asm = True
            elif b.status == "EPT":
                has_ept = True
            else:
                return "PD"
        if has_asm and has_ept:
            return "PA"
        elif has_asm:
            return "CA"
        return "RB"
    
    def __str__(self):
        return f"{self.title}V{self.version}"


class BOM(models.Model):

    STATUS_CHOICE = [
        ('PND','pending'),
        ('TV','tahvil'),
        ('AS','asselmbled'),
        ('EPT','empty'),
    ]

    board = models.ForeignKey(Board ,on_delete=models.CASCADE)
    part_number = models.CharField(max_length=50)
    designators = models.TextField()
    description = models.TextField(blank=True, null=True)
    datasheet = models.FileField(blank=True, null=True)
    count = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, default="EPT", choices=STATUS_CHOICE)


        
class Darkhast(models.Model):

    STATUS_CHOICE = [
        ('ACC','accepted'),
        ('REJ','rejected'),
        ('PND','pending')
    ]
    TYPE_CHOICE = [
        ('FIN', 'Finance'),
        ('ASS', 'Assemble'),
        ('COM', 'Completion'),
        ('MAF', 'Mafghood'),
        ('QC', 'QC'),
        ('MCH', 'Mechanic')
    ]

    user = models.ForeignKey(User ,on_delete=models.SET_NULL, null=True ,related_name='user')
    for_user = models.ForeignKey(User ,on_delete=models.SET_NULL, null=True ,related_name='for_user')
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=3, choices=STATUS_CHOICE, default='PND')
    description = models.TextField()
    req_type = models.CharField(max_length=3, choices=TYPE_CHOICE, blank=True, null=True)


class PaletAnbar(models.Model):

    number = models.SmallIntegerField()
    def cal_qnt(self):
        return self.palet_set.aggregate(total=Sum('quantity'))['total'] or 0


class Palet(models.Model):

    bom = models.ForeignKey(BOM, on_delete=models.CASCADE)
    quantity =  models.IntegerField()
    part = models.ForeignKey(Part ,on_delete=models.CASCADE)
    req = models.ForeignKey(Darkhast ,on_delete=models.CASCADE)
    palet_anbar = models.ForeignKey(PaletAnbar ,on_delete=models.CASCADE, blank=True, null=True)


class BoardOperation(models.Model):
    TYPE_CHOICE = [
        ('QC', 'QC'),
        ('AS', 'Assemble'),
    ]

    board = models.ForeignKey(Board, on_delete=models.CASCADE,)
    operator = models.ForeignKey(User, on_delete=models.CASCADE, default=1)
    start = models.DateTimeField(blank=True, null=True)
    end = models.DateTimeField(null=True, blank=True)
    description = models.TextField()
    operation_type = models.CharField(max_length=2, choices=TYPE_CHOICE)
    
    def duration(self):
        if self.start and self.end:
            return self.end - self.start
        return None
    
    
    
class Mafghood(models.Model):

    maf_part = models.ForeignKey(Part, on_delete=models.CASCADE, blank=True, null=True)
    quantity = models.IntegerField()
    req = models.ForeignKey(Darkhast ,on_delete=models.CASCADE)


class SepehrQC(models.Model):

    STATUS_CHOICES = [
        ('ACC','accepted'),
        ('REJ','rejected'),
        ('NOR','not ordered'),
        ('PND','pending')
    ]
    
    user = models.ForeignKey(User ,on_delete=models.CASCADE)
    board = models.ForeignKey(Board, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=3, choices=STATUS_CHOICES, default='NOR')


class ReStock(models.Model):

    res_part = models.ForeignKey( Part ,on_delete=models.SET_NULL ,null=True)
    quantity = models.SmallIntegerField()
    sep_req = models.ForeignKey( SepehrQC,on_delete=models.CASCADE)