import { useCallback, useEffect, useState } from "react";
import api from "@/apis/api";

export interface CurrentUser {
  id: number;
  name: string;
  role: string;
  companyName?: string;
  email?: string;
}

let cachedUser: CurrentUser | null = null;
let loadPromise: Promise<CurrentUser | null> | null = null;

const requestUser = async (): Promise<CurrentUser | null> => {
  const response = await api.get("/api/users/me");
  return response.data?.data ?? null;
};

const loadUser = () => {
  if (cachedUser) {
    return Promise.resolve(cachedUser);
  }
  if (!loadPromise) {
    loadPromise = requestUser()
      .then((user) => {
        cachedUser = user;
        return user;
      })
      .catch((error) => {
        cachedUser = null;
        throw error;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    setIsLoading(true);
    loadUser()
      .then((data) => {
        if (!mounted) return;
        setUser(data);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setError("사용자 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await requestUser();
      cachedUser = data;
      setUser(data);
    } catch {
      setUser(null);
      setError("사용자 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading, error, refresh };
}

export function clearCurrentUserCache() {
  cachedUser = null;
}
