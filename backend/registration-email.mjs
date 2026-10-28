/** Server-only email envelope. Visitor input never controls the recipient or subject. */
export function checklistRegistrationEmail(sender, data) {
  const fields = [
    ["Full name", data.name], ["Email address", data.email], ["Country", data.country],
    ["Registration type", data.kind], ["Book selection", data.bookId], ["Format", data.format],
    ["Consent", data.consent], ["Consent version", data.consentVersion],
    ["Form started at (Unix milliseconds)", data.startedAt], ["Website (spam check)", data.website],
    ["Received at", data.consentAt],
  ];
  return {
    FromEmailAddress: sender,
    Destination: { ToAddresses: ["admin@aafxx.com"] },
    ReplyToAddresses: [data.email],
    Content: { Simple: {
      Subject: { Data: "New AAFXX Checklist Registration", Charset: "UTF-8" },
      Body: { Text: { Data: fields.map(([label, value]) => `${label}: ${value === "" ? "(not provided)" : String(value)}`).join("\n"), Charset: "UTF-8" } },
    } },
  };
}
