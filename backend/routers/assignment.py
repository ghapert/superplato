from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from services.auth_dependency import verify_pro_user  # Pro 인증 활성화
import openai
import os
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from PIL import Image
import pytesseract
import io
import requests  # o1-pro 직접 호출용
import logging

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# openai.AsyncOpenAI 대신 일반 openai 사용도 가능
# (굳이 asyncio가 필요없다면 그냥 openai.api_key = OPENAI_API_KEY 로 사용 가능)
client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/gpt")
async def free_chat(
    question: str = Form(..., description="질문 또는 명령어"),
    model: str = Form(
        ...,
        description="사용할 수 있는 모델: gpt-3.5-turbo, gpt-4o, o1-pro (이외 모델은 불가)"
    ),
    file: UploadFile = File(None),
    current_user=Depends(verify_pro_user)  # Pro 유저만 접근 가능
):
    """
    GPT에게 자유롭게 질의/답변을 할 수 있는 엔드포인트.
    - 파일을 업로드하면 텍스트를 추출해서 함께 참고하도록 할 수 있음.
    - model 파라미터를 통해 원하는 GPT 모델을 지정할 수 있음.
    - 토큰 제한 없이 전체 답변을 받아옴.
    """

    allowed_models = {"gpt-3.5-turbo", "gpt-4o", "o1-pro"}
    if model not in allowed_models:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 모델입니다. 사용 가능한 모델: {', '.join(allowed_models)}"
        )

    # 1. (선택 사항) 파일로부터 텍스트를 추출
    extracted_text = ""
    if file is not None:
        content = await file.read()
        filename = file.filename.lower()

        text_extensions = [
            ".txt", ".md", ".py", ".java", ".c", ".cpp", ".csv", ".json", ".html", ".js", ".ts", ".css"
        ]
        pdf_extensions = [".pdf"]
        image_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]

        if any(filename.endswith(ext) for ext in text_extensions):
            # 텍스트 파일 계열
            try:
                extracted_text = content.decode("utf-8")
            except:
                try:
                    extracted_text = content.decode("euc-kr")
                except:
                    raise HTTPException(status_code=400, detail="파일을 텍스트로 디코딩할 수 없습니다.")
        elif any(filename.endswith(ext) for ext in pdf_extensions):
            # PDF
            try:
                pdf = PdfReader(io.BytesIO(content))
                for page in pdf.pages:
                    extracted_text += page.extract_text() or ""
                if not extracted_text.strip():
                    raise HTTPException(status_code=400, detail="PDF에서 텍스트를 추출할 수 없습니다.")
            except:
                raise HTTPException(status_code=400, detail="PDF 파일을 읽을 수 없습니다.")
        elif any(filename.endswith(ext) for ext in image_extensions):
            # 이미지
            try:
                image = Image.open(io.BytesIO(content))
                extracted_text = pytesseract.image_to_string(image, lang="kor+eng")
                if not extracted_text.strip():
                    raise HTTPException(
                        status_code=400,
                        detail="이미지에서 텍스트를 추출할 수 없습니다. (이미지 품질이 낮거나 텍스트가 포함되지 않았을 수 있습니다.)"
                    )
            except pytesseract.TesseractNotFoundError:
                raise HTTPException(
                    status_code=500,
                    detail="서버에 Tesseract-OCR이 설치되어 있지 않거나 PATH에 등록되어 있지 않습니다."
                )
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"이미지 파일을 읽거나 OCR 처리할 수 없습니다. ({str(e)})"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail="지원하지 않는 파일 형식입니다. 텍스트, PDF, 이미지 파일만 업로드하세요."
            )

    # 2. GPT에 넘길 프롬프트 구성
    # 파일이 있을 경우 해당 내용도 함께 전달
    if extracted_text.strip():
        prompt = (
            f"[업로드된 파일 내용]\n"
            f"{extracted_text}\n"
            f"---\n"
            f"[사용자 요청]\n{question}"
        )
    else:
        # 파일이 없으면 그냥 question만 사용
        prompt = question

    # 3. OpenAI ChatCompletion 호출
    if model == "o1-pro":
        # o1-pro는 requests로 직접 호출 (v1/responses 엔드포인트만 지원)
        api_key = os.getenv("OPENAI_API_KEY")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "o1-pro",
            "input": prompt,
            "reasoning": {"effort": "high"}
        }
        try:
            resp = requests.post("https://api.openai.com/v1/responses", headers=headers, json=data)
            resp.raise_for_status()
            result = resp.json()
            logging.info(f"[o1-pro 응답] {result}")  # o1-pro 응답 로그 추가
            answer = result.get("output") or result.get("choices", [{}])[0].get("message", {}).get("content", "")
            return {
                "status": "success",
                "model": model,
                "answer": answer,
                "raw": result
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"o1-pro API 오류: {str(e)}"
            )
    elif model in {"gpt-3.5-turbo", "gpt-4o"}:
        # gpt-3.5-turbo, gpt-4o만 OpenAI ChatCompletion 사용
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "당신은 친절하고 유능한 AI 비서입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            logging.info(f"[GPT 응답] {response}")  # 모든 응답을 로그에 남김
            answer = response.choices[0].message.content.strip()
            return {
                "status": "success",
                "model": model,
                "answer": answer
            }
        except openai.BadRequestError as e:
            # 모델 미지원 등 404 에러 메시지 명확화
            return {
                "status": "error",
                "model": model,
                "message": "해당 모델은 지원하지 않거나, 올바른 엔드포인트가 아닙니다. (gpt-3.5-turbo, gpt-4o만 지원)"
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API 오류: {str(e)}"
            )
