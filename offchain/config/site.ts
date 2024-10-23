export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Aiken Auction",
  description: "Aiken Auction",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Seller",
      href: "/seller",
    },
    {
      label: "Bidder",
      href: "/bidder",
    },
  ],
  links: {
    github: "https://github.com/Emurgo",
    twitter: "https://twitter.com/emurgo_io",
    docs: "https://emurgo.io",
    discord: "https://discord.gg/AWEp2SG437",
    sponsor: "https://events.emurgo.io/aiken-smart-contract-development-program",
  },
};
