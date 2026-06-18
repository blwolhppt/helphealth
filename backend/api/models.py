from django.db import models
from django.contrib.auth.models import AbstractUser
import random
import string
from .validators import (
    validate_birth_date,
    validate_phone_number,
    validate_password,
    validate_mark,
    validate_steps,
    validate_mark_device
)
from .constants import (
    MAX_LENGTH_NAME,
    MAX_LENGTH_PASSWORD,
    MAX_LENGTH_PHONE,
    MAX_LENGTH_DESCRIPTION,
    MAX_LENGTH_DOCT,
    MAX_LENGTH_STATUS,
    MAX_LENGTH_NAME_SLUG,
    MAX_LENGTH_NAME_DISEASES,
)


class Specialization(models.Model):
    specialization_name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        verbose_name="Название специализации",
        unique=True
    )
    specialization_slug = models.SlugField(
        max_length=MAX_LENGTH_NAME_SLUG,
        verbose_name="Слаг",
        unique=True
    )

    class Meta:
        verbose_name = "Специализация врача"
        verbose_name_plural = "Специализации врача"

    def __str__(self):
        return self.specialization_name


class ChronicDiseas(models.Model):
    chronic_diseas_name = models.CharField(
        max_length=MAX_LENGTH_NAME_DISEASES,
        verbose_name="Название заболевания",
        unique=True,
    )
    chronic_diseas_slug = models.SlugField(
        max_length=MAX_LENGTH_NAME_SLUG,
        verbose_name="Слаг",
        unique=True
    )

    class Meta:
        verbose_name = "Хроническое заболевание"
        verbose_name_plural = "Хронические заболевания"

    def __str__(self):
        return self.chronic_diseas_name


class AnalysisIndicators(models.Model):
    analysis_indicators_type = models.CharField(
        max_length=MAX_LENGTH_NAME,
        verbose_name="Тип показателя"
    )
    analysis_indicators_name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        verbose_name="Название показателя"
    )
    analysis_indicators_slug = models.SlugField(
        max_length=MAX_LENGTH_NAME_SLUG,
        verbose_name="Слаг",
        unique=True
    )

    class Meta:
        verbose_name = "Показатель анализов"
        verbose_name_plural = "Показатели анализов"

    def __str__(self):
        return self.analysis_indicators_name


class Doctor(AbstractUser):
    doctor_first_name = models.CharField(
        max_length=MAX_LENGTH_NAME, 
        null=False,
        blank=False,
        verbose_name="Имя"
    )
    doctor_second_name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        null=False,
        blank=False,
        verbose_name="Фамилия"
    )
    doctor_third_name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        null=True,
        blank=True,
        verbose_name="Отчество"
    )
    doctor_date_of_birth = models.DateField(
        null=True,
        blank=True,
        validators=[validate_birth_date],
        verbose_name="Дата рождения",
    )
    doctor_photo = models.ImageField(
        upload_to="doctors_photo/",
        null=True,
        blank=True,
        verbose_name="Фото профиля"
    )
    doctor_phone_number = models.CharField(
        max_length=MAX_LENGTH_PHONE,
        null=False,
        blank=False,
        unique=True,
        validators=[validate_phone_number],
        verbose_name="Номер телефона",
    )
    doctor_email = models.EmailField(
        null=False,
        blank=False,
        unique=True,
        verbose_name="Почта"
    )
    # doctor_password = models.CharField(
    #     max_length=MAX_LENGTH_PASSWORD,
    #     null=False,
    #     blank=False,
    #     validators=[validate_password],
    #     verbose_name="Пароль",
    # )
    doctor_specialization = models.ManyToManyField(
        Specialization,
        null=True,
        blank=True,
        verbose_name="Специализация"
    )
    doctor_workplace = models.CharField(
        max_length=MAX_LENGTH_DOCT,
        null=True,
        blank=True,
        verbose_name="Место работы"
    )
    doctor_experience = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Опыт работы"
    )
    doctor_description = models.TextField(
        max_length=MAX_LENGTH_DESCRIPTION,
        null=True,
        blank=True,
        verbose_name="О себе"
    )

    REQUIRED_FIELDS = ['doctor_email', 'doctor_first_name', 'doctor_second_name', 'doctor_phone_number']

    def __str__(self):
        return f"{self.doctor_second_name} {self.doctor_first_name} {self.doctor_third_name}"

    class Meta:
        verbose_name = "Врач"
        verbose_name_plural = "Врачи"


class Patient(models.Model):
    patient_first_name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        null=False,
        blank=False,
        verbose_name="Имя"
    )
    patient_second_name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        null=False,
        blank=False,
        verbose_name="Фамилия"
    )
    patient_third_name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        null=True,
        blank=True,
        verbose_name="Отчество"
    )
    patient_date_of_birth = models.DateField(
        null=False,
        blank=False,
        validators=[validate_birth_date],
        verbose_name="Дата рождения",
    )
    patient_photo = models.ImageField(
        upload_to="patient_photo/",
        null=True,
        blank=True,
        verbose_name="Фото профиля"
    )
    patient_phone_number = models.CharField(
        null=False,
        blank=False,
        unique=True,
        max_length=15,
        validators=[validate_phone_number],
        verbose_name="Номер телефона",
    )
    patient_email = models.EmailField(
        null=False,
        blank=False,
        unique=True,
        verbose_name="Почта"
    )
    patient_password = models.CharField(
        max_length=250,
        null=False,
        blank=False,
        validators=[validate_password],
        verbose_name="Пароль",
    )
    patient_diagnosis = models.ManyToManyField(
        ChronicDiseas,
        null=True,
        blank=True,
        verbose_name="Диагнозы"
    )
    patient_last_update = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Последнее обновление данных"
    )
    patient_auth_token = models.CharField(
        max_length=64, 
        null=True, 
        blank=True, 
        unique=True,
        verbose_name="Токен авторизации"
    )
    patient_invite_code = models.CharField(
        max_length=6, 
        unique=True, 
        null=True, 
        blank=True,
        verbose_name="Код привязки"
    )

    def __str__(self):
        return f"{self.patient_second_name} {self.patient_first_name} {self.patient_third_name}"
    
    def generate_invite_code(self):
        while True:
            code = ''.join(random.choices(string.digits, k=6))
            if not Patient.objects.filter(patient_invite_code=code).exists():
                return code
            
    class Meta:
        verbose_name = "Пациент"
        verbose_name_plural = "Пациенты"


class StatusEnum(models.TextChoices):
    ACTIVE = "Active", "Активный"
    ARCHIVED = "Archived", "Архивированный"


class DoctorPatientAssignment(models.Model):
    assignment_doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        verbose_name="Доктор"
    )
    assignment_patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        verbose_name="Пациент"
    )
    assignment_status = models.CharField(
        max_length=MAX_LENGTH_STATUS,
        choices=StatusEnum.choices,
        verbose_name="Статус"
    )
    assignment_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата"
    )

    class Meta:
        unique_together = ("assignment_doctor", "assignment_patient")
        verbose_name = "Связь доктора и пациента"
        verbose_name_plural = "Связи доктора и пациента"


class StatusSyncEnum(models.TextChoices):
    SEND = "Send", "Отправлено"
    NOT_SEND = "Not Send", "Не отправлено"


class TypeEnum(models.TextChoices):
    ANALYZES = "Analyzes", "Анализы"
    REPORT = "Report", "Заключение врача"
    RESULTS = "Results", "Результаты обследований"
    OTHER = "Other", "Прочее"


class Document(models.Model):
    document_patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        verbose_name="Пациент"
    )
    document_type = models.CharField(
        max_length=MAX_LENGTH_STATUS,
        choices=TypeEnum.choices,
        verbose_name="Тип документа",
    )
    document_file = models.FileField(
        upload_to="documents/"
    )
    document_name = models.CharField(
        max_length=MAX_LENGTH_NAME,
        null=False,
        blank=False,
        verbose_name="Название документа",
    )
    document_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата отправки документа"
    )

    def __str__(self):
        return f"{self.document_name}"

    class Meta:
        verbose_name = "Файл пациента"
        verbose_name_plural = "Файлы пациентов"


class Diary(models.Model):
    diary_patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        verbose_name="Пациент"
    )
    diary_date = models.DateTimeField(
        auto_now_add=False,
        verbose_name="Дата отправки данных"
    )
    diary_health = models.IntegerField(
        null=False,
        blank=False,
        validators=[validate_mark],
        default=1,
        verbose_name="Самочувствие",
    )
    diary_efficiency = models.IntegerField(
        null=False,
        blank=False,
        validators=[validate_mark],
        default=1,
        verbose_name="Работоспособность",
    )
    diary_sleep = models.IntegerField(
        null=False,
        blank=False,
        validators=[validate_mark],
        default=1,
        verbose_name="Сон",
    )
    diary_appetite = models.IntegerField(
        null=False,
        blank=False,
        validators=[validate_mark],
        default=1,
        verbose_name="Аппетит",
    )
    diary_mood = models.IntegerField(
        null=False,
        blank=False,
        validators=[validate_mark],
        default=1,
        verbose_name="Настроение",
    )

    def __str__(self):
        return f"{self.diary_date} - {self.diary_patient}"

    class Meta:
        verbose_name = "Дневник самочувствия пациента"
        verbose_name_plural = "Дневник самочувствия пациентов"


class Note(models.Model):
    note_patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        verbose_name="Пациент"
    )
    note_doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        verbose_name="Доктор"
    )
    note_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания записи"
    )
    note_description = models.TextField(
        max_length=MAX_LENGTH_DESCRIPTION,
        null=True,
        blank=True,
        verbose_name="Запись"
    )
    note_reason = models.CharField(
        max_length=MAX_LENGTH_STATUS, 
        verbose_name="На основании"
    )

    class Meta:
        verbose_name = "Запись"
        verbose_name_plural = "Записи"


class DeviceData(models.Model):
    devicedata_patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        verbose_name="Пациент"
    )
    devicedata_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата"
    )
    # devicedata_data = models.JSONField(
    #     verbose_name="Данные"
    # )
    devicedata_steps = models.IntegerField(
        null=False,
        blank=False,
        validators=[validate_steps],
        default=1,
        verbose_name="Кол-во шагов",
    )
    devicedata_pulse = models.IntegerField(
        null=False,
        blank=False,
        default=1,
        verbose_name="Пульс",
    )
    devicedata_temperature = models.FloatField(
        verbose_name="Температура тела"
    )
    devicedata_spo2 = models.IntegerField(
        null=False,
        blank=False,
        default=1,
        verbose_name="SpO2",
    )
    devicedata_sleep_time = models.CharField(
        null=False,
        blank=False,
        verbose_name="Время сна",
    )
    devicedata_sleep_score = models.IntegerField(
        null=False,
        blank=False,
        default=1,
        validators=[validate_mark_device],
        verbose_name="Оценка сна",
    )
    devicedata_stress = models.IntegerField(
        null=False,
        blank=False,
        default=1,
        verbose_name="Уровень стресса",
    )

    class Meta:
        verbose_name = "Данные с устройства"
        verbose_name_plural = "Данные с устройства"


class AnalysisNotes(models.Model):
    notes_patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        verbose_name="Пациент"
    )
    notes_indicators = models.ForeignKey(
        AnalysisIndicators,
        on_delete=models.CASCADE,
        verbose_name="Наименование анализа",
    )
    notes_value = models.FloatField(
        verbose_name="Численное значение"
    )
    notes_measure = models.CharField(
        max_length=MAX_LENGTH_STATUS,
        verbose_name="Ед.изм"
    )
    notes_date = models.DateTimeField(
        auto_now_add=False,
        verbose_name="Дата"
    )

    class Meta:
        verbose_name = "Анализ пользователя"
        verbose_name_plural = "Анализы пользователя"


class TypeNotification(models.TextChoices):
    DIARY = "Diary", "Дневник"
    ANALYSIS = "Analysis", "Анализы"
    DOCUMENT = "Document", "Документы"
    DEVICE = "Device", "Данные с устройства"


class Notification(models.Model):
    notification_doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        verbose_name="Врач"
    )
    notification_patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        verbose_name="Пациент"
    )
    notification_type = models.CharField(
        max_length=MAX_LENGTH_STATUS,
        choices=TypeNotification.choices,
        verbose_name="Тип уведомления",
    )
    notification_message = models.TextField(
        verbose_name="Уведомление"
    )
    notification_is_read = models.BooleanField(
        default=False,
        verbose_name="Прочитано"
    )
    notification_created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Создано"
    )

    class Meta:
        ordering = ['-notification_created_at'] 
        verbose_name = "Уведомление"
        verbose_name_plural = "Уведомления"


class Appointment(models.Model):
    appointment_patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        verbose_name="Пациент"
    )
    appointment_doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        verbose_name="Врач"
    )
    appointment_datetime = models.DateTimeField(
        verbose_name="Дата и время приёма"
    )

    class Meta:
        ordering = ['appointment_datetime']
        verbose_name = "Запись на приём"
        verbose_name_plural = "Записи на приёмы"

    def __str__(self):
        return f"{self.appointment_patient}: {self.appointment_datetime}"