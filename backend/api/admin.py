from django.contrib import admin
from djangoql.admin import DjangoQLSearchMixin
from import_export import resources
from import_export.admin import ExportActionModelAdmin

from .models import (
    Doctor,
    Patient,
    DoctorPatientAssignment,
    Document,
    Diary,
    Specialization,
    ChronicDiseas,
    AnalysisIndicators,
    Note,
    DeviceData,
    AnalysisNotes,
    Notification,
    Appointment
)


class DoctorResource(resources.ModelResource):
    class Meta:
        model = Doctor


class PatientResource(resources.ModelResource):
    class Meta:
        model = Patient


class DoctorPatientAssignmentResource(resources.ModelResource):
    class Meta:
        model = DoctorPatientAssignment


class DocumentResource(resources.ModelResource):
    class Meta:
        model = Document


class AnalysisNotesResource(resources.ModelResource):
    class Meta:
        model = AnalysisNotes


class AnalysisIndicatorsResource(resources.ModelResource):
    class Meta:
        model = AnalysisIndicators


class NotificationResource(resources.ModelResource):
    class Meta:
        model = Notification


class AppointmentResource(resources.ModelResource):
    class Meta:
        model = Appointment


@admin.register(Doctor)
class DoctorAdmin(DjangoQLSearchMixin, ExportActionModelAdmin):
    list_display = (
        "doctor_second_name",
        "doctor_first_name",
        "doctor_email",
        "doctor_workplace",
    )
    list_filter = ("doctor_workplace", "doctor_specialization")
    ordering = ("doctor_second_name",)
    resource_classes = [DoctorResource]


@admin.register(Patient)
class PatientAdmin(DjangoQLSearchMixin, ExportActionModelAdmin):
    list_display = (
        "patient_second_name",
        "patient_first_name",
        "patient_email",
    )
    ordering = ("patient_second_name",)
    resource_classes = [PatientResource]


@admin.register(DoctorPatientAssignment)
class DoctorPatientAssignmentAdmin(DjangoQLSearchMixin, ExportActionModelAdmin):
    list_display = ("assignment_doctor", "assignment_patient", "assignment_status")
    ordering = ("assignment_date",)
    resource_classes = [DoctorPatientAssignmentResource]


@admin.register(Document)
class DocumentAdmin(DjangoQLSearchMixin, ExportActionModelAdmin):
    list_display = ("document_date", "document_name", "document_type")
    list_filter = ("document_type",)
    ordering = ("document_date",)
    resource_classes = [DocumentResource]


@admin.register(AnalysisNotes)
class AnalysisNotesAdmin(DjangoQLSearchMixin, ExportActionModelAdmin):
    list_display = ("notes_date", "notes_patient", "notes_indicators", "notes_value")
    list_filter = ("notes_date", "notes_patient", "notes_indicators")
    ordering = ("notes_date",)
    resource_classes = [AnalysisNotesResource]


@admin.register(AnalysisIndicators)
class AnalysisIndicatorsAdmin(DjangoQLSearchMixin, ExportActionModelAdmin):
    ordering = ("analysis_indicators_name",)
    resource_classes = [AnalysisIndicatorsResource]


@admin.register(Notification)
class NotificationAdmin(DjangoQLSearchMixin, ExportActionModelAdmin):
    list_display = ("notification_patient", "notification_type", "notification_message", "notification_is_read")
    list_filter = ("notification_patient", "notification_type",)
    ordering = ("notification_created_at",)
    resource_classes = [NotificationResource]


@admin.register(Appointment)
class AppointmentAdmin(DjangoQLSearchMixin, ExportActionModelAdmin):
    list_display = ("appointment_doctor", "appointment_patient", "appointment_datetime",)
    list_filter = ("appointment_patient",)
    ordering = ("appointment_datetime",)
    resource_classes = [AppointmentResource]


admin.site.register(Diary)
admin.site.register(Specialization)
admin.site.register(ChronicDiseas)
admin.site.register(Note)
admin.site.register(DeviceData)
