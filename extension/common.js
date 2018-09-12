/*
  RR-DNS in Firefox and Chrome
  ============================

  RR-DNS (a domain name with multiple IPs) may be tested on Linux by adding
  this to /etc/hosts:

    # Reachable loopback address that rejects connections.
    127.1.1.1   dummy.local
    # Unreachable external address that times out.
    10.1.1.1    dummy.local
    # Reachable external address that accepts connections.
    8.8.8.8     dummy.local

  Firefox and RR-DNS:

  * When an IP rejects connection (SYN+RST) - Firefox transparently tries
    next IP without aborting the request.
  * When an IP times out (no response to SYN) - because of XHR.timeout or
    of default Firefox timeout (90 seconds) if that's unset - Firefox aborts
    the request and fires onreadystate with readyState = 2, then 4 and empty
    response. If another request is made to the same domain then Firefox will
    use next address.
  * If an IP returns an invalid response but TCP handshake succeeds - Firefox
    will stick to it from now on.
  * The timeout of individual IPs (i.e. when Firefox may repeat request
    during this session to one of the previously failed IPs) was not
    determined but it was determined that neither Clear Recent History
    nor Private Mode (!) do that, only restarting Firefox does that reliably.

  Chrome and RR-DNS:

  * When an IP times out (no response to SYN) because of default Chrome
    timeout (2-3 minutes, which cannot be changed for sync XHR) - Chrome
    transparently tries next IP without aborting the request.
  * If an IP returns an invalid response but TCP handshake succeeds -
    Chrome will stick to it from now on.
  * Chrome refreshes DNS entries very often (for every request?), including
    on extension reload (for unpacked extensions).

  Other notes:

  * Looks like it's a standard to not to shuffle the IP list, i.e. try
    returned addresses in their original order. Firefox, Chrome and curl
    all do that. That's why NHE resolver (bdns.io) shuffles results by
    default.
  * Unlike Firefox, Chrome will periodically reload a tab which loading was
    aborted by an extension. Because of this and transparent retries on
    rejection and timeout it's not necessary to implement reloading in the
    extension.
*/

// Update manifest when this list is changed.
var apiBase = 'https://namebase.now.sh/';

var apiTimeout = 5000;

// Additionally restricted by manifest's permissions.
var allURLs = {
  urls: [
    '<all_urls>',
  ]
};

function parseURL(url) {
  var match = (url || '').match(/^(\w+):\/\/[^\/]*?([\w.-]+)(:(\d+))?(\/|$)/);
  if (match) {
    return {
      url: url,
      scheme: match[1],
      domain: match[2],
      tld: match[2].match(/[^.]+$/),
      port: match[4]
    };
  }
}

// done = function (ips), ips = [] if nx, [ip, ...] if xx, null on error.
function resolveViaAPI(domain, async, done) {
  var xhr = new XMLHttpRequest;

  xhr.onreadystatechange = function () {
    var ips = (xhr.responseText || '').trim();

    console.info('NHE: ' + domain + ': from ' + apiBase + ': readyState=' + xhr.readyState + ', status=' + xhr.status + ', response=' + ips.replace(/\r?\n/g, ',')); //-

    if (xhr.readyState == 4) {
      if (xhr.status == 200 && ips.match(/^[\d.\r\n]+$/)) {
        ips = ips.split(/\r?\n/);
        done(ips);
      } else {
        xhr.onerror = null;
        done();
      }
    }
  }

  xhr.onerror = function () { done(); };

  xhr.ontimeout = function () {
    apiTimeout = Math.min(apiTimeout * 1.5, 30000);
    console.warn('NHE: ' + domain + ': resolver has timed out, increasing timeout to ' + apiTimeout + 'ms'); //-
    // Error handled is called from onreadystatechange.
  };

  // No way to specify timeout in Chrome. I'd love to hear the sound reason
  // for not allowing timeout on sync XHR - where it's most needed.
  if (async) {
    xhr.timeout = apiTimeout;
  }

  try {
    var apiURL = apiBase + "resolve?domain=" + encodeURIComponent(domain);
    xhr.open("GET", apiURL, async);
    xhr.send();
    return xhr;
  } catch (e) {
    done();
  }
}

function isNormalURL(url) {
  return normalTLDs.indexOf(url.tld[0]) !== -1;
}

const normalTLDs = [
  "nec",
  "cern",
  "claims",
  "cafe",
  "mini",
  "center",
  "ag",
  "info",
  "sr",
  "ve",
  "by",
  "wiki",
  "edeka",
  "sx",
  "country",
  "dot",
  "skin",
  "kred",
  "soy",
  "careers",
  "build",
  "origins",
  "sap",
  "mx",
  "pl",
  "hospital",
  "akdn",
  "monster",
  "jlc",
  "diamonds",
  "memorial",
  "az",
  "durban",
  "merckmsd",
  "quest",
  "gp",
  "csc",
  "mormon",
  "lease",
  "dog",
  "broker",
  "voto",
  "everbank",
  "webcam",
  "cancerresearch",
  "photos",
  "organic",
  "eurovision",
  "auspost",
  "boo",
  "pramerica",
  "med",
  "shiksha",
  "lotto",
  "nadex",
  "immo",
  "at",
  "xn--pssy2u",
  "xn--9dbq2a",
  "no",
  "samsclub",
  "tel",
  "bridgestone",
  "ott",
  "delivery",
  "fresenius",
  "guru",
  "pay",
  "pro",
  "inc",
  "otsuka",
  "qvc",
  "skype",
  "support",
  "abudhabi",
  "game",
  "americanfamily",
  "lanxess",
  "xn--jvr189m",
  "link",
  "realtor",
  "capital",
  "swiftcover",
  "firestone",
  "koeln",
  "bms",
  "nexus",
  "plus",
  "mobi",
  "gallup",
  "kfh",
  "style",
  "exchange",
  "online",
  "cfa",
  "able",
  "vana",
  "garden",
  "ca",
  "jp",
  "care",
  "flir",
  "gallo",
  "security",
  "ice",
  "hot",
  "barclaycard",
  "py",
  "bostik",
  "statoil",
  "xn--mgba3a4f16a",
  "wtc",
  "biz",
  "scor",
  "xn--fhbei",
  "frontier",
  "cal",
  "dunlop",
  "aw",
  "beer",
  "lasalle",
  "lv",
  "kaufen",
  "rodeo",
  "phd",
  "xn--80ao21a",
  "chanel",
  "london",
  "green",
  "pfizer",
  "frogans",
  "okinawa",
  "read",
  "osaka",
  "xn--mgbayh7gpa",
  "tdk",
  "xn--5su34j936bgsg",
  "samsung",
  "abbott",
  "best",
  "hiphop",
  "suzuki",
  "fund",
  "insure",
  "scjohnson",
  "help",
  "avianca",
  "aig",
  "eco",
  "rich",
  "xn--qcka1pmc",
  "tires",
  "agakhan",
  "shell",
  "vg",
  "raid",
  "bank",
  "gap",
  "xn--clchc0ea0b2g2a9gcd",
  "college",
  "zw",
  "xn--xhq521b",
  "shriram",
  "xn--mk1bu44c",
  "diy",
  "like",
  "mq",
  "nyc",
  "xn--6qq986b3xl",
  "digital",
  "ao",
  "ps",
  "bnpparibas",
  "software",
  "viajes",
  "alibaba",
  "observer",
  "taxi",
  "kitchen",
  "eat",
  "br",
  "education",
  "restaurant",
  "vivo",
  "kinder",
  "repair",
  "spiegel",
  "schule",
  "xn--bck1b9a5dre4c",
  "ovh",
  "icbc",
  "investments",
  "moscow",
  "jot",
  "wales",
  "insurance",
  "quebec",
  "tci",
  "cw",
  "ads",
  "er",
  "xn--2scrj9c",
  "volkswagen",
  "lancia",
  "nra",
  "coffee",
  "attorney",
  "productions",
  "xn--mgbc0a9azcg",
  "xn--estv75g",
  "download",
  "metlife",
  "company",
  "free",
  "weber",
  "lat",
  "channel",
  "xn--45q11c",
  "page",
  "xn--1qqw23a",
  "ikano",
  "plumbing",
  "sandvik",
  "bb",
  "team",
  "ba",
  "market",
  "fr",
  "fyi",
  "catholic",
  "docs",
  "gi",
  "golf",
  "accountants",
  "boehringer",
  "vacations",
  "wtf",
  "xn--mgbb9fbpob",
  "hotmail",
  "forex",
  "xn--3hcrj9c",
  "computer",
  "fo",
  "health",
  "bd",
  "xn--eckvdtc9d",
  "md",
  "reliance",
  "xn--mgbca7dzdo",
  "melbourne",
  "gb",
  "nike",
  "gallery",
  "song",
  "bike",
  "gbiz",
  "hermes",
  "club",
  "cr",
  "bf",
  "asia",
  "cyou",
  "directory",
  "gs",
  "gold",
  "td",
  "hdfcbank",
  "day",
  "dupont",
  "law",
  "viva",
  "maif",
  "auto",
  "cbre",
  "kddi",
  "clubmed",
  "ec",
  "xn--mgbt3dhd",
  "gt",
  "xn--efvy88h",
  "ht",
  "schmidt",
  "xn--nyqy26a",
  "ma",
  "cy",
  "pioneer",
  "showtime",
  "vistaprint",
  "safe",
  "training",
  "red",
  "kpn",
  "mtr",
  "design",
  "ngo",
  "afamilycompany",
  "hr",
  "homesense",
  "casino",
  "baseball",
  "global",
  "ua",
  "xn--vermgensberatung-pwb",
  "smart",
  "bnl",
  "ad",
  "xn--lgbbat1ad8j",
  "fans",
  "broadway",
  "lotte",
  "joburg",
  "forum",
  "wine",
  "protection",
  "fidelity",
  "xn--hxt814e",
  "dish",
  "school",
  "fujixerox",
  "nagoya",
  "tv",
  "ae",
  "network",
  "dodge",
  "xn--rhqv96g",
  "hosting",
  "xn--9krt00a",
  "comsec",
  "press",
  "codes",
  "abc",
  "latino",
  "xn--d1acj3b",
  "miami",
  "bbt",
  "bj",
  "tf",
  "rio",
  "george",
  "play",
  "mu",
  "orange",
  "ng",
  "xn--j6w193g",
  "cfd",
  "homes",
  "iselect",
  "next",
  "is",
  "xn--b4w605ferd",
  "yachts",
  "landrover",
  "xn--o3cw4h",
  "vegas",
  "etisalat",
  "sex",
  "man",
  "uk",
  "property",
  "buy",
  "realestate",
  "ceb",
  "xn--rovu88b",
  "lgbt",
  "xn--6frz82g",
  "sca",
  "co",
  "kerrylogistics",
  "fly",
  "sandvikcoromant",
  "ups",
  "xn--mgba3a3ejt",
  "sh",
  "alstom",
  "cd",
  "world",
  "xn--ses554g",
  "xn--90ais",
  "ing",
  "apple",
  "extraspace",
  "maserati",
  "voyage",
  "toshiba",
  "bingo",
  "partners",
  "lawyer",
  "nc",
  "xn--80adxhks",
  "sm",
  "redstone",
  "final",
  "xn--imr513n",
  "olayangroup",
  "pub",
  "jetzt",
  "itau",
  "haus",
  "discount",
  "xn--gk3at1e",
  "xn--g2xx48c",
  "cv",
  "kim",
  "icu",
  "xn--mgbbh1a71e",
  "kp",
  "news",
  "rexroth",
  "discover",
  "fiat",
  "lplfinancial",
  "marketing",
  "lancome",
  "xn--s9brj9c",
  "dealer",
  "wed",
  "hitachi",
  "democrat",
  "bio",
  "omega",
  "grocery",
  "mo",
  "bbva",
  "nowtv",
  "jprs",
  "bugatti",
  "tvs",
  "spreadbetting",
  "epost",
  "monash",
  "cn",
  "ollo",
  "bw",
  "energy",
  "black",
  "fire",
  "casa",
  "tz",
  "kz",
  "delta",
  "gq",
  "aarp",
  "luxe",
  "holdings",
  "ventures",
  "buzz",
  "xn--xkc2al3hye2a",
  "consulting",
  "xn--80asehdb",
  "bn",
  "st",
  "stream",
  "playstation",
  "ricoh",
  "equipment",
  "int",
  "pwc",
  "save",
  "dating",
  "living",
  "sg",
  "tj",
  "wow",
  "aetna",
  "allstate",
  "town",
  "norton",
  "zappos",
  "fk",
  "call",
  "ford",
  "salon",
  "taobao",
  "sncf",
  "praxi",
  "bosch",
  "promo",
  "catering",
  "book",
  "yamaxun",
  "xn--tiq49xqyj",
  "guide",
  "wme",
  "wanggou",
  "gent",
  "estate",
  "schaeffler",
  "cheap",
  "moda",
  "dubai",
  "xyz",
  "chrysler",
  "fujitsu",
  "stada",
  "luxury",
  "travelchannel",
  "post",
  "im",
  "budapest",
  "abogado",
  "hbo",
  "tax",
  "xn--fjq720a",
  "aquarelle",
  "vanguard",
  "xn--mgbbh1a",
  "bzh",
  "weir",
  "as",
  "enterprises",
  "rest",
  "porn",
  "cisco",
  "uy",
  "lundbeck",
  "lpl",
  "business",
  "mh",
  "loft",
  "fm",
  "surgery",
  "faith",
  "lc",
  "rogers",
  "cars",
  "aco",
  "xn--y9a3aq",
  "helsinki",
  "dabur",
  "tennis",
  "lexus",
  "physio",
  "hyundai",
  "ferrari",
  "blockbuster",
  "bbc",
  "caseih",
  "je",
  "xn--vermgensberater-ctb",
  "cc",
  "store",
  "xn--ogbpf8fl",
  "construction",
  "christmas",
  "clothing",
  "banamex",
  "versicherung",
  "gratis",
  "xn--42c2d9a",
  "total",
  "xn--mgbaam7a8h",
  "xn--mgbpl2fh",
  "neustar",
  "brother",
  "engineering",
  "express",
  "northwesternmutual",
  "dnp",
  "xn--mxtq1m",
  "aero",
  "hkt",
  "charity",
  "mortgage",
  "xn--5tzm5g",
  "app",
  "party",
  "cbn",
  "duck",
  "compare",
  "pohl",
  "rip",
  "nextdirect",
  "mobile",
  "gal",
  "yt",
  "pccw",
  "kia",
  "spot",
  "vote",
  "google",
  "xn--mgb9awbf",
  "sener",
  "desi",
  "xn--p1acf",
  "cuisinella",
  "cleaning",
  "sv",
  "yokohama",
  "gm",
  "af",
  "fj",
  "sa",
  "auction",
  "tours",
  "telefonica",
  "study",
  "lupin",
  "theatre",
  "toys",
  "top",
  "qpon",
  "motorcycles",
  "hu",
  "aol",
  "so",
  "qa",
  "toyota",
  "xn--55qx5d",
  "bentley",
  "xn--w4r85el8fhu5dnra",
  "lifestyle",
  "ren",
  "author",
  "money",
  "verisign",
  "fedex",
  "cbs",
  "xn--nqv7fs00ema",
  "vlaanderen",
  "you",
  "liaison",
  "glass",
  "es",
  "gripe",
  "scholarships",
  "tech",
  "goodyear",
  "talk",
  "lancaster",
  "ki",
  "it",
  "xn--zfr164b",
  "sn",
  "apartments",
  "shoes",
  "starhub",
  "institute",
  "woodside",
  "farm",
  "xn--czrs0t",
  "cash",
  "canon",
  "jcp",
  "xn--90a3ac",
  "xn--p1ai",
  "taipei",
  "xn--mgbab2bd",
  "xerox",
  "nissan",
  "ie",
  "de",
  "vista",
  "bg",
  "nhk",
  "ryukyu",
  "one",
  "xn--mix891f",
  "mitsubishi",
  "graphics",
  "chase",
  "select",
  "industries",
  "healthcare",
  "ci",
  "nico",
  "xn--fpcrj9c3d",
  "tattoo",
  "shopping",
  "tokyo",
  "ally",
  "xn--wgbl6a",
  "capetown",
  "cymru",
  "click",
  "prime",
  "saarland",
  "grainger",
  "hk",
  "tips",
  "vin",
  "pars",
  "africa",
  "intel",
  "feedback",
  "dclk",
  "xn--gecrj9c",
  "box",
  "xn--h2brj9c",
  "foo",
  "pn",
  "movistar",
  "markets",
  "kg",
  "jeep",
  "weibo",
  "gmx",
  "xn--fzc2c9e2c",
  "aramco",
  "storage",
  "sina",
  "duns",
  "doha",
  "church",
  "swiss",
  "seat",
  "yahoo",
  "nab",
  "sucks",
  "direct",
  "citadel",
  "pictet",
  "weather",
  "tw",
  "goodhands",
  "bm",
  "oracle",
  "frontdoor",
  "bet",
  "secure",
  "uno",
  "beauty",
  "beats",
  "uconnect",
  "alsace",
  "pr",
  "circle",
  "shangrila",
  "jobs",
  "cipriani",
  "earth",
  "itv",
  "fan",
  "scb",
  "star",
  "bargains",
  "mutual",
  "cityeats",
  "android",
  "games",
  "shia",
  "kh",
  "gmo",
  "vc",
  "meme",
  "mr",
  "si",
  "vip",
  "et",
  "alfaromeo",
  "wien",
  "group",
  "fage",
  "kerryhotels",
  "teva",
  "cooking",
  "pin",
  "booking",
  "aaa",
  "hgtv",
  "hockey",
  "aeg",
  "ipiranga",
  "calvinklein",
  "ru",
  "sew",
  "jaguar",
  "trade",
  "xn--j1amh",
  "airtel",
  "sanofi",
  "xfinity",
  "movie",
  "imdb",
  "pru",
  "amfam",
  "lidl",
  "technology",
  "xn--kpry57d",
  "bt",
  "ug",
  "bmw",
  "navy",
  "guardian",
  "sbs",
  "madrid",
  "name",
  "yoga",
  "corsica",
  "yun",
  "fishing",
  "amex",
  "gea",
  "fido",
  "audio",
  "kyoto",
  "kiwi",
  "tirol",
  "vuelos",
  "phone",
  "gn",
  "camp",
  "zm",
  "ifm",
  "mg",
  "racing",
  "gle",
  "lamborghini",
  "re",
  "gg",
  "mv",
  "deloitte",
  "ml",
  "gd",
  "seek",
  "fi",
  "aigo",
  "swatch",
  "honda",
  "citi",
  "here",
  "bharti",
  "bing",
  "xn--ygbi2ammx",
  "se",
  "xn--30rr7y",
  "guitars",
  "republican",
  "xn--qxam",
  "saxo",
  "xn--otu796d",
  "pf",
  "gy",
  "arpa",
  "ni",
  "xn--9et52u",
  "autos",
  "rocks",
  "seven",
  "xn--fiqz9s",
  "cookingchannel",
  "esq",
  "mm",
  "land",
  "au",
  "ntt",
  "football",
  "bi",
  "watches",
  "lamer",
  "juegos",
  "reisen",
  "art",
  "id",
  "th",
  "unicom",
  "ls",
  "media",
  "locker",
  "surf",
  "accountant",
  "mattel",
  "sk",
  "caravan",
  "cloud",
  "target",
  "berlin",
  "ril",
  "xn--90ae",
  "doctor",
  "new",
  "fun",
  "ceo",
  "ne",
  "theater",
  "xn--fzys8d69uvgm",
  "sarl",
  "ibm",
  "mit",
  "me",
  "audible",
  "moto",
  "city",
  "tmall",
  "symantec",
  "bz",
  "aws",
  "ltd",
  "np",
  "xn--3pxu8k",
  "viking",
  "pizza",
  "cg",
  "yandex",
  "io",
  "mov",
  "pics",
  "xn--fiq64b",
  "bv",
  "xn--80aswg",
  "dz",
  "xn--3bst00m",
  "house",
  "xn--q9jyb4c",
  "chrome",
  "dvag",
  "ist",
  "contractors",
  "mlb",
  "net",
  "xn--kpu716f",
  "drive",
  "whoswho",
  "forsale",
  "got",
  "site",
  "events",
  "esurance",
  "mp",
  "kn",
  "xn--kcrx77d1x4a",
  "pnc",
  "cba",
  "eg",
  "coupon",
  "xn--54b7fta0cc",
  "sky",
  "irish",
  "prof",
  "hoteles",
  "gh",
  "mint",
  "tkmaxx",
  "loans",
  "na",
  "sohu",
  "win",
  "cricket",
  "mango",
  "diet",
  "hyatt",
  "lol",
  "virgin",
  "moe",
  "srt",
  "tk",
  "cool",
  "linde",
  "am",
  "xbox",
  "credit",
  "ltda",
  "xn--fiqs8s",
  "zip",
  "ky",
  "homegoods",
  "asda",
  "hn",
  "guge",
  "ms",
  "tc",
  "pg",
  "nfl",
  "sj",
  "works",
  "my",
  "marriott",
  "erni",
  "reviews",
  "sexy",
  "mopar",
  "alipay",
  "vodka",
  "walter",
  "ping",
  "warman",
  "coach",
  "lb",
  "progressive",
  "ftr",
  "hsbc",
  "bo",
  "bcn",
  "rocher",
  "mma",
  "sharp",
  "properties",
  "tiaa",
  "dhl",
  "zuerich",
  "pk",
  "vig",
  "hangout",
  "gdn",
  "how",
  "kuokgroup",
  "statefarm",
  "email",
  "hdfc",
  "shaw",
  "ai",
  "edu",
  "crown",
  "sas",
  "dell",
  "bond",
  "dentist",
  "coop",
  "xn--mgberp4a5d4ar",
  "cab",
  "xn--io0a7i",
  "passagens",
  "tab",
  "americanexpress",
  "dtv",
  "boats",
  "gf",
  "baidu",
  "studio",
  "jmp",
  "dk",
  "xn--kprw13d",
  "anquan",
  "map",
  "travel",
  "hiv",
  "homedepot",
  "xxx",
  "photography",
  "analytics",
  "lilly",
  "courses",
  "loan",
  "xn--czr694b",
  "ubs",
  "xn--11b4c3d",
  "tl",
  "bid",
  "firmdale",
  "kpmg",
  "sy",
  "builders",
  "xn--ngbc5azd",
  "family",
  "commbank",
  "xn--cck2b3b",
  "netbank",
  "su",
  "search",
  "pa",
  "llc",
  "community",
  "bayern",
  "xn--45brj9c",
  "kw",
  "xn--3oq18vl8pn36a",
  "audi",
  "jm",
  "gw",
  "lt",
  "barcelona",
  "reit",
  "il",
  "xn--3e0b707e",
  "xn--pbt977c",
  "nba",
  "onl",
  "xn--mgbgu82a",
  "sz",
  "recipes",
  "xn--gckr3f0f",
  "abarth",
  "ly",
  "case",
  "datsun",
  "trust",
  "macys",
  "deal",
  "tools",
  "rightathome",
  "juniper",
  "xn--80aqecdr1a",
  "imamat",
  "kr",
  "dance",
  "xn--4gbrim",
  "scot",
  "stc",
  "xn--55qw42g",
  "ro",
  "richardli",
  "makeup",
  "cruises",
  "olayan",
  "philips",
  "bestbuy",
  "telecity",
  "us",
  "xn--l1acc",
  "lu",
  "xn--yfro4i67o",
  "off",
  "ruhr",
  "onyourside",
  "tjx",
  "xn--e1a4c",
  "gr",
  "chintai",
  "dj",
  "ink",
  "xn--vuq861b",
  "crs",
  "xn--mgbi4ecexp",
  "xn--3ds443g",
  "cf",
  "rw",
  "rugby",
  "mc",
  "xn--fiq228c5hs",
  "meet",
  "blue",
  "today",
  "expert",
  "associates",
  "show",
  "volvo",
  "ax",
  "adac",
  "live",
  "car",
  "academy",
  "locus",
  "xn--mgba7c0bbn0a",
  "prudential",
  "bradesco",
  "ac",
  "ong",
  "xn--mgbx4cd0ab",
  "fairwinds",
  "anz",
  "ses",
  "mobily",
  "vn",
  "ggee",
  "visa",
  "jio",
  "infiniti",
  "tui",
  "radio",
  "winners",
  "cx",
  "adult",
  "comcast",
  "abb",
  "dad",
  "pictures",
  "xn--xkc2dl3a5ee0h",
  "zero",
  "food",
  "mom",
  "fail",
  "gifts",
  "lipsy",
  "azure",
  "tunes",
  "xn--flw351e",
  "abbvie",
  "clinic",
  "weatherchannel",
  "hm",
  "poker",
  "tushu",
  "gucci",
  "nu",
  "ninja",
  "genting",
  "istanbul",
  "pink",
  "bible",
  "xn--d1alf",
  "wedding",
  "creditunion",
  "nl",
  "watch",
  "domains",
  "gu",
  "aq",
  "arab",
  "lr",
  "barclays",
  "finance",
  "sl",
  "pharmacy",
  "statebank",
  "xn--mgbtx2b",
  "piaget",
  "basketball",
  "cl",
  "sydney",
  "hughes",
  "joy",
  "wolterskluwer",
  "xn--rvc1e0am3e",
  "solar",
  "bar",
  "ch",
  "zippo",
  "host",
  "natura",
  "kindle",
  "stcgroup",
  "tt",
  "paris",
  "foundation",
  "rwe",
  "allfinanz",
  "xn--pgbs0dh",
  "menu",
  "cz",
  "marshalls",
  "al",
  "tjmaxx",
  "microsoft",
  "dental",
  "life",
  "mba",
  "management",
  "mk",
  "vision",
  "barefoot",
  "xin",
  "arte",
  "supply",
  "toray",
  "panerai",
  "obi",
  "degree",
  "work",
  "jcb",
  "nikon",
  "sport",
  "exposed",
  "netflix",
  "xn--j1aef",
  "rentals",
  "redumbrella",
  "ir",
  "nrw",
  "oldnavy",
  "fox",
  "ck",
  "giving",
  "dds",
  "lds",
  "florist",
  "jnj",
  "gmbh",
  "cat",
  "xn--jlq61u9w7b",
  "bananarepublic",
  "prod",
  "trv",
  "bot",
  "gov",
  "xn--ngbe9e0a",
  "horse",
  "xn--h2brj9c8c",
  "blackfriday",
  "goog",
  "museum",
  "iveco",
  "bofa",
  "xihuan",
  "axa",
  "fish",
  "ye",
  "xn--t60b56a",
  "bs",
  "thd",
  "sakura",
  "xn--wgbh1c",
  "room",
  "uol",
  "cm",
  "pid",
  "dev",
  "cartier",
  "blog",
  "travelersinsurance",
  "band",
  "xn--tckwe",
  "xn--mgbaakc7dvf",
  "brussels",
  "mtn",
  "tr",
  "condos",
  "do",
  "xn--vhquv",
  "review",
  "tickets",
  "film",
  "safety",
  "krd",
  "boutique",
  "xn--mgbai9azgqp6j",
  "career",
  "xn--1ck2e1b",
  "realty",
  "za",
  "services",
  "xn--node",
  "xn--fct429k",
  "archi",
  "walmart",
  "ooo",
  "nationwide",
  "voting",
  "lk",
  "maison",
  "hotels",
  "latrobe",
  "xn--kput3i",
  "youtube",
  "ubank",
  "honeywell",
  "zone",
  "fashion",
  "parts",
  "immobilien",
  "sfr",
  "lacaixa",
  "ferrero",
  "nissay",
  "actor",
  "bom",
  "bauhaus",
  "emerck",
  "om",
  "coupons",
  "limo",
  "vi",
  "komatsu",
  "cruise",
  "international",
  "video",
  "cards",
  "bcg",
  "tatamotors",
  "glade",
  "lego",
  "sling",
  "mil",
  "xn--i1b6b1a6a2e",
  "social",
  "java",
  "citic",
  "bh",
  "in",
  "jpmorgan",
  "flights",
  "ski",
  "rmit",
  "singles",
  "to",
  "jewelry",
  "open",
  "farmers",
  "pet",
  "politie",
  "staples",
  "mz",
  "srl",
  "org",
  "deals",
  "ieee",
  "bloomberg",
  "gmail",
  "cam",
  "xn--czru2d",
  "mls",
  "pm",
  "men",
  "zara",
  "gift",
  "schwarz",
  "xn--45br5cyl",
  "kosher",
  "hamburg",
  "airforce",
  "tn",
  "eu",
  "yodobashi",
  "nokia",
  "foodnetwork",
  "report",
  "place",
  "xn--nqv7f",
  "soccer",
  "li",
  "hisamitsu",
  "tiffany",
  "jll",
  "mn",
  "xn--c1avg",
  "ismaili",
  "smile",
  "newholland",
  "chat",
  "xn--ngbrx",
  "mt",
  "tm",
  "mckinsey",
  "reise",
  "va",
  "tatar",
  "shouji",
  "rehab",
  "agency",
  "science",
  "now",
  "nz",
  "lighting",
  "date",
  "fit",
  "iq",
  "be",
  "trading",
  "baby",
  "space",
  "la",
  "data",
  "sale",
  "globo",
  "dvr",
  "goldpoint",
  "fitness",
  "solutions",
  "windows",
  "fast",
  "villas",
  "camera",
  "epson",
  "sd",
  "pe",
  "ee",
  "run",
  "supplies",
  "amsterdam",
  "airbus",
  "holiday",
  "rsvp",
  "ga",
  "engineer",
  "shop",
  "silk",
  "army",
  "rs",
  "stockholm",
  "afl",
  "moi",
  "jo",
  "godaddy",
  "website",
  "goo",
  "lifeinsurance",
  "ws",
  "financial",
  "uz",
  "ericsson",
  "gives",
  "creditcard",
  "nr",
  "xn--unup4y",
  "wang",
  "limited",
  "accenture",
  "softbank",
  "love",
  "hair",
  "xn--h2breg3eve",
  "leclerc",
  "xn--c2br7g",
  "cologne",
  "rent",
  "msd",
  "sc",
  "lincoln",
  "gop",
  "travelers",
  "com",
  "mw",
  "xn--w4rs40l",
  "gl",
  "sb",
  "tube",
  "ladbrokes",
  "office",
  "ar",
  "contact",
  "temasek",
  "flickr",
  "systems",
  "tienda",
  "lixil",
  "university",
  "ph",
  "nf",
  "boston",
  "amica",
  "km",
  "clinique",
  "furniture",
  "blanco",
  "active",
  "legal",
  "athleta",
  "futbol",
  "wf",
  "ge",
  "xn--8y0a063a",
  "sbi",
  "dm",
  "cu",
  "pw",
  "williamhill",
  "tg",
  "nowruz",
  "lefrak",
  "capitalone",
  "ke",
  "photo",
  "intuit",
  "sony",
  "xn--cg4bki",
  "pt",
  "vet",
  "vu",
  "flowers",
  "kerryproperties",
  "eus",
  "panasonic",
  "frl",
]
