import { faker } from "@faker-js/faker";

const date = new Date();
const prevDay = new Date().getDate() - 1;
const nextDay = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

// prettier-ignore
const nextMonth = date.getMonth() === 11 ? new Date(date.getFullYear() + 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() + 1, 1)
// prettier-ignore
const prevMonth = date.getMonth() === 11 ? new Date(date.getFullYear() - 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() - 1, 1)
export const calendarEvents = [
  {
    id: faker.string.uuid() ,
    title: "John Smith",
    start: date,
    end: nextDay,
    allDay: false,
    //className: "warning",
    extendedProps: {
      calendar: "fixed",
    },
  },
  {
    id: faker.string.uuid(),
    title: "James Anderson",
    start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
    allDay: true,
    //className: "success",
    extendedProps: {
      calendar: "flexible",
    },
  },
  {
    id: faker.string.uuid(),
    title: "Michael Brown",
    allDay: true,
    start: new Date(date.getFullYear(), date.getMonth() + 1, -9),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -7),
    // className: "info",
    extendedProps: {
      calendar: "fixed",
    },
  },
  {
    id: faker.string.uuid(),
    title: "Emma Wilson",
    start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
    allDay: true,
    //className: "primary",
    extendedProps: {
      calendar: "flexible",
    },
  },
  {
    id: faker.string.uuid(),
    title: "Michael Brown",
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    // className: "danger",
    extendedProps: {
      calendar: "flexible",
    },
  },
  {
    id: faker.string.uuid(),
    title: "Sarah Johnson",
    start: nextMonth,
    end: nextMonth,
    allDay: true,
    //className: "primary",
    extendedProps: {
      calendar: "fixed",
    },
  },
];

export const calendarCategories  = [
  {
    label: "Fixed",
    value: "fixed",
    activeClass: "ring-primary-500 bg-primary-500",
    className: " group-hover:border-blue-500",
  },
  {
    label: "Flexible",
    value: "flexible",
    activeClass: "ring-success-500 bg-success-500",
    className: " group-hover:border-green-500",
  },
];

export const categories = [
  {
    label: "Fixed",
    value: "fixed",
    className: "data-[state=checked]:bg-primary border-primary",
  },
  {
    label: "Flexible",
    value: "flexible",

    className: "data-[state=checked]:bg-success border-success",
  },
];

export type CalendarEvent = (typeof  calendarEvents)[number]
export type CalendarCategory = (typeof  calendarCategories)[number]
export type Category = (typeof  categories)[number]