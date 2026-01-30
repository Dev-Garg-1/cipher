console.log("CipherGuard content script loaded");

const NSFW_THRESHOLD = 0.3;

const offensiveWords = [
  "aand",
  "aandu",
  "balatkar",
  "balatkari",
  "behen chod",
  "beti chod",
  "bhadva",
  "bhadve",
  "bhandve",
  "bhangi",
  "bhootni ke",
  "bhosad",
  "bhosadi ke",
  "boobe",
  "chakke",
  "chinaal",
  "chinki",
  "chod",
  "chodu",
  "chodu bhagat",
  "chooche",
  "choochi",
  "choope",
  "choot",
  "choot ke baal",
  "chootia",
  "chootiya",
  "chuche",
  "chuchi",
  "chudaap",
  "chudai khanaa",
  "chudam chudai",
  "chude",
  "chut",
  "chut ka chuha",
  "chut ka churan",
  "chut ka mail",
  "chut ke baal",
  "chut ke dhakkan",
  "chut maarli",
  "chutad",
  "chutadd",
  "chutan",
  "chutia",
  "chutiya",
  "gaand",
  "gaandfat",
  "gaandmasti",
  "gaandufad",
  "gandfattu",
  "gandu",
  "gashti",
  "gasti",
  "ghassa",
  "ghasti",
  "gucchi",
  "gucchu",
  "harami",
  "haramzade",
  "hawas",
  "hawas ke pujari",
  "hijda",
  "hijra",
  "jhant",
  "jhant chaatu",
  "jhant ka keeda",
  "jhant ke baal",
  "jhant ke pissu",
  "jhantu",
  "kamine",
  "kaminey",
  "kanjar",
  "kutta",
  "kutta kamina",
  "kutte ki aulad",
  "kutte ki jat",
  "kuttiya",
  "loda",
  "lodu",
  "lund",
  "lund choos",
  "lund ka bakkal",
  "lund khajoor",
  "lundtopi",
  "lundure",
  "maa ki chut",
  "maal",
  "madar chod",
  "madarchod",
  "madhavchod",
  "mooh mein le",
  "mutth",
  "mutthal",
  "najayaz",
  "najayaz aulaad",
  "najayaz paidaish",
  "paki",
  "pataka",
  "patakha",
  "raand",
  "randaap",
  "randi",
  "randi rona",
  "saala",
  "saala kutta",
  "saali kutti",
  "saali randi",
  "suar",
  "suar ke lund",
  "suar ki aulad",
  "tatte",
  "tatti",
  "teri maa ka bhosada",
  "teri maa ka boba chusu",
  "teri maa ki behenchod",
  "teri maa ki chut",
  "tharak",
  "tharki",
  "tu chuda",
  "2g1c",
  "2 girls 1 cup",
  "acrotomophilia",
  "alabama hot pocket",
  "alaskan pipeline",
  "anal",
  "anilingus",
  "anus",
  "apeshit",
  "arsehole",
  "ass",
  "asshole",
  "assmunch",
  "auto erotic",
  "autoerotic",
  "babeland",
  "baby batter",
  "baby juice",
  "ball gag",
  "ball gravy",
  "ball kicking",
  "ball licking",
  "ball sack",
  "ball sucking",
  "bangbros",
  "bangbus",
  "bareback",
  "barely legal",
  "barenaked",
  "bastard",
  "bastardo",
  "bastinado",
  "bbw",
  "bdsm",
  "beaner",
  "beaners",
  "beaver cleaver",
  "beaver lips",
  "beastiality",
  "bestiality",
  "big black",
  "big breasts",
  "big knockers",
  "big tits",
  "bimbos",
  "birdlock",
  "bitch",
  "bitches",
  "black cock",
  "blonde action",
  "blonde on blonde action",
  "blowjob",
  "blow job",
  "blow your load",
  "blue waffle",
  "blumpkin",
  "bollocks",
  "bondage",
  "boner",
  "boob",
  "boobs",
  "booty call",
  "brown showers",
  "brunette action",
  "bukkake",
  "bulldyke",
  "bullet vibe",
  "bullshit",
  "bung hole",
  "bunghole",
  "busty",
  "butt",
  "buttcheeks",
  "butthole",
  "camel toe",
  "camgirl",
  "camslut",
  "camwhore",
  "carpet muncher",
  "carpetmuncher",
  "chocolate rosebuds",
  "cialis",
  "circlejerk",
  "cleveland steamer",
  "clit",
  "clitoris",
  "clover clamps",
  "clusterfuck",
  "cock",
  "cocks",
  "coprolagnia",
  "coprophilia",
  "cornhole",
  "coon",
  "coons",
  "creampie",
  "cum",
  "cumming",
  "cumshot",
  "cumshots",
  "cunnilingus",
  "cunt",
  "darkie",
  "date rape",
  "daterape",
  "deep throat",
  "deepthroat",
  "dendrophilia",
  "dick",
  "dildo",
  "dingleberry",
  "dingleberries",
  "dirty pillows",
  "dirty sanchez",
  "doggie style",
  "doggiestyle",
  "doggy style",
  "doggystyle",
  "dog style",
  "dolcett",
  "domination",
  "dominatrix",
  "dommes",
  "donkey punch",
  "double dong",
  "double penetration",
  "dp action",
  "dry hump",
  "dvda",
  "eat my ass",
  "ecchi",
  "ejaculation",
  "erotic",
  "erotism",
  "escort",
  "eunuch",
  "fag",
  "faggot",
  "fecal",
  "felch",
  "fellatio",
  "feltch",
  "female squirting",
  "femdom",
  "figging",
  "fingerbang",
  "fingering",
  "fisting",
  "foot fetish",
  "footjob",
  "frotting",
  "fuck",
  "fuck buttons",
  "fuckin",
  "fucking",
  "fucktards",
  "fudge packer",
  "fudgepacker",
  "futanari",
  "gangbang",
  "gang bang",
  "gay sex",
  "genitals",
  "giant cock",
  "girl on",
  "girl on top",
  "girls gone wild",
  "goatcx",
  "goatse",
  "god damn",
  "gokkun",
  "golden shower",
  "goodpoop",
  "goo girl",
  "goregasm",
  "grope",
  "group sex",
  "g-spot",
  "guro",
  "hand job",
  "handjob",
  "hard core",
  "hardcore",
  "hentai",
  "homoerotic",
  "honkey",
  "hooker",
  "horny",
  "hot carl",
  "hot chick",
  "how to kill",
  "how to murder",
  "huge fat",
  "humping",
  "incest",
  "intercourse",
  "jack off",
  "jail bait",
  "jailbait",
  "jelly donut",
  "jerk off",
  "jigaboo",
  "jiggaboo",
  "jiggerboo",
  "jizz",
  "juggs",
  "kike",
  "kinbaku",
  "kinkster",
  "kinky",
  "knobbing",
  "leather restraint",
  "leather straight jacket",
  "lemon party",
  "livesex",
  "lolita",
  "lovemaking",
  "make me come",
  "male squirting",
  "masturbate",
  "masturbating",
  "masturbation",
  "menage a trois",
  "milf",
  "missionary position",
  "mong",
  "motherfucker",
  "mound of venus",
  "mr hands",
  "muff diver",
  "muffdiving",
  "nambla",
  "nawashi",
  "negro",
  "neonazi",
  "nigga",
  "nigger",
  "nig nog",
  "nimphomania",
  "nipple",
  "nipples",
  "nsfw",
  "nsfw images",
  "nude",
  "nudity",
  "nutten",
  "nympho",
  "nymphomania",
  "octopussy",
  "omorashi",
  "one cup two girls",
  "one guy one jar",
  "orgasm",
  "orgy",
  "paedophile",
  "paki",
  "panties",
  "panty",
  "pedobear",
  "pedophile",
  "pegging",
  "penis",
  "phone sex",
  "piece of shit",
  "pikey",
  "pissing",
  "piss pig",
  "pisspig",
  "playboy",
  "pleasure chest",
  "pole smoker",
  "ponyplay",
  "poof",
  "poon",
  "poontang",
  "punany",
  "poop chute",
  "poopchute",
  "porn",
  "porno",
  "pornography",
  "prince albert piercing",
  "pthc",
  "pubes",
  "pussy",
  "queaf",
  "queef",
  "quim",
  "raghead",
  "raging boner",
  "rape",
  "raping",
  "rapist",
  "rectum",
  "reverse cowgirl",
  "rimjob",
  "rimming",
  "rosy palm",
  "rosy palm and her 5 sisters",
  "rusty trombone",
  "sadism",
  "santorum",
  "scat",
  "schlong",
  "scissoring",
  "semen",
  "sex",
  "sexcam",
  "sexo",
  "sexy",
  "sexual",
  "sexually",
  "sexuality",
  "shaved beaver",
  "shaved pussy",
  "shemale",
  "shibari",
  "shit",
  "shitblimp",
  "shitty",
  "shota",
  "shrimping",
  "skeet",
  "slanteye",
  "slut",
  "s&m",
  "smut",
  "snatch",
  "snowballing",
  "sodomize",
  "sodomy",
  "spastic",
  "spic",
  "splooge",
  "splooge moose",
  "spooge",
  "spread legs",
  "spunk",
  "strap on",
  "strapon",
  "strappado",
  "strip club",
  "style doggy",
  "suck",
  "sucks",
  "suicide girls",
  "sultry women",
  "swastika",
  "swinger",
  "tainted love",
  "taste my",
  "tea bagging",
  "threesome",
  "throating",
  "thumbzilla",
  "tied up",
  "tight white",
  "tit",
  "tits",
  "titties",
  "titty",
  "tongue in a",
  "topless",
  "tosser",
  "towelhead",
  "tranny",
  "tribadism",
  "tub girl",
  "tubgirl",
  "tushy",
  "twat",
  "twink",
  "twinkie",
  "two girls one cup",
  "undressing",
  "upskirt",
  "urethra play",
  "urophilia",
  "vagina",
  "venus mound",
  "viagra",
  "vibrator",
  "violet wand",
  "vorarephilia",
  "voyeur",
  "voyeurweb",
  "voyuer",
  "vulva",
  "wank",
  "wetback",
  "wet dream",
  "white power",
  "whore",
  "worldsex",
  "wrapping men",
  "wrinkled starfish",
  "xx",
  "xxx",
  "yaoi",
  "yellow showers",
  "yiffy",
  "zoophilia",
];

/* ================= UTILITIES ================= */

// Escape regex special chars
function escapeRegex(word) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build safe regex
const offensiveRegex = new RegExp(
  `\\b(${offensiveWords.map(escapeRegex).join("|")})\\b`,
  "gi"
);

// Inject blur CSS
const style = document.createElement("style");
style.textContent = `
  .blurred-safe {
    filter: blur(15px) !important;
    transition: filter 0.3s ease;
  }
`;
document.documentElement.appendChild(style);

/* ================= TEXT FILTER ================= */

function cleanText(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (offensiveRegex.test(node.nodeValue)) {
      node.nodeValue = node.nodeValue.replace(offensiveRegex, "****");
    }
  }
}

/* ================= IMAGE FILTER (ALT BASED) ================= */

function blurOffensiveImages() {
  document.querySelectorAll("img:not([data-cipher-checked])").forEach(img => {
    const alt = (img.alt || "").toLowerCase();
    if (offensiveWords.some(word => alt.includes(word))) {
      img.classList.add("blurred-safe");
    }
  });
}

/* ================= IMAGE NSFW MODEL ================= */

async function classifyImage(img) {
  if (img.dataset.cipherChecked) return;
  img.dataset.cipherChecked = "true";

  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise(res =>
      canvas.toBlob(res, "image/jpeg", 0.8)
    );
    if (!blob) return;

    const formData = new FormData();
    formData.append("file", blob, "image.jpg");

    const response = await fetch(
      "https://051a2f2d8c10.ngrok-free.app /api/monitor/classify/",
      { method: "POST", body: formData }
    );

    const data = await response.json();
    const score = data?.labels?.nsfw ?? 0;

    if (score >= NSFW_THRESHOLD) {
      img.classList.add("blurred-safe");
    }
  } catch (err) {
    console.error("CipherGuard image scan failed:", err);
  }
}

/* ================= DOM SCAN ================= */

function handleNode(node) {
  cleanText(node);

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.tagName === "IMG") {
      if (node.complete && node.naturalWidth > 0) {
        classifyImage(node);
      } else {
        node.addEventListener("load", () => classifyImage(node));
      }
    }
  }
}

function traverseDOM(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    null
  );

  let node;
  while ((node = walker.nextNode())) {
    handleNode(node);
  }
}

/* ================= INITIAL RUN ================= */

traverseDOM(document.body);
blurOffensiveImages();

/* ================= OBSERVER ================= */

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        traverseDOM(node);
        blurOffensiveImages();
      }
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
