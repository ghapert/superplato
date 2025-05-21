import time

# PLATO 사이트에서 모달창(알림창) 닫기용 함수
# - 'button.close[data-dismiss="modal"]' 셀렉터를 가진 모든 버튼을 찾아 클릭
# - 성공 시 True, 실패 시 False 반환
async def popup_close(page):
    try:
        await page.wait_for_selector('button.close[data-dismiss="modal"]', timeout=3000)
        await page.evaluate("""
            () => {
                const buttons = document.querySelectorAll('button.close[data-dismiss="modal"]');
                buttons.forEach(btn => btn.click());
            }
        """)
        await page.wait_for_timeout(1000)
        return True
    except:
        return False