document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
    var modalTitle = document.getElementById('modalTitle');
    var eventTitleInput = document.getElementById('eventTitle');
    var eventColorInput = document.getElementById('eventColor');
    var eventIdInput = document.getElementById('eventId');
    var deleteBtn = document.getElementById('deleteEventBtn');
    var saveBtn = document.getElementById('saveEventBtn');

    var currentEvent = null; // Hold the clicked event object

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    // Color Selection Logic
    const colorOptions = document.querySelectorAll('#color-options button');

    function updateColorSelectionUI(selectedColor) {
        eventColorInput.value = selectedColor;
        colorOptions.forEach(btn => {
            const btnColor = btn.dataset.color;
            if (btnColor === selectedColor) {
                btn.classList.add('border-dark', 'border-3');
                btn.classList.remove('border');
            } else {
                btn.classList.remove('border-dark', 'border-3');
                btn.classList.add('border');
            }
        });
    }

    colorOptions.forEach(btn => {
        btn.addEventListener('click', function () {
            updateColorSelectionUI(this.dataset.color);
        });
    });

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'ko', // Korean locale
        slotMinTime: '07:00:00',
        slotMaxTime: '25:00:00', // 1 AM next day
        eventMinHeight: 20, // Minimum height for short events
        expandRows: true,
        editable: true,
        selectable: true,
        dayMaxEvents: true,
        events: '/api/events/', // Fetch events from API

        // Resize or Drag Event
        eventDrop: function (info) {
            updateEvent(info.event);
        },
        eventResize: function (info) {
            updateEvent(info.event);
        },

        // Create New Event
        select: function (info) {
            currentEvent = null;
            modalTitle.innerText = "새 스케줄 만들기";
            eventTitleInput.value = "";
            eventIdInput.value = "";
            deleteBtn.classList.add('d-none');

            // Default Color
            updateColorSelectionUI("#3788d8");

            // Temporary Start/End storage
            eventIdInput.dataset.start = info.startStr;
            eventIdInput.dataset.end = info.endStr;

            eventModal.show();
        },

        // Edit Existing Event
        eventClick: function (info) {
            currentEvent = info.event;
            modalTitle.innerText = "스케줄 수정";
            eventTitleInput.value = currentEvent.title;
            eventIdInput.value = currentEvent.id;
            deleteBtn.classList.remove('d-none');

            // Set Color
            updateColorSelectionUI(currentEvent.backgroundColor);

            eventModal.show();
        }
    });

    calendar.render();

    // Save Button Click
    saveBtn.addEventListener('click', function () {
        if (!eventTitleInput.value) {
            alert("내용을 입력해주세요.");
            return;
        }

        const eventData = {
            title: eventTitleInput.value,
            backgroundColor: eventColorInput.value,
        };

        let url = '/api/events/';
        let method = 'POST';

        if (eventIdInput.value) {
            // Edit existing
            url += eventIdInput.value + '/';
            method = 'PUT';
        } else {
            // New
            eventData.start = eventIdInput.dataset.start;
            eventData.end = eventIdInput.dataset.end;
        }

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(eventData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' || data.id) {
                    calendar.refetchEvents();
                    eventModal.hide();
                } else {
                    alert("저장 중 오류가 발생했습니다.");
                }
            });
    });

    // Delete Button Click
    deleteBtn.addEventListener('click', function () {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        const id = eventIdInput.value;
        fetch('/api/events/' + id + '/', {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'deleted') {
                    currentEvent.remove();
                    eventModal.hide();
                } else {
                    alert("삭제 중 오류가 발생했습니다.");
                }
            });
    });

    // Update Event (Drag/Resize)
    function updateEvent(event) {
        fetch('/api/events/' + event.id + '/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                start: event.start.toISOString(),
                end: event.end.toISOString()
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'success') {
                    alert("업데이트 실패. 변경사항이 되돌려집니다.");
                    event.revert();
                }
            });
    }

    // Copy Previous Week Button
    const copyBtn = document.getElementById('copyPrevWeekBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!confirm("지난 주의 모든 스케줄을 이번 주(" + calendar.view.title + ")로 복사하시겠습니까?")) return;

            const currentStart = calendar.view.currentStart.toISOString();

            fetch('/api/copy-prev-week/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({
                    currentWeekStart: currentStart
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert(data.count + "개의 스케줄이 복사되었습니다.");
                        calendar.refetchEvents();
                    } else if (data.status === 'no_events') {
                        alert(data.message);
                    } else {
                        alert("오류 발생: " + (data.error || "알 수 없음"));
                    }
                });
        });
    }

    // PDF Download Button
    const pdfBtn = document.getElementById('pdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', function () {
            // Confirm libraries are loaded
            if (!window.jspdf || !window.html2canvas) {
                alert("PDF 생성 라이브러리 로딩 중... 잠시 후 다시 시도해주세요.");
                return;
            }

            const { jsPDF } = window.jspdf;

            // A4 Portrait: 210mm x 297mm
            const doc = new jsPDF('p', 'mm', 'a4');

            // Element to capture
            const element = document.getElementById('calendar');

            // Hide toolbar for clean capture
            const toolbar = document.querySelector('.fc-header-toolbar');
            if (toolbar) toolbar.style.display = 'none';

            html2canvas(element, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = canvas.height * imgWidth / canvas.width;

                let heightLeft = imgHeight;
                let position = 0;

                doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                doc.save('weekly-schedule.pdf');

                // Restore visibility
                if (toolbar) toolbar.style.display = '';
            }).catch(err => {
                console.error("PDF generation failed: ", err);
                alert("PDF 생성 중 오류가 발생했습니다.");
                if (toolbar) toolbar.style.display = '';
            });
        });
    }
});
