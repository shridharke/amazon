import { cn } from "@/lib/utils";
const ExternalDraggingevent = ({ event }: any) => {
  const { title, id, tag } = event;

  return (
    <div
      title={title}
      data-id={id}
      className={cn(
        "fc-event  px-4 py-1.5 bg-default-100  rounded text-sm flex  items-center gap-2 shadow-sm  cursor-move",
        {
          "bg-primary/10": tag === "fixed",
          "bg-warning/10": tag === "meeting",
          "bg-destructive/10": tag === "holiday",
          "bg-success/10": tag === "flexible",
        }
      )}
    >
      <span
        className={cn("h-2 w-2 rounded-full block", {
          "bg-primary": tag === "fixed",
          "bg-warning": tag === "meeting",
          "bg-destructive": tag === "holiday",
          "bg-success": tag === "flexible",
        })}
      ></span>
      <span className="text-sm font-medium text-default-900"> {title}</span>
    </div>
  );
};

export default ExternalDraggingevent;
