import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  getPreEnrollsApi,
  addPreEnrollApi,
  updateCartCountApi,
  deletePreEnrollApi,
} from '../api/cartApi';
import { getDevCartCourses } from '@shared/mock/devCourses';
import type {
  PreEnrollAddRequest,
  PreEnrollCourseResponse,
  PreEnrollUpdateCartCountRequest,
} from './types';

export const cartKeys = {
  all: ['cart'] as const,
  lists: ['cart', 'list'] as const,
  list: (overQuotaOnly?: boolean) =>
    [...cartKeys.all, 'list', overQuotaOnly] as const,
};

export function useCartQuery(overQuotaOnly = false) {
  return useQuery({
    queryKey: cartKeys.list(overQuotaOnly),
    queryFn: async () => {
      if (import.meta.env.DEV) {
        return getDevCartCourses(overQuotaOnly);
      }

      const response = await getPreEnrollsApi(overQuotaOnly);
      return response.data;
    },
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PreEnrollAddRequest) => {
      if (import.meta.env.DEV) return Promise.resolve();
      return addPreEnrollApi(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: cartKeys.lists});
    },
  });
}

export function useUpdateCartCountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      data,
    }: {
      courseId: number;
      data: PreEnrollUpdateCartCountRequest;
    }) => {
      if (import.meta.env.DEV) return Promise.resolve();
      return updateCartCountApi(courseId, data);
    },
    onMutate: async ({courseId, data}) => {
      await queryClient.cancelQueries({queryKey: cartKeys.lists});

      const previousLists = queryClient.getQueriesData<
        PreEnrollCourseResponse[]
      >({queryKey: cartKeys.lists});

      queryClient.setQueriesData<PreEnrollCourseResponse[]>(
        {queryKey: cartKeys.lists},
        (old) =>
          old?.map((item) =>
            item.course.id === courseId
              ? {...item, cartCount: data.cartCount}
              : item
          ),
      );

      return {previousLists};
    },
    onError: (_err, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: cartKeys.lists});
    },
  });
}

export function useDeleteFromCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: number) => {
      if (import.meta.env.DEV) return Promise.resolve();
      return deletePreEnrollApi(courseId);
    },
    onMutate: async (courseId) => {
      await queryClient.cancelQueries({queryKey: cartKeys.lists});

      const previousLists = queryClient.getQueriesData<
        PreEnrollCourseResponse[]
      >({queryKey: cartKeys.lists});

      queryClient.setQueriesData<PreEnrollCourseResponse[]>(
        {queryKey: cartKeys.lists},
        (old) => old?.filter((item) => item.course.id !== courseId),
      );

      return {previousLists};
    },
    onError: (_err, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: cartKeys.lists});
    },
  });
}
