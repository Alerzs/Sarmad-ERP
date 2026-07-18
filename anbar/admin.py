from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from simple_history.admin import SimpleHistoryAdmin

from .models import *


# ---------- Inlines ----------

class BOMInline(admin.TabularInline):
    model = BOM
    extra = 0
    fields = ("part_number", "designators", "count", "status", "description", "datasheet")
    show_change_link = True


class BoardOperationInline(admin.TabularInline):
    model = BoardOperation
    extra = 0
    fields = ("operator", "start", "end", "description")
    show_change_link = True
    autocomplete_fields = ("operator",)


class PaletInline(admin.TabularInline):
    """Useful when inspecting BOMs; shows allocations from inventory."""
    model = Palet
    extra = 0
    fields = ("part", "quantity", "req", "palet_anbar")
    autocomplete_fields = ("part", "req", "palet_anbar")


# ---------- ModelAdmins ----------

@admin.register(Order)
class OrderAdmin(SimpleHistoryAdmin):
    list_display = ("order_number", "order_date", "short_description")
    search_fields = ("order_number", "description")
    date_hierarchy = "order_date"
    ordering = ("-order_date", "order_number")

    @admin.display(description=_("description"))
    def short_description(self, obj):
        return (obj.description[:60] + "…") if obj.description and len(obj.description) > 60 else obj.description


@admin.register(Part)
class PartAdmin(SimpleHistoryAdmin):
    list_display = (
        "id",
        "part_number",
        "order",
        "failure",
        "count",
        "reserve",
        "price",
        "freeze",
        "changed_request",
    )
    list_filter = ("failure", "order")
    search_fields = ("part_number", "description", "changed_request")
    autocomplete_fields = ("order",)
    list_select_related = ("order",)
    ordering = ("part_number",)

    fieldsets = (
        (None, {
            "fields": ("id", "order", "part_number", "package", "part_value", "description")
        }),
        (_("Status & Quantities"), {
            "fields": ("failure", "count", "reserve", "price", "freeze", "changed_request")
        }),
    )


@admin.register(Project)
class ProjectAdmin(SimpleHistoryAdmin):
    list_display = ("name",)
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Board)
class BoardAdmin(SimpleHistoryAdmin):
    list_display = ("pk","part_number", "title", "project_name", "status", "name", "version", "serial")
    list_filter = ("status", "project_name")
    search_fields = ("part_number", "title", "name", "version", "serial")
    inlines = (BOMInline, BoardOperationInline)
    ordering = ("part_number","pk")
    list_select_related = ("project_name",)


@admin.register(BOM)
class BOMAdmin(admin.ModelAdmin):
    list_display = ("board", "part_number", "status", "count", "short_description")
    list_filter = ("status",)
    search_fields = ("part_number", "description", "designators", "board__part_number", "board__title")
    autocomplete_fields = ("board",)
    inlines = (PaletInline,)
    ordering = ("board", "part_number")
    list_select_related = ("board",)

    @admin.display(description=_("description"))
    def short_description(self, obj):
        return (obj.description[:60] + "…") if obj.description and len(obj.description) > 60 else obj.description


@admin.register(Darkhast)
class DarkhastAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "for_user", "date", "status", "req_type")
    list_filter = ("status", "req_type", "date")
    search_fields = ("description", "user__username", "for_user__username")
    autocomplete_fields = ("user", "for_user")
    date_hierarchy = "date"
    ordering = ("-date", "id")


@admin.register(PaletAnbar)
class PaletAnbarAdmin(admin.ModelAdmin):
    list_display = ("number", "total_quantity")
    search_fields = ("number",)
    ordering = ("number",)

    @admin.display(description=_("total quantity"))
    def total_quantity(self, obj: PaletAnbar):
        return obj.cal_qnt()


@admin.register(Palet)
class PaletAdmin(admin.ModelAdmin):
    list_display = ("bom", "part", "quantity", "req", "palet_anbar")
    list_filter = ("palet_anbar",)
    search_fields = (
        "bom__part_number",
        "bom__board__part_number",
        "part__part_number",
        "req__description",
    )
    autocomplete_fields = ("bom", "part", "req", "palet_anbar")
    list_select_related = ("bom", "part", "req", "palet_anbar")
    ordering = ("bom",)


@admin.register(Mafghood)
class MafghoodAdmin(admin.ModelAdmin):
    list_display = ("maf_part", "quantity", "req")
    search_fields = ("maf_part", "req__description")
    autocomplete_fields = ("req",)


@admin.register(BoardOperation)
class BoardOperationAdmin(admin.ModelAdmin):
    list_display = ("board", "operator", "start", "end", "computed_duration")
    date_hierarchy = "start"
    search_fields = ("board__part_number", "board__title", "operator__username", "description")
    autocomplete_fields = ("board", "operator")
    list_select_related = ("board", "operator")
    ordering = ("-start",)

    @admin.display(description=_("duration"))
    def computed_duration(self, obj: BoardOperation):
        return obj.duration()


@admin.register(SepehrQC)
class SepehrQCAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'board', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('user__username', 'board__name')
    ordering = ('-date',)


@admin.register(ReStock)
class ReStockAdmin(admin.ModelAdmin):
    list_display = ('id', 'res_part', 'quantity', 'sep_req')
    list_filter = ('res_part',)
    search_fields = ('res_part__name', 'sep_req__user__username')