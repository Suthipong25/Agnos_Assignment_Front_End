export function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function secondsSince(value: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - new Date(value).getTime()) / 1000);
}
