import { z } from "zod";

const EXPECTED_LABEL: Record<string, string> = {
  date: "Pick a valid date",
  number: "Enter a number",
  boolean: "Choose an option",
};

z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type":
        if (issue.input === undefined || issue.input === null) {
          return "This field is required";
        }
        return EXPECTED_LABEL[String(issue.expected)] ?? "Check this value";

      case "too_small":
        return issue.origin === "string" && Number(issue.minimum) <= 1
          ? "This field is required"
          : `Use at least ${issue.minimum}`;

      case "too_big":
        return `Use at most ${issue.maximum}`;

      case "invalid_value":
      case "invalid_union":
        return "Choose one of the available options";

      case "invalid_format":
        return "Check the format of this value";

      default:
        return "Check this value";
    }
  },
});
