import pdfplumber
import json
import time
import logging
from json_repair import repair_json
from openai import OpenAI, Timeout


client = OpenAI(
    base_url="http://mossy.ru:10000/v1",
    api_key="ollama",
    timeout=Timeout(timeout=120.0, connect=10.0),
)

SYSTEM_PROMPT = """
Ты — медицинский парсер лабораторных отчетов. Твоя задача:
1. Убрать все дубликаты строк и артефакты форматирования.
2. Нормализовать таблицу результатов анализов.
3. В названиях анализов оставить только русских названия без сокращений.
4. Вернуть СТРОГО JSON без markdown-обёрток.
5. Для каждого показателя надо еще тип анализа: Общий анализ крови, Биохимический анализ крови, Эндокринная система, Анализ кала или Анализ мочи
6. Надо получить дату документа. 
Формат JSON:
{
  "date": "",
  "tests": [
    {"type": "", "name": "", "value": "", "unit": ""}
  ]
}
Правила:
- Если поле пустое или не найдено, ставь null.
- Числа оставляй как строки.
- Не добавляй пояснений, только JSON.
"""

USER_PROMPT = """
Очисти и структурируй следующий текст лабораторного отчета:
{text}
"""


def extract_raw_text(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        pages_text = []
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                pages_text.append(text)
        result = "\n".join(pages_text)
    return result


def parse_with_llm(raw_text):
    try:
        response = client.chat.completions.create(
            model="Qwen3.6-35B-A3B-Q8_0",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": USER_PROMPT.format(text=raw_text[:4000])},
            ],
            temperature=0.0,
            max_tokens=1500,
            response_format={"type": "json_object"},
            extra_body={
                "chat_template_kwargs": {"enable_thinking": False}
            }
        )
        raw_json = response.choices[0].message.content
        fixed_json = repair_json(raw_json)
        result = json.loads(fixed_json) 
        return result
    except Exception as e:
        raise


def parse_medical_pdf(pdf_path: str) -> dict:
    try:
        raw_text = extract_raw_text(pdf_path)
        if not raw_text.strip():
            return {"tests": []}
        result = parse_with_llm(raw_text)
        if not isinstance(result, dict) or "tests" not in result:
            raise ValueError("LLM вернула ответ без ключа 'tests'")
        return result
        
    except Exception as e:
        raise