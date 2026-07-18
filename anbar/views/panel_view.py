from django.shortcuts import render, redirect
from ..permisions import has_permision
from ..models import Part, Mafghood, Darkhast, Board, BOM, PaletAnbar, BoardOperation, Palet, User, ReStock, SepehrQC
from django.contrib.auth.decorators import login_required
from django.db.models import OuterRef, Subquery, F
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.paginator import Paginator
from collections import defaultdict
from django.http import JsonResponse
from django.http import HttpResponseNotAllowed



@login_required
def panel_anbardar(request):
    has_permision(request, 'anbardar')
    status = request.GET.get('status')
    type = request.GET.get('type')
    page_number = request.GET.get('page', 1)
    darkhasts = Darkhast.objects.filter(req_type__in=['ASS','COM']).annotate(board=F('palet__bom__board__title'), version=F('palet__bom__board__version')).distinct()
    if status:
        darkhasts = darkhasts.filter(status__in=status.split(','))
    if type:
        darkhasts = darkhasts.filter(req_type__in=type.split(','))
    paginator = Paginator(darkhasts, 20)
    page_obj = paginator.get_page(page_number)

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        req_data = [
            {
                'req_id': p.pk,
                'sender': p.user.username,
                'board': p.board,
                'assembler' : p.for_user.username,
                'type' : p.get_req_type_display(),
                'status' : p.get_status_display(),
            }
            for p in page_obj
        ]
        return JsonResponse({
            'darkhasts': req_data,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'num_pages': paginator.num_pages,
            'current_page': page_obj.number
        })
    
    mafghood = Darkhast.objects.filter(req_type='MAF').order_by('-pk')[:10]
    restock = SepehrQC.objects.exclude(status='NOR').order_by('-pk')[:10]

    return render(request, 'darkhast_list_an.html', {'darkhasts':page_obj, 'mafghood':mafghood, 'restock':restock})


@login_required
def panel_anbardar_details(request, pk):
    has_permision(request, 'anbardar')
    my_req = get_object_or_404(Darkhast, id=pk)
    palets = PaletAnbar.objects.filter(palet__req=my_req).distinct()
    boards = Board.objects.filter(bom__palet__req=my_req).distinct()
    for board in boards:
        board.status = board.is_complete()
    Board.objects.bulk_update(boards, ['status'])
    insf = BOM.objects.filter(board__in=boards, status='EPT').values_list('part_number','count')
    kasri = defaultdict(int)
    for partnumber, count in insf:
        kasri[partnumber] += count

    boards = boards.values_list('pk', flat=True)
    boms = BOM.objects.filter(board__pk__in=boards, board__status='PND', status='EPT')
    parts = Part.objects.filter(failure='REJECT')
    rej=[]

    for b in boms:    
        if b.part_number in parts.values_list('part_number', flat=True):
            rej.append({
                'part_number':b.part_number,
                'bom_total':b.count,
                'part_total': parts.values_list('count', flat=True).first()
            })
    if rej:
        merged = {}
        for d in rej:
            pn = d['part_number']
            if pn in merged:
                merged[pn]['bom_total'] += d['bom_total']
            else:
                merged[pn] = d.copy()
        rej = list(merged.values())

    return render(request, 'palet_list.html', {'palets':palets, 'my_req':my_req, 'rej':rej, 'kasri':dict(kasri)})


@login_required
def panel_anbardar_maf_details(request, pk):
    has_permision(request, 'anbardar')
    my_req = get_object_or_404(Darkhast, id=pk)
    if request.method == 'POST':
        action = request.POST.get('action')
        if my_req.status != 'PND':
            return render(request, 'status.html', {"title":"Error", "message":"Request is not pending"})
        with transaction.atomic():
            if action == 'accept':
                mafghoods = Mafghood.objects.filter(req=my_req)
                parts=[]
                for maf in mafghoods:
                    my_part=maf.maf_part
                    if my_part.count < maf.quantity:
                        return render(request, 'status.html', {"title":"Error", "message":f"Part from {my_part.id} code is insufficient"})
                    my_part.count -= maf.quantity
                    parts.append(my_part)
                Part.objects.bulk_update(parts, ['count'])
                my_req.status='ACC'
                my_req.save()
            else:
                my_req.status='REJ'
                my_req.save()
        return redirect("panel_anbardar")

    maf_list = Mafghood.objects.filter(req=my_req).annotate(aveilable=F('maf_part__count')-F('maf_part__reserve')-F('maf_part__freeze'))
    return render(request, "maf_details.html", {"mafghood":maf_list})


@login_required
def panel_anbardar_res_details(request, pk):
    has_permision(request, 'anbardar')
    sep_req = get_object_or_404(SepehrQC, id=pk)
    if request.method == 'POST':
        action = request.POST.get('action')
        if sep_req.status != 'PND':
            return render(request, 'status.html', {"title":"Error", "message":"Request is not pending"})
        with transaction.atomic():
            if action == 'accept':
                mafghoods = ReStock.objects.filter(sep_req=sep_req)
                parts=[]
                for maf in mafghoods:
                    my_part=maf.res_part
                    if my_part.count < maf.quantity:
                        return render(request, 'status.html', {"title":"Error", "message":f"Part from {my_part.id} code is insufficient"})
                    my_part.count -= maf.quantity
                    parts.append(my_part)
                Part.objects.bulk_update(parts, ['count'])
                sep_req.status='ACC'
                sep_req.save()
            else:
                sep_req.status='REJ'
                sep_req.save()
        return redirect("panel_anbardar")

    restock = ReStock.objects.filter(sep_req=sep_req).annotate(aveilable=F('res_part__count')-F('res_part__reserve')-F('res_part__freeze'))
    return render(request, "res_details.html", {"restock":restock})


@login_required
def panel_anbardar_acc(request, pk):
    has_permision(request, 'anbardar')
    my_req = get_object_or_404(Darkhast, id=pk)
    if my_req.status != 'PND':
        return render(request, 'status.html', {'title':'Error','message':'request has already been submited'})
    if request.method == 'POST':
        action = request.POST.get('action')
        with transaction.atomic():
            if action == 'button1':
                my_req.status = "ACC"
                my_req.save()
                BOM.objects.filter(palet__req=my_req).update(status = 'TV')
                my_palet = Palet.objects.filter(req=my_req)
                for plt in my_palet:
                    my_part = plt.part
                    my_part.count -= plt.quantity
                    my_part.reserve -= plt.quantity
                    my_part.save()
                    
                return render(request, 'status.html', {'title':'Success','message':'Request was Accepted Successfuly'})
            
            elif action == 'button2':
                my_req.status = "REJ"
                my_req.save()
                BOM.objects.filter(palet__req=my_req).update(status = 'EPT')
                my_palet = Palet.objects.filter(req=my_req)
                for plt in my_palet:
                    my_part = plt.part
                    my_part.reserve -= plt.quantity
                    my_part.save()
                return render(request, 'status.html', {'title':'Success','message':'Request was Rejected Successfuly'})
    return HttpResponseNotAllowed(['POST'])


@login_required
def panel_assemble(request):
    has_permision(request, 'assemble')
    if request.user.groups.filter(name="elecadmin").exists():
        first_board_id = Board.objects.filter(bom__palet__req=OuterRef('pk')).values('title')[:1]
        darkhasts = Darkhast.objects.filter(status='ACC',req_type__in=['ASS', 'COM']).annotate(board_id=Subquery(first_board_id))
        assemblers = User.objects.filter(groups__name="assemble")
        is_admin = True
    else:
        first_board_id = Board.objects.filter(bom__palet__req=OuterRef('pk')).values('title')[:1]
        darkhasts = Darkhast.objects.filter(status='ACC', for_user=request.user, req_type__in=['ASS', 'COM']).annotate(board_id=Subquery(first_board_id))
        assemblers = []
        is_admin = False
    
    return render(request, 'darkhast_list_as.html', {'darkhasts':darkhasts, "is_admin":is_admin, "assemblers":assemblers})


@login_required
def change_assembler(request, pk):
    has_permision(request, 'admin')
    if request.method == 'POST':
        my_req = Darkhast.objects.get(id=pk)
        new_assebmler_id = request.POST.get('change_assembler')
        new_assembler = User.objects.get(id=new_assebmler_id)
        my_req.for_user = new_assembler
        my_req.save()
        return redirect("panel_assemble")


@login_required
def panel_assemble_board(request, pk):
    has_permision(request, 'assemble')
    if request.method == 'POST':
        board_id = request.POST.get('board_id')
        description = request.POST.get('description')
        start = request.POST.get('start')
        end = request.POST.get('end')
        BoardOperation.objects.create(
            operation_type = 'AS',
            operator=request.user,
            board_id=board_id,
            description=description,
            start=start,
            end=end)
        return redirect('panel_assemble_board',pk)
    
    my_req = get_object_or_404(Darkhast, id=pk)
    boards = Board.objects.filter(bom__palet__req = my_req).distinct()
    for b in boards:
        b.status = b.is_complete()
    Board.objects.bulk_update(boards, ['status'])
    operations_by_board = defaultdict(list)
    operations = BoardOperation.objects.filter(board__in=boards, operation_type='AS').select_related('board')
    for op in operations:
        operations_by_board[op.board_id].append(op)
    return render(request, 'board_list_as.html', {'boards':boards, 'my_req':my_req, 'operations_by_board': dict(operations_by_board)})


@login_required
def panel_assemble_details(request, pk, pk2):
    has_permision(request, 'assemble')
    if request.method == 'POST':
        selected_ids = request.POST.getlist('selected_palets')
        unselected_ids = request.POST.getlist('unselected_palets')
        with transaction.atomic(): 
            BOM.objects.filter(id__in=selected_ids).update(status='AS')
            BOM.objects.filter(id__in=unselected_ids).update(status='TV')
            for key, new_value in request.POST.items():
                if key.startswith("description_"):
                    bom_id = int(key.split("_")[1])
                    new_description = new_value.strip()
                    original_description = request.POST.get(f"original_description_{bom_id}", "").strip()

                    if new_description != original_description:
                        bom = BOM.objects.get(id=bom_id)
                        bom.description = new_description
                        bom.save()
            return redirect('panel_assemble_details', pk, pk2)
        
    my_req = get_object_or_404(Darkhast, id=pk)
    my_board = get_object_or_404(Board, id=pk2)
    palets = Palet.objects.filter(req=my_req, bom__board=my_board)
    ids = list(Board.objects.filter(bom__palet__req = my_req).distinct().order_by('serial').values_list('id', flat=True))
    serials = list(Board.objects.filter(bom__palet__req = my_req).distinct().order_by('serial').values_list('serial', flat=True))
    index = ids.index(pk2)
    first_id = ids[0]
    last_id = ids[-1]
    prev_ids = ids[max(0, index-2):index]
    next_ids = ids[index+1:index+3]
    prev_ids = [i for i in prev_ids if i not in [first_id, last_id, pk2]]
    next_ids = [i for i in next_ids if i not in [first_id, last_id, pk2]]
    show_first = first_id != pk2
    show_last = last_id != pk2
    show_left_ellipsis = False
    if show_first and prev_ids:
        show_left_ellipsis = prev_ids[0] - first_id > 1
    show_right_ellipsis = False
    if show_last and next_ids:
        show_right_ellipsis = last_id - next_ids[-1] > 1
    
    context = {
        'first_id': first_id if show_first else None,
        'prev_ids': prev_ids,
        'current_id': pk2,
        'next_ids': next_ids,
        'last_id': last_id if show_last else None,
        'show_left_ellipsis': show_left_ellipsis,
        'show_right_ellipsis': show_right_ellipsis,
        'palets':palets, 'my_req':my_req, 'my_board':my_board,
        'mapp':dict(zip(ids,serials))
        }
    
    return render(request, 'palet_list_as.html', context)


@login_required
def panel_assemble_acc(request, pk, pk2):
    has_permision(request, 'assemble')
    return HttpResponseNotAllowed(['POST'])
