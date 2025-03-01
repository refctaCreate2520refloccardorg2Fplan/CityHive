import { Injectable } from "@angular/core";
import emailjs, { EmailJSResponseStatus } from "emailjs-com";

export interface EventData {
  title: string;
  description?: string;
  startDateTime: string; // ISO string, napr. 2025-03-05T19:00:00.000Z
  endDateTime: string;   // ISO string
  location?: string;
}

@Injectable({
  providedIn: "root"
})
export class InterestEmailService {
  constructor() {
    // Inicializácia EmailJS – nahraďte "YOUR_EMAILJS_USER_ID" vaším User ID
    emailjs.init("8acPASLMzUsLETQPh");

  }

  /**
   * Vygeneruje URL pre Google Calendar s predvyplnenými údajmi eventu.
   */
  private generateGoogleCalendarUrl(event: EventData): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const startStr = formatDate(new Date(event.startDateTime));
    const endStr = formatDate(new Date(event.endDateTime));
    const text = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || "");
    const location = encodeURIComponent(event.location || "");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  }

  /**
   * Odošle email s informáciami o evente, využíva templátu "template_5y1ei2d".
   * @param userEmail Emailová adresa príjemcu
   * @param event Objekt s údajmi o evente
   */
  sendInterestEmail(
    userEmail: string,
    event: EventData
  ): Promise<EmailJSResponseStatus> {
    const calendarUrl = this.generateGoogleCalendarUrl(event);

    // Parametre, ktoré EmailJS vloží do šablóny "template_5y1ei2d"
    const templateParams = {
      from_name: "Organizer",       // Môžete prispôsobiť podľa seba
      to_name: userEmail,           // Môžete to brať aj z iného poľa
      message: `Event: ${event.title}\nStart: ${event.startDateTime}\nEnd: ${event.endDateTime}`,
      google_calendar_link: calendarUrl,
    };

    // Použite Váš Service ID (napr. "service_7hn8vqk") a Template ID "template_5y1ei2d"
    return emailjs.send("service_7hn8vqk", "template_5y1ei2d", templateParams);
  }
}
