import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useClientShipments = (params?: { status?: string; search?: string; per_page?: number }) => {
  return useQuery({
    queryKey: ['client', 'shipments', params],
    queryFn: () => clientShipmentService.getShipments(params),
  });
};

export const useClientShipment = (trackingNumber: string) => {
  return useQuery({
    queryKey: ['client', 'shipment', trackingNumber],
    queryFn: () => clientShipmentService.getShipmentByTrackingNumber(trackingNumber),
    enabled: !!trackingNumber,
  });
};

export const useClientShipmentStatistics = () => {
  return useQuery({
    queryKey: ['client', 'shipments', 'statistics'],
    queryFn: () => clientShipmentService.getStatistics(),
  });
};

export const useClientShipmentTypes = () => {
  return useQuery({
    queryKey: ['client', 'shipment-types'],
    queryFn: () => clientShipmentService.getShipmentTypes(),
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => clientShipmentService.createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'shipments'] });
      queryClient.invalidateQueries({ queryKey: ['client', 'shipments', 'statistics'] });
    },
  });
};

export const useCancelShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientShipmentService.cancelShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'shipments'] });
      queryClient.invalidateQueries({ queryKey: ['client', 'shipments', 'statistics'] });
    },
  });
};

export const useClientAddresses = () => {
  return useQuery({
    queryKey: ['client', 'addresses'],
    queryFn: () => clientAddressService.getAddresses(),
  });
};

export const useClientAddress = (id: number) => {
  return useQuery({
    queryKey: ['client', 'address', id],
    queryFn: () => clientAddressService.getAddressById(id),
    enabled: !!id,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => clientAddressService.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'addresses'] });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => clientAddressService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'addresses'] });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientAddressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'addresses'] });
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientAddressService.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'addresses'] });
    },
  });
};

export const useClientProfile = () => {
  return useQuery({
    queryKey: ['client', 'profile'],
    queryFn: () => clientService.getCurrentUser(),
  });
};

export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => clientService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'profile'] });
    },
  });
};

export const useCompleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; email?: string }) => clientService.completeProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'profile'] });
    },
  });
};
