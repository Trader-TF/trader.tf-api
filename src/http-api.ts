import axios, { AxiosError, AxiosInstance } from 'axios'
import Bottleneck from 'bottleneck'

import { TraderTFOptions, Currency, UserPrice, Price, Snapshot } from './common'

export type APIResponse<TResponse> =
	| {
			success: 1;
			result: TResponse;
	}
	| {
			success: 0;
			message: string;
	};

export type GetPriceResponse = Price;

export type AddListingResponse = {
	added: boolean;
};

export type GetListingResponse = {
	sku: string;
	min: Currency;
	max: Currency;
	time: number;
	belongsTo: string;
};

export type RemoveListingResponse = {
	removed: boolean;
};

export type GetUserPriceResponse = UserPrice

export type RequestPriceResponse = {
	queued: boolean;
};

export type GetPriceHistoryResponse = {
	sku: string;
	history: {
		buy: Currency;
		sell: Currency;
		time: number;
	}[];
};

export type GetSnapshotResponse = Snapshot;

export type GetRateResponse = {
	value: number;
	type: 'key';
}

export type AddToBlacklistResponse = {
	added: boolean;
}

export type GetBlacklistResponse = {
	blacklist: string[]
}

export type RemoveFromBlacklistResponse = {
	removed: boolean;
}

/**
 * For BPTF Pricer.
 */
export class TraderTFAPI {
	private requestClient: AxiosInstance;
	private apiKey: string;
	/**
	 * This class helps us
	 * keep rate limit in tact.
	 */
	private bottleneck: Bottleneck;

	constructor ({
		pricerInstanceUrl = 'https://trader.tf',
		apiKey,
		rateLimit = true
	}: TraderTFOptions & { rateLimit?: boolean; }) {
		this.requestClient = axios.create({ baseURL: pricerInstanceUrl })
		this.apiKey = apiKey
		if (!rateLimit) {
			this.bottleneck = new Bottleneck()
			return
		}

		this.bottleneck = new Bottleneck({
			// Lets see how it performs.
			reservoirRefreshAmount: 1000,
			reservoir: 1000,
			reservoirRefreshInterval: 15 * 1000 * 60
		})
	}

	private async request<TResponse> (
		method: 'GET' | 'POST' | 'DELETE',
		url: string,
		params: { [key: string]: any } = {},
		data: { [key: string]: any } = {}
	): Promise<TResponse> {
		try {
			const response = await this.bottleneck.schedule(() =>
				this.requestClient.request<APIResponse<TResponse>>({
					url,
					method,
					params,
					data
				})
			)

			if (!response.data.success) {
				throw new Error(response.data.message)
			}

			return response.data.result
		} catch (e) {
			throwErrorWithAPIMessage(method, url, e)
		}
	}

	async getPrice (sku: string): Promise<GetPriceResponse> {
		return this.request<GetPriceResponse>('GET', '/price', {
			sku,
			key: this.apiKey
		})
	}

	async requestPrice (sku: string): Promise<RequestPriceResponse> {
		return this.request<RequestPriceResponse>('POST', '/price', {
			sku,
			key: this.apiKey
		})
	}

	async getSnapshot (sku: string): Promise<GetSnapshotResponse> {
		return this.request<GetSnapshotResponse>('GET', '/snapshot', {
			sku,
			key: this.apiKey
		})
	}

	async getPriceHistory (sku: string): Promise<GetPriceHistoryResponse> {
		return this.request<GetPriceHistoryResponse>('GET', '/price/history', {
			sku,
			key: this.apiKey
		})
	}

	async getUserPrice (sku: string): Promise<GetUserPriceResponse> {
		return this.request<GetUserPriceResponse>('GET', '/user-price', {
			sku,
			key: this.apiKey
		})
	}

	async addListing (sku: string): Promise<AddListingResponse> {
		return this.request<AddListingResponse>(
			'POST',
			'/listing',
			{
				key: this.apiKey
			},
			{
				sku
			}
		)
	}

	async getListing (sku: string): Promise<GetListingResponse> {
		return this.request<GetListingResponse>('GET', '/listing', {
			sku,
			key: this.apiKey
		})
	}

	async removeListing (sku: string): Promise<RemoveListingResponse> {
		return this.request<RemoveListingResponse>('GET', '/delete', {
			sku,
			key: this.apiKey
		})
	}

	async getRate (): Promise<GetRateResponse> {
		return this.request<GetRateResponse>('GET', '/pricer/rate', {
			key: this.apiKey
		})
	}

	async addToBlacklist (steamId: string): Promise<AddToBlacklistResponse> {
		return this.request<AddToBlacklistResponse>('POST', '/settings/blacklist', {
			key: this.apiKey,
			steamId
		})
	}

	async getBlacklist (): Promise<GetBlacklistResponse> {
		return this.request<GetBlacklistResponse>('GET', '/settings/blacklist', {
			key: this.apiKey
		})
	}

	async removeFromBlacklist (steamId: string): Promise<RemoveFromBlacklistResponse> {
		return this.request<RemoveFromBlacklistResponse>('DELETE', '/settings/blacklist', {
			key: this.apiKey,
			steamId
		})
	}
}

export function throwErrorWithAPIMessage (method: string, url: string, e: AxiosError | Error): never {
	let message = e.message
	let status = 0
	if (isAxioxError(e)) {
		const errorsOrMessage =
			e?.response?.data?.errors || e?.response?.data?.message

		message = Array.isArray(errorsOrMessage)
			? errorsOrMessage.join('. ')
			: errorsOrMessage

		status = e.response?.status || 0
	}

	throw new Error(
		`${status} ${method} ${url}: ${message}`
	)
}

function isAxioxError (e: AxiosError | Error): e is AxiosError {
	return Object.prototype.hasOwnProperty.call(e, 'isAxiosError')
}
