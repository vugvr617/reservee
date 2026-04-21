export const VAPI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "check_availability",
      description:
        "Check available tables for a given date, time, and party size. Use this before creating a reservation to see what's available.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format",
          },
          time: {
            type: "string",
            description: "Time in HH:MM format (24-hour)",
          },
          party_size: {
            type: "number",
            description: "Number of guests",
          },
        },
        required: ["date", "time", "party_size"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_reservation",
      description:
        "Book a reservation after confirming details with the caller. Always check availability first.",
      parameters: {
        type: "object",
        properties: {
          guest_name: {
            type: "string",
            description: "Full name of the guest",
          },
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format",
          },
          time: {
            type: "string",
            description: "Time in HH:MM format (24-hour)",
          },
          party_size: {
            type: "number",
            description: "Number of guests",
          },
          special_requests: {
            type: "string",
            description:
              "Any special requests such as dietary needs, celebrations, or seating preferences",
          },
        },
        required: ["guest_name", "date", "time", "party_size"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cancel_reservation",
      description:
        "Cancel an existing reservation. The reservation is identified automatically by the caller's phone number — never ask the caller for their name.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date of the reservation in YYYY-MM-DD format",
          },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "modify_reservation",
      description:
        "Modify an existing reservation. The reservation is identified automatically by the caller's phone number — never ask the caller for their name. Only provide fields that are changing.",
      parameters: {
        type: "object",
        properties: {
          original_date: {
            type: "string",
            description: "Current date of the reservation in YYYY-MM-DD format",
          },
          new_date: {
            type: "string",
            description: "New date in YYYY-MM-DD format (if changing)",
          },
          new_time: {
            type: "string",
            description: "New time in HH:MM format (if changing)",
          },
          new_party_size: {
            type: "number",
            description: "New number of guests (if changing)",
          },
          special_requests: {
            type: "string",
            description:
              "Any special requests such as dietary needs, celebrations, or seating preferences",
          },
        },
        required: ["original_date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_reservations",
      description:
        "Look up the caller's existing reservations on a given date. The reservations are identified automatically by the caller's phone number — never ask the caller for their name.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date to look up in YYYY-MM-DD format",
          },
        },
        required: ["date"],
      },
    },
  },
];
