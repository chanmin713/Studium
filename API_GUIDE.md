# Studium API 가이드

## 1. 엔드포인트 목록

### 1.1. 채팅 요청 (시험지 생성 또는 검색)

- **URL**: `http://52.79.40.102:3049/chat`
- **Method**: POST
- **Content-Type**: `application/json`

### 1.2. 진행 상태 확인

- **URL**: `http://52.79.40.102:3049/progress/:id`
- **Method**: GET
- **파라미터**: `id` - 요청 ID

## 2. 요청 및 응답 형식

### 2.1. 채팅 요청 (POST `/chat`)

#### 요청 형식

```json
{
  "query": "미적분 어려운 문제로 시험지 만들어줘" // 사용자의 질의
}
```

#### 응답 형식

응답은 세 가지 유형이 있습니다:

1. **검색 결과 (JSON)**

```json
{
  "type": "search",
  "orbiResults": [
    {
      "title": "미적분 계산법",
      "url": "https://orbi.kr/post/123",
      "content": "미적분 관련 설명입니다...",
      "timestamp": "2023-05-16",
      "commentCount": 5,
      "relevanceScore": 0.85
    }
  ],
  "sumanwhiResults": [
    {
      "title": "미적분 문제 풀이",
      "url": "https://sumanwhi.com/post/456",
      "content": "미적분 문제 풀이 방법...",
      "timestamp": "2023-05-15",
      "commentCount": 3,
      "relevanceScore": 0.75
    }
  ]
}
```

2. **시험지 생성 시작 (JSON)**

```json
{
  "type": "exam_progress",
  "requestId": "1620285871234",
  "message": "시험지 생성이 시작되었습니다."
}
```

3. **시험지 생성 완료 (JSON)**

```json
{
  "type": "exam",
  "downloadUrl": "http://52.79.40.102:3049/files/exam_123456.pdf"
}
```

### 2.2. 진행 상태 확인 (GET `/progress/:id`)

#### 응답 형식

```json
{
  "status": "HTML 생성 중",
  "progress": 70,
  "message": "시험지 생성 중...",
  "startTime": 1620285871234,
  "estimatedSecondsLeft": 10,
  "elapsedTimeSeconds": 5
}
```

## 3. 구현 가이드

### 3.1. 시험지 생성 요청 및 진행 상태 추적

```typescript
// 시험지 생성 요청
async function requestExam(query: string) {
  const response = await fetch("http://52.79.40.102:3049/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();

  if (data.type === "exam_progress") {
    // 진행 상태 추적 시작
    startProgressPolling(data.requestId);
    return {
      type: "exam_progress",
      requestId: data.requestId,
      message: data.message,
    };
  } else if (data.type === "exam") {
    return {
      type: "exam",
      downloadUrl: data.downloadUrl,
    };
  } else {
    return data;
  }
}

// 진행 상태 폴링
function startProgressPolling(requestId: string) {
  const intervalId = setInterval(async () => {
    try {
      const response = await fetch(
        `http://52.79.40.102:3049/progress/${requestId}`
      );
      const data = await response.json();

      // UI 업데이트
      updateProgressUI(data);

      // 완료 또는 실패 시 폴링 중단
      if (data.progress === 100 || data.status === "failed") {
        clearInterval(intervalId);
      }
    } catch (error) {
      console.error("진행 상태 확인 중 오류:", error);
      clearInterval(intervalId);
    }
  }, 2000); // 2초마다 상태 확인
}
```

### 3.2. UI 컴포넌트 구현

```typescript
// LoadingIndicator 컴포넌트
interface LoadingIndicatorProps {
  message: string;
  progress?: number;
  type: "default" | "exam";
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  progress,
  type,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-4 py-6">
      <div className="border border-gray-200 bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center text-blue-500">
          <Loader2 className="w-8 h-8 mr-4 animate-spin" />
          <div>
            <h3 className="text-lg font-semibold mb-1">{message}</h3>
            {type === "exam" && progress !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 4. 주의사항 및 팁

1. **진행 상태 추적**

   - 요청 ID는 최대 1분 동안만 유효합니다.
   - 폴링 간격은 2초로 설정하는 것이 권장됩니다.
   - 진행 상태가 100%가 되거나 실패 상태가 되면 폴링을 중단해야 합니다.

2. **오류 처리**

   - 네트워크 오류 발생 시 적절한 에러 메시지를 표시하세요.
   - 504 Gateway Timeout 등의 오류가 발생할 경우 재시도 로직을 구현하세요.

3. **UI/UX 고려사항**

   - 로딩 상태를 명확하게 표시하세요.
   - 진행률이 있는 경우 프로그레스 바를 표시하세요.
   - 다운로드 링크는 사용자가 쉽게 클릭할 수 있도록 배치하세요.

4. **모바일 지원**

   - 모바일 환경에서도 원활하게 작동하도록 반응형으로 구현하세요.
   - 파일 다운로드 처리가 모바일 브라우저에서 제대로 동작하는지 확인하세요.

5. **보안**
   - API 키나 민감한 정보는 클라이언트에 노출되지 않도록 주의하세요.
   - CORS 설정이 올바르게 되어있는지 확인하세요.
