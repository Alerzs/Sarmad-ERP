from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .permisions import has_permision
from json import dumps, loads
import re
import requests
from django.http import JsonResponse, HttpResponse
from datetime import timedelta
import os
from django.core.paginator import Paginator
import shutil
from django.db import transaction
from django.db.models import OuterRef, Subquery, F, IntegerField, Count, Value ,TextField, functions
from collections import defaultdict
from django.utils.safestring import mark_safe
from .models import *
from anbar.models import Project
from assembly.models import Tree
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage

    

@login_required
def materials(request):
    has_permision(request, 'mech')
    if request.method == 'POST':
        types = request.POST.getlist('new_type[]')
        dims = request.POST.getlist('new_dimensions[]')
        alloys = request.POST.getlist('new_alloy[]')
        orders = request.POST.getlist('new_order[]')

        for t, d, a, o in zip(types, dims, alloys, orders):
            if t == 'SCRAP' or d == '-':
                length = width = hight = None
            else:
                try:
                    length, width, hight = map(int, d.split('x'))
                except:
                    length = width = hight = None 
            Material.objects.create(type=t, length=length, width=width, hight=hight, alloy=a, order=o)
        return redirect('materials')
    
    all_materials = Material.objects.all()
    type = request.GET.get('type')
    alloy = request.GET.get('alloy')
    order = request.GET.get('order')
    status = request.GET.get('status')
    page_number = request.GET.get('page', 1)

    if type:
        all_materials = all_materials.filter(type=type)
    if alloy:
        all_materials = all_materials.filter(alloy__icontains=alloy)
    if order:
        all_materials = all_materials.filter(order__icontains=order)
    if status:
        all_materials = all_materials.filter(status=status)

    paginator = Paginator(all_materials, 20)
    page_obj = paginator.get_page(page_number)


    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        mat_data = []
        for m in page_obj:
            if m.get_type_display() == 'scrap':
                dim='-'
            else:
                dim = f"{m.length}x{m.width}x{m.hight}"
            dic = {
                'id': m.pk,
                'type': m.get_type_display(),
                'dimension': dim,
                'alloy' : m.alloy,
                'order' : m.order,
                'status' : m.get_status_display(),
            }
            mat_data.append(dic)
        
        return JsonResponse({
            'mats': mat_data,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'num_pages': paginator.num_pages,
            'current_page': page_obj.number,
        })

    return render(request, 'material_list.html', {'materials': page_obj})


@login_required
def materials_edit(request):
    if request.method == "POST":
        data = loads(request.body)
        alloy = data.get("alloy")
        dim = data.get("dim")
        id = data.get("id") 
        order = data.get("order")
        my_mat = get_object_or_404(Material, id=id)
        if not re.match(r'^\d+x\d+x\d+$', dim):
            return redirect("materials")
        dim = dim.split('x')
        my_mat.order = order
        my_mat.alloy = alloy
        my_mat.length = dim[0]
        my_mat.width = dim[1]
        my_mat.hight = dim[2]  
        my_mat.save()



@login_required
def parts(request):
    has_permision(request, 'mech')
    parts = Part.objects.filter(status='DUM')
    return render(request, 'part_mech_list.html', {'parts': parts})


@login_required
def part_add(request):
    has_permision(request, 'mech')
    part_qs = Part.objects.values_list('project_name__name', 'title', 'name', 'version').distinct()
    
    part_map = {f"{p}::{t}": pid for p, t, pid, _ in part_qs}
    version_map = defaultdict(list)
    for p, t, _, v in part_qs:
        key = f"{p}::{t}"
        if v not in version_map[key]:
            version_map[key].append(v)

    context = {
        'part_map_json': mark_safe(dumps(part_map)),
        'version_map_json': mark_safe(dumps(version_map))
    }

    if request.method == 'POST':
        projectname = request.POST.get('projectname')
        partname = request.POST.get('partname')
        part_id = request.POST.get('id')
        version = request.POST.get('version')
        step = request.FILES.get('step')
        qcp = request.FILES.get('qcp')
        pm = request.FILES.get('pm')

        with transaction.atomic():
            try:
                if step:
                    format = step.name.split('.')[-1]
                    fs = FileSystemStorage(location='C:/mech/STEP/')
                    filename = f"M{part_id}V{version}.{format}"
                    if fs.exists(filename):
                        fs.delete(filename)
                    fs.save(filename, step)
                if qcp:
                    format = qcp.name.split('.')[-1]
                    fs = FileSystemStorage(location='C:/mech/QCP/')
                    filename = f"M{part_id}V{version}.{format}"
                    if fs.exists(filename):
                        fs.delete(filename)
                    fs.save(filename, qcp)
                if pm:
                    format = pm.name.split('.')[-1]
                    fs = FileSystemStorage(location='C:/mech/PM/')
                    filename = f"M{part_id}V{version}.{format}"
                    if fs.exists(filename):
                        fs.delete(filename)
                    fs.save(filename, pm)
                if not partname or not part_id or not version:
                    return render(request, 'status_mech.html', {'title':'Failed', 'message':"Please fill all inputs"})
                project, created = Project.objects.get_or_create(name=projectname)
                my_part, part_created = Part.objects.get_or_create(title=partname, name=part_id, version=version,project_name=project, status='DUM')
                if part_created:
                    return render(request, 'status_mech.html', {'title':'Success', 'message':'Part was created.'})
                else:
                    return render(request, 'status_mech.html', {'title':'Success', 'message':"Part was edited successfully."})
            except Exception as e:
                context["error"]=str(e)
                return render(request, 'part_mech_add.html', context)
            
    return render(request, 'part_mech_add.html', context)


@login_required
def projects(request):
    has_permision(request, 'mech')
    projects = Project.objects.all()
    return render(request, 'project_mech_list.html', {'projects':projects})


@login_required
def project_details(request, project_name):
    has_permision(request, 'mech')
    con_count_subquery = (
    Part.objects
        .filter(
            project_name=OuterRef('project_name'),
            name=OuterRef('name'),
            version=OuterRef('version'),
            status='CON')
        .exclude(status='DUM')
        .values('project_name', 'name', 'version')
        .annotate(count=Count('id'))
        .values('count')[:1]
    )
    sep_count_subquery = (
    Part.objects
        .filter(
            project_name=OuterRef('project_name'),
            name=OuterRef('name'),
            version=OuterRef('version'),
            status='SEP')
        .exclude(status='DUM')
        .values('project_name', 'name', 'version')
        .annotate(count=Count('id'))
        .values('count')[:1]
    )
    all_parts = (
        Part.objects
        .filter(project_name__name=project_name)
        .annotate(same_connected=functions.Coalesce(Subquery(con_count_subquery), Value(0)), same_separated=functions.Coalesce(Subquery(sep_count_subquery), Value(0)))
    ).filter(status="DUM")
    return render(request, 'project_mech_details.html', {'parts':all_parts, 'prj':project_name})


@login_required
def project_details_part(request, project_name, name_version):
    has_permision(request, 'mech')
    name_version = name_version.split('-')
    latest_operation = PartOperation.objects.filter(part=OuterRef('pk')).order_by('-end')
    all_parts = Part.objects.filter(project_name__name=project_name,title=name_version[0],version=name_version[1]
    ).exclude(status='DUM').annotate(last_op=functions.Coalesce(Subquery(latest_operation.values('description')[:1]), Value('-', output_field=TextField())))

    operations_by_part = defaultdict(list)
    part_duration_totals = defaultdict(timedelta)
    operations = PartOperation.objects.filter(part__in=all_parts).select_related('part')
    for op in operations:
        operations_by_part[op.part_id].append(op)
        if op.start and op.end:
            part_duration_totals[op.part_id] += op.duration()

    operations_by_material = defaultdict(list)
    material_duration_totals = defaultdict(timedelta)
    material_ids = all_parts.values_list('material_id', flat=True)
    operations = Operation.objects.filter(material_id__in=material_ids).select_related('material')
    for op in operations:
        operations_by_material[op.material_id].append(op)
        if op.start and op.end:
            material_duration_totals[op.material_id] += op.duration()
    part_files = {}
    for part in all_parts:
        part_files[int(part.id)] = {
            'STEP': os.path.exists(os.path.join(r"C:\mech\STEP", f"M{part.name}V{part.version}.STEP")),
            'PM': os.path.exists(os.path.join(r"C:\mech\PM", f"M{part.name}V{part.version}.pm")),
            'QCP': os.path.exists(os.path.join(r"C:\mech\QCP", f"M{part.name}V{part.version}S{part.serial}.docx")),
        }

    return render(request, 'project_mech_details_part.html', {'parts': all_parts,'prj': f'{project_name}-{name_version[0]} V{name_version[1]}',
        'operations_by_part': dict(operations_by_part),'operations_by_material': dict(operations_by_material),'part_duration_totals': dict(part_duration_totals),
        'material_duration_totals': dict(material_duration_totals),"part_files":part_files})


@login_required
def material_select(request):
    has_permision(request, 'mech')
    if request.method == 'POST':
        mat_id = request.POST.get('mat_id')
        latest_versions = (
            Part.objects.filter(project_name=OuterRef('project_name'),title=OuterRef('title'),name=OuterRef('name'),status="DUM"
            ).annotate(version_int=functions.Cast('version', IntegerField())).order_by('-version_int').values('version')[:1])
        parts = (Part.objects.filter(status="DUM").annotate(latest_version=Subquery(latest_versions)).filter(version=F('latest_version')))
        return render(request, 'part_select.html', {'mat_id':mat_id, "parts":parts})
    
    all_materials = Material.objects.filter(status='EPT')
    return render(request, 'material_select.html', {'materials': all_materials})


@login_required
def operation_create(request, mat_id):
    has_permision(request, 'mech')
    if request.method == 'POST':
        part_ids = request.POST.getlist('part_id[]')
        quantities = request.POST.getlist('quantity[]')

        part_quantities = {}
        for pid, qty in zip(part_ids, quantities):
            try:
                part_quantities[int(pid)] = int(qty)
            except ValueError:
                continue
        with transaction.atomic():
            parts = Part.objects.filter(pk__in=part_ids)
            my_mat = get_object_or_404(Material, id=mat_id)
            my_mat.status = 'PRT'
            my_mat.save()
            for part in parts:
                matching_part = Part.objects.filter(title=part.title, name=part.name, version=part.version, project_name=part.project_name).order_by('-serial').first()
                for indx in range(part_quantities[part.id]):
                    if matching_part.serial == "":
                        next_serial = indx + 1
                    else:
                        next_serial = int(matching_part.serial) + indx + 1
                    serial = f"{next_serial:04d}"
                    Part.objects.create(material=my_mat, status='CON', title=part.title, name=part.name, version=part.version, project_name=part.project_name,
                                        serial=serial, part_number=f'M{part.name}V{part.version}S{serial}')
        return render(request, 'status_mech.html', {'title':'Success', 'message':'Part was created.'})
    

@login_required
def operation_mat(request):
    has_permision(request, 'mech')

    if request.method == 'POST':
        material_id = request.POST.get('material_id')
        description = request.POST.get('description')
        start = request.POST.get('start')
        end = request.POST.get('end')
        Operation.objects.create(
            operator=request.user,
            material_id=material_id,
            description=description,
            start=start,
            end=end)
        return redirect('operation_mat')

    all_materials = Material.objects.filter(status='PRT')
    operations_by_material = defaultdict(list)
    operations = Operation.objects.filter(material__in=all_materials).select_related('material')
    for op in operations:
        operations_by_material[op.material_id].append(op)

    return render(request, 'material_operation.html', {'materials': all_materials, 'operations_by_material': dict(operations_by_material)})
    

@login_required
def operation_part(request):
    has_permision(request, 'mech')

    if request.method == 'POST':
        part_id = request.POST.get('part_id')
        description = request.POST.get('description')
        start = request.POST.get('start')
        end = request.POST.get('end')
        PartOperation.objects.create(operator=request.user,part_id=part_id,description=description,start=start,end=end)
        return redirect('operation_part')
    
    latest_operation = PartOperation.objects.filter(part=OuterRef('pk')).order_by('-end')
    all_parts = Part.objects.filter(status='SEP').annotate(last_op=functions.Coalesce(Subquery(latest_operation.values('description')[:1]), Value('-', output_field=TextField())))

    part_files = {}
    for part in all_parts:
        part_files[int(part.id)] = {
            'STEP': os.path.exists(os.path.join(r"C:\mech\STEP", f"M{part.name}V{part.version}.STEP")),
            'PM': os.path.exists(os.path.join(r"C:\mech\PM", f"M{part.name}V{part.version}.pm")),
            'QCP': os.path.exists(os.path.join(r"C:\mech\QCP", f"M{part.name}V{part.version}S{part.serial}.docx")),
        }
    operations_by_part = defaultdict(list)
    operations = PartOperation.objects.filter(part__in=all_parts).select_related('part')
    for op in operations:
        operations_by_part[op.part_id].append(op)

    return render(request, 'part_operation.html', {'parts': all_parts, 'operations_by_part': dict(operations_by_part), 'part_files':part_files})


@login_required
def send_assemble(request):
    has_permision(request,'mech')
    if request.method == 'POST':
        part_id = request.POST.get('part_id')
        my_part = get_object_or_404(Part ,pk=part_id)
        my_part.status = 'ASM'
        my_part.save()
        return redirect('operation_part')


@login_required
def parting(request):
    has_permision(request,'mech')
    if request.method == 'POST':
        material_id = request.POST.get('material_id')
        my_mat = get_object_or_404(Material, id=material_id)
        with transaction.atomic():
            my_mat.status='SEP'
            my_mat.save()
            my_parts = Part.objects.filter(material=my_mat)
            fs = FileSystemStorage(location='C:/mech/QCP/')
            for part in my_parts:
                part.status = 'SEP'
                if fs.exists(f"M{part.name}V{part.version}.docx"):
                    original_path = fs.path(f"M{part.name}V{part.version}.docx")
                    new_path = fs.path(f"M{part.name}V{part.version}S{part.serial}.docx")  
                    shutil.copyfile(original_path, new_path)  
            Part.objects.bulk_update(my_parts, ['status'])       
        return redirect('parting')

    all_materials = Material.objects.filter(status='PRT')
    parts_by_material = defaultdict(list)
    parts = Part.objects.filter(material__in=all_materials).select_related('material')
    for pr in parts:
        parts_by_material[pr.material_id].append(pr)
    return render(request, 'parting_list.html',{'materials': all_materials, 'parts_by_material': dict(parts_by_material)})



@csrf_exempt
def open_file(request):
    if request.method == 'POST':
        rd_url = request.POST.get('rd_url')
        file_path = request.POST.get('file_path')
        if not file_path:
            try:
                data = loads(request.body.decode("utf-8") or "{}")
                file_path = data.get("path")
            except:
                file_path = None
        if not file_path:
            return JsonResponse({"error": "Missing 'path'"}, status=400)
        try:
            requests.post(f"http://127.0.0.1:5000/open", json={"path": file_path}, timeout=5)#change for user
            return redirect(rd_url)       
        except Exception as e:
            return render(request, 'status_mech.html',{'title':'Error','message':f"Error: {e}"})
        

@csrf_exempt
def save_file(request):
    if request.method == 'POST':
        rd_url = request.POST.get('rd_url')
        file_path = request.POST.get('file_path')
        try:
            os.startfile(file_path)
            return redirect(rd_url)
        except Exception as e:
            return render(request, 'status_mech.html',{'title':'Error','message':f"Error: {e}"})
        

@login_required
def add_file_mech(request):
    has_permision(request,'mech')
    all_parts = Part.objects.filter(status='SEP').values('project_name__name','version','name', 'title').distinct()
    return render(request, 'add_files.html', {'parts': all_parts})

@login_required
def save_file_mech(request):
    has_permision(request,'mech')
    if request.method == 'POST':
        file = request.FILES.get('file')
        part_id = request.POST.get('part_id')
        return redirect('operation_part')
    

@login_required
def add_product(request):
    has_permision(request,'mech')
    projects = Project.objects.all()
    if request.method == 'POST':
        proj = request.POST.get('project')
        tree = Tree.objects.filter(project__name=proj, department='MEC')
        for t in tree:
            tree_id = t.partnumber[1:]
            related_parts = Part.objects.filter(name=tree_id, status='ASM').values_list('part_number', flat=True)
            t.rel_parts = related_parts
        return render(request, 'add_product.html', {"projects":projects, 'tree':tree, 'thisproject':proj})
    #GET
    return render(request, 'add_product.html', {"projects":projects})


@login_required
def save_product(request):
    has_permision(request,'mech')
    part_list = request.POST.get('data')
    project = request.POST.get('project')
    part_qs = Part.objects.filter(part_number__in=part_list.split(','))
    my_project = Project.objects.get(name=project)

    product_number = Product.objects.filter(project=my_project).values_list('productnumber', flat=True).first() or 0
    my_product = Product.objects.create(productnumber=int(product_number)+1, project=my_project)
    all_packs = []
    for part in part_qs:
        part.status = 'FIN'
        pack = PartPack(part=part, product=my_product)
        all_packs.append(pack)
    PartPack.objects.bulk_create(all_packs)
    Part.objects.bulk_update(part_qs, ['status'])
    return render(request, 'product_postview.html', {"product":my_product, "all_packs":all_packs })


@login_required
def all_products(request):
    has_permision(request,'mech')
    products = Product.objects.all()
    if request.method == 'POST':
        product_id = request.POST.get('product_id')
        Part.objects.filter(partpack__product__id=product_id).update(status='ASM')
        Product.objects.get(id=product_id).delete()
        return render(request, 'all_products_mech.html', {"products":products})
    return render(request, 'all_products_mech.html', {"products":products})


@login_required
def product_details(request, pk):
    has_permision(request,'mech')
    my_product = get_object_or_404(Product, id=pk)
    all_packs = PartPack.objects.filter(product=my_product)
    part_dict = defaultdict(list)
    for part in all_packs:
        part_dict[part.part.title].append(part.part.part_number)

    part_dict = dict(part_dict)
    return render(request, 'product_details.html', {"all_packs":part_dict, "product":my_product})
    

@login_required
def send_request(request):
    has_permision(request,'admin')
    if request.method == "POST":
        with transaction.atomic():
            part_ids = request.POST.getlist('part_id[]')
            quantities = request.POST.getlist('quantity[]')
            req = DarkhastMech.objects.create()
            for pid, qty in zip(part_ids, quantities):
                DarkhastMechPart.objects.create(part_id=pid, quantity=qty, req=req)
            return render(request, 'status_mech.html', {"title":"Success", "message":f"Request {req.pk} was sent"})

    latest_versions = (Part.objects.filter(project_name=OuterRef('project_name'),title=OuterRef('title'),name=OuterRef('name'),status="DUM").annotate(version_int=functions.Cast('version', IntegerField())).order_by('-version_int').values('version')[:1])
    parts = (Part.objects.filter(status="DUM").annotate(latest_version=Subquery(latest_versions)).filter(version=F('latest_version')))
    return render(request, 'send_request.html', {'parts':parts})


@login_required
def panel_mech(request):
    has_permision(request,'mech')
    reqs = DarkhastMech.objects.all()
    return render(request, 'panel_mech.html', {"reqs":reqs})


@login_required
def panel_mech_details(request, pk):
    has_permision(request,'mech')
    req = get_object_or_404(DarkhastMech, id=pk)
    parts = DarkhastMechPart.objects.filter(req=req)
    if request.method == 'POST':
        for part in parts:
            if Part.objects.filter(status__in=['SEP','CON'], name=part.part.name, version=part.part.version).count() < part.quantity:
                return render(request, 'panel_mech_details.html', {"parts":parts, "message":"not enough part in stock"})
        req.status = 'FIN'
        req.save()
        return redirect('panel_mech')
    return render(request, 'panel_mech_details.html', {"parts":parts})
