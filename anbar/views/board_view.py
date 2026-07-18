from django.forms.models import model_to_dict
from django.shortcuts import render, redirect
from django.urls import reverse
from ..permisions import has_permision
from ..models import Board, Project, BOM, BoardOperation
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from json import dumps
from django.db import transaction
from django.core.paginator import Paginator
from django.http import JsonResponse
from datetime import timedelta



@login_required
def board_add(request):
    has_permision(request, 'admin')
    if request.method == 'POST':

        serial = request.POST.getlist('range_options')
        serial = list(map(lambda x : (4-len(x))*'0'+str(x), serial))
        board_id = request.POST.get('board')
        origin = get_object_or_404(Board, id=board_id)
        origin_bom = origin.bom_set.all()
        serail_check = Board.objects.filter(project_name=origin.project_name, title=origin.title, version=origin.version).values_list('serial', flat=True)
        error, new_bom = [], []
        for s in serial:
            if s in serail_check:
                error.append(s)
        if error:
            projects = Project.objects.all()
            boards = Board.objects.filter(status='NR').select_related("project_name")
            boards_data = dumps([{"id": board.id,
                    "title": board.title,
                    "version": board.version,
                    "project_id": board.project_name.id if board.project_name else None}for board in boards])
            context = {'projects': projects,'boards_json': boards_data,'error':error}
            return render(request, 'board_add.html', context)
        
        with transaction.atomic():
            for s in serial:
                my_board = Board.objects.create(project_name=origin.project_name, title=origin.title, name=origin.name, 
                                     version=origin.version, serial=s, status='RB', part_number=f"E{origin.name}V{origin.version}S{s}")
                for b in origin_bom:
                    b_dict = model_to_dict(b)
                    b_dict.pop('id', None)
                    b_dict['board'] = my_board
                    new_bom.append(BOM(**b_dict))
            BOM.objects.bulk_create(new_bom)
        return render(request, 'board_postview.html', {'board':origin, 'serial':serial})

    projects = Project.objects.all()
    boards = Board.objects.filter(status='NR').select_related("project_name")
    boards_data = dumps([{"id": board.id,
            "title": board.title,
            "version": board.version,
            "project_id": board.project_name.id if board.project_name else None}for board in boards])
    context = {'projects': projects,'boards_json': boards_data,}

    return render(request, 'board_add.html', context) 



@login_required
def board_list(request):
    has_permision(request, 'admin')
    project = request.GET.get('project')
    title = request.GET.get('title')
    page_number = request.GET.get('page', 1)
    boards = Board.objects.all()
    if project:
        boards = boards.filter(project_name__name__icontains=project)
    if title:
        boards = boards.filter(title__icontains=title)
    boards = boards.values('project_name__name', 'title', 'name').distinct()
    paginator = Paginator(boards, 10)
    page_obj = paginator.get_page(page_number)
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        board_data = [
            {
                'project': b['project_name__name'],
                'title': b['title'],
                'name': b['name'],
            }
            for b in page_obj
        ]
        return JsonResponse({
            'boards': board_data,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'num_pages': paginator.num_pages,
            'current_page': page_obj.number,
        })
    return render(request, 'board_list_all.html', {'boards': page_obj})



@login_required
def board_title(request, projectname, title):
    has_permision(request, 'admin')
    boards = Board.objects.filter(project_name__name=projectname, title=title).exclude(status='NR').values("title","version").distinct()
    return render(request, "board_version_b.html", {"boards":boards, "Project":projectname})


@login_required
def board_title_version(request, projectname, title, version):
    has_permision(request, 'admin')
    if request.method == 'POST':
        qc_list = request.POST.getlist('send_qc')
        boards = Board.objects.filter(id__in=qc_list).update(status='QC')
        return redirect(reverse('board_title_version', args=[projectname, title, version]))
    
    boards = Board.objects.filter(project_name__name=projectname, title=title, version=version).exclude(status='NR').select_related('project_name').all()
    for b in boards:
        b.status = b.is_complete()
    Board.objects.bulk_update(boards, ['status'])
    serial = request.GET.get('serial')
    status = request.GET.get('status')
    page_number = request.GET.get('page', 1)

    if serial:
        boards = boards.filter(serial__icontains=serial)
    if status:
        boards = boards.filter(status__in=status.split(','))
    
    boards_list = []
    for b in boards:
        bom = b.bom_set.filter(status__in=['PND', 'TV']).order_by('status').first()
        if bom:
            palet = bom.palet_set.order_by('req__id').first()
            req_id = palet.req.pk if palet and palet.req else '-'
        else:
            req_id = '-'

        operations_by_board = []
        board_duration_totals = timedelta(days=0 ,hours=0, minutes=0, seconds=0)
        operations = BoardOperation.objects.filter(board=b)
        for op in operations:
            operations_by_board.append([op.start, op.end, op.description, op.operator, op.duration()])
            if op.start and op.end:
                board_duration_totals += (op.end - op.start)

        boards_list.append({
            'id': b.id,
            'project': b.project_name.name,
            'title': b.title,
            'part_number': b.part_number,
            'status': b.get_status_display(),
            'req': req_id,
            'operations_by_board': operations_by_board,
            'board_duration_totals': board_duration_totals,
        })

    paginator = Paginator(boards_list, 20)
    page_obj = paginator.get_page(page_number)

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        board_data = [b for b in page_obj]
        return JsonResponse({
            'boards': board_data,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'num_pages': paginator.num_pages,
            'current_page': page_obj.number,
            'page_size': paginator.per_page,
        })

    return render(request, 'board_extra_list2.html', {
        'boards': page_obj,
    })


@login_required
def board_details(request, projectname):
    has_permision(request, 'admin')
    my_project = get_object_or_404(Project, name=projectname)
    boards = Board.objects.filter(project_name=my_project).values('project_name__name','title').distinct()
    return render(request, 'board_list.html', {'boards': boards})


@login_required
def board_version(request, projectname, title):
    has_permision(request, 'admin')
    my_project = get_object_or_404(Project, name=projectname)
    boards = Board.objects.filter(project_name=my_project, title=title).values('project_name__name','title','version').distinct()
    if request.method == 'POST':
        board_version = request.POST.get('Delete')
        my_board = Board.objects.filter(title=title,project_name__name=projectname,version=board_version)
        for board in my_board:
            if board.bom_set.exclude(status='EPT').exists():
                return render(request, 'board_version.html', {'boards': boards, 'error':'Board can not be deleted'})
        my_board.delete()
        return render(request, 'board_version.html', {'boards': boards})
    return render(request, 'board_version.html', {'boards': boards})


@login_required
def board_version_bom(request, projectname, title, version):
    has_permision(request, 'admin')
    my_project = get_object_or_404(Project, name=projectname)
    boms = BOM.objects.filter(board__project_name=my_project, board__title=title, board__version=version, board__status='NR')

    designator = request.GET.get('designator')
    part_number = request.GET.get('part_number')
    page_number = request.GET.get('page', 1)
    if designator:
        boms = boms.filter(designators__icontains=designator)
    if part_number:
        boms = boms.filter(part_number__icontains=part_number)
    paginator = Paginator(boms, 20)
    page_obj = paginator.get_page(page_number)

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        bom_data = [
            {   
                'part_number': p.part_number,
                'designators' : p.designators,
                'quantity' : p.count,
            }
            for p in page_obj
        ]
        return JsonResponse({
            'boms': bom_data,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'num_pages': paginator.num_pages,
            'page_size':20 ,
            'current_page': page_obj.number,
        })

    return render(request, 'bom_preview.html', {
        'boms': page_obj,
        'project':projectname,
        'title':title,
        'version':version,
    })


@login_required
def board_extra_details(request, projectname, title, version):
    has_permision(request, 'admin')
    my_project = get_object_or_404(Project, name=projectname)
    boards = Board.objects.filter(project_name=my_project, title=title, version=version)
    return render(request, 'board_extra_list.html', {'boards':boards})


@login_required
def bom_details(request, projectname, title, version, pk):
    my_board = get_object_or_404(Board, id=pk)
    boms = BOM.objects.filter(board=my_board)

    designator = request.GET.get('designator')
    part_number = request.GET.get('part_number')
    description = request.GET.get('description')
    status = request.GET.get('status')
    page_number = request.GET.get('page', 1)

    if designator:
        boms = boms.filter(designators__icontains=designator)
    if part_number:
        boms = boms.filter(part_number__icontains=part_number)
    if description:
        boms = boms.filter(description__icontains=description)
    if status:
        boms = boms.filter(status__in=status.split(','))

    paginator = Paginator(boms, 20)
    page_obj = paginator.get_page(page_number)

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        bom_data = [
            {   
                'part_number': p.part_number,
                'designators' : p.designators,
                'description' : p.description,
                'status' : p.get_status_display(),
            }
            for p in page_obj
        ]
        return JsonResponse({
            'boms': bom_data,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'num_pages': paginator.num_pages,
            'page_size' : 20 ,
            'current_page': page_obj.number,
        })

    return render(request, 'bom_list.html', {
        'boms': page_obj,
        'project':f"{projectname} - {my_board.title}",
        'title':my_board.part_number,
    })



@login_required
def bom_preview(request, project, title, version):
    has_permision(request, 'admin')
    my_board = Board.objects.filter(project_name__name=project, title=title, version=version)[0]
    boms = BOM.objects.filter(board=my_board)
    return render(request, 'bom_preview.html', {'boms':boms})


@login_required
def send_to_qc(request):
    board_id = request.POST.get('toqc')
    my_req = request.POST.get('req')
    Board.objects.filter(id=board_id).update(status='QC')
    return redirect("panel_assemble_board",my_req)