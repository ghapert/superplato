from utils.plato_cookie import load_cookies_if_exist, save_cookies
from utils.auth_helper import decrypt
import logging

async def get_plato_session(p, user):
    student_id = user.student_id
    student_pw = decrypt(user.student_password_encrypted)
    # 디버깅용 상세 추적은 debug, 주요 이벤트는 info
    logging.debug(f"[get_plato_session 진입] student_id={student_id}")

    logging.debug("[브라우저 시작 시도 중]")
    browser = await p.chromium.launch(headless=True)
    logging.info("[브라우저 시작 성공]")

    try:
        # 1️. 쿠키로 우선 시도
        context = await load_cookies_if_exist(browser, student_id)
        if context:
            logging.debug("[쿠키 기반 로그인 시도]")
            page = await context.new_page()
            await page.goto("https://plato.pusan.ac.kr/login.php")
            await page.wait_for_load_state("networkidle")

            logout_button = await page.query_selector('button[title=""]:has-text("로그아웃")')
            if logout_button:
                logging.info("[쿠키 로그인 성공 (로그아웃 버튼 감지됨)]")
                await page.goto("https://plato.pusan.ac.kr")
                return browser, page
            else:
                logging.warning("[쿠키 로그인 실패: 로그아웃 버튼 없음]")
                await context.close()  # 쿠키 context 명시적 종료

        # 2. 실패 시 로그인
        context = await browser.new_context()
        logging.info("[🔐 수동 로그인 시도]")
        page = await context.new_page()
        await page.goto("https://plato.pusan.ac.kr/login.php")
        logging.debug("[학번 입력 시도]")
        await page.fill('input[name="username"]', student_id)
        logging.debug("[비밀번호 입력 시도]")
        await page.fill('input[name="password"]', student_pw)
        logging.debug("[로그인 버튼 클릭]")
        await page.click('[name="loginbutton"]')
        logging.debug("[로드 대기]")
        await page.wait_for_load_state("networkidle")

        # 3. 로그인 실패 확인
        if "login.php" in page.url or await page.query_selector("div.loginerrors"):
            raise Exception("로그인 실패: 학번 또는 비밀번호 오류")

        # 4. 쿠키 저장
        await save_cookies(context, student_id)
        logging.debug("[쿠키 저장 성공]")
        logging.info("[로그인 및 쿠키 저장 완료]")
        return browser, page

    except Exception as e:
        logging.error("[예외 발생, 브라우저 종료 중]")
        logging.error(f"[세션 생성 실패] {e}")
        import sys
        import traceback
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logging.error("traceback info:")
        tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
        for line in tb_lines:
            logging.error(line.strip())
        await browser.close()
        raise
