export type TaskCategory = 'digitization' | 'marketing';

export type ChannelType =
  | 'Telegram'
  | 'Facebook'
  | 'Instagram/TikTok'
  | 'Google Business'
  | 'OTA Follow-up';

export interface PlanTask {
  id: string;
  category: TaskCategory;
  title: string;
  toolOrSetting: string;
  instructions: string;
  estimatedMinutes: number;
}

export interface ActionPlanDay {
  day: number;
  title: string;
  primaryFocus: string;
  summary: string;
  targetChannel: string;
  tasks: PlanTask[];
  kpiDeliverable: string;
  deliverableChecklist: string[];
}

export interface ScriptTemplate {
  id: string;
  dayRef: number;
  channel: ChannelType;
  title: string;
  hookAngle: string;
  visualInstruction: string;
  settingOrButton: string;
  bodyText: string;
}

export interface ShotGuideItem {
  id: string;
  title: string;
  shotTiming: string;
  framingNote: string;
  captionHook: string;
  imageKey: 'desk' | 'courtyard' | 'cafe';
}

export const ACTION_PLAN_DAYS: ActionPlanDay[] = [
  {
    day: 1,
    title: 'Audit, Wi-Fi Proof & Google Maps Foundation',
    primaryFocus: 'Audit & Search Discovery Foundation',
    summary:
      'Establish verifiable fiber Wi-Fi proof for remote workers and claim/optimize Google Business Profile so travelers searching Toul Tom Pong find Vanny’s directly without OTA fees.',
    targetChannel: 'Google Business Profile · Ookla Speedtest',
    tasks: [
      {
        id: 'd1-dig-1',
        category: 'digitization',
        title: 'Run Floor-by-Floor Wi-Fi Speed & Stability Audit',
        toolOrSetting: 'Speedtest.net app (smartphone) + Google Sheets',
        instructions:
          'Stand at each work desk on Ground, 2nd, and 3rd floors plus the courtyard. Run Speedtest twice per spot (morning and 19:00 peak), screenshot Download/Upload Mbps and Ping, and record any dead zones to reposition mesh routers.',
        estimatedMinutes: 35,
      },
      {
        id: 'd1-dig-2',
        category: 'digitization',
        title: 'Claim & Complete Google Business Profile (GBP)',
        toolOrSetting: 'Google Business Profile Manager · Primary Category: Guest house',
        instructions:
          'Set exact pin in Toul Tom Pong (near Russian Market). Enable attributes: Free high-speed Wi-Fi, Dedicated workspace, Air conditioning, Airport shuttle. Add your Telegram link (`https://t.me/yourhandle`) under Website/Appointment URL until a full site launches.',
        estimatedMinutes: 45,
      },
      {
        id: 'd1-dig-3',
        category: 'digitization',
        title: 'Align Facebook Page Info & CTA Button',
        toolOrSetting: 'Facebook Page Settings -> Action Button -> Send Message',
        instructions:
          'Update Facebook Bio to lead with "Quiet Nomad-Friendly Rooms in Toul Tom Pong · Fiber Wi-Fi + Ergonomic Desks · Direct ABA KHQR Booking". Link Telegram and Google Maps pin in the Intro section.',
        estimatedMinutes: 20,
      },
      {
        id: 'd1-mkt-1',
        category: 'marketing',
        title: 'Publish First Google Business Update + 5 Core Photos',
        toolOrSetting: 'GBP -> Add Update -> Offer/Update + Photos',
        instructions:
          'Upload 5 daylight smartphone shots: 1) Teak desk with natural window light, 2) Courtyard seating, 3) Speedtest screenshot showing Mbps, 4) Clean street entrance, 5) Walkable corner toward Russian Market. Publish the Day 1 GBP post from the Script Vault.',
        estimatedMinutes: 30,
      },
    ],
    kpiDeliverable:
      'Verified Google Business Profile live with 5 nomad-focused photos + Room Wi-Fi Speed Matrix completed.',
    deliverableChecklist: [
      'Speedtest screenshots saved for every room tier',
      'GBP pin & attributes verified (Guest house category)',
      'Facebook Page intro & Send Message CTA updated',
    ],
  },
  {
    day: 2,
    title: 'Telegram Concierge & ABA Pay / KHQR Direct Funnel',
    primaryFocus: 'Direct Booking Funnel & Payment Friction Removal',
    summary:
      'Replace slow manual DMs with instant Telegram Business auto-replies, launch a zero-cost Google Form for direct reservations, and standardize ABA Pay / KHQR 1-night deposit verification.',
    targetChannel: 'Telegram Business · Google Forms · ABA Pay / KHQR',
    tasks: [
      {
        id: 'd2-dig-1',
        category: 'digitization',
        title: 'Configure Telegram Business Greeting, Away & Quick Replies',
        toolOrSetting: 'Telegram Settings -> Telegram Business -> Greeting / Quick Replies',
        instructions:
          'Create 4 one-tap slash commands: `/wifi` (exact Mbps + backup 4G router note), `/rates` (Daily, 7-night, 30-night direct discount vs OTA), `/khqr` (ABA Pay USD/KHR deposit instructions), and `/checkin` (Pre-arrival Google Form link).',
        estimatedMinutes: 40,
      },
      {
        id: 'd2-dig-2',
        category: 'digitization',
        title: 'Generate Direct Booking Request Google Form',
        toolOrSetting: 'This Dashboard -> Forms Hub -> Create Direct Booking Form',
        instructions:
          'Use the Forms Hub tab in this dashboard to provision your standardized Direct Booking Google Form. Copy the short responder link and paste it into your Telegram `/rates` reply and Facebook pinned post.',
        estimatedMinutes: 20,
      },
      {
        id: 'd2-dig-3',
        category: 'digitization',
        title: 'Prepare Printed & Digital ABA Pay / KHQR Deposit Card',
        toolOrSetting: 'ABA Mobile App -> KHQR -> Save Image + Canva A5 Counter Card',
        instructions:
          'Export high-res ABA KHQR code showing "Vanny’s Peaceful Guesthouse" in USD & KHR. Save a clean square crop on the front-desk phone for instant Telegram forwarding to confirm direct 1-night deposits with 0% OTA commission.',
        estimatedMinutes: 25,
      },
      {
        id: 'd2-mkt-1',
        category: 'marketing',
        title: 'Pin Facebook Direct-Booking Offer for Remote Workers',
        toolOrSetting: 'Facebook Page -> Create Post -> Pin to Top of Page',
        instructions:
          'Publish the "Work Quietly in Toul Tom Pong — Save 12% Booking Direct via Telegram + ABA KHQR" post with a bright desk photo and clear weekly/monthly nomad pricing.',
        estimatedMinutes: 25,
      },
    ],
    kpiDeliverable:
      'Live Telegram Business `/rates` & `/khqr` automation + Active Direct Booking Google Form + Pinned FB Offer.',
    deliverableChecklist: [
      '4 Telegram quick-reply shortcuts tested',
      'Direct Booking Google Form created & linked',
      'ABA KHQR deposit image saved for one-tap sending',
    ],
  },
  {
    day: 3,
    title: 'Digital Pre-Arrival Check-In QR & Link-in-Bio Hub',
    primaryFocus: 'Frictionless Check-In & Single-Link Discovery',
    summary:
      'Eliminate paper lobby forms and scattered links by launching a Digital Pre-Arrival Check-In Google Form with printable QR cards and a single free Link-in-Bio hub.',
    targetChannel: 'Google Forms · Linktree/Carrd · Instagram Stories',
    tasks: [
      {
        id: 'd3-dig-1',
        category: 'digitization',
        title: 'Provision Digital Pre-Arrival Check-In Google Form + Desk QR',
        toolOrSetting: 'This Dashboard -> Forms Hub -> Create Check-In Form -> Print QR',
        instructions:
          'Create the Digital Check-In Google Form (captures arrival ETA, Telegram handle, passport photo note, quiet-floor/desk preference, and tuk-tuk request). Print the dashboard’s generated QR card for the reception desk and guest welcome folder.',
        estimatedMinutes: 30,
      },
      {
        id: 'd3-dig-2',
        category: 'digitization',
        title: 'Launch Free Link-in-Bio Booking Hub',
        toolOrSetting: 'Carrd.co (free) or Linktree Free',
        instructions:
          'Add exactly 4 clean links: 1) Book Direct & Save 12% (Google Form), 2) Instant Telegram Concierge, 3) Pre-Arrival Check-In, 4) Google Maps Pin (Toul Tom Pong). Place this single URL on Facebook, Instagram, TikTok, and GBP.',
        estimatedMinutes: 40,
      },
      {
        id: 'd3-mkt-1',
        category: 'marketing',
        title: 'Post 3-Slide Instagram & Facebook Story Funnel',
        toolOrSetting: 'Instagram Stories -> Link Sticker + Location Tag (Toul Tom Pong)',
        instructions:
          'Slide 1: Room desk + text overlay "120+ Mbps fiber & quiet street in TTP". Slide 2: Walk outside to neighborhood iced coffee ("2 mins from Russian Market cafes"). Slide 3: Link sticker to your Link-in-Bio hub ("DM or book direct — zero platform fees").',
        estimatedMinutes: 25,
      },
    ],
    kpiDeliverable:
      'Printable Check-In QR deployed at reception + Single Link-in-Bio Hub live across all social profiles.',
    deliverableChecklist: [
      'Check-In Google Form live & QR code printed',
      '4-button Link-in-Bio URL active on FB/IG/GBP',
      '3-slide Story sequence published & saved to "Workspaces" Highlight',
    ],
  },
  {
    day: 4,
    title: 'Smartphone Visual Batching & Canva Templates',
    primaryFocus: 'Content Batching & Visual Consistency',
    summary:
      'Batch-shoot two weeks of authentic, bright smartphone photography and vertical B-roll in 90 minutes of morning light so staff never scramble for daily posts.',
    targetChannel: 'Smartphone Camera · Canva Free · Google Drive',
    tasks: [
      {
        id: 'd4-dig-1',
        category: 'digitization',
        title: 'Build 2 Reusable Free Canva Templates (Carousel + Reels Cover)',
        toolOrSetting: 'Canva Free (1080×1350 Portrait Post & 1080×1920 Reel Cover)',
        instructions:
          'Set brand colors (Warm Off-White, Charcoal Ink, Mekong Teal). Template A: "Remote Work Scorecard" slide showing Wi-Fi Mbps, Desk Lighting, Quiet Score, Walk-to-Coffee mins. Template B: Clean vertical Reel cover.',
        estimatedMinutes: 45,
      },
      {
        id: 'd4-mkt-1',
        category: 'marketing',
        title: 'Execute 90-Minute Morning Light Photo & B-Roll Batch',
        toolOrSetting: 'Smartphone 1x & 0.5x Lens (07:30–09:00 golden daylight)',
        instructions:
          'Shoot 12 crisp photos and 3 vertical 15-second clips following the Shot Guide below: ergonomic desk setup with laptop + mug, peaceful tropical courtyard, quiet street alley in TTP, and a walking POV to a nearby specialty cafe.',
        estimatedMinutes: 60,
      },
      {
        id: 'd4-dig-2',
        category: 'digitization',
        title: 'Organize Shared Staff Content Folder',
        toolOrSetting: 'Google Drive / Telegram "Saved Media" Channel',
        instructions:
          'Create 3 sub-albums (`01_Desks_Rooms`, `02_Courtyard_Vibe`, `03_TTP_Neighborhood`) so any reception team member can grab verified photos in seconds when replying to inquiries.',
        estimatedMinutes: 15,
      },
    ],
    kpiDeliverable:
      '12 daylight photos + 3 vertical B-roll video clips + 2 reusable Canva templates archived for 14 days of posting.',
    deliverableChecklist: [
      '12 clean photos shot between 07:30–09:00',
      '3 vertical 15s B-roll clips filmed',
      '2 Canva templates saved for weekly reuse',
    ],
  },
  {
    day: 5,
    title: 'Phnom Penh Expat & Nomad Facebook Launch + Reels',
    primaryFocus: 'Targeted Organic Distribution & Short-Form Video',
    summary:
      'Deploy your batched visuals into the highest-converting Phnom Penh channels: local expat/digital nomad Facebook groups and an educational Instagram/TikTok room-tour Reel.',
    targetChannel: 'Facebook Groups · Instagram Reels · TikTok',
    tasks: [
      {
        id: 'd5-dig-1',
        category: 'digitization',
        title: 'Configure Meta Business Suite Saved Replies & Lead Log',
        toolOrSetting: 'Meta Business Suite Inbox -> Saved Replies',
        instructions:
          'Save 3 instant inbox responses for Facebook/IG DMs: Monthly Rate Sheet, Wi-Fi & Quiet Room Guarantee, and Direct Telegram/Google Form link so zero DM inquiries go cold overnight.',
        estimatedMinutes: 25,
      },
      {
        id: 'd5-mkt-1',
        category: 'marketing',
        title: 'Post in 3 High-Intent Phnom Penh Facebook Groups',
        toolOrSetting: 'Phnom Penh Expats · Phnom Penh Housing · Digital Nomads Cambodia',
        instructions:
          'Always verify group promo rules first. Post the transparent "Monthly & Weekly Remote-Worker Sanctuary in Toul Tom Pong" listing with 4 clean photos (desk, bed, courtyard, speedtest) and exact USD rate range + Telegram handle.',
        estimatedMinutes: 40,
      },
      {
        id: 'd5-mkt-2',
        category: 'marketing',
        title: 'Publish Reel / TikTok #1: "Skip Riverside Traffic — Work From TTP"',
        toolOrSetting: 'CapCut Free / Instagram Reels + TikTok',
        instructions:
          'Stitch your 3 vertical B-roll clips (12–15 seconds total). Hook text on screen in first 2 seconds: "Why remote workers choose Toul Tom Pong over Riverside in Phnom Penh". Use the Script Vault caption & local hashtags.',
        estimatedMinutes: 35,
      },
    ],
    kpiDeliverable:
      '3 compliant Facebook group launches + 1st Reel/TikTok live + Meta Business Suite saved replies active.',
    deliverableChecklist: [
      'Meta Business Suite DM macros configured',
      '3 Phnom Penh FB group posts published',
      '1st vertical Reel & TikTok uploaded with Link-in-Bio CTA',
    ],
  },
  {
    day: 6,
    title: 'Toul Tom Pong Partnerships & Airport Tuk-Tuk Package',
    primaryFocus: 'Hyperlocal Partnerships & Arrival Experience',
    summary:
      'Use live Google Maps route intelligence to build an accurate TTP Nomad Welcome Guide, lock in fixed airport tuk-tuk transfers, and partner with nearby specialty cafés and coworking spots.',
    targetChannel: 'TTP Map & Routes · Local Cafés · Tuk-Tuk Partners',
    tasks: [
      {
        id: 'd6-dig-1',
        category: 'digitization',
        title: 'Build Verified TTP Distance & Airport Route Sheet',
        toolOrSetting: 'This Dashboard -> TTP Map & Routes Tab',
        instructions:
          'Query nearby Specialty Coffee, Coworking, ABA ATMs, and Gyms in the TTP Map tab. Compute live driving/tuk-tuk routes from Phnom Penh Int’l Airport / Techo Airport & Riverside, then copy the formatted distance note into Telegram `/location`.',
        estimatedMinutes: 30,
      },
      {
        id: 'd6-dig-2',
        category: 'digitization',
        title: 'Standardize Trusted Tuk-Tuk Driver Card & Fixed Rates',
        toolOrSetting: 'Telegram Group ("Vanny Drivers") + PassApp/Grab Rate Check',
        instructions:
          'Onboard 2 reliable English-speaking tuk-tuk drivers into a dedicated Telegram group. Set transparent fixed airport pickup rates + driver name/plate template sent automatically after Check-In Form submission.',
        estimatedMinutes: 30,
      },
      {
        id: 'd6-mkt-1',
        category: 'marketing',
        title: 'Walk-In Outreach to 5 TTP Cafés & Coworking Spaces',
        toolOrSetting: 'Printed/Digital Partner Flyer + Instagram Tagging',
        instructions:
          'Visit 5 top-rated TTP coffee shops/coworking spots within 10 minutes’ walk. Offer to feature them in your "Vanny’s TTP Nomad Map" guest welcome card in exchange for letting you leave 5 discount cards or tagging each other on IG.',
        estimatedMinutes: 60,
      },
    ],
    kpiDeliverable:
      'Verified TTP Walking & Airport Route Sheet + 2 vetted tuk-tuk drivers on Telegram + 5 local café/coworking outreach contacts.',
    deliverableChecklist: [
      'Airport & TTP spot route times copied from TTP Map tab',
      'Driver Telegram dispatch template active',
      '5 TTP cafés/coworking spaces contacted for cross-promo',
    ],
  },
  {
    day: 7,
    title: 'OTA-to-Direct Conversion Loop & Weekly Review',
    primaryFocus: 'OTA Commission Recovery & Social Proof Loop',
    summary:
      'Turn one-time Booking.com and Agoda guests into repeat direct bookers and 5-star Google Maps reviewers, then review weekly metrics to lock in next week’s rhythm.',
    targetChannel: 'Booking.com · Agoda Extranet · Google Reviews',
    tasks: [
      {
        id: 'd7-dig-1',
        category: 'digitization',
        title: 'Update Booking.com & Agoda Scheduled Messages',
        toolOrSetting: 'Booking.com Extranet / Agoda YCS -> Messaging Preferences',
        instructions:
          'Add your Digital Check-In Form & Telegram concierge handle to pre-arrival messages so OTA guests connect on Telegram before landing—making mid-stay extensions easy to process direct via ABA KHQR.',
        estimatedMinutes: 35,
      },
      {
        id: 'd7-mkt-1',
        category: 'marketing',
        title: 'Send Post-Stay Google Review + Direct Rebooking Message',
        toolOrSetting: 'Telegram / WhatsApp Checkout Follow-Up + GBP Short Review Link',
        instructions:
          'Message every departing guest 2 hours after checkout with your direct Google Maps review link and a 12% "Welcome Back Direct" code valid for friends or return Phnom Penh stays.',
        estimatedMinutes: 25,
      },
      {
        id: 'd7-dig-2',
        category: 'digitization',
        title: 'Run Weekly Conversion & Content Audit in Forms Hub',
        toolOrSetting: 'This Dashboard -> Forms Hub + GBP Performance Insights',
        instructions:
          'Review Week 1 Direct Booking Form submissions, Check-In completions, GBP direction clicks, and top-performing Facebook/Reel hooks. Archive winning hooks for Week 2.',
        estimatedMinutes: 30,
      },
    ],
    kpiDeliverable:
      'Automated OTA pre-arrival/post-stay templates live + Weekly Scorecard reviewed (Direct Form Inquiries, GBP Views, New Reviews).',
    deliverableChecklist: [
      'Booking.com & Agoda messaging templates updated',
      'GBP direct review shortlink sent to recent guests',
      'Week 1 Forms & GBP metrics logged',
    ],
  },
];

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'scr-1',
    dayRef: 1,
    channel: 'Google Business',
    title: 'Google Business Opening / Nomad Sanctuary Update',
    hookAngle: 'Search Intent: Quiet rooms + verified fiber Wi-Fi near Russian Market',
    visualInstruction: 'Attach 5 photos: Desk + Window Light, Courtyard, Speedtest Screenshot, Entrance, TTP Street.',
    settingOrButton: 'GBP -> Add Update -> Button: "Book" or "Learn More" -> Link to Direct Booking Form / Telegram',
    bodyText: `Looking for a peaceful base to work remotely in Toul Tom Pong?

Vanny’s Peaceful Guesthouse pairs quiet, sunlit rooms with verified high-speed fiber Wi-Fi, proper teak work desks, and a shaded garden courtyard—just a short walk from Russian Market and TTP’s best specialty coffee shops.

• Reliable fiber Wi-Fi (tested at every desk)
• Weekly & monthly remote-worker rates
• Easy airport tuk-tuk pickup & digital pre-arrival check-in
• Book direct via Telegram or our booking form (ABA Pay / KHQR accepted, zero platform fees)

Message us on Telegram before your arrival for room availability and current Wi-Fi speed proof.`,
  },
  {
    id: 'scr-2',
    dayRef: 2,
    channel: 'Telegram',
    title: 'Telegram `/rates` & Direct Booking Quick Reply',
    hookAngle: 'Instant clarity on Daily / Weekly / Monthly savings vs. OTAs',
    visualInstruction: 'Send after guest taps Start or asks "How much per week/month?"',
    settingOrButton: 'Telegram Business -> Quick Replies -> Shortcut: /rates',
    bodyText: `Hello! Welcome to Vanny’s Peaceful Guesthouse in Toul Tom Pong (Russian Market), Phnom Penh.

Here are our Direct Booking rates (12% lower than Booking.com / Agoda—no platform fees):
• Standard Quiet Room (Work Desk + Fiber Wi-Fi): $[XX]/night · $[XXX]/week · $[XXX]/month
• Courtyard Desk Suite (Extra Quiet + Balcony): $[XX]/night · $[XXX]/week · $[XXX]/month

All stays include:
✓ Verified high-speed fiber Wi-Fi + backup 4G router
✓ Ergonomic desk setup & natural light
✓ Drinking water refill & housekeeping

Ready to reserve? Fill out our 60-second Direct Booking Form here:
[PASTE YOUR DIRECT BOOKING FORM LINK]

Reply /khqr for our ABA Pay QR code to lock in your dates with a 1-night deposit.`,
  },
  {
    id: 'scr-3',
    dayRef: 2,
    channel: 'Telegram',
    title: 'Telegram `/khqr` ABA Pay Deposit Instruction',
    hookAngle: 'Zero-friction Cambodian direct deposit confirmation',
    visualInstruction: 'Attach your cropped ABA Pay / KHQR PNG image directly with this caption.',
    settingOrButton: 'Telegram Business -> Quick Replies -> Shortcut: /khqr',
    bodyText: `To confirm your direct reservation at Vanny’s Peaceful Guesthouse, please send a 1-night deposit via ABA Pay / KHQR (USD or KHR) using the QR code above.

Account Name: Vanny’s Peaceful Guesthouse
Deposit Amount: $[XX] USD (or equivalent KHR)

Once completed, simply reply here with a screenshot of your transfer receipt. We’ll immediately confirm your room and send your Digital Pre-Arrival Check-In link so your keys and Wi-Fi password are ready when you land.`,
  },
  {
    id: 'scr-4',
    dayRef: 2,
    channel: 'Facebook',
    title: 'Facebook Pinned Post — Direct Nomad Rates',
    hookAngle: 'Lead with peace, fiber reliability, and 12% direct savings',
    visualInstruction: 'Use your brightest desk-by-the-window photo as the primary image.',
    settingOrButton: 'Pin to top of Facebook Page · Primary CTA Button: Send Message',
    bodyText: `Quiet mornings, fast fiber Wi-Fi, and walkable TTP coffee—without the Booking.com fees.

Whether you’re landing in Phnom Penh for a 1-week sprint or a 1-month stay, Vanny’s Peaceful Guesthouse in Toul Tom Pong is set up for remote work:

• Dedicated work desks & natural light in every nomad room
• Verified fiber Wi-Fi + backup connection for uninterrupted calls
• Shaded tropical courtyard for afternoon focus
• 3–7 mins walk to Russian Market, specialty cafés, gyms & ABA ATMs
• Airport tuk-tuk pickup arranged before you land

Book direct with us via Telegram or ABA Pay / KHQR and save 12% off OTA prices.
Tap "Send Message" or comment "RATES" below and we’ll send this week’s open rooms.`,
  },
  {
    id: 'scr-5',
    dayRef: 5,
    channel: 'Facebook',
    title: 'Facebook Group Launch — Phnom Penh Expats & Nomads',
    hookAngle: 'Transparent pricing + real neighborhood context (non-spammy)',
    visualInstruction: 'Attach 4 photos: 1) Desk setup, 2) Bed & window, 3) Courtyard, 4) Speedtest screenshot.',
    settingOrButton: 'Post in Phnom Penh Expats / Digital Nomads Cambodia (follow group promo day rules)',
    bodyText: `[Toul Tom Pong / Russian Market] Quiet, work-friendly guesthouse rooms — Weekly & Monthly Direct Rates

Hi everyone — for remote workers or newcomers settling into Phnom Penh who want a quiet base in TTP before committing to a long lease (or for a comfortable multi-week stay), we have rooms open at Vanny’s Peaceful Guesthouse.

What’s set up for remote work:
• Proper wooden desk + comfortable seating + strong window light
• Tested fiber Wi-Fi (happy to send live speedtest screenshots for your room)
• Quiet alley off the main noise, lush courtyard seating
• Walking distance to TTP cafés, coworking spots, and Russian Market
• Flexible weekly & monthly rates via ABA KHQR or cash (no agency/OTA fees)

Feel free to message me directly or drop a comment with your dates and I’ll share exact availability and room video tours on Telegram.`,
  },
  {
    id: 'scr-6',
    dayRef: 5,
    channel: 'Instagram/TikTok',
    title: 'Reel / TikTok #1 — "Why Nomads Stay in Toul Tom Pong"',
    hookAngle: 'Contrast noisy tourist strip vs. calm productive TTP sanctuary',
    visualInstruction: '0–3s: Desk & iced coffee | 3–8s: Courtyard walk | 8–12s: TTP cafe street | 12–15s: Speedtest proof.',
    settingOrButton: 'On-screen text hook + Location: Toul Tom Pong, Phnom Penh + Link in Bio CTA',
    bodyText: `On-screen text (0–3s): "Why remote workers skip Riverside & stay in Toul Tom Pong"
On-screen text (4–8s): "Quiet mornings + real work desks + fiber Wi-Fi"
On-screen text (9–14s): "3 mins to Phnom Penh’s best coffee & coworking"

Caption:
Your Phnom Penh work week hits different when you sleep in a quiet alley and walk 3 minutes for morning espresso.

Save this for your Cambodia trip: Vanny’s Peaceful Guesthouse in Toul Tom Pong offers weekly & monthly direct nomad rates (plus airport tuk-tuk pickup).

Link in bio to check dates directly or message us on Telegram.

#PhnomPenh #ToulTomPong #DigitalNomadCambodia #RemoteWorkAsia #CambodiaTravel`,
  },
  {
    id: 'scr-7',
    dayRef: 6,
    channel: 'Telegram',
    title: 'Pre-Arrival Tuk-Tuk & Welcome Message',
    hookAngle: 'Turns arrival stress into instant 5-star hospitality',
    visualInstruction: 'Send 24 hours before arrival once guest completes Check-In Form.',
    settingOrButton: 'Telegram Concierge -> Send 24h before Check-In',
    bodyText: `Welcome to Phnom Penh soon, [Guest Name]!

Your room at Vanny’s Peaceful Guesthouse is confirmed for [Check-In Date]. Here is everything for a smooth arrival:

1) Digital Check-In: If you haven’t filled it yet, complete our 1-minute form here so your key & Wi-Fi details are ready: [CHECK-IN FORM LINK]
2) Airport Pickup: Your driver [Driver Name] (Tuk-Tuk plate: [XXXX]) will meet you outside Arrivals holding a sign with "VANNY’S - [Guest Name]". Fixed rate: $[XX] paid directly or via ABA.
3) Google Maps Pin for Drivers: [GOOGLE MAPS LINK]

Message us on Telegram as soon as you clear customs!`,
  },
  {
    id: 'scr-8',
    dayRef: 7,
    channel: 'OTA Follow-up',
    title: 'Booking.com / Agoda Checkout -> Direct Rebooking & Review',
    hookAngle: 'Capture Google Maps reviews + convert future stays/extensions direct',
    visualInstruction: 'Send via Telegram/WhatsApp 2 hours after guest checks out.',
    settingOrButton: 'Telegram / WhatsApp post-checkout message + GBP Review Link',
    bodyText: `Thank you for staying with us at Vanny’s Peaceful Guesthouse, [Guest Name]! It was great hosting your work week in Toul Tom Pong.

Two quick favors before your next flight:
1) If you enjoyed the quiet room and Wi-Fi, a quick 30-second review on Google Maps helps independent guesthouses like ours immensely: [GBP REVIEW LINK]
2) Whenever you or a friend return to Phnom Penh, message us directly here on Telegram for 12% off Booking.com/Agoda rates + complimentary late checkout when available.

Safe travels! — Vanny & Team`,
  },
];

export const SHOT_GUIDE_ITEMS: ShotGuideItem[] = [
  {
    id: 'shot-desk',
    title: '01. Sunlit Teak Work Desk & Bed Depth',
    shotTiming: '07:30 – 09:00 AM · Natural window light, curtains half-sheer',
    framingNote:
      'Shoot at 45-degree angle so both the laptop-ready desk lamp AND crisp white bed appear in frame—proves "sleep + deep work" in one image.',
    captionHook: '"Morning light at your Toul Tom Pong desk—before the 9 AM standup."',
    imageKey: 'desk',
  },
  {
    id: 'shot-courtyard',
    title: '02. Shaded Tropical Courtyard Sanctuary',
    shotTiming: '04:00 – 05:15 PM · Golden hour shade',
    framingNote:
      'Step back with 1x lens showing greenery, outdoor wooden work table, and calm walkway—proves quiet refuge away from Phnom Penh street noise.',
    captionHook: '"Afternoon deep-work session in our shaded courtyard—two blocks from Russian Market."',
    imageKey: 'courtyard',
  },
  {
    id: 'shot-cafe',
    title: '03. Walkable TTP Specialty Coffee Lifestyle',
    shotTiming: '08:30 AM · Window seat at partner café',
    framingNote:
      'Capture iced Khmer coffee, notebook, and laptop by an open wooden window overlooking Toul Tom Pong—sells the walkable remote-worker lifestyle.',
    captionHook: '"3-minute morning walk from your room to TTP’s best specialty coffee."',
    imageKey: 'cafe',
  },
];
