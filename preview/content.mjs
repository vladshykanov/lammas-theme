// Everything a merchant would keep in the Shopify admin: pages, the journal,
// policies. Written out in full rather than stubbed, because a page with
// placeholder text hides exactly the layout problems the preview exists to
// find — a two-line paragraph never wraps badly.

export const PAGES = {
  'about': {
    title: 'About',
    lede: 'Two of us, one field, and a van that smells permanently of sweet peas.',
    blocks: [
      { heading: 'Where this is', body: [
        'Lammas is four acres on the north side of the Howe of Fife, between Cupar and Falkland. It was a potato field until 2019 and the soil still tells you so — heavy, cold in spring, and generous once it warms.',
        'We grow outdoors and in two polytunnels. There is no glasshouse, no heating and no lighting, which is why there is nothing to sell between November and March.',
      ] },
      { heading: 'Why cut flowers', body: [
        'Most flowers sold in Britain have flown. They are bred to survive the journey, which means bred for stem strength and shelf life rather than for scent. A supermarket sweet pea does not smell of anything, and that is not an accident.',
        'We grow the varieties that cannot travel. That is the whole proposition, and it is also why our courier list is shorter than our field list.',
      ] },
      { heading: 'The name', body: [
        'Lammas is the first of August, the old harvest festival, and the week the field is usually at its loudest. Week 32, more or less.',
      ] },
    ],
  },

  'how-we-grow': {
    title: 'How we grow',
    lede: 'Small field. Two tunnels. No shortcuts.',
    blocks: [
      { heading: 'No chemicals on the flowers', body: [
        'We do not spray. Aphids get washed off with water, and if a crop fails it fails — this year the ranunculus did.',
        'The beds are no-dig, mulched with compost from the farm up the road. Weeding is done by hand, which is most of what we do between April and June.',
      ] },
      { heading: 'Cut cold, twice a week', body: [
        'Everything is cut early on Tuesday and Friday, before the sun is on the field, and goes straight into water in the shade. Flowers cut warm never recover.',
        'They are conditioned overnight in the grading shed and wrapped the following morning. Nothing sits in a bucket for a week waiting for an order.',
      ] },
      { heading: 'What we do not do', body: [
        'No floral foam, ever. It is single-use plastic and it does not break down.',
        'No dyed or bleached stems, no glitter, and no imported filler to bulk out a bunch. If a week is thin, the bunch is smaller and cheaper.',
      ] },
    ],
  },

  'delivery': {
    title: 'Delivery',
    lede: 'Three ways to get flowers, and a real reason why they are not equivalent.',
    blocks: [
      { heading: 'Our van — Fife and Edinburgh, £6.00', body: [
        'We drive Tuesdays and Fridays. Order by 18:00 the day before the cut and it goes on the next run.',
        'The van carries everything we grow, including the varieties that cannot be posted. If you are inside the van area, this is always the better option.',
      ] },
      { heading: 'UK courier — £12.00, selected flowers only', body: [
        'Next-day, boxed dry, and limited to the varieties that survive a night in a box. Dahlias and sweet peas do not, so a bouquet containing them cannot be sent this way.',
        'The Jar is built each week specifically to be postable. If you are outside Fife and Edinburgh, that is the one to order.',
      ] },
      { heading: 'Farm pickup — free, Wednesday and Saturday', body: [
        'Nine until one at the grading shed, Balmalcolm. Bring a bucket if you are taking a lot.',
      ] },
      { heading: 'Cut-offs', body: [
        'Orders close at 18:00 on the working day before each cut. A cart left open past the cut-off will ask you to pick a new date — the flowers genuinely are not cut yet.',
      ] },
    ],
  },

  'care': {
    title: 'Care & vase life',
    lede: 'Field flowers last well if you do three things and badly if you do not.',
    blocks: [
      { heading: 'On arrival', body: [
        'Cut two centimetres off every stem at an angle, with a knife or sharp scissors. Blunt secateurs crush the stem and it stops drinking.',
        'Stand them in cold water within the hour. Use the sachet if one came with them; it is sugar and a mild biocide, and it works.',
      ] },
      { heading: 'Every other day', body: [
        'Change the water completely and re-cut a centimetre. Cloudy water is bacteria, and bacteria block the stem.',
        'Keep them out of direct sun, away from radiators, and away from the fruit bowl — ripening fruit gives off ethylene and ages flowers fast.',
      ] },
      { heading: 'What to expect', body: [
        'Five to eight days for most of what we grow. Sweet peas give you two or three and are worth it anyway. Amaranth and physalis will dry standing in the vase if you let the water run out on purpose.',
      ] },
    ],
  },

  'varieties': { title: 'All varieties', lede: 'Everything we grow, what it does, and whether it can be posted.', special: 'varieties' },
  'archive':   { title: 'Season archive', lede: 'What flowered each week, and what it cost.', special: 'archive' },
  'contact':   { title: 'Contact', lede: 'The shed is not always staffed, so email is faster than the phone.', special: 'contact' },
  'faqs':      { title: 'FAQs', lede: 'The questions that actually arrive.', special: 'faq' },

  'flower-share': {
    title: 'Flower Share',
    lede: 'A bouquet every week of the season, from £22.00 a week.',
    blocks: [
      { heading: 'How it works', body: [
        'You take a share of whatever the field produces that week. We cut it, wrap it and deliver it on your usual day. There is no choosing — that is the point, and it is why it costs less than buying the same bouquet outright.',
        'Three sizes: Small at £22, Medium at £34, Large at £52 per week. Minimum four weeks, then weekly until you stop.',
      ] },
      { heading: 'Pausing', body: [
        'Pause any week from your account before the Monday cut-off, as many times as you like. Holidays are the main reason people ask, and we would rather pause than deliver to an empty house.',
      ] },
      { heading: 'The honest part', body: [
        'In a bad week your share is smaller. In August it will be embarrassing how much you get. Over a season it averages out in your favour, but week to week it does not, and if that would annoy you the Share is not for you.',
      ] },
    ],
  },

  'weddings': {
    title: 'Weddings',
    lede: 'Seasonal, local, and booked a long way ahead.',
    blocks: [
      { heading: 'What we take on', body: [
        'Six weddings a season, between late May and late September. We do not take bookings outside that, because we would have to buy in flowers from a wholesaler and then it is not our field.',
        'Buckets of loose stems from £180 for people arranging it themselves. Full flowering from £900.',
      ] },
      { heading: 'What we cannot promise', body: [
        'A specific flower on a specific day. We can promise a palette and a feel — dusky and rust in September, blue and white in June — but a named variety twelve months out is a promise nobody outdoors can keep.',
      ] },
      { heading: 'Enquiring', body: [
        'Email the date, the venue and roughly what you have in mind. We reply within a week, and we will say no if the date is already taken rather than stretch.',
      ] },
    ],
  },

  'gift-cards': {
    title: 'Gift cards',
    lede: 'For people who would rather choose their own week.',
    blocks: [
      { heading: 'How they work', body: [
        'Any amount from £25. Sent by email with a code, valid for two years, and usable against anything in the shop including the Flower Share.',
        'They do not expire at the end of a season, which matters here — a card bought in October cannot be spent until March.',
      ] },
    ],
  },

  'returns': {
    title: 'Returns',
    lede: 'Flowers cannot be returned, so this is about when we refund instead.',
    blocks: [
      { heading: 'If something arrives badly', body: [
        'Send a photograph within 24 hours of delivery and we will refund or resend, your choice. No need to send anything back.',
        'This happens most often with courier orders in hot weather, which is why the courier list is short.',
      ] },
      { heading: 'Cancelling', body: [
        'Cancel free of charge any time before the cut-off for your delivery date. After the cut-off the flowers have been cut for you specifically and we cannot refund them.',
      ] },
      { heading: 'Non-flower items', body: [
        'Gift cards and Listening Room bookings can be cancelled up to 48 hours before, for a full refund.',
      ] },
    ],
  },

  'sustainability': {
    title: 'Sustainability',
    lede: 'What we actually do, and what we have not solved.',
    blocks: [
      { heading: 'Done', body: [
        'No floral foam. No imported stems. Compostable wrapping — paper, jute string, no cellophane. Buckets and boxes come back on the van and are reused until they fall apart.',
        'The tunnels are heated by nothing at all, so the season is short and the carbon cost of a Lammas bouquet is mostly the van.',
      ] },
      { heading: 'Not solved', body: [
        'Courier deliveries are boxed in cardboard with a plastic-free liner, but they are still a next-day van journey across the country for one bouquet. It is the least good thing we do, and it is a third of our orders.',
        'Peat-free compost costs us roughly a third more and performs worse in the propagation house. We use it anyway, but we have not made it work as well as peat did.',
      ] },
    ],
  },
};

export const POLICIES = {
  'terms-of-service': {
    title: 'Terms & conditions',
    blocks: [
      { heading: 'Orders', body: [
        'A contract is formed when we send the order confirmation. Prices include VAT where applicable; Lammas is not currently VAT registered.',
        'We may cancel and refund an order if the crop fails, which we will tell you about as soon as we know rather than substituting without asking.',
      ] },
      { heading: 'Delivery', body: [
        'Delivery dates are estimates and depend on the cut. Courier deliveries are subject to the variety restrictions set out on the delivery page.',
      ] },
      { heading: 'Liability', body: [
        'Nothing here limits liability for death, personal injury or fraud. Otherwise our liability is limited to the value of the order.',
      ] },
    ],
  },
  'privacy-policy': {
    title: 'Privacy policy',
    blocks: [
      { heading: 'What we keep', body: [
        'Name, delivery address, email and order history. Payment details are handled by Shopify Payments and never reach us.',
        'Newsletter subscribers are kept until they unsubscribe. We do not sell or share the list.',
      ] },
      { heading: 'Your rights', body: [
        'Ask for a copy of what we hold, or ask us to delete it, by emailing the address on the contact page. We will do it within thirty days.',
      ] },
    ],
  },
  'shipping-policy': {
    title: 'Shipping policy',
    blocks: [
      { heading: 'Where we deliver', body: [
        'Our own van covers Fife and Edinburgh. UK courier covers mainland Britain, excluding the Highlands and islands where next-day is not reliable enough for cut flowers.',
        'We do not ship outside the UK.',
      ] },
      { heading: 'Restrictions', body: [
        'Some varieties cannot travel by courier. The restriction is shown on every product page and enforced in the cart, so a courier order containing them cannot be placed.',
      ] },
    ],
  },
};

export const FAQS = [
  { q: 'Can I choose which flowers are in my bouquet?',
    a: 'No. You choose a size and we cut what is best that week. Choosing individual varieties is what makes a florist expensive, and it is also how flowers end up flown in.' },
  { q: 'Why can I not have dahlias posted to me?',
    a: 'Dahlia heads bruise where they touch the box and arrive marked. We tried it for a season and refunded roughly one in four, so we stopped offering it.' },
  { q: 'What happens if I miss the cut-off?',
    a: 'The date closes and the site asks you to pick the next one. Nothing is lost — the cart keeps everything else.' },
  { q: 'Do you deliver on a specific date, like a birthday?',
    a: 'Only if it falls on a delivery day. We cut Tuesday and Friday, so those are the days flowers can leave.' },
  { q: 'Is the jar included with The Jar?',
    a: 'No, and it says so on the product. It is photographed in a jam jar because that is what it is sized for.' },
  { q: 'Can I visit the field?',
    a: 'On pickup days, yes, and you are welcome to walk the beds. Please do not bring dogs into the tunnels.' },
];

export const ARTICLES = [
  {
    handle: 'why-we-stopped-posting-dahlias',
    title: 'Why we stopped posting dahlias',
    date: '2026-07-28',
    excerpt: 'A season of refunds, and what we learned about which flowers can survive a box.',
    body: [
      'We spent the whole of 2024 trying to make dahlias travel. They are the flower people ask for most between August and the first frost, and every year we had to tell half the country they could not have them.',
      'The problem is not the journey time. Next-day is fine. The problem is that a dahlia head is a hundred soft petals packed tightly together, and any point where it touches the box, or another stem, or itself, browns within a day. You cannot pack around it. We tried tissue collars, individual sleeves, and suspending the heads in a frame so nothing touched. The frame worked and cost more than the flowers.',
      'By September we were refunding about one order in four. Not because they arrived dead — they arrived alive and marked, which is worse, because the customer has to decide whether to complain about something that is obviously still a flower.',
      'So the courier list is now short and honest. Scabiosa, amaranth, cosmos, physalis and the grasses travel. Dahlias and sweet peas do not, and the site will not let you order them that way.',
    ],
  },
  {
    handle: 'the-week-the-sweet-peas-came',
    title: 'The week the sweet peas came',
    date: '2026-07-14',
    excerpt: 'Three weeks of scent, and then nothing until next June.',
    body: [
      'Sweet peas are the reason a lot of people find us. They are also the least commercial thing in the field: two days in a vase, no shelf life, and they have to be picked every single day or the plant stops flowering.',
      'Matucana is the old Sicilian variety, small-flowered and bicoloured, and it smells like nothing else. The modern show varieties have larger flowers on longer stems and considerably less scent, which tells you what breeding optimises for.',
      'We pick them at six in the morning, into water, and they go out the same week. There is no holding them back.',
    ],
  },
  {
    handle: 'what-happens-in-november',
    title: 'What happens in November',
    date: '2026-06-02',
    excerpt: 'The shop closes, and here is what the four months are actually for.',
    body: [
      'People assume the winter is time off. It is the opposite: it is when everything that made the season possible gets done.',
      'The dahlias are lifted, labelled and stored somewhere frost-free. Beds are cleared and mulched. Seed is ordered in October for a March sowing, and the propagation house is running by February.',
      'We keep the shop closed rather than buying stems in to fill it. A Lammas box in December would have to be Dutch, and then the whole argument falls apart.',
    ],
  },
];
