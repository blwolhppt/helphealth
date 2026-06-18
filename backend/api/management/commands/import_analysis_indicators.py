import csv
from django.core.management.base import BaseCommand
from api.models import AnalysisIndicators


class Command(BaseCommand):
    def handle(self, *args, **options):
        csv_file = open(
            "api/management/commands/analysis_indicators.csv",
            encoding="utf-8",
        )
        reader = csv.reader(csv_file, delimiter=",")
        next(reader, None)
        list_analysisindicators = []
        for row in reader:
            type, name, slug = row
            list_analysisindicators.append(
                AnalysisIndicators(
                    analysis_indicators_type=type,
                    analysis_indicators_name=name,
                    analysis_indicators_slug=slug,
                )
            )
        AnalysisIndicators.objects.bulk_create(
            list_analysisindicators, 
            ignore_conflicts=True
        )
        print("Показатели анализов +")
