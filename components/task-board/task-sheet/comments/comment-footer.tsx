"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import avatar from "@/public/images/avatar/avatar-7.jpg";
import { SendHorizontal } from "lucide-react";
import { Comment } from "@prisma/client";
import { createComment } from "@/config/db";
import toast from "react-hot-toast";
const CommentFooter = ({
  taskId,
  fetchComments,
}: {
  taskId: number;
  fetchComments: () => Promise<void>;
}) => {
  const [message, setMessage] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = "auto"; // Reset the height to auto to adjust
    e.target.style.height = `${e.target.scrollHeight - 15}px`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newMessage = {
      comment: message,
      jobId: taskId,
    };

    try {
      const response = await createComment(newMessage);
      if (response.status === 201) {
        toast.success("Comment successfully added");
        setMessage("");
        fetchComments();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error while adding comment");
    }
  };

  return (
    <>
      <div className="w-full flex items-end gap-4 px-4 border-t border-default-200">
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <div className="flex  gap-1 relative">
              <textarea
                value={message}
                placeholder="Type your message..."
                className="bg-default-100 rounded-xl break-words px-3 flex-1 h-10 pt-2 p-1 "
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                style={{
                  minHeight: "40px",
                  maxHeight: "120px",
                  overflowY: "auto",
                  resize: "none",
                }}
              />

              <Button
                type="submit"
                className="rounded-full bg-default-100 hover:bg-default-100 h-[42px] w-[42px] p-0 self-end"
              >
                <SendHorizontal className="w-5 h-8 text-primary" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CommentFooter;
