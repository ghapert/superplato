import React, { useState, useEffect } from 'react';
import { moveToKeywordOnMap } from '../utils/mapUtils';

const SearchBarWithSuggestions = ({ onSelect, externalValue }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // 외부에서 값이 바뀌면 input도 동기화
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== input) {
      setInput(externalValue);
    }
  }, [externalValue]);

  const handleInput = (e) => {
    const value = e.target.value;
    setInput(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      const ps = new window.kakao.maps.services.Places();
      const query = "부산대학교 " + value.replace(/^부산대학교\s*/, "");
      ps.keywordSearch(query, function (data, status) {
        if (status === window.kakao.maps.services.Status.OK) {
          setSuggestions(data.slice(0, 5));
        } else {
          setSuggestions([]);
        }
      });
    }
  };

  const handleSuggestionClick = (place) => {
    setInput(place.place_name);
    setSuggestions([]);
    moveToKeywordOnMap(place.place_name);
    if (onSelect) onSelect(place.place_name);
  };

  return (
    <div className="searchbar-suggestion-wrapper">
      <input
        type="text"
        value={input}
        onChange={handleInput}
        placeholder="건물명 또는 강의실명 입력"
        className="searchbar-suggestion-input"
      />
      {suggestions.length > 0 && (
        <div className="suggestion-list">
          {suggestions.map((place, idx) => (
            <div
              key={idx}
              className="suggestion-list-item"
              onClick={() => handleSuggestionClick(place)}
            >
              {place.place_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBarWithSuggestions;
