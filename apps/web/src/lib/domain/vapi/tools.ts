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
          guest_phone: {
            type: "string",
            description: "Phone number of the guest",
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
        required: ["guest_name", "guest_phone", "date", "time", "party_size"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cancel_reservation",
      description:
        "Cancel an existing reservation. Look up by guest name and date.",
      parameters: {
        type: "object",
        properties: {
          guest_name: {
            type: "string",
            description: "Name the reservation is under",
          },
          date: {
            type: "string",
            description: "Date of the reservation in YYYY-MM-DD format",
          },
        },
        required: ["guest_name", "date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "modify_reservation",
      description:
        "Modify an existing reservation. Look up by guest name and original date, then update with new details. Only provide fields that are changing.",
      parameters: {
        type: "object",
        properties: {
          guest_name: {
            type: "string",
            description: "Name the reservation is under",
          },
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
        },
        required: ["guest_name", "original_date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_reservations",
      description:
        "Look up existing reservations for a guest by name or phone number on a specific date.",
      parameters: {
        type: "object",
        properties: {
          guest_name: {
            type: "string",
            description: "Name to search for",
          },
          date: {
            type: "string",
            description: "Date to look up in YYYY-MM-DD format",
          },
        },
        required: ["guest_name", "date"],
      },
    },
  },
];
