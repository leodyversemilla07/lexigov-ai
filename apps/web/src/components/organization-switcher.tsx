'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lexigov/ui/components/select';
import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDraftScope } from '@/hooks/useDraftScope';
import { authClient } from '@/lib/auth-client';

const PERSONAL_WORKSPACE = '__personal__';

export function OrganizationSwitcher() {
  const { organization, isLoading, refetch } = useDraftScope();
  const { data: organizations, isPending: isListLoading } = authClient.useListOrganizations();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleChange = async (value: string) => {
    setIsSwitching(true);
    try {
      const { error } = await authClient.organization.setActive({
        organizationId: value === PERSONAL_WORKSPACE ? null : value,
      });
      if (error) throw new Error(error.message || 'Unable to change workspace');
      await refetch();
      toast.success(value === PERSONAL_WORKSPACE ? 'Personal workspace selected.' : 'Organization workspace selected.');
    } catch (error) {
      console.error('Failed to change workspace:', error);
      toast.error('Failed to change workspace.');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <Select value={organization?.id ?? PERSONAL_WORKSPACE} onValueChange={handleChange} disabled={isLoading || isListLoading || isSwitching}>
      <SelectTrigger className='h-8 w-[135px] sm:w-[190px]' aria-label='Active workspace'>
        <Building2 className='h-3.5 w-3.5 shrink-0' />
        <SelectValue placeholder='Select workspace' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={PERSONAL_WORKSPACE}>Personal workspace</SelectItem>
        {(organizations ?? []).map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
