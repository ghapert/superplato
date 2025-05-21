import re

def search_campus(building_code):
    """
    건물 코드(building_code)를 받아 해당 캠퍼스의 건물 이름을 반환.
    부산, 양산, 밀양, 아미 캠퍼스의 건물 코드/이름 매핑을 모두 포함.
    """
    busan_campus = {
        "101": "MEMS / NANO 클린룸동",
        "102": "IT관(건축중)",
        "103": "제12 공학관",
        "105": "제3 공학관(융합기계관)",
        "106": "효원문화회관",
        "107": "제8 공학관(항공관)",
        "108": "제9 공학관(기전관)",
        "109": "공과대학 공동실험관",
        "110": "에너지분야 실험실",
        "111": "실험폐기물처리장",
        "201": "제6 공학관(컴퓨터공학관)",
        "202": "운죽정",
        "203": "넉넉한터",
        "204": "넉넉한터 지하주차장",
        "205": "대학본부",
        "206": "제11 공학관(조선해양공학관)",
        "207": "제10 공학관(특성화공학관)",
        "208": "기계기술연구동",
        "209": "상남국제관",
        "210": "언어교육원",
        "211": "보육종합센터",
        "301": "구조실험동",
        "302": "토조실험동",
        "303": "기계관",
        "306": "인문관",
        "307": "인문대교수연구동",
        "308": "제1 물리관",
        "309": "제2 물리관",
        "310": "문창회관",
        "311": "공동연구기기동",
        "312": "공동실험실습관",
        "313": "자연대 연구실험동",
        "314": "정보화교육관",
        "315": "자유관 A동",
        "316": "자유관 B동",
        "317": "직장어린이집",
        "318": "자유주차장",
        "401": "건설관",
        "402": "정학관",
        "403": "10. 16 기념관",
        "405": "제2 공학관(재료관)",
        "406": "제7 공학관(화공관)",
        "407": "선박예인수조연구동",
        "408": "제5 공학관(유기소재관)",
        "409": "교수회관",
        "410": "선박충격ㆍ피로ㆍ도장ㆍ시험연구동",
        "412": "박물관 A",
        "413": "박물관 B",
        "414": "지구관",
        "415": "샛벌회관",
        "416": "생물관",
        "417": "제1 사범관",
        "418": "제2 교수연구동",
        "419": "금정회관",
        "420": "새벽벌도서관",
        "421": "사회관",
        "422": "성학관",
        "501": "첨단과학관",
        "503": "약학관",
        "506": "효원산학협동관",
        "507": "인덕관",
        "508": "산학협동관",
        "509": "박물관 별관",
        "510": "중앙도서관",
        "511": "간이체육관",
        "512": "테니스장",
        "513": "철골주차장",
        "514": "경영관",
        "515": "중앙도서관 및 정보화본부",
        "516": "경제통상관",
        "601": "예술관",
        "602": "생활과학관 강의동",
        "603": "생활과학관 연구동",
        "605": "학군단",
        "606": "화학관",
        "607": "수학관·공동연구소동",
        "608": "제2 법학관",
        "609": "법학관",
        "701": "제2 사범관",
        "702": "조소실",
        "703": "미술관",
        "704": "조형관",
        "705": "경암체육관 교수연구동",
        "706": "경암체육관",
        "707": "음악관",
        "708": "학생회관",
        "709": "과학기술연구동",
        "710": "대운동장",
        "711": "효원재",
        "712": "웅비관 A동",
        "713": "웅비관 B동",
        "714": "진리관 관리동",
        "715": "진리관 가동",
        "716": "진리관 나동",
        "717": "진리관 다동",
        "K05": "변전실",
        "K08": "공과대학 제2별관",
    }
    yangsan_campus = {
        "Y01": "경암의학관",
        "Y02": "치의학전문대학원",
        "Y03": "한의학전문대학원",
        "Y04": "간호대학",
        "Y05": "행림관",
        "Y06": "지진방재연구센터",
        "Y07": "파워플랜트",
        "Y08": "쓰레기집하장",
        "Y09": "나래관",
        "Y10": "의생명과학도서관",
        "Y11": "충격공학연구센터 시험연구동",
        "Y12": "운동장",
        "Y13": "테니스장",
        "Y14": "한국 그린인프라·저영향개발 센터",
        "Y15": "첨단의생명융합센터",
        "Y16": "지행관",
        "Y17": "경암공학관",
        "YH01": "양산부산대학교병원",
        "YH02": "어린이병원",
        "YH03": "치과병원",
        "YH04": "한방병원",
        "YH05": "재활병원",
        "YH06": "전문질환센터",
        "YH07": "한의약임상연구센터",
        "YH08": "편의시설동",
        "YH09": "교수연구동ㆍ행정동",
        "YH11": "의생명창의연구동",
        "YH12": "직장어린이집",
        "YH13": "로날드맥도날드하우스",
        "YH14": "직원기숙사",
        "YH15": "한방병원원외탕전실"
    }
    miryang_campus = {
        "M01": "행정지원본부동",
        "M01-1": "나노생명과학도서관",
        "M02": "나노과학기술관",
        "M03": "생명자원과학관",
        "M04": "학생회관",
        "M05": "비마관 및 매화관(기숙사)",
        "M05-1": "청학관",
        "M06": "종합실험실습관",
        "M07": "정문수위실",
        "M08": "운동장",
        "M09": "공동실험실습관",
        "M10": "테니스장",
        "M11": "첨단온실"
    }
    ami_campus = {
        "AH01": "A동(본관)",
        "AH04": "B동(외래센터)",
        "AH05": "E동(부산권역 응급의료센터)",
        "AH06": "C동(부산지역암센터)",
        "AH07": "CE동(부산지역암센터 별관)",
        "AH08": "주차타워",
        "AH09": "H동(복지동)",
        "AH10": "J동(장기려관)",
        "AH20": "의생명연구원"
    }

    all_campuses = {
        **busan_campus,
        **yangsan_campus,
        **miryang_campus,
        **ami_campus
    }
    
    building_name = all_campuses.get(building_code, "알 수 없는 건물")
    return building_name

def parse_location(text):
    """
    강의실 위치 문자열(text)을 받아
    - 온라인/오프라인/알 수 없음 구분
    - 건물 코드, 건물명, 호실, 전체 라벨 등 정보를 dict로 반환.
    다양한 캠퍼스/건물 코드 패턴을 처리.
    """
    text = text.strip()
    if text == "사이버수업":
        # 온라인 수업인 경우
        return {
            "type": "online",
            "building_code": None,
            "building_name": None,
            "room": None,
            "full_label": "사이버수업"
        }

    # 밀양 캠퍼스 특수 패턴 처리 (M01-1, M05-1 등)
    if text.startswith("M01-1-"):
        building_code = "M01-1"
        room = text[len("M01-1-"):]
        return {
            "type": "offline",
            "building_code": building_code,
            "building_name": search_campus(building_code),
            "room": room,
            "full_label": text
        }
    
    if text.startswith("밀양M01-1-"):
        building_code = "M01-1"
        room = text[len("밀양M01-1-"):]
        return {
            "type": "offline",
            "building_code": building_code,
            "building_name": search_campus(building_code),
            "room": room,
            "full_label": text
        }

    if text.startswith("밀양 M01-1-"):
            building_code = "M01-1"
            room = text[len("밀양 M01-1-"):]
            return {
                "type": "offline",
                "building_code": building_code,
                "building_name": search_campus(building_code),
                "room": room,
                "full_label": text
            }

    if text.startswith("M05-1-"):
        building_code = "M05-1"
        room = text[len("M05-1-"):]
        return {
            "type": "offline",
            "building_code": building_code,
            "building_name": search_campus(building_code),
            "room": room,
            "full_label": text
        }
    
    if text.startswith("밀양M05-1-"):
        building_code = "M05-1"
        room = text[len("밀양M05-1-"):]
        return {
            "type": "offline",
            "building_code": building_code,
            "building_name": search_campus(building_code),
            "room": room,
            "full_label": text
        }
    
    if text.startswith("밀양 M05-1-"):
        building_code = "M05-1"
        room = text[len("밀양 M05-1-"):]
        return {
            "type": "offline",
            "building_code": building_code,
            "building_name": search_campus(building_code),
            "room": room,
            "full_label": text
        } 

    # 일반적인 형식: "건물코드-호실" (예: 401-101)
    match = re.match(r"^([가-힣A-Z0-9]+)-(\d+)$", text)
    if match:
        building_code = match.group(1)
        room = match.group(2)
        building_name = search_campus(building_code)
        # 캠퍼스 접두어가 붙은 경우(양산, 밀양, 아미) 정제
        if building_code.startswith('양산') or building_code.startswith('밀양') or building_code.startswith('아미'):
            cleaned_code = re.sub(r"^(양산|밀양|아미)", "", building_code)
            building_name = search_campus(cleaned_code)
            building_code = cleaned_code

        return {
            "type": "offline",
            "building_code": building_code,
            "building_name": building_name,
            "room": room,
            "full_label": f"{building_code}-{room}"
        }
    
    # 위 조건에 모두 해당하지 않으면 알 수 없음 처리
    return {
        "type": "unknown",
        "building_code": None,
        "building_name": None,
        "room": None,
        "full_label": text
    }