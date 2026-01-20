import json
from datetime import timedelta
from django.utils.dateparse import parse_datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import ScheduleItem

@login_required
def index(request):
    return render(request, 'schedule/index.html')

def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('index')
    else:
        form = UserCreationForm()
    return render(request, 'registration/signup.html', {'form': form})

@login_required
def api_events(request, event_id=None):
    if request.method == 'GET':
        events = ScheduleItem.objects.filter(user=request.user)
        events_data = []
        for event in events:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'start': event.start_time.isoformat(),
                'end': event.end_time.isoformat(),
                'backgroundColor': event.color,
                'borderColor': event.color,
            })
        return JsonResponse(events_data, safe=False)

    elif request.method == 'POST':
        data = json.loads(request.body)
        event = ScheduleItem.objects.create(
            user=request.user,
            title=data.get('title', '새 스케줄'),
            start_time=data['start'],
            end_time=data['end'],
            color=data.get('backgroundColor', '#3788d8')
        )
        return JsonResponse({'id': event.id, 'status': 'success'})

    elif request.method == 'PUT':
        if not event_id:
             return JsonResponse({'error': 'Event ID required'}, status=400)
        data = json.loads(request.body)
        event = get_object_or_404(ScheduleItem, id=event_id, user=request.user)
        
        if 'start' in data:
            event.start_time = data['start']
        if 'end' in data:
            event.end_time = data['end']
        if 'title' in data:
            event.title = data['title']
        if 'backgroundColor' in data:
            event.color = data['backgroundColor']
        
        event.save()
        return JsonResponse({'status': 'success'})

    elif request.method == 'DELETE':
        if not event_id:
             return JsonResponse({'error': 'Event ID required'}, status=400)
        event = get_object_or_404(ScheduleItem, id=event_id, user=request.user)
        event.delete()
        return JsonResponse({'status': 'deleted'})

    return JsonResponse({'error': 'Invalid method'}, status=405)

@login_required
def copy_previous_week(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # current_view_start should be the start of the week user is looking at
            current_week_start_str = data.get('currentWeekStart')
            if not current_week_start_str:
                return JsonResponse({'error': 'Missing currentWeekStart'}, status=400)
            
            # Parse (FullCalendar sends ISO string usually)
            current_week_start = parse_datetime(current_week_start_str)
            if not current_week_start:
                 # Try adding TZ info if missing or simple date parse if needed
                 # For simplicity, assuming ISO format from JS
                 pass

            # Calculate Previous Week Range
            # Note: current_week_start from JS might be local time or UTC. 
            # We assume it represents the Monday (or Sunday) 00:00 of the target week.
            
            prev_week_start = current_week_start - timedelta(days=7)
            prev_week_end = current_week_start # Exclusive
            
            # Fetch events from previous week
            source_events = ScheduleItem.objects.filter(
                user=request.user,
                start_time__gte=prev_week_start,
                start_time__lt=prev_week_end
            )
            
            if not source_events.exists():
                return JsonResponse({'status': 'no_events', 'message': '이전 주에 복사할 스케줄이 없습니다.'})

            copied_count = 0
            for src in source_events:
                # Calculate new start/end by adding 7 days
                new_start = src.start_time + timedelta(days=7)
                new_end = src.end_time + timedelta(days=7)
                
                # Check for duplication to avoid mess (optional but good)
                # Simple check: overlap with same title? For now, just copy.
                
                ScheduleItem.objects.create(
                    user=request.user,
                    title=src.title,
                    start_time=new_start,
                    end_time=new_end,
                    color=src.color
                )
                copied_count += 1
                
            return JsonResponse({'status': 'success', 'count': copied_count})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'POST required'}, status=405)
