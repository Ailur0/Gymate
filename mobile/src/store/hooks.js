import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';

export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

export const useShallowEqualSelector = (selector) => {
  const value = useSelector(selector, (left, right) => {
    if (Object.is(left, right)) return true;
    if (typeof left !== 'object' || typeof right !== 'object') return false;
    const leftKeys = Object.keys(left ?? {});
    const rightKeys = Object.keys(right ?? {});
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key) => Object.is(left[key], right[key]));
  });
  return useMemo(() => value, [value]);
};
