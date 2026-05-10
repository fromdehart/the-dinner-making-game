export async function sendEmail(_to: string, _subject: string, _html: string) {
  return { success: false as const, error: "Email not configured" };
}
