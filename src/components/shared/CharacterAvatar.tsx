import React from 'react';

interface CharacterAvatarProps {
  characterId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBadge?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterId,
  size = 'md',
  className = '',
  showBadge = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  }[size];

  // Specific SVGs for Pi & Kem universe
  if (characterId === 'char_pi') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-0.5 ${sizeClasses} ${className}`}
        title="Pi (Nancy) - Older Sister"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-[14px] bg-amber-50"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background aura */}
          <rect width="100" height="100" fill="#fffbeb" />
          <circle cx="50" cy="50" r="42" fill="#fef3c7" />

          {/* Twin Pigtails with Yellow Star Clips */}
          <path d="M22 34 C12 28, 10 46, 20 54 C24 50, 25 38, 22 34 Z" fill="#1e1b4b" />
          <path d="M78 34 C88 28, 90 46, 80 54 C76 50, 75 38, 78 34 Z" fill="#1e1b4b" />
          {/* Star hair clips */}
          <polygon points="23,34 25,38 29,38 26,41 27,45 23,42 19,45 20,41 17,38 21,38" fill="#f59e0b" />
          <polygon points="77,34 79,38 83,38 80,41 81,45 77,42 73,45 74,41 71,38 75,38" fill="#f59e0b" />

          {/* Head & Neck */}
          <rect x="44" y="68" width="12" height="10" rx="3" fill="#fbcfe8" />
          <ellipse cx="50" cy="52" rx="26" ry="24" fill="#fed7aa" />

          {/* Cheeks Blush */}
          <ellipse cx="32" cy="56" rx="6" ry="3.5" fill="#f43f5e" opacity="0.3" />
          <ellipse cx="68" cy="56" rx="6" ry="3.5" fill="#f43f5e" opacity="0.3" />

          {/* Big Sparkling Eyes */}
          <ellipse cx="36" cy="48" rx="6" ry="7" fill="#0f172a" />
          <circle cx="34" cy="46" r="2.2" fill="#ffffff" />
          <circle cx="38" cy="50" r="1.1" fill="#ffffff" />

          <ellipse cx="64" cy="48" rx="6" ry="7" fill="#0f172a" />
          <circle cx="62" cy="46" r="2.2" fill="#ffffff" />
          <circle cx="66" cy="50" r="1.1" fill="#ffffff" />

          {/* Cute Eyebrows */}
          <path d="M31 39 Q36 36 42 39" stroke="#1e1b4b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M58 39 Q64 36 69 39" stroke="#1e1b4b" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Button Nose & Happy Giggling Smile */}
          <circle cx="50" cy="54" r="1.5" fill="#ea580c" opacity="0.6" />
          <path d="M43 59 Q50 67 57 59" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" fill="#be123c" />
          <path d="M46 60 Q50 62 54 60" fill="#ffffff" />

          {/* Fringe Hair */}
          <path
            d="M24 44 C26 28, 40 22, 50 22 C60 22, 74 28, 76 44 C72 36, 64 32, 58 33 C52 34, 48 30, 42 33 C36 34, 28 38, 24 44 Z"
            fill="#1e1b4b"
          />

          {/* Dress Collar & Rainbow emblem */}
          <path d="M32 76 C36 70, 64 70, 68 76 L74 100 L26 100 Z" fill="#fbbf24" />
          <path d="M44 76 Q50 82 56 76" stroke="#f97316" strokeWidth="2" fill="#fed7aa" />
          <circle cx="50" cy="88" r="4.5" fill="#f43f5e" />
        </svg>
      </div>
    );
  }

  if (characterId === 'char_kem') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-0.5 ${sizeClasses} ${className}`}
        title="Kem (Leo) - Younger Brother"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-[14px] bg-emerald-50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" fill="#ecfdf5" />
          <circle cx="50" cy="50" r="42" fill="#d1fae5" />

          {/* Mischievous Cowlick tuft */}
          <path d="M50 24 C53 14, 62 16, 56 26 Z" fill="#1e293b" />

          {/* Big Chubby Dumpling Cheeks Head */}
          <rect x="44" y="70" width="12" height="9" fill="#fed7aa" />
          <ellipse cx="50" cy="54" rx="27" ry="25" fill="#ffedd5" />

          {/* Fluffy Hair */}
          <path
            d="M23 48 C24 30, 38 23, 50 23 C62 23, 76 30, 77 48 C72 38, 62 34, 50 34 C38 34, 28 38, 23 48 Z"
            fill="#1e293b"
          />

          {/* Rosy toddler cheeks */}
          <ellipse cx="30" cy="58" rx="6.5" ry="4" fill="#f43f5e" opacity="0.35" />
          <ellipse cx="70" cy="58" rx="6.5" ry="4" fill="#f43f5e" opacity="0.35" />

          {/* Innocent Giant Puppy Eyes */}
          <ellipse cx="36" cy="50" rx="6.5" ry="7.5" fill="#0f172a" />
          <circle cx="34" cy="48" r="2.4" fill="#ffffff" />
          <circle cx="38.5" cy="52.5" r="1.2" fill="#ffffff" />

          <ellipse cx="64" cy="50" rx="6.5" ry="7.5" fill="#0f172a" />
          <circle cx="62" cy="48" r="2.4" fill="#ffffff" />
          <circle cx="66.5" cy="52.5" r="1.2" fill="#ffffff" />

          {/* Tiny Eyebrows */}
          <path d="M32 41 Q37 38 42 41" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M58 41 Q63 38 68 41" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Button Nose & Mischievous Tooth Grin */}
          <circle cx="50" cy="56" r="1.5" fill="#f97316" opacity="0.6" />
          <path d="M44 62 Q50 69 56 62" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" fill="#ffffff" />

          {/* Mint Green Dungarees */}
          <path d="M28 78 C34 72, 66 72, 72 78 L78 100 L22 100 Z" fill="#10b981" />
          {/* Dungaree Straps */}
          <rect x="33" y="74" width="7" height="26" fill="#059669" rx="1.5" />
          <rect x="60" y="74" width="7" height="26" fill="#059669" rx="1.5" />
          <circle cx="36.5" cy="80" r="1.8" fill="#facc15" />
          <circle cx="63.5" cy="80" r="1.8" fill="#facc15" />
          {/* Pale yellow under-shirt */}
          <path d="M42 75 Q50 78 58 75" stroke="#fde047" strokeWidth="3" fill="none" />
        </svg>
      </div>
    );
  }

  if (characterId === 'char_ethan') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-blue-500 via-indigo-600 to-slate-800 p-0.5 ${sizeClasses} ${className}`}
        title="Ethan (Ba Trường) - Father"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-[14px] bg-blue-50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" fill="#eff6ff" />
          <circle cx="50" cy="50" r="42" fill="#dbeafe" />

          {/* Neat Dark Brown Hair */}
          <path
            d="M24 45 C23 25, 38 18, 50 18 C64 18, 77 24, 76 45 C70 34, 60 27, 48 27 C36 27, 28 33, 24 45 Z"
            fill="#3e2723"
          />

          {/* Neck & Athletic Head */}
          <rect x="42" y="66" width="16" height="12" fill="#fcd34d" rx="2" />
          <path
            d="M28 42 C28 32, 72 32, 72 42 C72 58, 64 68, 50 68 C36 68, 28 58, 28 42 Z"
            fill="#fed7aa"
          />

          {/* Hair Front Side Parting */}
          <path d="M26 38 C32 26, 52 24, 62 26 C68 28, 73 34, 74 40 C70 33, 56 30, 42 32 C32 34, 28 36, 26 38 Z" fill="#4e342e" />

          {/* Friendly Almond Eyes & Laugh Lines */}
          <ellipse cx="38" cy="46" rx="4.5" ry="4" fill="#1e293b" />
          <circle cx="36.5" cy="45" r="1.5" fill="#ffffff" />
          <ellipse cx="62" cy="46" rx="4.5" ry="4" fill="#1e293b" />
          <circle cx="60.5" cy="45" r="1.5" fill="#ffffff" />

          {/* Eyebrows */}
          <path d="M33 39 Q39 36 45 40" stroke="#271c19" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M55 40 Q61 36 67 39" stroke="#271c19" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Straight nose & Gentle Fatherly smile */}
          <path d="M50 45 L48 53 L52 53" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M42 58 Q50 64 58 58" stroke="#9a3412" strokeWidth="2.2" strokeLinecap="round" fill="#ffffff" />

          {/* Navy Polo Shirt with Collar */}
          <path d="M22 76 C28 70, 72 70, 78 76 L85 100 L15 100 Z" fill="#1e3a8a" />
          {/* Polo Collar */}
          <polygon points="50,82 40,73 48,72 50,78" fill="#38bdf8" />
          <polygon points="50,82 60,73 52,72 50,78" fill="#38bdf8" />
          <line x1="50" y1="78" x2="50" y2="92" stroke="#3b82f6" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (characterId === 'char_emma') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-rose-400 via-pink-500 to-purple-700 p-0.5 ${sizeClasses} ${className}`}
        title="Emma (Mẹ Vân) - Mother"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-[14px] bg-rose-50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" fill="#fff1f2" />
          <circle cx="50" cy="50" r="42" fill="#ffe4e6" />

          {/* Wavy Chestnut Hair Backing */}
          <path
            d="M20 44 C18 68, 22 78, 26 84 C28 72, 28 55, 26 44 Z"
            fill="#5c3826"
          />
          <path
            d="M80 44 C82 68, 78 78, 74 84 C72 72, 72 55, 74 44 Z"
            fill="#5c3826"
          />

          {/* Neck & Graceful Face */}
          <rect x="44" y="66" width="12" height="12" fill="#fed7aa" rx="3" />
          {/* Delicate Gold Pendant */}
          <path d="M46 72 Q50 78 54 72" stroke="#eab308" strokeWidth="1.5" fill="none" />
          <circle cx="50" cy="78" r="1.5" fill="#facc15" />

          <ellipse cx="50" cy="48" rx="23" ry="22" fill="#ffedd5" />

          {/* Hair Front Styling */}
          <path
            d="M26 42 C28 24, 42 19, 50 19 C62 19, 74 24, 75 42 C70 32, 60 28, 50 30 C38 28, 30 34, 26 42 Z"
            fill="#6d432b"
          />

          {/* Pearl Stud Earrings */}
          <circle cx="26" cy="50" r="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          <circle cx="74" cy="50" r="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />

          {/* Warm Dark Eyes & Soft Eyelashes */}
          <ellipse cx="38" cy="46" rx="4.8" ry="4.5" fill="#1e1b4b" />
          <circle cx="36.5" cy="44.5" r="1.6" fill="#ffffff" />
          <ellipse cx="62" cy="46" rx="4.8" ry="4.5" fill="#1e1b4b" />
          <circle cx="60.5" cy="44.5" r="1.6" fill="#ffffff" />

          {/* Feminine Eyebrows */}
          <path d="M33 39 Q38 36 43 38" stroke="#4a2810" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M57 38 Q62 36 67 39" stroke="#4a2810" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Rosy Cheeks & Sweet Smile */}
          <ellipse cx="32" cy="53" rx="5" ry="3" fill="#f43f5e" opacity="0.25" />
          <ellipse cx="68" cy="53" rx="5" ry="3" fill="#f43f5e" opacity="0.25" />
          <path d="M43 56 Q50 63 57 56" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" fill="#fff" />

          {/* Coral Pink Cardigan */}
          <path d="M26 76 C32 70, 68 70, 74 76 L80 100 L20 100 Z" fill="#fb7185" />
          <polygon points="50,84 42,75 58,75" fill="#fffbeb" />
        </svg>
      </div>
    );
  }

  // Mochi the puppy
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 p-0.5 ${sizeClasses} ${className}`}
      title="Mochi - Fluffy Puppy"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full rounded-[14px] bg-amber-50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" fill="#fffbeb" />
        <circle cx="50" cy="50" r="42" fill="#fef3c7" />

        {/* Floppy Puppy Ears */}
        <ellipse cx="24" cy="46" rx="9" ry="18" fill="#fde68a" transform="rotate(-15, 24, 46)" />
        <ellipse cx="76" cy="46" rx="9" ry="18" fill="#fde68a" transform="rotate(15, 76, 46)" />

        {/* Fluffy Round Head */}
        <circle cx="50" cy="52" r="26" fill="#fef08a" />
        {/* Forehead fluff */}
        <circle cx="50" cy="32" r="8" fill="#fef08a" />

        {/* Big Glossy Obsidian Eyes */}
        <circle cx="38" cy="48" r="5.5" fill="#0f172a" />
        <circle cx="36" cy="46" r="2" fill="#ffffff" />
        <circle cx="62" cy="48" r="5.5" fill="#0f172a" />
        <circle cx="60" cy="46" r="2" fill="#ffffff" />

        {/* Soft Muzzle & Shiny Wet Black Nose */}
        <ellipse cx="50" cy="60" rx="12" ry="9" fill="#ffffff" />
        <ellipse cx="50" cy="56" rx="5.5" ry="3.5" fill="#0f172a" />
        <circle cx="49" cy="55" r="1.2" fill="#94a3b8" />

        {/* Tongue & Mouth */}
        <path d="M46 62 Q50 65 54 62" stroke="#0f172a" strokeWidth="1.8" fill="none" />
        <ellipse cx="50" cy="67" rx="3.5" ry="4.5" fill="#fb7185" />

        {/* Red Woven Collar with Golden Bell */}
        <path d="M30 76 Q50 82 70 76 L68 83 Q50 89 32 83 Z" fill="#ef4444" />
        <circle cx="50" cy="85" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="50" cy="86" r="1.5" fill="#713f12" />
      </svg>
    </div>
  );
};
