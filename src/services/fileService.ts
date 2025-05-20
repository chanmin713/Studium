import { errorService } from "./errorService";

/**
 * 파일 서비스 클래스
 * 파일 업로드, 다운로드, 변환 등의 기능을 제공
 */
export class FileService {
  /**
   * 파일 업로드 처리
   * @param file 업로드할 파일
   * @returns FormData 객체
   */
  public async prepareFileUpload(file: File): Promise<FormData> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      return formData;
    } catch (error) {
      errorService.handle(error);
      throw new Error("파일 업로드 준비 중 오류가 발생했습니다.");
    }
  }

  /**
   * 파일 다운로드 처리
   * @param blob 다운로드할 파일 데이터
   * @param fileName 파일 이름
   */
  public downloadFile(blob: Blob, fileName: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      errorService.handle(error);
      throw new Error("파일 다운로드 중 오류가 발생했습니다.");
    }
  }

  /**
   * 파일 크기 포맷팅
   * @param bytes 파일 크기 (바이트)
   * @returns 포맷팅된 파일 크기 문자열
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * 파일 타입 검증
   * @param file 검증할 파일
   * @param allowedTypes 허용된 파일 타입 배열
   * @returns 검증 결과
   */
  public validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * 파일 크기 검증
   * @param file 검증할 파일
   * @param maxSize 최대 파일 크기 (바이트)
   * @returns 검증 결과
   */
  public validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const fileService = new FileService();
