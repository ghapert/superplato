from datetime import date
today = date.today().strftime("%Y-%m-%d")

# --- F 기준 계산기 함수 추가 ---
def summarize_attendance_with_redemption(records):
    from datetime import datetime
    today = datetime.today().date()

    total_expected_classes = 0
    past_classes = 0
    current_attendance = 0

    for r in records:
        try:
            class_date = datetime.strptime(r["date"], "%Y-%m-%d").date()
        except ValueError:
            continue

        total_expected_classes += 1

        if class_date <= today:
            past_classes += 1
            if r["status"] in ["출석", "기록 없음"]:
                current_attendance += 1

    required_attendance = int((2 / 3) * total_expected_classes)
    remaining_classes = total_expected_classes - past_classes
    max_possible_attendance = current_attendance + remaining_classes

    if max_possible_attendance < required_attendance:
        status = "당신은 이미 F 확정입니다..."
        max_absent_allowed = 0
    else:
        max_absent_allowed = max_possible_attendance - required_attendance
        status = f"{max_absent_allowed}번까지 결석 가능 (그 이상은 F)"

    return {
        "총 수업 예정": total_expected_classes,
        "현재까지 출석 간주 수": current_attendance,
        "2/3 기준 최소 출석 필요": required_attendance,
        "앞으로 남은 수업 수": remaining_classes,
        "앞으로 결석 가능 횟수": max_absent_allowed,
        "현재 상황": status
    }


def make_attendance_prompt(records: list, lecture_name: str = "") -> str:
    """
    출석 기록 리스트를 GPT가 이해하기 쉬운 자연어 형식으로 변환.
    """
    lines = []
    for r in records:
        lines.append(f"- {r['date']} / {r['period']}교시 / {r['status']}")

    formatted_records = "\n".join(lines)

    prompt = f"""
'{lecture_name}' 수업에 대한 출석 기록을 분석해 주세요.

📘 수업명: {lecture_name}
📅 출석 내역:
{formatted_records}

📌 출석 정책:

- 전체 수업 중 **2/3 이상 출석**해야 학점이 인정됩니다.
- '출석'은 출석으로 인정됩니다.
- '결석'은 인정되지 않으며, 일정 횟수 이상 시 F 처리됩니다.
- '지각', '조퇴'는 일부 교수는 출석으로 인정하지만, 일반적으로는 **부분 결석 혹은 결석 처리**될 수 있습니다.
- '기록 없음'의 해석은 다음과 같습니다:
  - 보통 온라인 출결을 사용하는 교수의 경우, **기록 없음이더라도 출석으로 인정**되는 경우가 많습니다 (특히 과거 날짜).
  - 그러나 기록 없음이 반복적으로 많다면, 해당 교수는 **온라인 출결을 사용하지 않을 가능성**이 높습니다. 이 경우, 기록 없음은 출석으로 간주되지 않을 수 있습니다.
- **공휴일이나 결강**은 결석으로 처리되지 않으며, **전체 수업 횟수에도 포함되지 않아야** 합니다.

🧠 GPT에게 요청:
위 정책을 바탕으로 아래 출석 데이터를 분석해 주세요:

1. 현재까지의 출석 상황을 요약해 주세요  
2. 이 학생이 F를 받을 위험이 있는지 판단해 주세요  
3. 앞으로 몇 번까지 결석 가능할지 계산해 주세요  
4. 수업별 특성을 감안한 전략이나 주의사항을 제시해 주세요  
5. 출석 기록을 바탕으로, 특정일 이후 출석 횟수가 급감하는 등 패턴 변화가 있다면 해당 시점과 그 원인을 추론해 주세요  

📆 참고: 오늘 날짜는 {today}입니다.
- 오늘 이후의 날짜는 아직 수업이 진행되지 않았습니다.
- 출석 분석은 오늘까지의 날짜까지만 분석해주세요.
"""

    return prompt.strip()