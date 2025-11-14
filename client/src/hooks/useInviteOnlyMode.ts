import { useQuery } from "@tanstack/react-query";

interface InviteOnlySettings {
  enabled: boolean;
}

export function useInviteOnlyMode() {
  const { data, isLoading, error } = useQuery<InviteOnlySettings>({
    queryKey: ['/api/settings/invite-only-mode'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  return {
    inviteOnlyMode: data?.enabled ?? true,
    isLoading,
    error,
  };
}
