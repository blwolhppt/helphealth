from datetime import datetime
from django.utils import timezone
import json
import os
import re
import sys
import tempfile
import threading
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import timedelta
import secrets
from django.core.mail import send_mail
from rest_framework import viewsets, status, permissions
import secrets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from django_filters.rest_framework import DjangoFilterBackend
from api import serializers, filters
from rest_framework.decorators import action
from django.conf import settings

from .tasks import send_confirmation_email_async
from .function.conv import parse_medical_pdf
from .models import (
    Doctor,
    Patient,
    DoctorPatientAssignment,
    Document,
    Diary,
    Specialization,
    ChronicDiseas,
    AnalysisIndicators,
    TypeEnum,
    AnalysisNotes,
    Note,
    DeviceData,
    Notification,
    Appointment
)
from rest_framework.response import Response


class SpecializationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialization.objects.all()
    serializer_class = serializers.SpecializationSerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None


class ChronicDiseasViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ChronicDiseas.objects.all()
    serializer_class = serializers.ChronicDiseasSerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None


class AnalysisIndicatorsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AnalysisIndicators.objects.all()
    serializer_class = serializers.AnalysisIndicatorsSerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None


@method_decorator(csrf_exempt, name='dispatch')
class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = serializers.DoctorSerializer

    http_method_names = ["get", "post", "delete", "patch"]

    def get_permissions(self):
        if self.action in ["create", "confirm_email"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_authenticators(self):
        action = getattr(self, "action", None)
        if action in ["confirm_email", "create"]:
            return []
        return super().get_authenticators()

    @action(detail=False,
            methods=["post"],
            permission_classes=[permissions.AllowAny])
    def confirm_email(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Токен не указан"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            doctor = Doctor.objects.get(email_confirmation_token=token)
        except Doctor.DoesNotExist:
            return Response({"error": "Недействительный токен"}, status=status.HTTP_400_BAD_REQUEST)
        if doctor.email_confirmation_token_created_at:
            token_age = timezone.now() - doctor.email_confirmation_token_created_at
            if token_age > timedelta(hours=24):
                return Response({"error": "Срок действия токена истек"}, status=status.HTTP_400_BAD_REQUEST)
        doctor.is_email_confirmed = True
        doctor.email_confirmation_token = None
        doctor.email_confirmation_token_created_at = None
        doctor.is_active = True
        doctor.save(update_fields=["is_email_confirmed", "email_confirmation_token", "email_confirmation_token_created_at", "is_active"])
        return Response({"message": "Email успешно подтвержден!"}, status=status.HTTP_200_OK)

    @action(detail=False,
            methods=["post"],
            permission_classes=[permissions.IsAuthenticated])
    def resend_confirmation(self, request):
        doctor = request.user
        if doctor.is_email_confirmed:
            return Response(
                {"message": "Email уже подтвержден"}, 
                status=status.HTTP_200_OK
            )
        token = secrets.token_urlsafe(48)
        doctor.email_confirmation_token = token
        doctor.email_confirmation_token_created_at = timezone.now()
        doctor.save(update_fields=["email_confirmation_token", "email_confirmation_token_created_at"])
        send_confirmation_email_async(
            doctor.doctor_email,
            doctor.doctor_first_name,
            token
        )
        return Response({"message": "Письмо с подтверждением отправлено"}, status=status.HTTP_200_OK)
    
    @action(detail=False,
            methods=["post"],
            permission_classes=[permissions.IsAuthenticated])
    def assign_patient(self, request):
        code = request.data.get("code")
        if not code:
            return Response(
                {"error": "Код не указан"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            patient = Patient.objects.get(patient_invite_code=code)
        except Patient.DoesNotExist:
            return Response(
                {"error": "Пациент с таким кодом не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        if DoctorPatientAssignment.objects.filter(
            assignment_doctor=request.user,
            assignment_patient=patient
        ).exists():
            return Response(
                {"message": "Пациент уже привязан к вам"}, 
                status=status.HTTP_200_OK
            )
        assignment = DoctorPatientAssignment.objects.create(
            assignment_doctor=request.user,
            assignment_patient=patient,
            assignment_date=timezone.now(),
            assignment_status="Active"
        )
        return Response({
            "status": "success",
            "message": "Пациент успешно привязан",
            "assignment_id": assignment.id,
            "patient_name": f"{patient.patient_second_name} {patient.patient_first_name}"
        }, status=status.HTTP_201_CREATED)


def get_patient_from_token(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token = auth_header.split(' ')[1]
        try:
            return Patient.objects.get(patient_auth_token=token)
        except Patient.DoesNotExist:
            return None
    return None


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = serializers.PatientSerializer

    http_method_names = ["get", "post", "delete", "patch"]

    @action(detail=False, 
        methods=["post"], 
        permission_classes=(permissions.AllowAny,))
    def register(self, request):
        email = request.data.get("patient_email")
        phone = request.data.get("patient_phone_number")
        password = request.data.get("patient_password")

        if not all([email, phone, password]):
            return Response({"error": "Заполните все поля"}, status=status.HTTP_400_BAD_REQUEST)

        if Patient.objects.filter(patient_email=email).exists():
            return Response({"error": "Email уже зарегистрирован"}, status=status.HTTP_400_BAD_REQUEST)
        if Patient.objects.filter(patient_phone_number=phone).exists():
            return Response({"error": "Телефон уже зарегистрирован"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data["patient_password"] = make_password(password)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        invite_code = patient.generate_invite_code()
        patient.patient_invite_code = invite_code
        token = secrets.token_urlsafe(32)
        patient.patient_auth_token = token

        patient.save(update_fields=["patient_invite_code", "patient_auth_token"])

        return Response({
            "status": "success",
            "patient_id": patient.id,
            "token": token,
            "invite_code": invite_code,
            "name": f"{patient.patient_second_name} {patient.patient_first_name}"
        }, status=status.HTTP_201_CREATED)


    @action(detail=False, 
            methods=["post"], 
            permission_classes=(permissions.AllowAny,))
    def login(self, request):
        email = request.data.get("patient_email")
        phone = request.data.get("patient_phone_number")
        password = request.data.get("patient_password")

        if not password or (not email and not phone):
            return Response({"error": "Укажите email/телефон и пароль"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient = Patient.objects.get(patient_email=email) if email else Patient.objects.get(patient_phone_number=phone)
        except Patient.DoesNotExist:
            return Response({"error": "Пациент не найден"}, status=status.HTTP_404_NOT_FOUND)

        if not check_password(password, patient.patient_password):
            return Response({"error": "Неверный пароль"}, status=status.HTTP_401_UNAUTHORIZED)

        token = secrets.token_urlsafe(32)
        patient.patient_auth_token = token
        patient.save(update_fields=["patient_auth_token"])

        return Response({
            "status": "success",
            "patient_id": patient.id,
            "token": token,
            "invite_code": patient.patient_invite_code,
            "name": f"{patient.patient_second_name} {patient.patient_first_name}"
        }, status=status.HTTP_200_OK)


class DoctorPatientAssignmentViewSet(viewsets.ModelViewSet):
    queryset = DoctorPatientAssignment.objects.all()
    serializer_class = serializers.DoctorPatientAssignmentSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.DoctorPatientAssignmentFilter

    http_method_names = ["get", "post", "delete", "patch"]

    def get_queryset(self):
        return DoctorPatientAssignment.objects.filter(assignment_doctor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(assignment_doctor=self.request.user)


def normalize_date(date_str) :
    if not date_str or not isinstance(date_str, str):
        return timezone.now()
    clean_str = re.sub(r"[^\d\-\.\/]", "", date_str).strip()
    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(clean_str, fmt)
        except ValueError:
            continue

    return datetime.timezone.now()


def save_analysis_notes(patient_instance, report_date, tests_data):
    target_date = normalize_date(report_date)
    for test in tests_data:
        raw_name = test.get("name", "").strip()
        if not raw_name:
            continue
        clean_name = re.sub(r"\s*[\(\[].*?[\)\]]", "", raw_name).strip()
        indicator = AnalysisIndicators.objects.filter(
            analysis_indicators_name=clean_name
        ).first()
        if indicator is None:
            continue
        raw_value = str(test.get("value", "0")).replace(",", ".").strip()
        try:
            value_float = float(raw_value)
        except ValueError:
            continue

        measure = test.get("unit", "").strip()
        AnalysisNotes.objects.create(
            notes_patient=patient_instance,
            notes_indicators=indicator,
            notes_value=value_float,
            notes_measure=measure,
            notes_date=target_date,
        )


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = serializers.DocumentSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.DocumentFilter

    http_method_names = ["get", "post", "delete", "patch"]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document_type = serializer.validated_data.get("document_type")
        self.perform_create(serializer)

        patient = serializer.validated_data.get("document_patient")
        if str(document_type).lower() == str(TypeEnum.ANALYZES).lower():
            uploaded_file = serializer.validated_data.get("document_file")
            if uploaded_file:
                with tempfile.NamedTemporaryFile(
                    suffix=".pdf", delete=False
                ) as tmp_file:
                    tmp_path = tmp_file.name
                    uploaded_file.seek(0)
                    for chunk in uploaded_file.chunks():
                        tmp_file.write(chunk)
                doc_id = serializer.instance.id

                def _run_parse():
                    tid = threading.current_thread().name
                    sys.stdout.flush()
                    try:
                        result = parse_medical_pdf(tmp_path)
                        tests = result.get("tests", [])
                        report_date = result.get("date")
                        print(
                            json.dumps(result, ensure_ascii=False, indent=2), flush=True
                        )
                        save_analysis_notes(patient, report_date, tests)
                        sys.stdout.flush()
                    except Exception as e:
                        import traceback

                        traceback.print_exc(file=sys.stdout)
                        sys.stdout.flush()
                    finally:
                        if os.path.exists(tmp_path):
                            os.unlink(tmp_path)

                thread = threading.Thread(
                    target=_run_parse, daemon=True, name=f"parse-{doc_id}"
                )
                thread.start()

        headers = self.get_success_headers(serializer.data)
        return Response(
            {**serializer.data}, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_create(self, serializer):
        serializer.save()


class DiaryViewSet(viewsets.ModelViewSet):
    queryset = Diary.objects.all()
    serializer_class = serializers.DiarySerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.DiaryFilter

    http_method_names = ["get", "post"]


class AnalysisNotesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AnalysisNotes.objects.all()
    serializer_class = serializers.AnalysisNotesSerializer
    pagination_class = None

    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.AnalyzesFilter

    http_method_names = ["get", "post"]


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = serializers.NoteSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.NoteFilter

    http_method_names = ["get", "post"]

    def perform_create(self, serializer):
        serializer.save(note_doctor=self.request.user)



class DeviceDataViewSet(viewsets.ModelViewSet):
    queryset = DeviceData.objects.all()
    serializer_class = serializers.DeviceDataSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.DeviceDataFilter

    http_method_names = ["get", "post"]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = serializers.NotificationSerializer
    # permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch"]


    @action(detail=False, methods=["patch"])
    def mark_all_read(self, request):
        Notification.objects.filter(
            notification_doctor=request.user,
            notification_is_read=False
        ).update(notification_is_read=True)
        return Response({"detail": "Все уведомления отмечены как прочитанные"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = Notification.objects.filter(
            notification_doctor=request.user,
            notification_is_read=False
        ).count()
        return Response({"count": count})

    def perform_update(self, serializer):
        serializer.save(notification_is_read=True)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = serializers.AppointmentSerializer
    pagination_class = None

    filter_backends = [DjangoFilterBackend]
    filterset_class = filters.AppointmentFilter

    http_method_names = ["get", "post", "delete"]