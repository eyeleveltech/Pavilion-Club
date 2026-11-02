/**
 * The GSAP build the home page serves from /assets/js, reused by SiteMotion:
 * each script's browser global and its file, in load order. Kept out of the
 * client module so SitePage (a server component) can preload them.
 */
export const MOTION_SCRIPTS = [
  ['gsap', '/assets/js/gsap.min.js'],
  ['ScrollTrigger', '/assets/js/ScrollTrigger.min.js'],
  ['SplitText', '/assets/js/SplitText.min.js'],
  ['Lenis', '/assets/js/lenis.min.js'],
] as const;
