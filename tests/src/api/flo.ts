/**
 * Smoke - Platform API
 *
 * For each site
 * - Tests the stripe products
 * - Tests the most watched widget
 */
import flagpole from "../../../dist/index";

const THRESHOLD_LOAD_TIME = 500;

// Retrieved from https://api.flosports.tv/api/sites?show_on_mobile=1
const sites = [
  {
    domain: "www.flofc.com",
    id: 43,
    name: "FloFC",
    code: "flofc",
    host: "https://www.flofc.com",
    active: true,
    type: "site",
    version: 3,
    color: "#00B74F",
    hero_image:
      "http://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flosoccer.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Soccer",
  },
  {
    domain: "www.flobowling.com",
    id: 41,
    name: "FloBowling",
    code: "flobowling",
    host: "https://www.flobowling.com",
    active: true,
    type: "site",
    version: 3,
    color: "#E4002B",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flobowling.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Bowling",
  },
  {
    domain: "www.flofootball.com",
    id: 38,
    name: "FloFootball",
    code: "flofootball",
    host: "http://www.flofootball.com",
    active: true,
    type: "site",
    version: 3,
    color: "#E4002B",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flofootball.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Football",
  },
  {
    domain: "www.flobikes.com",
    id: 37,
    name: "FloBikes",
    code: "flobikes",
    host: "http://www.flobikes.com",
    active: true,
    type: "site",
    version: 3,
    color: "#FF8200",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flocycling.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Cycling",
  },
  {
    domain: "www.flodance.com",
    id: 36,
    name: "FloDance",
    code: "flodance",
    host: "http://www.flodance.com",
    active: true,
    type: "site",
    version: 3,
    color: "#AC4FC6",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flodance.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Dance",
  },
  {
    domain: "www.flolive.tv",
    id: 35,
    name: "FloLive",
    code: "flolive",
    host: "http://www.flolive.tv",
    active: false,
    type: "site",
    version: 3,
    color: "#FF8200",
    hero_image: null,
    modified_at: null,
    show_on_mobile: true,
    sport_name: null,
  },
  {
    domain: "www.florugby.com",
    id: 34,
    name: "FloRugby",
    code: "florugby",
    host: "http://www.florugby.com",
    active: true,
    type: "site",
    version: 3,
    color: "#00B74F",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_florugby.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Rugby",
  },
  {
    domain: "www.flovoice.com",
    id: 33,
    name: "FloVoice",
    code: "flovoice",
    host: "http://www.flovoice.com",
    active: true,
    type: "site",
    version: 3,
    color: "#307FE2",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flovoice.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Singing",
  },
  {
    domain: "www.floracing.com",
    id: 32,
    name: "FloRacing",
    code: "floracing",
    host: "http://www.floracing.com",
    active: true,
    type: "site",
    version: 3,
    color: "#E4002B",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_floracing.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Racing",
  },
  {
    domain: "www.florodeo.com",
    id: 30,
    name: "FloRodeo",
    code: "florodeo",
    host: "http://www.florodeo.com",
    active: true,
    type: "site",
    version: 3,
    color: "#E4002B",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_florodeo.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Rodeo",
  },
  {
    domain: "www.flohockey.tv",
    id: 29,
    name: "FloHockey",
    code: "flohockey",
    host: "http://www.flohockey.tv",
    active: true,
    type: "site",
    version: 3,
    color: "#307FE2",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flohockey.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Hockey",
  },
  {
    domain: "www.floswimming.com",
    id: 28,
    name: "FloSwimming",
    code: "floswimming",
    host: "http://www.floswimming.com",
    active: true,
    type: "site",
    version: 3,
    color: "#307FE2",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_floswimming.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Swimming",
  },
  {
    domain: "www.flomarching.com",
    id: 27,
    name: "FloMarching",
    code: "flomarching",
    host: "http://www.flomarching.com",
    active: true,
    type: "site",
    version: 3,
    color: "#00B74F",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flomarching.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Marching Arts",
  },
  {
    domain: "www.flocombat.com",
    id: 23,
    name: "FloCombat",
    code: "flocombat",
    host: "http://www.flocombat.com",
    active: true,
    type: "site",
    version: 3,
    color: "#00B74F",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flocombat.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "MMA",
  },
  {
    domain: "www.flovolleyball.tv",
    id: 22,
    name: "FloVolleyball",
    code: "flovolleyball",
    host: "http://www.flovolleyball.tv",
    active: true,
    type: "site",
    version: 3,
    color: "#307FE2",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flovolleyball.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Volleyball",
  },
  {
    domain: "tv.varsity.com",
    id: 20,
    name: "Varsity",
    code: "varsity",
    host: "http://tv.varsity.com",
    active: true,
    type: "site",
    version: 3,
    color: "#307FE2",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_varsity.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Varsity TV",
  },
  {
    domain: "www.flosoftball.com",
    id: 14,
    name: "FloSoftball",
    code: "flosoftball",
    host: "http://www.flosoftball.com",
    active: true,
    type: "site",
    version: 3,
    color: "#00A9E0",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flosoftball.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Softball",
  },
  {
    domain: "www.floelite.com",
    id: 12,
    name: "FloElite",
    code: "floelite",
    host: "http://www.floelite.com",
    active: true,
    type: "site",
    version: 3,
    color: "#FF8200",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_floelite.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Elite Fitness",
  },
  {
    domain: "www.flocheer.com",
    id: 10,
    name: "FloCheer",
    code: "flocheer",
    host: "http://www.flocheer.com",
    active: true,
    type: "site",
    version: 3,
    color: "#AC4FC6",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flocheer.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "All Star Cheer & Dance",
  },
  {
    domain: "www.flograppling.com",
    id: 8,
    name: "FloGrappling",
    code: "flograppling",
    host: "http://www.flograppling.com",
    active: true,
    type: "site",
    version: 3,
    color: "#00B74F",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flograppling.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Grappling",
  },
  {
    domain: "www.flohoops.com",
    id: 7,
    name: "FloHoops",
    code: "flohoops",
    host: "http://www.flohoops.com",
    active: true,
    type: "site",
    version: 3,
    color: "#FF8200",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flohoops.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Basketball",
  },
  {
    domain: "www.flogymnastics.com",
    id: 4,
    name: "FloGymnastics",
    code: "flogymnastics",
    host: "http://www.flogymnastics.com",
    active: true,
    type: "site",
    version: 3,
    color: "#307FE2",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flogymnastics.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Gymnastics",
  },
  {
    domain: "www.flowrestling.org",
    id: 2,
    name: "FloWrestling",
    code: "flowrestling",
    host: "http://www.flowrestling.org",
    active: true,
    type: "site",
    version: 3,
    color: "#84BD00",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flowrestling.jpg",
    modified_at: null,
    show_on_mobile: true,
    sport_name: "Wrestling",
  },
  {
    domain: "www.flotrack.org",
    id: 1,
    name: "FloTrack",
    code: "flotrack",
    host: "http://www.flotrack.org",
    active: true,
    type: "site",
    version: 3,
    color: "#E4002B",
    hero_image:
      "https://d6fm3yzmawlcs.cloudfront.net/mobileVerticalBackground/mobile_bg_flotrack.jpg",
    modified_at: "2019-04-01T21:19:31+00:00",
    show_on_mobile: true,
    sport_name: "Track and Field",
  },
];

const suite = flagpole("Smoke - Platform API").base("https://api.flosports.tv");
// .finally(suite => suite.print());

sites.forEach((site) => {
  suite
    .scenario(`${site.name} - Stripe Products`, "json")
    .open(`/api/products?provider=stripe&site_id=${site.id}`)
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      context
        .assert(context.response.loadTime)
        .optional.lessThan(THRESHOLD_LOAD_TIME);
      const total = await context.find("meta.total");
      const data = await context.find("data");
      const firstType = await context.find("data[0].type");
      context.assert(total).greaterThan(0);
      context.assert(data.length).equals(total);
      context.assert(firstType).equals("product");
    });
});

sites.forEach((site) => {
  suite
    .json(`${site.name} - Widget - Most Watched`)
    .open(`/api/widgets/most-watched?site_id=${site.id}`)
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      context
        .assert(context.response.loadTime)
        .optional.lessThan(THRESHOLD_LOAD_TIME);
      const videos = await context.find("data.videos");
      context.assert(videos.length).greaterThan(0);
    });
});
