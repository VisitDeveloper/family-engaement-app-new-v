import { useState, useEffect, useCallback } from 'react';
import { blocklistService } from '../services/blocklist.service';
import type { UserListItemDto } from '@/types';
import { Alert } from 'react-native';

interface UseBlocklistReturn {
  blockedUsers: UserListItemDto[];
  allowedUsers: UserListItemDto[];
  loading: boolean;
  error: string | null;
  refreshLists: () => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  allowUser: (userId: string) => Promise<void>;
  removeFromAllowList: (userId: string) => Promise<void>;
}

export const useBlocklist = (): UseBlocklistReturn => {
  const [blockedUsers, setBlockedUsers] = useState<UserListItemDto[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<UserListItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [blockListResponse, allowListResponse] = await Promise.all([
        blocklistService.getBlockList(),
        blocklistService.getAllowList(),
      ]);

      setBlockedUsers(blockListResponse.items);
      setAllowedUsers(allowListResponse.items);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load contact lists';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const blockUser = useCallback(async (userId: string) => {
    try {
      await blocklistService.addToBlockList(userId);
      
      // Remove from allowed list if exists
      setAllowedUsers((prev) => prev.filter((user) => user.id !== userId));
      
      // Fetch updated blocked list
      const blockListResponse = await blocklistService.getBlockList();
      setBlockedUsers(blockListResponse.items);
      
      Alert.alert('Success', 'User blocked successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to block user');
      throw err;
    }
  }, []);

  const unblockUser = useCallback(async (userId: string) => {
    try {
      await blocklistService.removeFromBlockList(userId);
      
      // Remove from blocked list
      setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
      
      // Also remove from allowed list if exists
      setAllowedUsers((prev) => prev.filter((user) => user.id !== userId));
      
      Alert.alert('Success', 'User unblocked successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to unblock user');
      throw err;
    }
  }, []);

  const allowUser = useCallback(async (userId: string) => {
    try {
      await blocklistService.addToAllowList(userId);
      
      // Remove from blocked list if exists
      setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
      
      // Fetch updated allowed list
      const allowListResponse = await blocklistService.getAllowList();
      setAllowedUsers(allowListResponse.items);
      
      Alert.alert('Success', 'User added to allow list');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add user to allow list');
      throw err;
    }
  }, []);

  const removeFromAllowList = useCallback(async (userId: string) => {
    try {
      await blocklistService.removeFromAllowList(userId);
      
      // Remove from allowed list
      setAllowedUsers((prev) => prev.filter((user) => user.id !== userId));
      
      // Also ensure user is not in blocked list
      setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
      
      Alert.alert('Success', 'User removed from allow list');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove user from allow list');
      throw err;
    }
  }, []);

  return {
    blockedUsers,
    allowedUsers,
    loading,
    error,
    refreshLists: fetchLists,
    blockUser,
    unblockUser,
    allowUser,
    removeFromAllowList,
  };
};
