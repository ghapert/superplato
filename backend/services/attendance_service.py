from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from datetime import datetime

from utils.auth_helper import decrypt
from utils.plato_login import get_plato_session
from utils.attendance_summary import summarize_attendance_with_redemption

# --- get_attendance_summary_for_user 함수 추가 ---
async def get_attendance_summary_for_user(user, plato_course_id):
    async with async_playwright() as p:
        student_id = user.student_id
        student_pw = decrypt(user.student_password_encrypted)

        browser, page = await get_plato_session(p, user)

        try:
            # 출석 상태 페이지로 이동
            await page.goto(f'https://plato.pusan.ac.kr/local/ubattendance/my_status.php?id={plato_course_id}')
            
            # 자동 출석 페이지로 리다이렉트되는지 확인
            if "autoattendance" in page.url:
                # '출석 현황' 링크를 찾아 클릭
                await page.click('a.nav-link[title="출석 현황"]')
                # 다시 매뉴얼 출석 페이지에서 테이블 로딩을 기다림
                await page.wait_for_selector("table.attendance_my")
            
            html = await page.content()
            
        finally:
            await browser.close()

    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_="attendance_my")
    rows = table.tbody.find_all("tr")

    records = []
    for row in rows:
        cols = row.find_all("td")
        date = cols[0].get_text(strip=True)
        period = cols[1].get_text(strip=True)

        if "○" in cols[2].get_text():
            status = "출석"
        elif "○" in cols[3].get_text():
            status = "결석"
        elif "○" in cols[4].get_text():
            status = "지각"
        elif "○" in cols[5].get_text():
            status = "조퇴"
        else:
            status = "기록 없음"

        records.append({
            "date": date,
            "period": period,
            "status": status
        })

    return {
        "records": records,
        "summary": summarize_attendance_with_redemption(records)
    }

