import { useEffect } from "react";

export const usePageTitle = (title: string) => {
  useEffect(() => {
    const fullTitle = title ? `Party Panther - ${title}` : "Party Panther";
    document.title = fullTitle;
  }, [title]);
};
