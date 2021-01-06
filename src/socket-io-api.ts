import io, { Socket } from 'socket.io-client'

import { TraderTFOptions, UserPrice, Price, Snapshot } from './common'

export type OnPriceListener = (price: Price) => unknown;

export type OnUserPriceListener = (price: UserPrice) => unknown;

export type OnSnapshotListener = (price: Snapshot) => unknown;

export class TraderTFSocket {
	public readonly socket: typeof Socket;

	constructor ({
		pricerInstanceUrl = 'https://trader.tf',
		apiKey
	}: TraderTFOptions) {
		this.socket = io(pricerInstanceUrl, {
			autoConnect: false,
			/**
             * Authentication happens within the query.
             */
			query: { key: apiKey }
		})
	}

	connect () {
		return new Promise<void>((resolve, reject) => {
			const onConnect = () => {
				this.socket.off('connect_error', onConnectError)
				resolve()
			}
			const onConnectError = (err: Error) => {
				this.socket.off('connect', onConnect)
				reject(err)
			}

			this.socket.once('connect', onConnect)
			this.socket.once('connect_error', onConnectError)

			this.socket.connect()
		})
	}

	onPrice (listener: OnPriceListener, sku?: string) {
		if (sku) {
			this.socket.on(`price/${sku}`, listener)
			return
		}

		this.socket.on('price', listener)
	}

	onUserPrice (listener: OnUserPriceListener, sku?: string) {
		if (sku) {
			this.socket.on(`user-price/${sku}`, listener)
			return
		}

		this.socket.on('user-price', listener)
	}

	onSnapshot (listener: OnSnapshotListener, sku?: string) {
		if (sku) {
			this.socket.on(`snapshot/${sku}`, listener)
			return
		}

		this.socket.on('snapshot', listener)
	}
}
