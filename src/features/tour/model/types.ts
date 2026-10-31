export type TourStep =
  | 'searchIntro'
  | 'searchType'
  | 'searchCheck'
  | 'searchAddToCart'
  | 'searchGoToCart'
  | 'cartCount'
  | 'cartGoRegistration'
  | 'registrationTimer'
  | 'registrationStart'
  | 'registrationWaiting'
  | 'registrationCheck'
  | 'registrationCaptcha'
  | 'registrationSubmit'
  | 'registrationGoHistory'
  | 'historyResult';

export interface TourStatusResponse {
  shouldShow: boolean;
  publishedAt: string;
  completedAt?: string | null;
}

export interface TourCompletionRequest {
  publishedAt: string;
}
