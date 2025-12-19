import { useState, useEffect } from 'react';

/**
 * useDebounce 훅
 * 값이 변경된 후 일정 시간(delay) 동안 추가 변경이 없을 때만 값을 업데이트
 * 검색어 입력 시 매 키 입력마다 API 호출하는 것을 방지
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // delay 후에 값 업데이트
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // cleanup: 다음 effect 실행 전이나 컴포넌트 언마운트 시 타이머 제거
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
