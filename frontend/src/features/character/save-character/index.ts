"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/shared/api";
import { profileKeys } from "@/entities/user";
import type { CharacterAppearance, CharacterColors, CharacterStats } from "@/entities/character";

// ============ Types ============

export interface SaveCharacterParams {
  userId: string;
  name: string;
  gender: "male" | "female";
  race: string;
  bodyType: number;
  stats: CharacterStats;
  appearance: CharacterAppearance;
  colors: CharacterColors;
}

interface CharacterData {
  name: string;
  isMain: boolean;
  gender: "male" | "female";
  race: string;
  bodyType: number;
  stats: CharacterStats;
  appearance: CharacterAppearance;
  colors: CharacterColors;
}

// ============ API ============

export async function saveCharacter({ userId: _userId, ...params }: SaveCharacterParams) {
  const character: CharacterData = {
    ...params,
    isMain: true,
  };

  return rpc("save_character", { p_character: character });
}

// ============ Hook ============

interface UseSaveCharacterOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useSaveCharacter(options?: UseSaveCharacterOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveCharacterParams) => saveCharacter(params),
    onSuccess: (_, variables) => {
      // 프로필 캐시 무효화
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
