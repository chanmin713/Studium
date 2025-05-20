# 입시 특화 LLM API 명세서

## 1. API 개요

이 API는 입시 특화 LLM을 위한 백엔드 서비스입니다. 수학 관련 질문에 대한 답변과 맞춤형 수학 시험지 생성 기능을 제공합니다.

## 2. 기본 URL

```
http://52.79.40.102:3049
```

## 3. 인증

현재 별도의 인증 과정은 없습니다.

## 4. 엔드포인트

### 4.1 채팅 요청 (시험지 생성 또는 검색)

**POST /chat**

사용자 질문을 분석하여 시험지를 생성하거나 검색을 수행합니다.

#### 요청 형식

```json
{
  "query": "미적분1 단원에서 난이도 7 수준으로 10문제 출제해줘"
}
```

#### 응답 형식

시험지 생성 요청일 경우:

- Content-Type: application/pdf
- Content-Disposition: attachment; filename="파일명.pdf"
- 응답 본문: PDF 파일 바이너리 데이터

검색 요청일 경우:

```json
{
  "type": "search",
  "requestId": "1234567890123",
  "combinedResults": [
    {
      "title": "검색 결과 제목",
      "url": "https://example.com/result",
      "content": "검색 결과 내용...",
      "relevanceScore": 0.95,
      "source": "오르비"
    }
    // 추가 결과...
  ]
}
```

### 4.2 진행 상태 확인

**GET /progress/:id**

요청 처리 진행 상태를 확인합니다.

#### 응답 형식

```json
{
  "status": "PDF 생성 중",
  "progress": 85,
  "startTime": 1623456789000,
  "estimatedSecondsLeft": 5,
  "elapsedTimeSeconds": 10
}
```

## 5. 시험지 생성 요청 예시

### 단일 단원 시험지 생성

```
"미적분1 단원에서 난이도 5 수준으로 20문제 출제해줘"
```

### 다중 단원 시험지 생성

```
"1~10번은 미적분1, 11~20번은 수열의 극한 단원에서 문제 출제해줘. 난이도는 1~5번은 3, 6~10번은 5, 11~15번은 7, 16~20번은 9로 해줘."
```

### 단원 지정 없이 난이도만 지정

```
"난이도 7~9 사이의 어려운 문제로 10문제 출제해줘"
```

## 6. 검색 요청 예시

```
"수능 미적분 킬러 문항 출제 경향이 어떻게 되나요?"
"작년 수능 확률과 통계 문제 분석"
```

## 7. 구현 방법

### 7.1 프론트엔드 연동

1. POST 요청으로 사용자 질문 전송
2. requestId를 받아 진행 상태 폴링
3. PDF 다운로드 또는 검색 결과 표시

```javascript
// 시험지 생성 요청 예시
async function generateExam(query) {
  try {
    const response = await fetch("http://52.79.40.102:3049/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (response.headers.get("Content-Type") === "application/pdf") {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers
        .get("Content-Disposition")
        .split("filename=")[1]
        .replace(/"/g, "");
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      const data = await response.json();
      // 검색 결과 처리
      return data;
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### 7.2 진행 상태 모니터링

1. 요청 후 반환된 requestId 저장
2. 주기적으로 `/progress/:id` 호출하여 진행 상태 확인
3. progress가 100이 되면 완료

### 7.3 PDF 다운로드 처리

1. PDF 응답을 Blob으로 변환
2. URL.createObjectURL로 다운로드 링크 생성
3. 사용자에게 파일 저장 옵션 제공

## 8. 에러 처리

- 400: 잘못된 요청 (질문 누락 등)
- 404: 리소스 없음 (진행 상태 ID 없음)
- 500: 서버 오류

## 9. 제한 사항

- 요청당 처리 시간: 최대 60초
- 시험지 최대 문제 수: 권장 20문제 (과도한 문제 수는 지양)
- 진행 상태는 완료 후 1분간만 유지
