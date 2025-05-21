import React from 'react';

const BuildingButtonGroup = ({ lectures, onBuildingClick }) => {
  const buildingSet = new Set();
  (lectures || []).forEach(lecture => {
    if (lecture.schedules) {
      lecture.schedules.forEach(sched => {
        const name = sched?.location_details?.building_name || sched?.location_details?.building_code;
        if (name) buildingSet.add(name);
      });
    }
  });

  if (buildingSet.size === 0) return null;

  return (
    <div className="building-btn-group">
      {[...buildingSet].map(name => (
        <button
          key={name}
          className="button building-btn"
          onClick={() => onBuildingClick(name)}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

export default BuildingButtonGroup;
