"use client";

/**
 * Colyseus 클라이언트 싱글턴.
 * Supabase Realtime 채널(map:{mapId})을 대체한다.
 * 반드시 클라이언트 컴포넌트에서만 import할 것 (SSR 불가).
 */

import { Client, type Room } from "colyseus.js";
import { WS_URL, getToken } from "./http";

let client: Client | null = null;

export function getColyseusClient(): Client {
  if (!client) {
    client = new Client(WS_URL);
  }
  return client;
}

export interface MapRoomJoinOptions {
  mapId: string;
  characterName: string;
}

/**
 * 맵 룸 입장. 같은 mapId끼리 같은 룸에 배정된다 (서버 filterBy).
 */
export async function joinMapRoom(options: MapRoomJoinOptions): Promise<Room> {
  const token = getToken();
  if (!token) throw new Error("로그인이 필요합니다");

  return getColyseusClient().joinOrCreate("map", {
    ...options,
    token,
  });
}
