from django.db import models
from django.contrib.auth.models import User

class ScheduleItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="사용자")
    title = models.CharField(max_length=200, verbose_name="제목")
    start_time = models.DateTimeField(verbose_name="시작 시간")
    end_time = models.DateTimeField(verbose_name="종료 시간")
    color = models.CharField(max_length=7, default='#3788d8', verbose_name="색상")  # Hex color

    class Meta:
        verbose_name = "스케줄"
        verbose_name_plural = "스케줄 목록"

    def __str__(self):
        return f"{self.title} ({self.start_time} - {self.end_time})"
