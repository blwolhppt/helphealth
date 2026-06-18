import csv
from django.core.management.base import BaseCommand
from api.models import Specialization


class Command(BaseCommand):
    def handle(self, *args, **options):
        csv_file = open(
            "api/management/commands/specializations.csv",
            encoding="utf-8",
        )
        reader = csv.reader(csv_file, delimiter=",")
        next(reader, None)
        list_specializations = []
        for row in reader:
            name, slug = row
            list_specializations.append(
                Specialization(specialization_name=name, specialization_slug=slug)
            )
        Specialization.objects.bulk_create(
            list_specializations,
            ignore_conflicts=True
        )
        print("Специализации +")
