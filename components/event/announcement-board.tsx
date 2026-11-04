"use client";

import { EmptyState } from "@/components/event/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sortAnnouncements } from "@/lib/announcements";
import type { Announcement } from "@/lib/types";
import { Pin, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AnnouncementBoardProps {
  eventId: string;
  initialItems: Announcement[];
  isHost: boolean;
}

// 공지 탭. 주최자는 작성/삭제/상단 고정을 할 수 있습니다. (더미 상태, 저장되지 않음)
export function AnnouncementBoard({
  eventId,
  initialItems,
  isHost,
}: AnnouncementBoardProps) {
  const [items, setItems] = useState(initialItems);
  const [body, setBody] = useState("");

  const sorted = sortAnnouncements(items);

  function add() {
    const text = body.trim();
    if (!text) {
      toast.error("공지 내용을 입력해 주세요.");
      return;
    }
    setItems([
      {
        id: `local-${Date.now()}`,
        event_id: eventId,
        body: text,
        pinned: false,
        created_at: new Date().toISOString(),
      },
      ...items,
    ]);
    setBody("");
  }

  function togglePin(id: string) {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned } : item,
      ),
    );
  }

  function remove(id: string) {
    setItems(items.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {isHost && (
        <div className="flex flex-col gap-2">
          <Textarea
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="참석자에게 알릴 내용을 적어 주세요."
            aria-label="공지 내용"
          />
          <Button className="h-11" onClick={add}>
            공지 등록
          </Button>
        </div>
      )}
      {sorted.length === 0 ? (
        <EmptyState message="등록된 공지가 없습니다." />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border p-4"
            >
              {item.pinned && (
                <Badge variant="secondary" className="w-fit">
                  고정
                </Badge>
              )}
              <p className="whitespace-pre-wrap text-sm">{item.body}</p>
              {isHost && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 flex-1"
                    onClick={() => togglePin(item.id)}
                  >
                    <Pin className="size-4" />
                    {item.pinned ? "고정 해제" : "상단 고정"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 flex-1"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="size-4" />
                    삭제
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
