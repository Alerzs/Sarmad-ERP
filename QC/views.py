from django.shortcuts import render, redirect
import requests
from collections import defaultdict
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError
from anbar.models import Board, Project, SepehrQC, BOM, Part, ReStock, BoardOperation
from django.contrib.auth.decorators import login_required
from json import dumps, loads
from .permisions import has_permision
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import *
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Q, Sum
from django.core.files.storage import FileSystemStorage
import shutil


@login_required
def qc_boards(request):
    boards = Board.objects.filter(status='QC')
    return render(request, 'qc_boards.html', {'boards': boards})


@login_required
def request_qc(request):
      
    if request.method == 'POST':
        selected_user = request.POST.get('user')
        board_ids = request.POST.getlist('board')
        boards = Board.objects.filter(id__in=board_ids)
        board = boards.first()
        with transaction.atomic():
            target_user = User.objects.get(id=selected_user)
            my_req = QCRequest.objects.create(sender=request.user, operator=target_user)
            boards.update(qc_req=my_req)
        return render(request, 'status_qc.html', {'title':"Success", "message":f"Request {my_req.pk} was sent."})
    
    projects = Project.objects.all()
    boards = Board.objects.filter(status='QC').exclude(qc_req__isnull=False).select_related("project_name")
    for b in boards:
        b.status = b.is_complete()
    Board.objects.bulk_update(boards, ["status"])
    boards_data = dumps([
        {
            "id": board.id,
            "title": board.title,
            "part_number": board.part_number,
            "project_id": board.project_name.id if board.project_name else None
        }for board in boards])
    context = {
        'users': User.objects.filter(groups__name='assemble'),
        'projects': projects,
        'boards_json': boards_data} 
    return render(request, 'request_qc.html', context)


@csrf_exempt
def open_file_QC(request):
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
            requests.post(f"http://127.0.0.1:5000/open", json={"path": file_path}, timeout=5)
            return redirect(rd_url)       
        except Exception as e:
            return render(request, 'status_qc.html',{'title':'Error','message':f"Error: {e}"})


@login_required
def panel_qc(request):
    if has_permision(request, 'admin'):
        reqs = QCRequest.objects.all()
    else:
        reqs = QCRequest.objects.filter(operator=request.user)
    return render(request, 'qc_panel.html', {"reqs":reqs})


@login_required
def send_to_sepehr(request):
    if request.method == 'POST':
        board_id = request.POST.get('tosepehr')
        my_req = request.POST.get('req')
        my_board = Board.objects.get(id=board_id)
        if my_board.status == 'QC':
            my_board.status='SP'
            my_board.save()
        return redirect("panel_qc_details",my_req)


@login_required
def panel_qc_details(request, reqid):
    if request.method == 'POST':
        board_id = request.POST.get('board_id')
        description = request.POST.get('description')
        start = request.POST.get('start')
        end = request.POST.get('end')
        BoardOperation.objects.create(
            operation_type = 'QC',
            board_id=board_id,
            operator=request.user,
            description=description,
            start=start,
            end=end)
        return redirect('panel_qc_details',reqid)
    
    boards = Board.objects.filter(qc_req__id=reqid)
    fs = FileSystemStorage(location='C:/mech/QC/')
    for board in boards:

        if fs.exists(f"E{board.name}V{board.version}S{board.serial}.docx"):
            board.has_file = True
        elif fs.exists(f"E{board.name}V{board.version}.docx"):
            original_path = fs.path(f"E{board.name}V{board.version}.docx")
            new_path = fs.path(f"E{board.name}V{board.version}S{board.serial}.docx")  
            shutil.copyfile(original_path, new_path)
            board.has_file = True
        else:
            board.has_file = False

    operations_by_board = defaultdict(list)
    operations = BoardOperation.objects.filter(board__in=boards, operation_type='QC').select_related('board')
    for op in operations:
        operations_by_board[op.board_id].append(op)
    
    return render(request, 'qc_panel_details.html', {"boards":boards, "reqid":reqid, 'operations_by_board': dict(operations_by_board)})


@login_required
def add_template_QC(request):
    if request.method == 'POST':
        template = request.FILES.get('file')
        boardname = request.POST.get('boardname')
        fs = FileSystemStorage(location='C:/mech/QC/')

        filename = f"{boardname}.docx"
        if fs.exists(filename):
            fs.delete(filename)
        elif not template:
            return render(request, 'status_qc.html', {'title':"Error", "message":"please upload the template file"})
        fs.save(filename, template)

    boards = Board.objects.filter(status='QC').values('project_name__name', 'title', 'version', 'name').distinct()
    for board in boards:
        file_path = os.path.join(r"C:\mech\QC", f"E{board['name']}V{board['version']}.docx")
        board['has_template'] = os.path.exists(file_path)
    return render(request, 'add_template.html', {"boards":boards})


@login_required
def sepehr_qc(request):
    boards = Board.objects.filter(status='SP')
    return render(request, 'sepehr_qc.html', {"boards":boards})


@login_required
def sepehr_qc_details(request, pk):
    board = Board.objects.get(id=pk)
    if request.method == "POST":
        file = request.FILES.get('file')
        sep_id = request.POST.get('sep_id')
        if file:
            fs = FileSystemStorage(location='C:/mech/Sepehr/')
            filename = f"{board.part_number}-{sep_id}.pdf"
            if fs.exists(filename):
                fs.delete(filename)
            fs.save(filename, file)
            return redirect("sepehr_qc_details", pk)
        
        SepehrQC.objects.create(board=board, user=board.qc_req.operator)
        return redirect("sepehr_qc_details", pk)
    
    seplogs = SepehrQC.objects.filter(board=board)
    for sep in seplogs:
        file_path = os.path.join(r"C:\mech\Sepehr", f"{board.part_number}-{sep.pk}.pdf")
        sep.has_file = os.path.exists(file_path)
    return render(request, 'sepehr_qc_details.html', {"seplogs":seplogs, "board":board})


@login_required
def get_stock(request, pk):

    sepehr_log = SepehrQC.objects.get(id=pk)
    if request.method == 'POST':
        selected_parts = request.POST.getlist('selected_parts')
        part_data = []

        for part_id in selected_parts:
            quantity = request.POST.get(f'quantity_{part_id}')
            if not quantity or not quantity.isdigit():
                raise ValidationError(f"Invalid quantity for part ID {part_id}")

            quantity = int(quantity)
            my_part = get_object_or_404(Part, pk=part_id)

            available = my_part.count - my_part.reserve
            if quantity > available:
                raise ValidationError(f"Not enough stock for part ID {part_id} (available: {available})")
            part_data.append((my_part, quantity))
        with transaction.atomic():
            for part, qty in part_data:
                ReStock.objects.create(sep_req=sepehr_log, quantity=qty, res_part=part)

        message = 'Request was sent successfully:<br><br>'
        for part, qty in part_data:
            message += f"Code Anbar: {part.pk} | Quantity: {qty}<br>"
        sepehr_log.status = 'PND'
        sepehr_log.save()
        return render(request, 'status_qc.html', {
            'title': 'Success',
            'message': message
        })
    
    my_board = Board.objects.get(sepehrqc=sepehr_log)
    filtered_boms = BOM.objects.filter(board=my_board)
    current_parts = Part.objects.filter(palet__bom__in=filtered_boms).values_list("id", flat=True)
    parts = Part.objects.all()

    designator = request.GET.get('designator')
    version = request.GET.get('version')
    partnumber = request.GET.get('partnumber')
    codeanbar = request.GET.get('codeanbar')
    page_number = request.GET.get('page', 1)

    if designator:
        filtered_boms = filtered_boms.filter(designators__icontains=designator)
    if version:
        filtered_boms = filtered_boms.filter(board__version__icontains=version)
    if partnumber:
        filtered_boms = filtered_boms.filter(part_number__icontains=partnumber)
    if codeanbar:
        matching_parts = Part.objects.filter(id__icontains=codeanbar)
        part_numbers = matching_parts.values_list('part_number', flat=True)
        filtered_boms = filtered_boms.filter(part_number__in=part_numbers)
    else:
        matching_parts = parts

    paginator = Paginator(filtered_boms, 30)
    page_obj = paginator.get_page(page_number)

    part_numbers_on_page = page_obj.object_list.values_list('part_number', flat=True)
    parts_on_page = matching_parts.filter(Q(part_number__in=part_numbers_on_page) & Q(id__in=current_parts) & Q(count__gt=0))

    part_map = defaultdict(list)
    for part in parts_on_page:
        part_map[part.part_number].append(part)

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        board_data = []
        for bom in page_obj:
            parts = part_map.get(bom.part_number, [])
            if parts:
                for part in parts:
                    prv = False
                    if part.id in current_parts:
                        prv = True
                    board_data.append({
                        "title": bom.board.title,
                        "project": bom.board.project_name.name,
                        "boardid": bom.board.name,
                        "version": bom.board.version,
                        "designator": bom.designators,
                        "part_number": bom.part_number,
                        "code_anbar": part.id,
                        "ordernumber": part.order.order_number,
                        "count": part.count - part.reserve,
                        "prv":prv,
                    })

        return JsonResponse({
            'boards': board_data,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'num_pages': paginator.num_pages,
            'current_page': page_obj.number,
        })

    return render(request, 'get_stock.html', {
        'boards': page_obj, "my_board":my_board,
    })


@login_required
def sep_history_details(request, pk):
    sep_req = SepehrQC.objects.get(id=pk)
    his = ReStock.objects.filter(sep_req=sep_req)
    board = Board.objects.get(sepehrqc=sep_req)
    return render(request, 'history_sep.html', {"history":his ,"board":board, "req":sep_req.id})


@login_required
def sep_history(request):
    restocks_sum = ReStock.objects.values('res_part__id', 'res_part__part_number', 'res_part__order__order_number').annotate(total_quantity=Sum('quantity'))
    return render(request, 'history_sep.html', {"history":restocks_sum})



@login_required
def send_to_AS(request):
    toas = request.POST.get('toas')
    my_board = Board.objects.get(id=toas)
    my_board.status = 'AS'
    my_board.save()
    return redirect("sepehr_qc")