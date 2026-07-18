from django.http import HttpResponseForbidden

def has_permision(request, perm):
    if not request.user.groups.filter(name=perm).exists():
        return HttpResponseForbidden("You are not authorized to view this page.")
    return True
    