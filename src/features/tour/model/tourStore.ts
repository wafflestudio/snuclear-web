import { create } from 'zustand';
import type { TourStep } from './types';
import { getTutorialOverQuotaCount } from './tutorialCourse';

interface TourStoreState {
  isActive: boolean;
  currentStep: TourStep | null;
  publishedAt: string | null;
  hasPrompted: boolean;
  isManuallyStopped: boolean;
  cartCount: number;
  hasSelectedSearchCourse: boolean;
  hasSelectedRegistrationCourse: boolean;
  captchaInput: string;
  isPracticeReady: boolean;
  isRegistrationSucceeded: boolean;
  start: (publishedAt?: string | null) => void;
  startAtStep: (step: TourStep, publishedAt?: string | null) => void;
  stop: () => void;
  complete: () => void;
  setStep: (step: TourStep) => void;
  markPrompted: () => void;
  setPublishedAt: (publishedAt: string | null) => void;
  selectSearchCourse: () => void;
  setCartOverQuota: () => void;
  selectRegistrationCourse: () => void;
  setCaptchaInput: (value: string) => void;
  setPracticeReady: () => void;
  markRegistrationSucceeded: () => void;
}

const initialRuntimeState = {
  cartCount: 0,
  hasSelectedSearchCourse: false,
  hasSelectedRegistrationCourse: false,
  captchaInput: '',
  isPracticeReady: false,
  isRegistrationSucceeded: false,
};

export const useTourStore = create<TourStoreState>((set) => ({
  isActive: false,
  currentStep: null,
  publishedAt: null,
  hasPrompted: false,
  isManuallyStopped: false,
  ...initialRuntimeState,

  start: (publishedAt) =>
    set((state) => ({
      ...initialRuntimeState,
      isActive: true,
      currentStep: 'searchIntro',
      publishedAt: publishedAt ?? state.publishedAt,
      isManuallyStopped: false,
    })),

  startAtStep: (step, publishedAt) =>
    set((state) => ({
      ...initialRuntimeState,
      isActive: true,
      currentStep: step,
      publishedAt: publishedAt ?? state.publishedAt,
      isManuallyStopped: false,
    })),

  stop: () =>
    set({
      isActive: false,
      currentStep: null,
      isManuallyStopped: true,
    }),

  complete: () =>
    set({
      ...initialRuntimeState,
      isActive: false,
      currentStep: null,
      isManuallyStopped: false,
    }),

  setStep: (step) => set({ currentStep: step }),
  markPrompted: () => set({ hasPrompted: true }),
  setPublishedAt: (publishedAt) => set({ publishedAt }),
  selectSearchCourse: () => set({ hasSelectedSearchCourse: true }),
  setCartOverQuota: () => set({ cartCount: getTutorialOverQuotaCount() }),
  selectRegistrationCourse: () => set({ hasSelectedRegistrationCourse: true }),
  setCaptchaInput: (value) => set({ captchaInput: value.replace(/\D/g, '').slice(0, 2) }),
  setPracticeReady: () => set({ isPracticeReady: true }),
  markRegistrationSucceeded: () => set({ isRegistrationSucceeded: true }),
}));
