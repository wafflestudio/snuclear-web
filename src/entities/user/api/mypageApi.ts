import { api } from '@shared/api/fetch';
import type {
  MyPageResponse,
  UpdateProfileResponse,
  ChangePasswordRequest,
  PracticeSessionsListResponse,
  PracticeResultResponse,
  CourseDetailResponse,
} from '../model/types';

// 마이페이지 조회
export const getMyPageApi = async () => {
  return await api.get<MyPageResponse>('/api/mypage');
};

// 닉네임 수정
export const updateProfileApi = async (data: { nickname: string }) => {
  return await api.patch<UpdateProfileResponse>('/api/mypage/profile', data);
};

// 프로필 이미지 업로드 - Presigned URL 방식
// Step 1: Presigned URL 요청 (확장자, 타입, 크기 전달)
export const getPresignedUrlApi = async (file: File) => {
  const extension = file.name.split('.').pop() || '';
  return await api.post<{ presignedUrl: string; imageUrl: string }>(
    '/api/mypage/profile-image/presigned-url',
    {
      extension,
      contentType: file.type,
      fileSize: file.size,
    }
  );
};

// Step 2: Presigned URL로 파일 직접 업로드 (S3 등)
export const uploadToPresignedUrlApi = async (
  presignedUrl: string,
  file: File
) => {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    mode: 'cors',
    headers: {
      'Content-Type': file.type,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to upload image to presigned URL');
  }
  return response;
};

// Step 3: 이미지 URL로 프로필 이미지 저장
export const updateProfileImageApi = async (imageUrl: string) => {
  return await api.patch<UpdateProfileResponse>('/api/mypage/profile-image', {
    imageUrl,
  });
};

// 프로필 이미지 삭제
export const deleteProfileImageApi = async () => {
  return await api.delete<void>('/api/mypage/profile-image');
};

// 비밀번호 변경
export const updatePasswordApi = async (data: ChangePasswordRequest) => {
  return await api.patch<void>('/api/mypage/password', data);
};

// 회원 탈퇴
export const deleteAccountApi = async (password: string) => {
  return await api.delete<void>('/api/mypage', {
    data: { password },
  });
};

// 연습 세션 목록 조회 (페이지네이션)
export const getPracticeSessionsApi = async (
  page: number = 0,
  size: number = 10
) => {
  return await api.get<PracticeSessionsListResponse>(
    `/api/mypage/practice-sessions?page=${page}&size=${size}`
  );
};

// 연습 세션 상세 조회
export const getPracticeSessionDetailApi = async (practiceLogId: number) => {
  return await api.get<PracticeResultResponse>(
    `/api/mypage/practice-sessions/${practiceLogId}`
  );
};

// 가장 최근 연습 세션에서 성공한 강의 목록 조회
export const getEnrolledCoursesApi = async () => {
  return await api.get<CourseDetailResponse[]>(
    '/api/practice/enrolled-courses'
  );
};
