/* eslint-disable no-unused-vars */
import url from 'url'
import axios, { AxiosError, AxiosInstance } from 'axios'
import Bottleneck from 'bottleneck'

import { TraderTFOptions, Currency, Price, Snapshot } from './common'
import { ApiError } from './api-error'

export enum ListingResponses {
	Updated = 0,
	Created = 1,
	ExceededLimit = 2
}

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

export type GetListingResponse = {
	sku: string;
	min: Currency;
	max: Currency;
	time: number;
	belongsTo: string;
};

export type GetListingsResponse = GetListingResponse[];

export type AddListingsResponse = Record<string, ListingResponses>

export type RemoveListingsResponse = { deletedAmount: number };

export type RequestPriceResponse = {
	queued: boolean;
	info: string;
};

export type GetPriceHistoryResponse = Price[];

export type GetSnapshotResponse = Snapshot;

export type GetRateResponse = {
	buy: number;
	sell: number;
	time: number;
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
		this.requestClient = axios.create({ baseURL: url.format(`${pricerInstanceUrl}/api/bptf`) })
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
		{
			data = {},
			params = {}
		}: {
			params?: object,
			data?: object
		} = {}
	): Promise<TResponse> {
		try {
			const response = await this.bottleneck.schedule(() =>
				this.requestClient.request<APIResponse<TResponse>>({
					url,
					method,
					params,
					data,
					headers: {
						Authorization: 'Bearer ' + this.apiKey
					}
				})
			)

			if (!response.data.success) {
				throw new ApiError(response.data.message, response.status)
			}

			return response.data.result
		} catch (e) {
			throwErrorWithAPIMessage(method, url, e)
		}
	}

	async getPrice (sku: string): Promise<GetPriceResponse> {
		return this.request<GetPriceResponse>('GET', `/prices/${sku}`)
	}

	async requestPrice (sku: string): Promise<RequestPriceResponse> {
		return this.request<RequestPriceResponse>('POST', `/prices/${sku}`)
	}

	async getSnapshot (sku: string): Promise<GetSnapshotResponse> {
		return this.request<GetSnapshotResponse>('GET', `/snapshots/${sku}`)
	}

	async getPriceHistory (sku: string): Promise<GetPriceHistoryResponse> {
		return this.request<GetPriceHistoryResponse>('GET', `/prices/${sku}/history`)
	}

	async addListings (listings: { sku: string; max?: Currency; min?: Currency }[]): Promise<AddListingsResponse> {
		return this.request<AddListingsResponse>(
			'POST',
			'/listings',
			{
				data: listings
			}
		)
	}

	async getListing (sku: string): Promise<GetListingResponse> {
		return this.request<GetListingResponse>('GET', '/listings/' + sku)
	}

	async getListings (): Promise<GetListingsResponse> {
		return this.request<GetListingsResponse>('GET', '/listings')
	}

	async removeListing (skus: string[]): Promise<RemoveListingsResponse> {
		return this.request<RemoveListingsResponse>('GET', '/listings', { data: skus })
	}

	async getRate (): Promise<GetRateResponse> {
		return this.request<GetRateResponse>('GET', '/rate')
	}

	async getRateHistory (): Promise<GetRateResponse[]> {
		return this.request<GetRateResponse[]>('GET', '/rate/history')
	}

	async getPricelist (): Promise<Price[]> {
		return this.request<Price[]>('GET', '/prices')
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

		throw new ApiError(`${method} ${url}: ${message}`, status)
	}

	throw new Error(
		`${status} ${method} ${url}: ${message}`
	)
}

function isAxioxError (e: AxiosError | Error): e is AxiosError {
	return Object.prototype.hasOwnProperty.call(e, 'isAxiosError')
}
