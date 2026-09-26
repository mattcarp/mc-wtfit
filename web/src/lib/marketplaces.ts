// Where a "let it go" item gets posted. Today: copy the listing and open the sell page (two taps).
// Later: direct posting through marketplace APIs (eBay Sell API) once the user connects their account.
export const MARKETPLACES = [
  { id: 'ebay.co.uk', label: 'eBay UK', sellUrl: 'https://www.ebay.co.uk/sl/sell' },
  { id: 'ebay.de', label: 'eBay Germany', sellUrl: 'https://www.ebay.de/sl/sell' },
  { id: 'ebay.com', label: 'eBay US', sellUrl: 'https://www.ebay.com/sl/sell' },
  { id: 'maltapark', label: 'MaltaPark', sellUrl: 'https://www.maltapark.com/' },
  { id: 'facebook', label: 'Facebook Marketplace', sellUrl: 'https://www.facebook.com/marketplace/create/item' },
  { id: 'vinted', label: 'Vinted', sellUrl: 'https://www.vinted.com/items/new' },
  { id: 'other', label: 'Somewhere else', sellUrl: null },
] as const;
export type MarketplaceId = (typeof MARKETPLACES)[number]['id'];
export const marketplace = (id: string | null | undefined) => MARKETPLACES.find(m => m.id === id) ?? MARKETPLACES[0];
