export type TraderTFOptions = {
	pricerInstanceUrl?: string;
	apiKey: string;
};

export type Currency = {
	keys: number;
	metal: number;
};

export type SnapshotListing = {
	listingId: string;
	steamId: string;
	attributes?: { value?: any; defindex?: number }[];
	quantity: number;
	currencies: Currency;
	createdAt: number;
	bumpedAt: number;
	automatic: boolean;
	offers: boolean;
};

export type Snapshot = {
	sku: string;
	buyOrders: SnapshotListing[];
	sellOrders: SnapshotListing[];
	time: number;
};

export type UserPrice = {
	sku: string;
	time: number;
	buy: Currency;
	sell: Currency;
	belongsTo: string;
};

export type Price = {
	sku: string;
	time: number;
	buy: Currency;
	sell: Currency;
}
