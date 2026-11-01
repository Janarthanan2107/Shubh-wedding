# WhatsApp

Shubh does not call the WhatsApp Business API. Each share opens `https://wa.me/?text=` or `https://wa.me/<digits>?text=` with a URL-encoded message: greeting, couple names, date, invitation URL, and a short blessing.

Personal links look like `/w/<slug>?g=<token>`. The token is a random 18-byte value. The public page shows that guest’s name and only the ceremonies they were invited to. It does not list other guests.

The guest page and the wedding overview list one `wa.me` link per guest so a family can send them one by one. Pending guests are the reminder list.

## Optional Business API later

A provider such as the WhatsApp Cloud API can sit behind a `ShareProvider` next to the current link builder in `src/lib/domain.ts`. The message text and the personal URL stay the same. You would add a phone-number id, a template name approved by Meta, and a send call that uses the guest token URL as the button. That needs a Meta business account and is intentionally not required to run this demo.
