"use client";

import { deleteThreadAction, updateThreadAction } from "@/app/api/chat/actions";
import {
  Loader,
  PencilLine,
  Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type PropsWithChildren, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { Button } from "ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import { Input } from "ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";

type Props = PropsWithChildren<{
  threadId: string;
  beforeTitle?: string;
  onDeleted?: () => void;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "end" | "center";
}>;

export function ThreadDropdown({
  threadId,
  children,
  beforeTitle,
  onDeleted,
  side,
  align,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteThreadAction(threadId);
      mutate("/api/thread");
      toast.success("Thread deleted");
      setOpen(false);
      onDeleted?.();
      router.push("/");
    } catch {
      toast.error("Failed to delete thread");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateTitle = async (title: string) => {
    try {
      await updateThreadAction(threadId, { title });
      mutate("/api/thread");
      toast.success("Thread renamed");
      setOpen(false);
    } catch {
      toast.error("Failed to rename thread");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-48 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandList>
            <CommandGroup>
              <UpdateThreadNameDialog
                initialTitle={beforeTitle || ""}
                onUpdated={handleUpdateTitle}
              >
                <CommandItem
                  onSelect={() => {}}
                  className="cursor-pointer"
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </CommandItem>
              </UpdateThreadNameDialog>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem disabled={isDeleting} className="cursor-pointer p-0">
                <div
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-destructive hover:bg-destructive/10 rounded"
                  onClick={handleDelete}
                >
                  <Trash className="h-4 w-4" />
                  <span>Delete</span>
                  {isDeleting && (
                    <Loader className="ml-auto h-4 w-4 animate-spin" />
                  )}
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function UpdateThreadNameDialog({
  initialTitle,
  children,
  onUpdated,
}: PropsWithChildren<{
  initialTitle: string;
  onUpdated: (title: string) => void;
}>) {
  const [title, setTitle] = useState(initialTitle);
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent hideClose>
        <DialogHeader>
          <DialogTitle>Rename Session</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <Input
            type="text"
            value={title}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdated(title);
              }
            }}
            onChange={(e) => setTitle(e.target.value)}
          />
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => onUpdated(title)}>
              Update
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
