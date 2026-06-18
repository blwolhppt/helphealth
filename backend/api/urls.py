from django.urls import path, include
from rest_framework.routers import SimpleRouter
from api import views
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import DoctorTokenView

router = SimpleRouter()

router.register("specializations", views.SpecializationViewSet)
router.register("chronicdiseas", views.ChronicDiseasViewSet)
router.register("analysisindicators", views.AnalysisIndicatorsViewSet)

router.register("analysisnotes", views.AnalysisNotesViewSet)

router.register("doctors", views.DoctorViewSet)
router.register("patients", views.PatientViewSet)
router.register("assignments", views.DoctorPatientAssignmentViewSet)

router.register("diaries", views.DiaryViewSet)
router.register("documents", views.DocumentViewSet)
router.register("notes", views.NoteViewSet)
router.register("devicedata", views.DeviceDataViewSet)

router.register("notifications", views.NotificationViewSet)
router.register("appointments", views.AppointmentViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path('token/', DoctorTokenView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
