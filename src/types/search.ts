/**
 * 검색 결과 아이템 타입
 */
export interface ResultItem {
  id: string;
  title: string;
  content: string;
  url: string;
  source: "orbi" | "sumanwhi";
  timestamp: string;
  commentCount?: number;
  relevanceScore?: number;
}

/**
 * 검색 키워드 타입
 */
export interface SearchKeyword {
  text: string;
  weight: number;
}

/**
 * 검색 필터 타입
 */
export interface SearchFilter {
  sources?: ("orbi" | "sumanwhi")[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minRelevanceScore?: number;
  minCommentCount?: number;
}
