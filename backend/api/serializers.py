from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.hashers import make_password
from .models import (
    Doctor,
    Notification,
    Patient,
    DoctorPatientAssignment,
    Document,
    Diary,
    Specialization,
    ChronicDiseas,
    AnalysisIndicators,
    AnalysisNotes,
    Note,
    TypeEnum,
    DeviceData,
    Appointment
)


class DoctorTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['doctor_id'] = user.id
        token['full_name'] = f"{user.doctor_second_name} {user.doctor_first_name}"
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['doctor'] = {
            'id': self.user.id,
            'first_name': self.user.doctor_first_name,
            'second_name': self.user.doctor_second_name,
            'email': self.user.doctor_email,
        }
        return data

class DoctorTokenView(TokenObtainPairView):
    serializer_class = DoctorTokenSerializer

    
class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = "__all__"


class ChronicDiseasSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronicDiseas
        fields = "__all__"


class AnalysisIndicatorsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisIndicators
        fields = "__all__"


class DoctorSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Doctor
        fields = (
            "username", "password",
            "doctor_first_name", "doctor_second_name", "doctor_third_name",
            "doctor_email", "doctor_phone_number",
            "doctor_date_of_birth", "doctor_photo",
            "doctor_specialization", "doctor_workplace", 
            "doctor_experience", "doctor_description"
        )

    def create(self, validated_data):
        specializations = validated_data.pop("doctor_specialization", [])
        validated_data["password"] = make_password(validated_data.get("password"))
        doctor = super().create(validated_data)
        if specializations:
            doctor.doctor_specialization.set(specializations)
        
        return doctor

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        if password:
            validated_data["password"] = make_password(password)
        specializations = validated_data.pop("doctor_specialization", None)
        doctor = super().update(instance, validated_data)
        if specializations is not None:
            doctor.doctor_specialization.set(specializations)
        return doctor


class PatientSerializer(serializers.ModelSerializer):
    patient_diagnosis = ChronicDiseasSerializer(required=False, many=True)

    class Meta:
        model = Patient
        fields = "__all__"


class DoctorPatientAssignmentSerializer(serializers.ModelSerializer):
    assignment_patient = PatientSerializer()

    class Meta:
        model = DoctorPatientAssignment
        fields = ("id", "assignment_doctor", "assignment_patient", "assignment_status", "assignment_date")
        read_only_fields = ("assignment_doctor", "assignment_date")


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id",
            "document_patient",
            "document_type",
            "document_file",
            "document_name",
            "document_date",
        ]
    


class DiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Diary
        fields = "__all__"


class DocumentParseSerializer(serializers.Serializer):
    file = serializers.FileField(required=True, allow_empty_file=False)
    document_type = serializers.ChoiceField(choices=TypeEnum.choices, required=True)
    document_name = serializers.CharField(
        required=False, allow_blank=True, max_length=255
    )

    def validate_file(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Только PDF файлы поддерживаются")
        if value.size > 25 * 1024 * 1024:
            raise serializers.ValidationError("Файл слишком большой (макс. 25 MB)")
        return value


class AnalysisNotesSerializer(serializers.ModelSerializer):
    notes_indicators = AnalysisIndicatorsSerializer()

    class Meta:
        model = AnalysisNotes
        fields = (
            "notes_patient",
            "notes_indicators",
            "notes_value",
            "notes_measure",
            "notes_date",
        )


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ("id", "note_patient", "note_doctor", "note_description", "note_reason", "note_date")
        read_only_fields = ("note_doctor", "note_date")


class DeviceDataSerializer(serializers.ModelSerializer):

    class Meta:
        model = DeviceData
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            "id", "notification_doctor","notification_patient","patient_name","notification_type","notification_message",
            "notification_is_read","notification_created_at",)
        read_only_fields = fields

    def get_patient_name(self, obj):
        p = obj.notification_patient
        return f"{p.patient_second_name} {p.patient_first_name}".strip()
    

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields =  "__all__"
