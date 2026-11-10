// storage.ts 와 나눈 까닭: 서버 (app/api/availability) 가 storage.ts 의 MAX_LIBRARIES 를 읽어서, 거기에는 React 훅을 둘 수 없다
import { useSyncExternalStore } from 'react';
import { loadLibraries } from './storage';
import type { Library } from './types';

// shortcut: 저장해도 알리지 않는다 (고르는 화면과 읽는 화면이 다른 페이지라 열 때마다 새로 읽는다). 한 페이지에 같이 두면 saveLibraries 에서 알린다
const subscribe = () => () => {};

/** 저장한 도서관. 서버 그림·하이드레이션 때는 null (브라우저에만 있는 값이라) */
export function useLibraries(): Library[] | null {
  return useSyncExternalStore(subscribe, loadLibraries, () => null);
}
