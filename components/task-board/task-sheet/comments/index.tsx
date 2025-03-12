import { ScrollArea } from "@/components/ui/scroll-area";
import CommentFooter from "./comment-footer";
import { cn, formatDate } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { getJobComments } from "@/config/db";
import { Comment } from "@prisma/client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CircularProgress } from "@/components/ui/progress";

const Comments = ({
  className,
  taskId,
}: {
  className: string;
  taskId: number;
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await getJobComments(taskId);
      if (response.status === 200) {
        setComments(response.data.comments);
        setTotalComments(response.data.comments.length);
      } else {
        toast.error("Error fetching comments");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error fetching comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  return (
    <div className="flex flex-col justify-between">
      <div className="border-none mb-0 flex-none py-3.5 px-2">
        <div className="flex items-center gap-2">
          <Icon
            icon="heroicons:chat-bubble-bottom-center"
            className="h-4 w-4 text-default-500"
          />
          <div className="text-base font-medium text-default-800">
            {totalComments}
            <span className="ml-1 capitalize">
              {totalComments > 1 ? "comments" : "comment"}
            </span>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center w-full h-full">
          <CircularProgress value={50} color="primary" loading />
        </div>
      ) : (
        <div className="flex-1 pb-0">
          {/* <div className="relative before:absolute before:top-1/2 -translate-y-1/2 before:left-0 before:w-full before:h-[1px] before:bg-default-300 text-center">
            <span className="relative bg-card   px-3">Today</span>
          </div> */}
          <div className={className}>
            <ScrollArea className="h-full">
              <div className="space-y-3.5 px-5">
                {comments?.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      className="flex gap-2"
                      key={`comment-key-${comment.id}`}
                    >
                      <div className="felx-none">
                        <Avatar>
                          <AvatarImage src={comment.user.image} />
                          <AvatarFallback>
                            {comment.user.name.toString()[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-default-900 capitalize">
                            {comment.user.name}
                          </div>
                          <div className="text-xs text-default-400">
                            {formatDate(comment.createdAt)}
                          </div>
                          <div className="text-xs text-default-400">
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="mt-1 text-default-600 font-medium ">
                          {comment.comment}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <div className="flex items-center gap-2 hover:bg-default-50 rounded-md group py-3 px-2">
                      <div>
                        <span className="h-10 w-10 rounded-full bg-default-50 group-hover:bg-default-100 block"></span>
                      </div>
                      <div className="text-sm font-medium text-default-500">
                        Post a comment to start a discussion.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
      <div className="flex-none">
        <CommentFooter taskId={taskId} fetchComments={fetchComments} />
      </div>
    </div>
  );
};

export default Comments;
