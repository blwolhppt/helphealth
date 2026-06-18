import csv
from django.core.management.base import BaseCommand
from api.models import ChronicDiseas


class Command(BaseCommand):
    def handle(self, *args, **options):
        csv_file = open(
            "api/management/commands/chronic_diseases.csv",
            encoding="utf-8",
        )
        # reader = csv.reader(csv_file, delimiter='|')
        next(csv_file, None)
        list_chronic_diseases = []
        for line in csv_file:
            line = line.strip()
            if not line:
                continue
            if line.startswith('"') and line.endswith('"'):
                line = line[1:-1]

            name, slug = line.split("|", 1)
            list_chronic_diseases.append(
                ChronicDiseas(
                    chronic_diseas_name=name.strip(), chronic_diseas_slug=slug.strip()
                )
            )
        ChronicDiseas.objects.bulk_create(
            list_chronic_diseases, 
            ignore_conflicts=True
        )
        print("Хронические заболевания +")
