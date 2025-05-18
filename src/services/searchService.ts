import { ResultItem, SearchResponse } from "../types";

/**
 * 검색 서비스 상태 인터페이스
 */
export interface SearchServiceState {
  orbiResults: ResultItem[];
  sumanwhiResults: ResultItem[];
  keywords: string[];
}

/**
 * 검색 결과 관리 서비스
 */
export class SearchService {
  private orbiResults: ResultItem[] = [];
  private sumanwhiResults: ResultItem[] = [];
  private keywords: string[] = [];
  private listeners: Array<(data: SearchServiceState) => void> = [];

  /**
   * 검색 결과 업데이트 알림을 받을 리스너 등록
   * @param listener 검색 결과 변경 시 호출될 콜백 함수
   * @returns 리스너 해제 함수
   */
  subscribe(listener: (data: SearchServiceState) => void) {
    this.listeners.push(listener);
    listener(this.getState()); // 초기 상태 전달

    // 리스너 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 리스너들에게 검색 결과 변경 사항 알림
   */
  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * 현재 검색 서비스 상태 반환
   */
  private getState(): SearchServiceState {
    return {
      orbiResults: [...this.orbiResults],
      sumanwhiResults: [...this.sumanwhiResults],
      keywords: [...this.keywords],
    };
  }

  /**
   * 검색 응답 처리
   * @param response 검색 API 응답
   */
  processSearchResponse(response: SearchResponse) {
    // API 응답에서 직접 결과 가져오기
    this.orbiResults = response.orbiResults || [];
    this.sumanwhiResults = response.sumanwhiResults || [];
    this.keywords = response.keywords || [];

    this.notifyListeners();
  }

  /**
   * 검색 결과에서 키워드 추출
   * @param results 검색 결과 목록
   * @returns 추출된 키워드 목록
   */
  private extractKeywords(results: ResultItem[]): string[] {
    // API에서 이미 키워드를 제공하므로 별도 추출 로직 불필요
    return [];
  }

  /**
   * 모든 검색 결과 가져오기 (연관도 순 정렬)
   */
  getAllResults(): ResultItem[] {
    return [...this.orbiResults, ...this.sumanwhiResults].sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );
  }

  /**
   * Orbi 검색 결과 가져오기
   */
  getOrbiResults(): ResultItem[] {
    return [...this.orbiResults];
  }

  /**
   * 수만휘 검색 결과 가져오기
   */
  getSumanwhiResults(): ResultItem[] {
    return [...this.sumanwhiResults];
  }

  /**
   * 키워드 목록 가져오기
   */
  getKeywords(): string[] {
    return [...this.keywords];
  }

  /**
   * 모든 검색 결과 초기화
   */
  clearResults() {
    this.orbiResults = [];
    this.sumanwhiResults = [];
    this.keywords = [];
    this.notifyListeners();
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const searchService = new SearchService();
