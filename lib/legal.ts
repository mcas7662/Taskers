// taskers/lib/legal.ts
// Text for /terms and /privacy. This is a plain-language starting point written for how Taskers works today.
// Have it checked by a lawyer in Bangladesh before a public launch, and update LEGAL_UPDATED when you change it.

export const LEGAL_UPDATED = '2026-11-18'

export type LegalSection = { h: string; p: string[] }
export type LegalDoc = { title: string; intro: string; sections: LegalSection[] }

const contact = (lang: 'bn' | 'en') => {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  if (email) return email
  return lang === 'bn' ? 'অ্যাপের ভেতরের "রিপোর্ট" বোতাম' : 'the "Report" button inside the app'
}

export function termsDoc(lang: 'bn' | 'en'): LegalDoc {
  if (lang === 'bn') {
    return {
      title: 'ব্যবহারের শর্তাবলি',
      intro: 'Taskers ব্যবহার করলে আপনি নিচের শর্তগুলো মেনে নিচ্ছেন। সহজ ভাষায় লেখা, মন দিয়ে পড়ুন।',
      sections: [
        { h: '১. Taskers কী', p: [
          'Taskers এমন একটি প্ল্যাটফর্ম যেখানে কেউ ছোট কাজ পোস্ট করেন (পোস্টকারী) আর কাছের কেউ সেটি করে দেন (Tasker)।',
          'Taskers নিজে কোনো কাজ করে না, কাজের নিশ্চয়তা দেয় না এবং দুজনের মধ্যে টাকা লেনদেনের অংশ নয়।',
        ] },
        { h: '২. কারা ব্যবহার করতে পারবেন', p: [
          'বয়স কমপক্ষে ১৮ বছর হতে হবে। সঠিক নাম ও জন্ম তারিখ দিতে হবে।',
          'একজন মানুষ একটিই অ্যাকাউন্ট রাখবেন এবং পাসওয়ার্ড কাউকে দেবেন না।',
        ] },
        { h: '৩. যে কাজ পোস্ট করা যাবে না', p: [
          'বেআইনি কাজ; অন্য কারো পরিচয়ে কিছু করা; পরীক্ষা বা ভোটে অন্যের হয়ে অংশ নেওয়া; নেশাজাত দ্রব্য, অস্ত্র বা চুরি করা জিনিস আনা-নেওয়া; কাউকে হয়রানি বা অনুসরণ করা।',
          'যে অফিস বা প্রতিষ্ঠানে অন্য কেউ কাজটি করতে পারে না, সেখানে কাজ দেওয়ার আগে পোস্টকারী নিজে নিশ্চিত হবেন যে অনুমতি আছে।',
        ] },
        { h: '৪. টাকা লেনদেন', p: [
          'দাম, খরচ ও সময় দুজনে চ্যাটে ঠিক করেন। পোস্টকারী আগে টাকা পাঠান (বিকাশ, নগদ, রকেট, ব্যাংক ইত্যাদি) এবং প্রমাণের ছবি দেন।',
          'টাকা সরাসরি দুজনের মধ্যে যায়; Taskers টাকা রাখে না, ফেরত দিতে পারে না এবং লেনদেনের দায় নেয় না। চ্যাটের বাইরে লেনদেন না করাই নিরাপদ।',
        ] },
        { h: '৫. আচরণ ও রিপোর্ট', p: [
          'সবার সাথে ভদ্র ব্যবহার করুন। প্রতারণা, ভুয়া পেমেন্ট, না আসা বা গালাগালি হলে চ্যাট থেকে রিপোর্ট করুন।',
          'নিয়ম ভাঙলে Taskers সতর্ক করতে, অ্যাকাউন্ট বন্ধ করতে এবং চলমান কাজ বাতিল করতে পারে। গুরুতর অপরাধ হলে আইনশৃঙ্খলা বাহিনীকে তথ্য দেওয়া হতে পারে।',
        ] },
        { h: '৬. দায়', p: [
          'কাজের মান, দেরি, ক্ষতি বা দুজনের মধ্যে বিরোধের জন্য প্রাথমিক দায় সংশ্লিষ্ট ব্যবহারকারীদের। আইন যতটুকু অনুমতি দেয়, Taskers তার বেশি দায় নেয় না।',
          'সেবা মাঝে মাঝে বন্ধ বা পরিবর্তন হতে পারে।',
        ] },
        { h: '৭. পরিবর্তন ও যোগাযোগ', p: [
          'শর্ত বদলালে এই পাতায় নতুন তারিখসহ জানানো হবে। বদলের পরও ব্যবহার চালালে নতুন শর্ত মেনে নিয়েছেন ধরা হবে।',
          `প্রশ্ন থাকলে যোগাযোগ: ${contact('bn')}। এই শর্তাবলি বাংলাদেশের আইন অনুযায়ী পড়া হবে।`,
        ] },
      ],
    }
  }
  return {
    title: 'Terms of Use',
    intro: 'By using Taskers you agree to these terms. They are written in plain language; please read them.',
    sections: [
      { h: '1. What Taskers is', p: [
        'Taskers is a platform where one person posts a small errand (the poster) and someone nearby does it (the Tasker).',
        'Taskers does not do the work, does not guarantee it, and is not part of the payment between the two people.',
      ] },
      { h: '2. Who can use it', p: [
        'You must be at least 18 and give your real name and date of birth.',
        'One person, one account. Do not share your password.',
      ] },
      { h: '3. Tasks that are not allowed', p: [
        'Anything illegal; acting under someone else\'s identity; sitting exams or voting for someone; carrying drugs, weapons or stolen goods; harassing or following anyone.',
        'If an office or institution may not accept someone else doing the task, the poster must make sure it is allowed before posting.',
      ] },
      { h: '4. Payments', p: [
        'The two people agree the fee, expenses and time in the chat. The poster pays in advance (bKash, Nagad, Rocket, bank, etc.) and uploads proof.',
        'Money goes directly between the two people. Taskers does not hold, refund or guarantee payments. Keeping the deal inside the chat is safer.',
      ] },
      { h: '5. Behaviour and reports', p: [
        'Be respectful. Report scams, fake payments, no-shows or abuse from the chat.',
        'If rules are broken, Taskers may warn, suspend the account and cancel ongoing deals. Serious crimes may be reported to the authorities.',
      ] },
      { h: '6. Liability', p: [
        'The users involved are first responsible for the quality of the work, delays, damage and disputes between them. Taskers is not liable beyond what the law requires.',
        'The service may sometimes be unavailable or change.',
      ] },
      { h: '7. Changes and contact', p: [
        'If these terms change, this page will show the new date. Using Taskers after a change means you accept the new terms.',
        `Questions: ${contact('en')}. These terms are governed by the laws of Bangladesh.`,
      ] },
    ],
  }
}

export function privacyDoc(lang: 'bn' | 'en'): LegalDoc {
  if (lang === 'bn') {
    return {
      title: 'গোপনীয়তা নীতি',
      intro: 'আমরা কী তথ্য নিই, কেন নিই এবং কে দেখতে পায়।',
      sections: [
        { h: 'যে তথ্য নেওয়া হয়', p: [
          'অ্যাকাউন্ট: নাম, ইমেইল, পাসওয়ার্ড (এনক্রিপ্ট করা, আমরা দেখতে পাই না) ও জন্ম তারিখ।',
          'প্রোফাইল: বিভাগ, জেলা, উপজেলা; ইচ্ছা হলে পোস্ট অফিস ও গ্রাম। সেভ করা জায়গা (সর্বোচ্চ ৩টি) ও তার স্থানাঙ্ক।',
          'কাজ: কাজের বিবরণ, কাজের জায়গা, দাম; চ্যাটের মেসেজ; পেমেন্ট নম্বর ও লেনদেন আইডি; পেমেন্ট ও কাজ শেষের ছবি; রিভিউ ও রিপোর্ট।',
          'লগ ইন ধরে রাখা ও ভাষা মনে রাখার জন্য কুকি ব্যবহার হয়। বিজ্ঞাপনের কুকি নেই।',
        ] },
        { h: 'কে কী দেখতে পায়', p: [
          'সবাই (লগ ইন করা): আপনার নাম, জেলা/উপজেলা, রেটিং, কতগুলো কাজ করেছেন। জন্ম তারিখ, ইমেইল, পোস্ট অফিস ও গ্রাম দেখানো হয় না।',
          'খোলা কাজের বিবরণ ও জায়গা লগ ইন করা সবাই দেখতে পান।',
          'সেভ করা জায়গার সঠিক অবস্থান শুধু আপনি দেখেন। পোস্টকারী শুধু আনুমানিক দূরত্ব (যেমন ৫০০ মিটার, ১ কিমি) দেখেন।',
          'চ্যাট, পেমেন্ট নম্বর ও ছবি শুধু ওই কাজের দুজন দেখেন। রিপোর্ট হলে Taskers-এর অ্যাডমিন সেই চ্যাট দেখতে পারেন।',
        ] },
        { h: 'কেন ব্যবহার করা হয়', p: [
          '১৮+ যাচাই, কাছের মানুষকে কাজের খবর দেওয়া, দুজনকে যুক্ত করা, প্রতারণা ঠেকানো এবং রিপোর্ট দেখা। তথ্য বিক্রি করা হয় না।',
        ] },
        { h: 'অন্য যে সেবা ব্যবহার হয়', p: [
          'Supabase (ডাটাবেস, লগ ইন, ছবি রাখা), Google Maps (ম্যাপ ও স্থান) এবং OpenStreetMap Nominatim (ঠিকানা থেকে স্থান খোঁজা)। এই সেবাগুলো নিজেদের নীতি অনুযায়ী তথ্য প্রক্রিয়া করে।',
        ] },
        { h: 'কতদিন রাখা হয় ও আপনার অধিকার', p: [
          'অ্যাকাউন্ট থাকা পর্যন্ত তথ্য রাখা হয়। বিরোধ বা প্রতারণার তদন্তের জন্য কাজ, চ্যাট ও রিপোর্ট কিছুদিন বেশি রাখা হতে পারে।',
          'প্রোফাইল থেকে নিজের তথ্য বদলাতে পারবেন (জন্ম তারিখ একবার দেওয়ার পর বদলানো যায় না)। অ্যাকাউন্ট ও তথ্য মুছতে চাইলে যোগাযোগ করুন।',
          `যোগাযোগ: ${contact('bn')}।`,
        ] },
      ],
    }
  }
  return {
    title: 'Privacy Policy',
    intro: 'What we collect, why, and who can see it.',
    sections: [
      { h: 'What we collect', p: [
        'Account: name, email, password (encrypted; we cannot see it) and date of birth.',
        'Profile: division, district, upazila; optionally post office and village. Saved places (up to 3) with their coordinates.',
        'Tasks: task details, task location and price; chat messages; payment number and transaction ID; payment and completion photos; reviews and reports.',
        'Cookies keep you logged in and remember your language. There are no advertising cookies.',
      ] },
      { h: 'Who can see what', p: [
        'Everyone logged in: your name, district/upazila, rating and number of tasks done. Your date of birth, email, post office and village are not shown.',
        'Details and location of open tasks are visible to everyone logged in.',
        'Only you see the exact location of your saved places. Posters only see a rough distance (e.g. 500 m, 1 km).',
        'Chats, payment numbers and photos are seen only by the two people in that deal. If it is reported, a Taskers admin can read that chat.',
      ] },
      { h: 'Why we use it', p: [
        'To check you are 18+, alert people nearby about tasks, connect the two sides, prevent fraud and handle reports. We do not sell your data.',
      ] },
      { h: 'Services we use', p: [
        'Supabase (database, login, photo storage), Google Maps (maps and places) and OpenStreetMap Nominatim (finding a place from an address). They process data under their own policies.',
      ] },
      { h: 'How long we keep it, and your rights', p: [
        'We keep data while your account exists. Tasks, chats and reports may be kept a little longer to investigate disputes or fraud.',
        'You can change your details from your profile (date of birth cannot be changed once set). To delete your account and data, contact us.',
        `Contact: ${contact('en')}.`,
      ] },
    ],
  }
}
