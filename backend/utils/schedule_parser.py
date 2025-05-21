from bs4 import BeautifulSoup
from utils.end_time_calculator import calc_end_time
import re

def parse_schedule(html, course_code, section_number):
    """강의 시간표 HTML에서 강의 시간 정보를 파싱합니다."""
    soup = BeautifulSoup(html, 'html.parser')
    rows = soup.select('#resultTbody > tr')
    print(f"[ROWS] 총 {len(rows)}개 발견됨")

    results = []

    for i, row in enumerate(rows):
        tds = row.find_all('td')
        if len(tds) < 12:
            continue

        raw_code = tds[7].get_text(strip=True)
        raw_section = tds[8].get_text(strip=True)
        section_match = re.match(r"(\d{3}(?:\.\d+/\d+)?)", raw_section)
        section = section_match.group(1) if section_match else raw_section.strip()

        code = raw_code.strip()
        course_code = course_code.strip()
        section_number = section_number.strip()

        print(f"[ {i+1}번 ROW] code={code} vs {course_code}, section={section} vs {section_number}")

        if code != course_code or section != section_number:
            print(f"[걸러짐] {code}-{section}")
            continue

        time_text = tds[11].get_text(separator=" ", strip=True)
        print("[시간 정보 원문]:", time_text)

        parsed_blocks = []

        # 형식 1: 시간범위형 (ex. 화 15:00-19:00 401-526)
        range_blocks = re.findall(
            r"([월화수목금토])\s+(\d{2}:\d{2})-(\d{2}:\d{2})\s+([\w\-가-힣\d]+)", time_text
        )
        for weekday, start, end, location in range_blocks:
            duration = (
                (int(end.split(":")[0]) * 60 + int(end.split(":")[1]))
                - (int(start.split(":")[0]) * 60 + int(start.split(":")[1]))
            )
            parsed_blocks.append({
                "weekday": weekday,
                "start_time": start,
                "end_time": end,
                "duration": duration,
                "location": location
            })

        # 형식 2: 시간(분)형 (ex. 월 13:00(75) 313-106)
        time_blocks = re.findall(
            r"([월화수목금토])\s+(\d{2}:\d{2})\((\d+)\)\s+([가-힣A-Za-z0-9\-]+)", time_text
        )
        for weekday, start, duration, location in time_blocks:
            end_time = calc_end_time(start, int(duration))
            parsed_blocks.append({
                "weekday": weekday,
                "start_time": start,
                "end_time": end_time,
                "duration": int(duration),
                "location": location
            })

        # 형식 3: 사이버수업 (ex. 토 사이버수업)
        cyber_blocks = re.findall(r"([월화수목금토])\s+사이버수업", time_text)
        for weekday in cyber_blocks:
            parsed_blocks.append({
                "weekday": weekday,
                "start_time": None,
                "end_time": None,
                "duration": None,
                "location": "사이버수업"
            })

        # 형식 4: 1.5/3 시간 처리 (ZE1000115 관련)
        new_blocks = re.findall(r"([월화수목금토])\s+(\d+(?:\.\d+/\d+)?)\s+([\w\-가-힣\d]+)", time_text)
        for weekday, time_info, location in new_blocks:
            parsed_blocks.append({
                "weekday": weekday,
                "start_time": time_info,  # 임시로 시간 정보를 start_time에 저장
                "end_time": None,
                "duration": None,
                "location": location
            })

        print("[추출 결과]:", parsed_blocks)
        results.extend(parsed_blocks)

    print("[최종 결과]:", results)
    return results
