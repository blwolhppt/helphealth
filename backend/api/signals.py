from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.utils import timezone
from .models import Patient, DeviceData, Diary, Note, Document, Notification, DoctorPatientAssignment


def touch_patient(patient):
    if patient and patient.pk:
        patient.patient_last_update = timezone.now()
        patient.save(update_fields=["patient_last_update"])


def get_doctors_for_patient(patient):
    assignments = DoctorPatientAssignment.objects.filter(
        assignment_patient=patient,
        assignment_status="Active"
    )
    return [assignment.assignment_doctor for assignment in assignments]


def create_notifications(patient, notification_type, message_template):
    doctors = get_doctors_for_patient(patient)
    patient_full_name = f"{patient.patient_second_name} {patient.patient_first_name}".strip()
    message = message_template.format(patient=patient_full_name)
    
    for doctor in doctors:
        Notification.objects.create(
            notification_doctor=doctor,
            notification_patient=patient,
            notification_type=notification_type,
            notification_message=message
        )


@receiver([post_save, post_delete], sender=DeviceData)
def update_on_device_data(sender, instance, **kwargs):
    touch_patient(instance.devicedata_patient)
    if kwargs.get("created", False):
        create_notifications(
            instance.devicedata_patient,
            "Device",
            "Пациент {patient} обновил данные с устройства"
        )


@receiver([post_save, post_delete], sender=Diary)
def update_on_diary(sender, instance, **kwargs):
    touch_patient(instance.diary_patient)
    if kwargs.get("created", False):
        create_notifications(
            instance.diary_patient,
            "Diary",
            "Пациент {patient} заполнил дневник"
        )


@receiver([post_save, post_delete], sender=Note)
def update_on_note(sender, instance, **kwargs):
    touch_patient(instance.note_patient)


@receiver([post_save, post_delete], sender=Document)
def update_on_document(sender, instance, **kwargs):
    touch_patient(instance.document_patient)
    if kwargs.get("created", False):
        create_notifications(
            instance.document_patient,
            "Document",
            "Пациент {patient} загрузил документ"
        )


@receiver(m2m_changed, sender=Patient.patient_diagnosis.through)
def update_on_diagnosis_change(sender, instance, action, **kwargs):
    if action in ("post_add", "post_remove", "post_clear"):
        touch_patient(instance)