from django import template
from django.utils.safestring import mark_safe
from json import dumps

register = template.Library()

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key, "")

@register.filter
def dict_get(dict_obj, key):
    if dict_obj and key:
        return dict_obj.get(key, 0)
    return 0

@register.filter(name='has_group')
def has_group(user, group_name):
    return user.groups.filter(name=group_name).exists()

@register.filter
def to_json(value):
    return mark_safe(dumps(value))

@register.filter
def merge_lists(list1, list2):
    return list(set(list(list1) + list(list2)))