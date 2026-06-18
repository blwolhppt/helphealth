import django_filters
from django_filters.rest_framework import FilterSet

from .models import Diary, Patient, DoctorPatientAssignment, Document, AnalysisNotes, Note, TypeEnum, DeviceData, Appointment


class PatientsFilter(django_filters.FilterSet):
    diary_patient = django_filters.ModelChoiceFilter(
        queryset=Patient.objects.all(), label="Пациент", empty_label="Все пациенты"
    )

    class Meta:
        model = Diary
        fields = ["diary_patient"]


class DiaryFilter(django_filters.FilterSet):
    diary_patient = django_filters.ModelChoiceFilter(
        queryset=Patient.objects.all(), label="Пациент", empty_label="Все пациенты"
    )
    diary_date = django_filters.DateFromToRangeFilter(label="Период (от и до)")

    class Meta:
        model = Diary
        fields = ["diary_patient", "diary_date"]


class DoctorPatientAssignmentFilter(django_filters.FilterSet):
    class Meta:
        model = DoctorPatientAssignment
        fields = ["assignment_doctor"]


class DocumentFilter(django_filters.FilterSet):
    document_patient = django_filters.ModelChoiceFilter(
        queryset=Patient.objects.all(), label="Пациент", empty_label="Все пациенты"
    )
    document_date = django_filters.DateFromToRangeFilter(label="Период (от и до)")
    document_type = django_filters.ChoiceFilter(
        choices=TypeEnum.choices,
        label="Тип документа",
        empty_label="Все типы"
    )
    class Meta:
        model = Document
        fields = ["document_patient", "document_date", "document_type"]


class AnalyzesFilter(django_filters.FilterSet):
    notes_patient = django_filters.ModelChoiceFilter(
        queryset=Patient.objects.all(), label="Пациент", empty_label="Все пациенты"
    )

    class Meta:
        model = AnalysisNotes
        fields = ["notes_patient"]


class NoteFilter(django_filters.FilterSet):
    note_patient = django_filters.ModelChoiceFilter(
        queryset=Patient.objects.all(), label="Пациент", empty_label="Все пациенты"
    )
    note_date = django_filters.DateFromToRangeFilter(label="Период (от и до)")

    class Meta:
        model = Note
        fields = ["note_patient", "note_date"]



class DeviceDataFilter(django_filters.FilterSet):
    devicedata_patient = django_filters.ModelChoiceFilter(
        queryset=Patient.objects.all(), label="Пациент", empty_label="Все пациенты"
    )
    devicedata_date = django_filters.DateFromToRangeFilter(label="Период (от и до)")

    class Meta:
        model = DeviceData
        fields = ["devicedata_patient", "devicedata_date"]


class AppointmentFilter(django_filters.FilterSet):
    appointment_patient = django_filters.ModelChoiceFilter(
        queryset=Patient.objects.all(), label="Пациент", empty_label="Все пациенты"
    )

    class Meta:
        model = Appointment
        fields = ["appointment_patient",]