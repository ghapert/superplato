import openai
from utils.attendance_summary import make_attendance_prompt
from dotenv import load_dotenv
import os
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# openai.AsyncOpenAI 대신 일반 openai 사용도 가능
# (굳이 asyncio가 필요없다면 그냥 openai.api_key = OPENAI_API_KEY 로 사용 가능)

client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

async def get_gpt_attendance_analysis(records, lecture_name: str):
    prompt = make_attendance_prompt(records, lecture_name)
    
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "당신은 대학 출석 데이터를 분석하는 교육 평가 전문가입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5
    )

    return response.choices[0].message.content.strip()