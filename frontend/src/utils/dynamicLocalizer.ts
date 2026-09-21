export type LanguageCode = 'en' | 'te' | 'hi' | 'kn' | 'ta' | 'mr';

export type LocalizedValueType =
  | 'personName'
  | 'doctorName'
  | 'hospitalName'
  | 'medicineName'
  | 'clinicalTerm'
  | 'medicalCondition'
  | 'allergy'
  | 'reaction'
  | 'description'
  | 'instruction'
  | 'identificationMark'
  | 'emergencyContact'
  | 'identifier'
  | 'number'
  | 'date';

// ============================================================================
// 1. SYSTEM IDENTIFIERS & CODES GUARD
// ============================================================================
const SYSTEM_ID_PATTERNS = [
  /^(HP|DOC|PAT|DR|LR|REC|APP|MED|HOSP|ABHA|TX|ORD|LAB|VACC|REQ|BILL|IPD|OPD)-/i,
  /^ABHA-\d{2}-\d{4}-\d{4}-\d{4}$/i,
  /^0x[a-f0-9]{30,}$/i, // Hashes (SHA-256, Ethereum addresses)
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID
  /^[X*]{2,}\s*[X*]{2,}\s*\d{2,}$/i, // Masked Aadhaar/IDs e.g. "XXXX XXXX 1234"
  /^\d{4}-\d{2}-\d{2}$/, // ISO Date (keep raw in code)
  /^\+?\d{10,13}$/, // Phone numbers
];

/**
 * Checks if a string is a system identifier, code, hash, or masked ID
 * which MUST remain completely untouched across all languages.
 */
export function isSystemIdentifier(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return SYSTEM_ID_PATTERNS.some((pattern) => pattern.test(trimmed));
}

// ============================================================================
// 2. ALGORITHMIC INDIC TRANSLITERATION ENGINE
// ============================================================================

interface ScriptMaps {
  vowels: Record<string, string>;
  matras: Record<string, string>;
  consonants: Record<string, string>;
  virama: string;
}

const SCRIPTS: Record<'te' | 'hi' | 'mr' | 'kn' | 'ta', ScriptMaps> = {
  // TELUGU
  te: {
    vowels: {
      aa: 'ఆ',
      a: 'అ',
      ee: 'ఈ',
      ii: 'ఈ',
      i: 'ఇ',
      oo: 'ఊ',
      uu: 'ఊ',
      u: 'ఉ',
      ai: 'ఐ',
      au: 'ఔ',
      ou: 'ఔ',
      e: 'ఏ',
      o: 'ఓ',
    },
    matras: {
      aa: 'ా',
      a: '',
      ee: 'ీ',
      ii: 'ీ',
      i: 'ి',
      oo: 'ూ',
      uu: 'ూ',
      u: 'ు',
      ai: 'ై',
      au: 'ౌ',
      ou: 'ౌ',
      e: 'ే',
      o: 'ో',
    },
    virama: '్',
    consonants: {
      ksh: 'క్ష',
      kh: 'ఖ',
      gh: 'ఘ',
      k: 'క',
      g: 'గ',
      chh: 'ఛ',
      ch: 'చ',
      jh: 'ఝ',
      j: 'జ',
      th: 'థ',
      dh: 'ధ',
      t: 'ట',
      d: 'ద',
      n: 'న',
      ph: 'ఫ',
      bh: 'భ',
      p: 'ప',
      f: 'ఫ',
      b: 'బ',
      m: 'మ',
      y: 'య',
      r: 'ర',
      l: 'ల',
      v: 'వ',
      w: 'వ',
      sh: 'శ',
      s: 'స',
      h: 'హ',
      z: 'జ',
    },
  },

  // HINDI (Devanagari)
  hi: {
    vowels: {
      aa: 'आ',
      a: 'अ',
      ee: 'ई',
      ii: 'ई',
      i: 'इ',
      oo: 'ऊ',
      uu: 'ऊ',
      u: 'उ',
      ai: 'ऐ',
      au: 'औ',
      ou: 'औ',
      e: 'ए',
      o: 'ओ',
    },
    matras: {
      aa: 'ा',
      a: '',
      ee: 'ी',
      ii: 'ी',
      i: 'ि',
      oo: 'ू',
      uu: 'ू',
      u: 'ु',
      ai: 'ै',
      au: 'ौ',
      ou: 'ौ',
      e: 'े',
      o: 'ो',
    },
    virama: '्',
    consonants: {
      ksh: 'क्ष',
      kh: 'ख',
      gh: 'घ',
      k: 'क',
      g: 'ग',
      chh: 'छ',
      ch: 'च',
      jh: 'झ',
      j: 'ज',
      th: 'थ',
      dh: 'ध',
      t: 'ट',
      d: 'द',
      n: 'न',
      ph: 'फ',
      bh: 'भ',
      p: 'प',
      f: 'फ़',
      b: 'ब',
      m: 'म',
      y: 'य',
      r: 'र',
      l: 'ल',
      v: 'व',
      w: 'व',
      sh: 'श',
      s: 'स',
      h: 'ह',
      z: 'ज़',
    },
  },

  // MARATHI (Devanagari)
  mr: {
    vowels: {
      aa: 'आ',
      a: 'अ',
      ee: 'ई',
      ii: 'ई',
      i: 'इ',
      oo: 'ऊ',
      uu: 'ऊ',
      u: 'उ',
      ai: 'ऐ',
      au: 'औ',
      ou: 'औ',
      e: 'ए',
      o: 'ओ',
    },
    matras: {
      aa: 'ा',
      a: '',
      ee: 'ी',
      ii: 'ी',
      i: 'ि',
      oo: 'ू',
      uu: 'ू',
      u: 'ु',
      ai: 'ै',
      au: 'ौ',
      ou: 'ौ',
      e: 'े',
      o: 'ो',
    },
    virama: '्',
    consonants: {
      ksh: 'क्ष',
      kh: 'ख',
      gh: 'घ',
      k: 'क',
      g: 'ग',
      chh: 'छ',
      ch: 'च',
      jh: 'झ',
      j: 'ज',
      th: 'थ',
      dh: 'ध',
      t: 'ट',
      d: 'द',
      n: 'न',
      ph: 'फ',
      bh: 'भ',
      p: 'प',
      f: 'फ',
      b: 'ब',
      m: 'म',
      y: 'य',
      r: 'र',
      l: 'ल',
      v: 'व',
      w: 'व',
      sh: 'श',
      s: 'स',
      h: 'ह',
      z: 'झ',
    },
  },

  // KANNADA
  kn: {
    vowels: {
      aa: 'ಆ',
      a: 'ಅ',
      ee: 'ಈ',
      ii: 'ಈ',
      i: 'ಇ',
      oo: 'ಊ',
      uu: 'ಊ',
      u: 'ಉ',
      ai: 'ಐ',
      au: 'ಔ',
      ou: 'ಔ',
      e: 'ಏ',
      o: 'ಓ',
    },
    matras: {
      aa: 'ಾ',
      a: '',
      ee: 'ೀ',
      ii: 'ೀ',
      i: 'ಿ',
      oo: 'ೂ',
      uu: 'ೂ',
      u: 'ು',
      ai: 'ೈ',
      au: 'ೌ',
      ou: 'ೌ',
      e: 'ೇ',
      o: 'ೋ',
    },
    virama: '್',
    consonants: {
      ksh: 'ಕ್ಷ',
      kh: 'ಖ',
      gh: 'ಘ',
      k: 'ಕ',
      g: 'ಗ',
      chh: 'ಛ',
      ch: 'ಚ',
      jh: 'ಝ',
      j: 'ಜ',
      th: 'ಥ',
      dh: 'ಧ',
      t: 'ಟ',
      d: 'ದ',
      n: 'ನ',
      ph: 'ಫ',
      bh: 'ಭ',
      p: 'ಪ',
      f: 'ಫ',
      b: 'ಬ',
      m: 'ಮ',
      y: 'ಯ',
      r: 'ರ',
      l: 'ಲ',
      v: 'ವ',
      w: 'ವ',
      sh: 'ಶ',
      s: 'ಸ',
      h: 'ಹ',
      z: 'ಜ',
    },
  },

  // TAMIL
  ta: {
    vowels: {
      aa: 'ஆ',
      a: 'அ',
      ee: 'ஈ',
      ii: 'ஈ',
      i: 'இ',
      oo: 'ஊ',
      uu: 'ஊ',
      u: 'உ',
      ai: 'ஐ',
      au: 'ஔ',
      ou: 'ஔ',
      e: 'ஏ',
      o: 'ஓ',
    },
    matras: {
      aa: 'ா',
      a: '',
      ee: 'ீ',
      ii: 'ீ',
      i: 'ி',
      oo: 'ூ',
      uu: 'ூ',
      u: 'ு',
      ai: 'ை',
      au: 'ௌ',
      ou: 'ௌ',
      e: 'ே',
      o: 'ோ',
    },
    virama: '்',
    consonants: {
      ksh: 'க்ஷ',
      kh: 'க',
      gh: 'க',
      k: 'க',
      g: 'க',
      chh: 'ச',
      ch: 'ச',
      jh: 'ஜ',
      j: 'ஜ',
      th: 'த',
      dh: 'த',
      t: 'ட',
      d: 'த',
      n: 'ந',
      ph: 'ப',
      bh: 'ப',
      p: 'ப',
      f: 'ப',
      b: 'ப',
      m: 'ம',
      y: 'ய',
      r: 'ர',
      l: 'ல',
      v: 'வ',
      w: 'வ',
      sh: 'ஷ',
      s: 'ஸ',
      h: 'ஹ',
      z: 'ஜ',
    },
  },
};

/**
 * Normalizes English/Romanized spelling variations of names
 */
function normalizeIndianPhonetics(w: string): string {
  let s = w.toLowerCase();

  // "kumar" -> "kumaar" (సో 'మా' has long aa)
  s = s.replace(/kumar$/i, 'kumaar');
  // "khan" -> "khaan"
  s = s.replace(/^khan$/i, 'khaan');
  // "rahul" -> "raahul"
  s = s.replace(/^rahul$/i, 'raahul');
  // "ahmed" -> "ahmad"
  s = s.replace(/^ahmed$/i, 'ahmad');
  // "apex" -> "apex"
  s = s.replace(/^apex$/i, 'apeks');

  return s;
}

/**
 * Transliterates a single English/Latin word into target Indic script
 */
function transliterateWord(word: string, lang: 'te' | 'hi' | 'mr' | 'kn' | 'ta'): string {
  const script = SCRIPTS[lang];
  if (!script) return word;

  const w = normalizeIndianPhonetics(word);
  let result = '';
  let i = 0;
  const len = w.length;

  const matchPrefix = (str: string, candidates: string[]): string | null => {
    for (const cand of candidates) {
      if (str.startsWith(cand)) return cand;
    }
    return null;
  };

  const vowelKeys = Object.keys(script.vowels).sort((a, b) => b.length - a.length);
  const matraKeys = Object.keys(script.matras).sort((a, b) => b.length - a.length);
  const consonantKeys = Object.keys(script.consonants).sort((a, b) => b.length - a.length);

  while (i < len) {
    const sub = w.substring(i);

    // 1. Initial independent vowel
    if (i === 0 || w[i - 1] === ' ' || w[i - 1] === '-') {
      const vMatch = matchPrefix(sub, vowelKeys);
      if (vMatch) {
        result += script.vowels[vMatch];
        i += vMatch.length;
        continue;
      }
    }

    // Special: 'x' -> 'ks'
    if (sub.startsWith('x')) {
      if (lang === 'te' || lang === 'kn') result += 'క్స్';
      else if (lang === 'ta') result += 'க்ஸ்';
      else result += 'क्स';
      i += 1;
      continue;
    }

    // Special: Tamil initial 'su' for names like 'Suresh' -> 'சு'
    if (lang === 'ta' && i === 0 && sub.startsWith('su')) {
      result += 'சு';
      i += 2;
      continue;
    }

    // Special: In Telugu/Kannada, terminal 'sh' (as in Suresh, Rajesh, Ramesh, Dinesh) ends in 'ష్' / 'ಶ್'
    if (lang === 'te' && (sub === 'sh' || sub === 'esh')) {
      if (sub === 'esh') {
        result += 'ేష్';
        i += 3;
      } else {
        result += 'ష్';
        i += 2;
      }
      continue;
    }
    if (lang === 'kn' && (sub === 'sh' || sub === 'esh')) {
      if (sub === 'esh') {
        result += 'ೇಶ್';
        i += 3;
      } else {
        result += 'ಶ್';
        i += 2;
      }
      continue;
    }

    // 2. Consonant match
    const cMatch = matchPrefix(sub, consonantKeys);
    if (cMatch) {
      const consGlyph = script.consonants[cMatch];
      i += cMatch.length;

      // Check if a vowel follows immediately
      const afterCons = w.substring(i);
      const mMatch = matchPrefix(afterCons, matraKeys);

      if (mMatch) {
        // Consonant + Vowel sign (matra)
        const matraGlyph = script.matras[mMatch];
        result += consGlyph + matraGlyph;
        i += mMatch.length;
      } else {
        // No vowel immediately follows: consonant cluster or word ending
        const isEnd = i >= len || !/[a-z]/.test(w[i]);
        if (isEnd) {
          if (lang === 'te' || lang === 'kn' || lang === 'ta') {
            result += consGlyph + script.virama;
          } else {
            // Hindi / Marathi: bare consonant
            result += consGlyph;
          }
        } else {
          // Half consonant / Conjunct
          result += consGlyph + script.virama;
        }
      }
      continue;
    }

    // 3. Fallback: independent vowel in middle of word
    const vMatch = matchPrefix(sub, vowelKeys);
    if (vMatch) {
      result += script.vowels[vMatch] || sub[0];
      i += vMatch.length;
      continue;
    }

    result += w[i];
    i++;
  }

  return result;
}

/**
 * Transliterates a full name or phrase of proper nouns into the target Indic script.
 */
export function transliterateToIndic(text: string, lang: 'te' | 'hi' | 'mr' | 'kn' | 'ta'): string {
  if (!text) return '';
  return text
    .split(/(\s+|[-.,/()&]+)/)
    .map((token) => {
      if (/^[a-zA-Z]+$/.test(token)) {
        return transliterateWord(token, lang);
      }
      return token;
    })
    .join('');
}

// ============================================================================
// 3. DOCTOR PREFIXES & COMMON HONORIFICS
// ============================================================================
const HONORIFICS: Record<string, Record<'te' | 'hi' | 'mr' | 'kn' | 'ta', string>> = {
  'dr.': { te: 'డా.', hi: 'डॉ.', mr: 'डॉ.', kn: 'ಡಾ.', ta: 'டாக்டர்.' },
  'dr': { te: 'డా.', hi: 'डॉ.', mr: 'डॉ.', kn: 'ಡಾ.', ta: 'டாக்டர்.' },
  'doctor': { te: 'డాక్టర్', hi: 'डॉक्टर', mr: 'डॉक्टर', kn: 'ಡಾಕ್ಟರ್', ta: 'மருத்துவர்' },
  'mr.': { te: 'శ్రీ', hi: 'श्री', mr: 'श्री', kn: 'ಶ್ರೀ', ta: 'திரு' },
  'mr': { te: 'శ్రీ', hi: 'श्री', mr: 'श्री', kn: 'ಶ್ರೀ', ta: 'திரு' },
  'mrs.': { te: 'శ్రీమతి', hi: 'श्रीमती', mr: 'श्रीमती', kn: 'ಶ್ರೀಮತಿ', ta: 'திருமதி' },
  'mrs': { te: 'శ్రీమతి', hi: 'श्रीमती', mr: 'श्रीमती', kn: 'ಶ್ರೀಮತಿ', ta: 'திருமதி' },
  'ms.': { te: 'కుమారి', hi: 'सुश्री', mr: 'सुश्री', kn: 'ಕುಮಾರಿ', ta: 'செல்வி' },
};

function localizePersonOrDoctor(
  name: string,
  lang: 'te' | 'hi' | 'mr' | 'kn' | 'ta'
): string {
  if (!name) return '';

  let cleaned = name.trim();

  // Extract common prefixes (e.g. "Dr. Rajesh Verma, MD, DM")
  let prefix = '';
  const prefixMatch = cleaned.match(/^(Dr\.|Dr|Doctor|Mr\.|Mr|Mrs\.|Mrs|Ms\.)\s+/i);
  if (prefixMatch) {
    const rawPrefix = prefixMatch[1].toLowerCase();
    prefix = HONORIFICS[rawPrefix]?.[lang] ? `${HONORIFICS[rawPrefix][lang]} ` : `${prefixMatch[1]} `;
    cleaned = cleaned.substring(prefixMatch[0].length);
  }

  // Check for medical qualifications after comma (e.g. ", MD, DM", ", MBBS")
  let qualifications = '';
  const commaIdx = cleaned.indexOf(',');
  if (commaIdx !== -1) {
    qualifications = cleaned.substring(commaIdx);
    cleaned = cleaned.substring(0, commaIdx);
  }

  const transliteratedName = transliterateToIndic(cleaned, lang);
  return `${prefix}${transliteratedName}${qualifications}`.trim();
}

// ============================================================================
// 4. INSTITUTIONAL & HOSPITAL PHRASES
// ============================================================================
const INSTITUTION_WORDS: Record<string, Record<'te' | 'hi' | 'mr' | 'kn' | 'ta', string>> = {
  hospital: { te: 'ఆసుపత్రి', hi: 'अस्पताल', mr: 'रुग्णालय', kn: 'ಆಸ್ಪತ್ರೆ', ta: 'மருத்துவமனை' },
  hospitals: { te: 'ఆసుపత్రులు', hi: 'अस्पताल', mr: 'रुग्णालये', kn: 'ಆಸ್ಪತ್ರೆಗಳು', ta: 'மருத்துவமனைகள்' },
  health: { te: 'హెల్త్', hi: 'हेल्थ', mr: 'आरोग्य', kn: 'ಹೆಲ್ತ್', ta: 'ஹெல்த்' },
  city: { te: 'సిటీ', hi: 'सिटी', mr: 'शहर', kn: 'ಸಿಟಿ', ta: 'சிட்டி' },
  care: { te: 'కేర్', hi: 'केयर', mr: 'केअर', kn: 'ಕೇರ್', ta: 'கேர்' },
  clinic: { te: 'క్లినిక్', hi: 'क्लिनिक', mr: 'क्लिनिक', kn: 'ಕ್ಲಿನಿಕ್', ta: 'கிளினிக்' },
  center: { te: 'సెంటర్', hi: 'केंद्र', mr: 'केंद्र', kn: 'ಕೇಂದ್ರ', ta: 'மையம்' },
  centre: { te: 'సెంటర్', hi: 'केंद्र', mr: 'केंद्र', kn: 'ಕೇಂದ್ರ', ta: 'மையம்' },
  institute: { te: 'ఇన్‌స్టిట్యూట్', hi: 'संस्थान', mr: 'संस्था', kn: 'ಸಂಸ್ಥೆ', ta: 'நிறுவனம்' },
  diagnostic: { te: 'డయాగ్నస్టిక్', hi: 'डायग्नोस्टिक', mr: 'निदान', kn: 'ಡಯಾಗ್ನಸ್ಟಿಕ್', ta: 'பரிசோதனை' },
  block: { te: 'బ్లాక్', hi: 'ब्लॉक', mr: 'ब्लॉक', kn: 'ಬ್ಲಾಕ್', ta: 'பிளாக்' },
  room: { te: 'రూమ్', hi: 'कमरा', mr: 'खोली', kn: 'ಕೊಠಡಿ', ta: 'அறை' },
};

function localizeHospitalName(
  facility: string,
  lang: 'te' | 'hi' | 'mr' | 'kn' | 'ta'
): string {
  if (!facility) return '';

  return facility
    .split(/(\s+|[,/()-]+)/)
    .map((token) => {
      const lower = token.toLowerCase();
      if (INSTITUTION_WORDS[lower]?.[lang]) {
        return INSTITUTION_WORDS[lower][lang];
      }
      if (/^[a-zA-Z]+$/.test(token)) {
        return transliterateWord(token, lang);
      }
      return token;
    })
    .join('');
}

// ============================================================================
// 5. CLINICAL TERMINOLOGY & INSTRUCTIONS
// ============================================================================
const CLINICAL_DICTIONARY: Record<string, Record<'te' | 'hi' | 'mr' | 'kn' | 'ta', string>> = {
  // Medical Conditions
  'essential hypertension (stage 1)': {
    te: 'ఎసెన్షియల్ హైపర్‌టెన్షన్ (దశ 1)',
    hi: 'एसेंशियल हाइपरटेंशन (स्टेज 1)',
    mr: 'अत्यावश्यक उच्च रक्तदाब (टप्पा 1)',
    kn: 'ಎಸೆನ್ಷಿಯಲ್ ಹೈಪರ್ಟೆನ್ಷನ್ (ಹಂತ 1)',
    ta: 'அத்தியாவசிய உயர் இரத்த அழுத்தம் (நிலை 1)',
  },
  'essential hypertension': {
    te: 'ఎసెన్షియల్ హైపర్‌టెన్షన్ (అధిక రక్తపోటు)',
    hi: 'एसेंशियल हाइपरटेंशन (उच्च रक्तचाप)',
    mr: 'अत्यावश्यक उच्च रक्तदाब',
    kn: 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ',
    ta: 'அத்தியாவசிய உயர் இரத்த அழுத்தம்',
  },
  dyslipidemia: {
    te: 'డిస్లిపిడెమియా (రక్తంలో అధిక కొవ్వు)',
    hi: 'डिसलिपिडेमिया (रक्त में असंतुलित वसा)',
    mr: 'डिसलिपिडेमिया',
    kn: 'ಡಿಸ್ಲಿಪಿಡೆಮಿಯಾ',
    ta: 'டிஸ்லிபிடெமியா',
  },
  'type 2 diabetes mellitus': {
    te: 'టైప్ 2 డయాబెటిస్ (మధుమేహం)',
    hi: 'टाइप 2 मधुमेह',
    mr: 'टाइप 2 मधुमेह',
    kn: 'ಟೈಪ್ 2 ಮಧುಮೇಹ',
    ta: 'வகை 2 நீரிழிவு',
  },

  // Status & condition descriptions
  'managed under arb medication (requires routine bp monitoring)': {
    te: 'ARB మందులతో నియంత్రణలో ఉంది (రెగ్యులర్ BP పర్యవేక్షణ అవసరం)',
    hi: 'एआरबी दवा के तहत प्रबंधित (नियमित बीपी निगरानी आवश्यक)',
    mr: 'एआरबी औषधोपचाराखाली व्यवस्थापित (नियमित बीपी तपासणी आवश्यक)',
    kn: 'ARB ಔಷಧಿಗಳ ಮೂಲಕ ನಿಯಂತ್ರಣದಲ್ಲಿದೆ (ನಿಯಮಿತ ಬಿಪಿ ಮೇಲ್ವಿಚಾರಣೆ ಅಗತ್ಯವಿದೆ)',
    ta: 'ARB மருந்துகளால் கட்டுப்படுத்தப்படுகிறது (வழக்கமான பிபி கண்காணிப்பு தேவை)',
  },
  'active management with statin therapy': {
    te: 'స్టాటిన్ చికిత్సతో యాక్టివ్ నిర్వహణ',
    hi: 'स्टैटिन थेरेपी के साथ सक्रिय प्रबंधन',
    mr: 'स्टॅटिन थेरपीसह सक्रिय व्यवस्थापन',
    kn: 'ಸ್ಟ್ಯಾಟಿನ್ ಚಿಕಿತ್ಸೆಯೊಂದಿಗೆ ಸಕ್ರಿಯ ನಿರ್ವಹಣೆ',
    ta: 'ஸ்டேடின் சிகிச்சையுடன் செயலில் உள்ள மேலாண்மை',
  },

  // Identification Marks
  'small scar near right eyebrow': {
    te: 'కుడి కనుబొమ్మ దగ్గర చిన్న మచ్చ',
    hi: 'दाहिनी भौंह के पास छोटा निशान',
    mr: 'उजव्या भुवईजवळ लहान व्रण',
    kn: 'ಬಲ ಹುಬ್ಬಿನ ಬಳಿ ಸಣ್ಣ ಕಲೆ',
    ta: 'வலது புருவத்தின் அருகே சிறிய தழும்பு',
  },
  'mole on left forearm': {
    te: 'ఎడమ ముంజేయిపై పుట్టుమచ్చ',
    hi: 'बाईं बांह पर तिल',
    mr: 'डाव्या हातावर तीळ',
    kn: 'ಎಡ ಮುಂಗೈ ಮೇಲೆ ಮಚ್ಚೆ',
    ta: 'இடது முன்கையில் மச்சம்',
  },
  'birthmark on right shoulder': {
    te: 'కుడి భుజంపై పుట్టుమచ్చ',
    hi: 'दाहिने कंधे पर जन्मचिह्न',
    mr: 'उजव्या खांद्यावर जन्मखूण',
    kn: 'ಬಲ ಭುಜದ ಮೇಲೆ ಜನ್ಮ ಗುರುತು',
    ta: 'வலது தோளில் மச்சம்',
  },

  // Allergies & Reactions
  penicillin: {
    te: 'పెన్సిలిన్',
    hi: 'पेनिसिलिन',
    mr: 'पेनिसिलिन',
    kn: 'ಪೆನ್ಸಿಲಿನ್',
    ta: 'பென்சிலின்',
  },
  anaphylaxis: {
    te: 'అనాఫిలాక్సిస్ (తీవ్రమైన అలర్జీ ప్రతిచర్య)',
    hi: 'एनाफिलेक्सिस (गंभीर एलर्जी प्रतिक्रिया)',
    mr: 'ॲनाफिलेक्सिस (तीव्र ॲलर्जी प्रतिक्रिया)',
    kn: 'ಅನಾಫಿಲ್ಯಾಕ್ಸಿಸ್ (ತೀವ್ರ ಅಲರ್ಜಿ ಪ್ರತಿಕ್ರಿಯೆ)',
    ta: 'அனாபிலாக்ஸிஸ் (தீவிர ஒவ்வாமை எதிர்வினை)',
  },
  'severe breathing distress & systemic rash; strictly avoid all beta-lactams': {
    te: 'శ్వాస తీసుకోవడంలో తీవ్రమైన ఇబ్బంది మరియు శరీరమంతా దద్దుర్లు; బీటా-లాక్టమ్ మందులు పూర్తిగా నివారించండి',
    hi: 'सांस लेने में गंभीर परेशानी और दाने; सभी बीटा-लैक्टम दवाओं से पूरी तरह बचें',
    mr: 'श्वास घेण्यास गंभीर त्रास आणि पुरळ; सर्व बीटा-लॅक्टम्स पूर्णपणे टाळा',
    kn: 'ಉಸಿರಾಟದ ತೀವ್ರ ತೊಂದರೆ ಮತ್ತು ದೇಹದಾದ್ಯಂತ ದದ್ದುಗಳು; ಎಲ್ಲಾ ಬೀಟಾ-ಲ್ಯಾಕ್ಟಮ್‌ಗಳನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ತಪ್ಪಿಸಿ',
    ta: 'தீவிர சுவாசக் கோளாறு மற்றும் உடல் முழுவதும் அரிப்பு; அனைத்து பீட்டா-லாக்டம்களையும் தவிர்க்கவும்',
  },

  // Emergency Relations
  spouse: {
    te: 'జీవిత భాగస్వామి',
    hi: 'जीवनसाथी',
    mr: 'जोडीदार',
    kn: 'ಸಂಗಾತಿ',
    ta: 'துணைவர்',
  },
  father: {
    te: 'తండ్రి',
    hi: 'पिता',
    mr: 'वडील',
    kn: 'ತಂದೆ',
    ta: 'தந்தை',
  },
  mother: {
    te: 'తల్లి',
    hi: 'माता',
    mr: 'आई',
    kn: 'ತಾಯಿ',
    ta: 'தாய்',
  },
  brother: {
    te: 'సోదరుడు',
    hi: 'भाई',
    mr: 'भाऊ',
    kn: 'ಸಹೋದರ',
    ta: 'சகோதரர்',
  },
  sister: {
    te: 'సోదరి',
    hi: 'बहन',
    mr: 'बहीण',
    kn: 'ಸಹೋದರಿ',
    ta: 'சகோதரி',
  },
};

// ============================================================================
// 6. MEDICINE NAME & DOSAGE PRESERVATION
// ============================================================================
function localizeMedicineName(
  medicineText: string,
  lang: 'te' | 'hi' | 'mr' | 'kn' | 'ta'
): string {
  if (!medicineText) return '';

  const match = medicineText.match(/^([a-zA-Z\s-]+?)\s+(\d+(\.\d+)?\s*(mg|mcg|ml|g|iu|%|tablets?|capsules?))$/i);
  if (match) {
    const drugName = match[1].trim();
    const dosage = match[2].trim();
    const localizedDrug = transliterateWord(drugName, lang);
    return `${localizedDrug} ${dosage}`;
  }

  return medicineText
    .split(/(\s+)/)
    .map((token) => {
      if (/^[a-zA-Z]+$/.test(token)) {
        return transliterateWord(token, lang);
      }
      return token;
    })
    .join('');
}

// ============================================================================
// 7. INSTRUCTIONS & TIMING GRAMMAR
// ============================================================================
const INSTRUCTION_PATTERNS: Array<{
  regex: RegExp;
  replacements: Record<'te' | 'hi' | 'mr' | 'kn' | 'ta', string>;
}> = [
  {
    regex: /1\s*tablet\s*daily\s*\(morning\)/i,
    replacements: {
      te: 'రోజుకు 1 మాత్ర (ఉదయం)',
      hi: 'प्रतिदिन 1 गोली (सुबह)',
      mr: 'दररोज 1 गोळी (सकाळी)',
      kn: 'ದಿನಕ್ಕೆ 1 ಮಾತ್ರೆ (ಬೆಳಿಗ್ಗೆ)',
      ta: 'ஒரு மாத்திரை தினமும் (காலை)',
    },
  },
  {
    regex: /1\s*tablet\s*twice\s*daily\s*\(with\s*meals\)/i,
    replacements: {
      te: 'రోజుకు 2 సార్లు 1 మాత్ర (భోజనంతో)',
      hi: 'प्रतिदिन 2 बार 1 गोली (भोजन के साथ)',
      mr: 'दिवसातून दोनदा 1 गोळी (जेवणासोबत)',
      kn: 'ದಿನಕ್ಕೆ 2 ಬಾರಿ 1 ಮಾತ್ರೆ (ಊಟದೊಂದಿಗೆ)',
      ta: 'ஒரு மாத்திரை இருவேளை (உணவுடன்)',
    },
  },
  {
    regex: /1\s*tablet\s*daily\s*\(at\s*night\)/i,
    replacements: {
      te: 'రోజుకు 1 మాత్ర (రాత్రి పూట)',
      hi: 'प्रतिदिन 1 गोली (रात में)',
      mr: 'दररोज 1 गोळी (रात्री)',
      kn: 'ದಿನಕ್ಕೆ 1 ಮಾತ್ರೆ (ರಾತ್ರಿ)',
      ta: 'ஒரு மாத்திரை தினமும் (இரவில்)',
    },
  },
  {
    regex: /take\s*after\s*food/i,
    replacements: {
      te: 'భోజనం తర్వాత తీసుకోండి',
      hi: 'भोजन के बाद लें',
      mr: 'जेवणानंतर घ्या',
      kn: 'ಊಟದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಿ',
      ta: 'உணவுக்குப் பின் எடுத்துக்கொள்ளவும்',
    },
  },
  {
    regex: /take\s*before\s*food/i,
    replacements: {
      te: 'భోజనానికి ముందు తీసుకోండి',
      hi: 'भोजन से पहले लें',
      mr: 'जेवणापूर्वी घ्या',
      kn: 'ಊಟಕ್ಕೆ ಮುಂಚೆ ತೆಗೆದುಕೊಳ್ಳಿ',
      ta: 'உணவுக்கு முன் எடுத்துக்கொள்ளவும்',
    },
  },
];

function localizeInstruction(
  instructionText: string,
  lang: 'te' | 'hi' | 'mr' | 'kn' | 'ta'
): string {
  if (!instructionText) return '';

  for (const item of INSTRUCTION_PATTERNS) {
    if (item.regex.test(instructionText)) {
      return item.replacements[lang];
    }
  }

  return instructionText
    .replace(/\bdaily\b/gi, { te: 'రోజువారీ', hi: 'प्रतिदिन', mr: 'दररोज', kn: 'ದಿನನಿತ್ಯ', ta: 'தினசரி' }[lang])
    .replace(/\bmorning\b/gi, { te: 'ఉదయం', hi: 'सुबह', mr: 'सकाळी', kn: 'ಬೆಳಿಗ್ಗೆ', ta: 'காலை' }[lang])
    .replace(/\bevening\b/gi, { te: 'సాయంత్రం', hi: 'शाम', mr: 'संध्याकाळी', kn: 'ಸಂಜೆ', ta: 'மாலை' }[lang])
    .replace(/\bnight\b/gi, { te: 'రాత్రి', hi: 'रात', mr: 'रात्री', kn: 'ರಾತ್ರಿ', ta: 'இரவு' }[lang])
    .replace(/\btablet\b/gi, { te: 'మాత్ర', hi: 'गोली', mr: 'गोळी', kn: 'ಮಾತ್ರೆ', ta: 'மாத்திரை' }[lang]);
}

// ============================================================================
// 8. PRIMARY EXPORTED API: displayLocalizedValue
// ============================================================================

export function displayLocalizedValue(
  actualValue: string | undefined | null,
  language: LanguageCode,
  valueType?: LocalizedValueType
): string {
  if (actualValue === undefined || actualValue === null || actualValue === '') {
    return '';
  }

  const str = String(actualValue).trim();

  // English always returns the exact stored value
  if (!language || language === 'en') {
    return str;
  }

  // 1. SYSTEM IDENTIFIER SAFEGUARD: Always keep untouched
  if (valueType === 'identifier' || isSystemIdentifier(str)) {
    return str;
  }

  // 2. PURE NUMBER / MEDICAL UNIT SAFEGUARD: e.g. "40 mg", "124 / 82", "5.6%"
  if (
    valueType === 'number' ||
    /^\d+(\.\d+)?(\s*(mg|mcg|ml|g|bpm|%|mmhg|kg|cm|mmol\/l))?$/i.test(str) ||
    /^\d+\s*\/\s*\d+$/.test(str)
  ) {
    return str;
  }

  // Only Indic scripts supported for transliteration
  if (!['te', 'hi', 'mr', 'kn', 'ta'].includes(language)) {
    return str;
  }
  const indicLang = language as 'te' | 'hi' | 'mr' | 'kn' | 'ta';

  // 3. SEMANTIC TYPE BRANCHING
  switch (valueType) {
    case 'personName':
    case 'doctorName':
    case 'emergencyContact':
      return localizePersonOrDoctor(str, indicLang);

    case 'hospitalName':
      return localizeHospitalName(str, indicLang);

    case 'medicineName':
      return localizeMedicineName(str, indicLang);

    case 'instruction':
      return localizeInstruction(str, indicLang);

    case 'clinicalTerm':
    case 'medicalCondition':
    case 'allergy':
    case 'reaction':
    case 'identificationMark':
    case 'description': {
      const lower = str.toLowerCase();
      if (CLINICAL_DICTIONARY[lower]?.[indicLang]) {
        return CLINICAL_DICTIONARY[lower][indicLang];
      }
      return transliterateToIndic(str, indicLang);
    }

    default: {
      if (/^(Dr\.|Doctor|Mr\.|Mrs\.|Ms\.)/i.test(str)) {
        return localizePersonOrDoctor(str, indicLang);
      }
      const lower = str.toLowerCase();
      if (CLINICAL_DICTIONARY[lower]?.[indicLang]) {
        return CLINICAL_DICTIONARY[lower][indicLang];
      }
      return transliterateToIndic(str, indicLang);
    }
  }
}
