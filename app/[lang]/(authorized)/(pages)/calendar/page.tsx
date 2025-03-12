import { getCategories, getEvents } from "@/config/calendar.config";
import CalendarView from "./calender-view";



const CalenderPage = async () => {
  const events = await getEvents();
  const categories = await getCategories();
  return (
    <div>
      <CalendarView />
    </div>
  );
};

export default CalenderPage;
