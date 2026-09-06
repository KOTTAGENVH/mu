export interface SectionItem {
  label: string;
  text: string;
  link?: { href: string; label: string };
  textAfter?: string;
}

export interface Section {
  number: string;
  title: string;
  meta?: string;
  items: SectionItem[];
}

export const sections: Section[] = [
  {
    number: "01",
    title: "Introduction",
    items: [
      {
        label: "Ownership & Scope",
        text: 'Mu is a self-hosted audio platform created, owned, and operated by Nowen Kottage ("I," "me," or "my"). By using the Mu application ("the App" or "the Service"), you ("the User") agree to be bound by these Terms & Conditions.',
      },
      {
        label: "Acceptance of Terms",
        text: "If you do not agree with any part of these Terms & Conditions, please do not use the Mu application.",
      },
      {
        label: "Self-Hosted Environment",
        text: "Mu is designed as a personal, self-hosted project for a pleasant audio listening experience. It is not a commercial product and is not intended for public redistribution of audio content.",
      },
    ],
  },
  {
    number: "02",
    title: "Disclaimer of Warranties (No Warranty)",
    items: [
      {
        label: 'Provided "As-Is"',
        text: "This self-hosted platform is provided strictly on an 'AS IS' and 'AS AVAILABLE' basis, without warranties of any kind, either express or implied.",
      },
      {
        label: "No Guarantee of Service",
        text: "I do not warrant or guarantee that the service will be uninterrupted, secure, or error-free. I make no warranty regarding the permanent storage of audio files, user preferences, or server uptime.",
      },
      {
        label: "Limitation of Liability",
        text: "Under no circumstances shall I, Nowen Kottage, be held liable for any direct, indirect, incidental, or consequential damages, including but not limited to data loss, device issues, or server downtime arising from your use of this platform.",
      },
    ],
  },
  {
    number: "03",
    title: "Intellectual Property",
    items: [
      {
        label: "Design & Code Rights",
        text: "All source code, interface design, and architecture for Mu are held by me, Nowen Kottage. Copying, distributing, or recreating the source code of Mu is strictly prohibited without explicit permission.",
      },
      {
        label: "Audio Content",
        text: "The audio tracks provided within the application are for demonstration purposes. I do not claim ownership of third-party musical compositions unless explicitly stated. If you are a copyright holder and believe your content is used improperly, please contact me for immediate removal.",
      },
      {
        label: "Visual Assets & Animations",
        text: "Certain visual elements, such as the interactive smoke animation, are created using frames extracted from copyright-free video materials sourced from Pexels (original footage by Dan Cristian Pădureț). These are used in compliance with their free-use license.",
      },
      {
        label: "Third-Party Assets",
        text: "Icons and UI elements may utilize libraries such as Lucide React and Font Awesome. These assets remain the property of their respective creators.",
      },
      {
        label: "Map Data",
        text: "Country boundary data is sourced from Natural Earth (https://github.com/nvkelso/natural-earth-vector), a public domain map dataset. Natural Earth does not endorse this project.",
      },
    ],
  },
  {
    number: "04",
    title: "User Responsibilities",
    items: [
      {
        label: "Personal Use Only",
        text: "Mu is intended for personal, non-commercial use. Users must not use the application for public broadcasting or commercial audio distribution.",
      },
      {
        label: "Prohibited Actions",
        text: "You may not attempt to manipulate audio streams, bypass authentication, or flood the self-hosted server with excessive requests (DDoS).",
      },
      {
        label: "Fair Usage",
        text: "Because this platform runs on limited self-hosted infrastructure, excessive bandwidth usage via automated scripts or bots is strictly prohibited to ensure the server remains stable.",
      },
    ],
  },
  {
    number: "05",
    title: "Privacy & Data Usage",
    items: [
      {
        label: "Data Storage",
        text: "User preferences and authentication tokens are stored on this self-hosted server and your local device. While basic security measures are in place, no guarantees of absolute data security are provided.",
      },
      {
        label: "Cookies",
        text: "Essential cookies or local storage tokens are used strictly for authentication and maintaining your session state.",
      },
      {
        label: "Data Charges",
        text: "Streaming high-quality audio consumes data. Users are responsible for any data charges incurred from their network provider while using Mu.",
      },
    ],
  },
  {
    number: "06",
    title: "Compatibility & Testing",
    meta: "Last reviewed: Feb 2026",
    items: [
      {
        label: "Browser Support",
        text: "This application has been tested on the latest stable versions of Chrome, Safari, and Edge.",
      },
      {
        label: "Audio Playback",
        text: "Background audio playback behaviors may vary on mobile devices (iOS/Android) due to operating system restrictions on web browsers.",
      },
      {
        label: "Report Issues",
        text: "If you encounter playback errors or UI inconsistencies, please report them via the",
        link: {
          href: "https://www.nowenkottage.com/contactus",
          label: "contact page",
        },
        textAfter: "with details regarding your device and browser version.",
      },
    ],
  },
];