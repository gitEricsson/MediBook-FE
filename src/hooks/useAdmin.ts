import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService, Department } from '@/services/admin.service';
import { UserRole } from '@/types/domain';

export const useAppointmentAnalytics = (from: string, to: string) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'appointments', from, to],
    queryFn: () => AdminService.getAppointmentAnalytics(from, to),
    staleTime: 5 * 60 * 1000,
  });

export const useRevenueAnalytics = (from: string, to: string) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'revenue', from, to],
    queryFn: () => AdminService.getRevenueAnalytics(from, to),
    staleTime: 5 * 60 * 1000,
  });

export const useDoctorUtilization = (from: string, to: string) =>
  useQuery({
    queryKey: ['admin', 'analytics', 'utilization', from, to],
    queryFn: () => AdminService.getDoctorUtilization(from, to),
    staleTime: 5 * 60 * 1000,
  });

export const useAdminDepartments = () => {
  return useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: AdminService.getDepartments,
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: AdminService.getUsers,
  });
};

export const useAdminDoctors = () => {
  return useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: () => AdminService.getDoctors(),
  });
};

export const useAdminActions = () => {
  const queryClient = useQueryClient();

  const createDeptMutation = useMutation({
    mutationFn: AdminService.createDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) => 
      AdminService.updateDepartment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  });

  const deactivateDeptMutation = useMutation({
    mutationFn: AdminService.deactivateDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] }),
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => 
      AdminService.updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: AdminService.revokeUserSessions,
  });

  return {
    createDepartment: createDeptMutation.mutateAsync,
    updateDepartment: updateDeptMutation.mutateAsync,
    deactivateDepartment: deactivateDeptMutation.mutateAsync,
    updateUserRole: updateUserRoleMutation.mutateAsync,
    revokeSessions: revokeSessionsMutation.mutateAsync,
    isProcessing: 
      createDeptMutation.isPending || 
      updateDeptMutation.isPending || 
      deactivateDeptMutation.isPending ||
      updateUserRoleMutation.isPending ||
      revokeSessionsMutation.isPending,
  };
};
