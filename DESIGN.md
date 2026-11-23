# GeekAI public website

The public journey follows the form of a conference ticket. A dated event row leads to a compact checkout, then to a printable pass with a perforated edge and the attendee’s QR code.

- Canvas uses warm alabaster (#F6F5F2), forms and ticket rows use white, and event summaries and the pass header use obsidian (#111315).
- Emerald (#0E9F6E) identifies primary actions. Dark text on the emerald surface keeps button labels legible.
- Plus Jakarta Sans sets the interface. JetBrains Mono sets dates, amounts, coupon codes, and order identifiers.
- Feature panels swipe horizontally at every viewport. On mobile, registration guidelines start collapsed, and the payable amount stays beside the fixed checkout action.
- The feature carousel advances every three seconds and supports swipe, keyboard arrows, and pagination. Hover or keyboard focus holds the active feature. The institution strip loops through the supplied OAIC logos and pauses on hover. Reduced motion disables both automatic sequences.
- The event directory displays the API’s active events. The success route uses the registration response and routes visitors without pass data back to their email or the event directory.
