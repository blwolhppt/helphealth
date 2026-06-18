from django.core.exceptions import ValidationError
from django.utils import timezone
import re


def validate_birth_date(value):
    today = timezone.now().date()
    min_year = today.year - 100
    max_year = today.year - 5

    if not (min_year <= value.year <= max_year):
        raise ValidationError(
            f"Дата рождения должна быть в диапазоне от {min_year} до {max_year} года!"
        )


def validate_phone_number(value):
    pattern = r"^(?:\(\d{3}\)|\d{3})\d{3}-?\d\d-?\d\d$"
    if not re.fullmatch(pattern, value):
        raise ValidationError("Введенный номер телефона не подходит по формату!")


def validate_password(value):
    if len(value) <= 8:
        raise ValidationError("Пароль должен быть длиннее 8 символов!")
    if not any(i.isupper() for i in value):
        raise ValidationError("Пароль должен содержать хотя бы одну заглавную букву.")
    if not any(i in "!@#$%^&*()_+-=[]{}|;:',.<>?/" for i in value):
        raise ValidationError(
            "Пароль должен содержать хотя бы один специальный символ."
        )


def validate_mark(value):
    if not (1 <= value <= 5):
        raise ValidationError(
            f"Оценка должна быть от 1 до 5! Поставьте, пожалуйста, корректную оценку."
        )


def validate_steps(value):
    if not (value >= 1):
        raise ValidationError(
            f"Шагов не может быть меньше 1."
        )
    

def validate_mark_device(value):
    if value < 0 and value > 100:
        raise ValidationError(
            f"Оценка не может быть больше 100 или меньше 0."
        )