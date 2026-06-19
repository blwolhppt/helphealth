import threading
from django.core.mail import send_mail
from django.conf import settings

def send_confirmation_email_async(email, first_name, token):
    def _send():
        confirmation_link = f"{settings.FRONTEND_URL}/confirm-email?token={token}"
        send_mail(
            subject='Подтверждение регистрации в HealthHelp',
            message=f'Здравствуйте, {first_name}!\n\n'
                    f'Спасибо за регистрацию в HealthHelp.\n\n'
                    f'Для подтверждения вашего email перейдите по ссылке:\n\n'
                    f'{confirmation_link}\n\n'
                    f'Ссылка действительна 24 часа.\n\n'
                    f'С уважением,\nКоманда HealthHelp',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

    thread = threading.Thread(target=_send)
    thread.daemon = True
    thread.start()