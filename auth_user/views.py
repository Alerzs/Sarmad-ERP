from django.shortcuts import render ,redirect
import requests
from django.urls import reverse
from .models import User
from django.contrib.auth import authenticate, login


def login_page(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if user.groups.filter(name='admin').exists():
                return redirect(reverse('part_list'))
            elif user.groups.filter(name='mech').exists():
                return redirect(reverse('materials'))
            elif user.groups.filter(name='assemble').exists():
                return redirect(reverse('panel_assemble'))
            elif user.groups.filter(name='anbardar').exists():
                return redirect(reverse('part_list'))
        else:
            return render(request, 'login.html', {'error': 'Invalid credentials'})
    
    return render(request, 'login.html')