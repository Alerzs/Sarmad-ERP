from django import forms
from django.forms import formset_factory
from .models import Project, Board

class UploadFileForm(forms.Form):
    file = forms.FileField()
    order_number = forms.CharField()

class ProjectInputForm(forms.Form):
    project_name = forms.CharField(max_length=20)

class BoardInputForm(forms.Form):
    name = forms.CharField(max_length=20)
    quantity = forms.IntegerField()


BoardFormSet = formset_factory(BoardInputForm, extra=1)
