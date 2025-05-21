import React from 'react';

const LectureList = ({ lectures, onLectureClick }) => {
  if (!lectures || lectures.length === 0) {
    return <div className="lecture-list-empty">강의가 없습니다.</div>;
  }

  return (
    <div className="lecture-list">
      {lectures.map(lecture => (
        <div
          key={lecture.plato_course_id}
          className="lecture-block"
          onClick={() => onLectureClick ? onLectureClick(lecture) : window.open(`/attendance/${lecture.plato_course_id}`, "_blank")}
        >
          <h1 className="lecture-block-title">
            <a
              href={`/attendance/${lecture.plato_course_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lecture-block-link"
              onClick={e => { e.preventDefault(); if (onLectureClick) onLectureClick(lecture); }}
            >
              {lecture.name}
            </a>
          </h1>
          {lecture.plato_course_id && <p className="lecture-block-id">PLATO 강의 ID: {lecture.plato_course_id}</p>}
          {lecture.schedules && lecture.schedules.length > 0 ? (
            <ul className="lecture-block-schedules">
              {lecture.schedules.map((sched, idx) => {
                let locationText = "장소 미정";
                if (sched.location_details) {
                  const { building_name, building_code, room_number } = sched.location_details;
                  if ((building_name || building_code) && room_number) {
                    locationText = `${building_name || building_code} ${room_number}호`;
                  }
                }
                if ((!sched.location_details || locationText === "장소 미정") && sched.location) {
                  locationText = sched.location;
                }
                return (
                  <li key={idx} className="lecture-block-schedule">
                    <span className="lecture-block-weekday">{sched.weekday}요일</span> {sched.start} ~ {sched.end}
                    <br />
                    <span className="lecture-block-location">{locationText}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="lecture-block-no-schedule">시간표 정보 없음</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default LectureList;
